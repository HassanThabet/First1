import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import DashboardLayout from "../components/DashboardLayout";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Eye, FileDown } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import pdfMake from "@digicole/pdfmake-rtl";
import pdfMakeFonts from "../fonts/vfs_fonts";
import { 
  createRTLTable, 
  createStatsGrid, 
  createSection,
  createChartImage,
  captureChartAsImage,
  generatePDF
} from "../utils/pdfTemplate";
import TeacherProgressView from "../components/TeacherProgressView";
import ActivitySupervisorsView from "../components/ActivitySupervisorsView";
import CooperatingTeachersView from "../components/CooperatingTeachersView";

const QualityDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // For statistics
  const [supervisorReports, setSupervisorReports] = useState([]);
  const [activitiesReports, setActivitiesReports] = useState([]);
  const [socialReports, setSocialReports] = useState([]);
  const [qualityReports, setQualityReports] = useState([]);
  const [vicePrincipalReports, setVicePrincipalReports] = useState([]);
  const [educationalSupervisionReports, setEducationalSupervisionReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [selectedSpecificEmployee, setSelectedSpecificEmployee] = useState("all");
  const [selectedVicePrincipal, setSelectedVicePrincipal] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [showDetailedReports, setShowDetailedReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTeachersListModal, setShowTeachersListModal] = useState(false);
  const [teachersListData, setTeachersListData] = useState({ title: "", teachers: [], type: "" });

  // Quality report specific states
  const [qualityReportsOwn, setQualityReportsOwn] = useState([]);
  const [allQualityReports, setAllQualityReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQualityReport, setSelectedQualityReport] = useState(null);
  const [showQualityReportModal, setShowQualityReportModal] = useState(false);
  const [editingQualityReport, setEditingQualityReport] = useState(null);
  const [viewMode, setViewMode] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    academic_performance_rate: "",
    academic_notes: "",
    supervision_quality_rate: "",
    supervision_notes: "",
    discipline_rate: "",
    discipline_notes: "",
    activities_quality_rate: "",
    activities_notes: "",
    social_specialist_performance_rate: "",
    social_specialist_notes: "",
    teaching_performance_rate: "",
    general_recommendations: ""
  });

  useEffect(() => {
    fetchAllData();
    fetchQualityReports();
  }, []);

  useEffect(() => {
    filterQualityReports();
  }, [viewMode, dateFilter, monthFilter, allQualityReports]);

  const fetchAllData = async () => {
    try {
      console.log("🔄 Fetching all data...");
      
      // Fetch data with individual error handling to avoid showing error toast for permissions
      const results = await Promise.allSettled([
        axios.get(`${API}/users`),
        axios.get(`${API}/teachers`),
        axios.get(`${API}/reports/supervisor`),
        axios.get(`${API}/reports/activities`),
        axios.get(`${API}/reports/social-specialist`),
        axios.get(`${API}/reports/quality`),
        axios.get(`${API}/reports/vice-principal`),
        axios.get(`${API}/reports/educational-supervision`)
      ]);
      
      // Extract successful results or use empty arrays
      const [usersRes, teachersRes, supervisorRes, activitiesRes, socialRes, qualityRes, vpRes, eduSupRes] = results;
      
      const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
      const teachersData = teachersRes.status === 'fulfilled' ? teachersRes.value.data : [];
      const supervisorData = supervisorRes.status === 'fulfilled' ? supervisorRes.value.data : [];
      const activitiesData = activitiesRes.status === 'fulfilled' ? activitiesRes.value.data : [];
      const socialData = socialRes.status === 'fulfilled' ? socialRes.value.data : [];
      const qualityData = qualityRes.status === 'fulfilled' ? qualityRes.value.data : [];
      const vpData = vpRes.status === 'fulfilled' ? vpRes.value.data : [];
      const eduSupData = eduSupRes.status === 'fulfilled' ? eduSupRes.value.data : [];
      
      console.log("✅ Data fetched successfully:");
      console.log("Users:", usersData.length);
      console.log("Teachers:", teachersData.length);
      console.log("Supervisor reports:", supervisorData.length);
      console.log("Activities reports:", activitiesData.length);
      console.log("Social reports:", socialData.length);
      console.log("Quality reports:", qualityData.length);
      console.log("VP reports:", vpData.length);
      console.log("Educational Supervision reports:", eduSupData.length);
      
      // Log any failed requests
      results.forEach((result, index) => {
        const names = ['users', 'teachers', 'supervisor', 'activities', 'social', 'quality', 'vice-principal', 'educational-supervision'];
        if (result.status === 'rejected') {
          console.error(`❌ Failed to fetch ${names[index]}:`, result.reason?.response?.status, result.reason?.message);
        }
      });
      
      setUsers(usersData);
      setTeachers(teachersData);
      setSupervisorReports(supervisorData);
      setActivitiesReports(activitiesData);
      setSocialReports(socialData);
      setQualityReports(qualityData);
      setVicePrincipalReports(vpData);
      setEducationalSupervisionReports(eduSupData);
      
      // Only show error if all requests failed
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        toast.error("فشل تحميل البيانات - يرجى التحقق من الصلاحيات");
      }
    } catch (error) {
      console.error("❌ Unexpected error:", error);
      // Don't show toast for unexpected errors either
    }
  };

  const fetchQualityReports = async () => {
    try {
      const res = await axios.get(`${API}/reports/quality`);
      setAllQualityReports(res.data);
      setQualityReportsOwn(res.data);
    } catch (error) {
      toast.error("فشل تحميل تقارير الجودة");
    }
  };

  const filterQualityReports = () => {
    let filtered = [...allQualityReports];

    if (viewMode === "daily" && dateFilter) {
      filtered = filtered.filter(r => r.date === dateFilter);
    }

    if (viewMode === "monthly" && monthFilter) {
      const [year, month] = monthFilter.split('-');
      filtered = filtered.filter(r => {
        const reportDate = new Date(r.date);
        return reportDate.getFullYear() === parseInt(year) && 
               reportDate.getMonth() === parseInt(month) - 1;
      });
    }

    setQualityReportsOwn(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert flat structure to nested dict structure expected by backend
      const dataToSubmit = {
        date: formData.date,
        academic_performance: {
          rate: formData.academic_performance_rate?.toString() || "0",
          notes: formData.academic_notes || ""
        },
        educational_supervision: {
          rate: formData.supervision_quality_rate?.toString() || "0",
          notes: formData.supervision_notes || ""
        },
        discipline_behavior: {
          rate: formData.discipline_rate?.toString() || "0",
          notes: formData.discipline_notes || ""
        },
        activities_programs: {
          rate: formData.activities_quality_rate?.toString() || "0",
          notes: formData.activities_notes || ""
        },
        social_specialist: {
          rate: formData.social_specialist_performance_rate?.toString() || "0",
          notes: formData.social_specialist_notes || "",
          teaching_performance_rate: formData.teaching_performance_rate?.toString() || "0",
          general_recommendations: formData.general_recommendations || ""
        }
      };
      
      if (editingQualityReport) {
        await axios.put(`${API}/reports/quality/${editingQualityReport.id}`, dataToSubmit);
        toast.success("تم تحديث التقرير بنجاح");
        setEditingQualityReport(null);
      } else {
        await axios.post(`${API}/reports/quality`, dataToSubmit);
        toast.success("تم إنشاء التقرير بنجاح");
      }
      fetchQualityReports();
      setActiveTab("quality-reports");
      setFormData({
        date: new Date().toISOString().split('T')[0],
        academic_performance_rate: "",
        academic_notes: "",
        supervision_quality_rate: "",
        supervision_notes: "",
        discipline_rate: "",
        discipline_notes: "",
        activities_quality_rate: "",
        activities_notes: "",
        social_specialist_performance_rate: "",
        social_specialist_notes: "",
        teaching_performance_rate: "",
        general_recommendations: ""
      });
    } catch (error) {
      if (editingQualityReport) {
        toast.error("فشل تحديث التقرير");
      } else {
        toast.error("فشل إنشاء التقرير");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    setEditingQualityReport(report);
    // Convert nested dict structure from backend to flat structure for form
    setFormData({
      date: report.date,
      academic_performance_rate: report.academic_performance?.rate || "",
      academic_notes: report.academic_performance?.notes || "",
      supervision_quality_rate: report.educational_supervision?.rate || "",
      supervision_notes: report.educational_supervision?.notes || "",
      discipline_rate: report.discipline_behavior?.rate || "",
      discipline_notes: report.discipline_behavior?.notes || "",
      activities_quality_rate: report.activities_programs?.rate || "",
      activities_notes: report.activities_programs?.notes || "",
      social_specialist_performance_rate: report.social_specialist?.rate || "",
      social_specialist_notes: report.social_specialist?.notes || "",
      teaching_performance_rate: report.social_specialist?.teaching_performance_rate || "",
      general_recommendations: report.social_specialist?.general_recommendations || ""
    });
    setActiveTab("quality-create");
  };

  const handleDelete = async (reportId) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التقرير؟")) {
      try {
        await axios.delete(`${API}/reports/quality/${reportId}`);
        toast.success("تم حذف التقرير بنجاح");
        fetchQualityReports();
      } catch (error) {
        toast.error("فشل حذف التقرير");
      }
    }
  };

  // Export Quality Reports to PDF
  const exportQualityReportsToPDF = () => {
    try {
      // Filter reports based on current filters
      const reportsToExport = qualityReportsOwn;

      if (reportsToExport.length === 0) {
        toast.error("لا توجد تقارير للتصدير");
        return;
      }

      // Prepare PDF content
      const content = [];

      // Title
      content.push({
        text: 'تقارير الجودة - مدارس الفجر الجديد الأهلية',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      });

      // Filter info
      let filterText = 'الفترة: ';
      if (viewMode === 'all') {
        filterText += 'جميع التقارير';
      } else if (viewMode === 'daily' && dateFilter) {
        filterText += `يوم ${new Date(dateFilter).toLocaleDateString('ar-SA')}`;
      } else if (viewMode === 'monthly' && monthFilter) {
        const [year, month] = monthFilter.split('-');
        filterText += `شهر ${month}/${year}`;
      }

      content.push({
        text: filterText,
        alignment: 'center',
        margin: [0, 0, 0, 15],
        fontSize: 11,
        color: '#555'
      });

      // Loop through reports
      reportsToExport.forEach((report, index) => {
        // Report header
        content.push({
          text: `تقرير ${index + 1} - ${new Date(report.date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
          style: 'sectionHeader',
          margin: [0, 15, 0, 10],
          fillColor: '#e3f2fd'
        });

        // Sections table
        const sectionsData = [
          ['القسم', 'التقييم', 'الملاحظات'],
          [
            '📚 القسم الأكاديمي',
            `${report.academic_performance?.rate || 0}/10`,
            report.academic_performance?.notes || 'لا توجد ملاحظات'
          ],
          [
            '👁️ قسم الإشراف',
            `${report.educational_supervision?.rate || 0}/10`,
            report.educational_supervision?.notes || 'لا توجد ملاحظات'
          ],
          [
            '⚖️ قسم الانضباط',
            `${report.discipline_behavior?.rate || 0}/10`,
            report.discipline_behavior?.notes || 'لا توجد ملاحظات'
          ],
          [
            '🎨 قسم الأنشطة',
            `${report.activities_programs?.rate || 0}/10`,
            report.activities_programs?.notes || 'لا توجد ملاحظات'
          ],
          [
            '💬 قسم الأخصائي الاجتماعي',
            `${report.social_specialist?.rate || 0}/10`,
            report.social_specialist?.notes || 'لا توجد ملاحظات'
          ]
        ];

        content.push({
          table: {
            headerRows: 1,
            widths: [150, 80, '*'],
            body: sectionsData
          },
          layout: {
            fillColor: function (rowIndex) {
              return rowIndex === 0 ? '#2196F3' : (rowIndex % 2 === 0 ? '#f5f5f5' : null);
            },
            hLineWidth: function () { return 0.5; },
            vLineWidth: function () { return 0.5; },
            hLineColor: function () { return '#ddd'; },
            vLineColor: function () { return '#ddd'; }
          },
          margin: [0, 0, 0, 10]
        });

        // Teaching performance
        content.push({
          table: {
            widths: ['*', 100],
            body: [
              [
                { text: '👨‍🏫 معدل الأداء التدريسي العام', fontSize: 12 },
                { text: `${report.social_specialist?.teaching_performance_rate || 0}/10`, alignment: 'center', fontSize: 12, color: '#2196F3' }
              ]
            ]
          },
          layout: 'noBorders',
          fillColor: '#e8f5e9',
          margin: [0, 5, 0, 10]
        });

        // General recommendations
        if (report.social_specialist?.general_recommendations) {
          content.push({
            text: 'التوصيات العامة:',
            fontSize: 12,
            margin: [0, 10, 0, 5]
          });
          content.push({
            text: report.social_specialist.general_recommendations,
            margin: [10, 0, 0, 15],
            italics: true,
            color: '#555'
          });
        }

        // Separator between reports
        if (index < reportsToExport.length - 1) {
          content.push({
            canvas: [
              {
                type: 'line',
                x1: 0, y1: 0,
                x2: 515, y2: 0,
                lineWidth: 1,
                lineColor: '#ccc'
              }
            ],
            margin: [0, 15, 0, 0]
          });
        }
      });

      // Summary statistics - Fixed data structure access
      const totalReports = reportsToExport.length;
      const avgAcademic = (reportsToExport.reduce((sum, r) => sum + (parseFloat(r.academic_performance?.rate) || 0), 0) / totalReports).toFixed(1);
      const avgSupervision = (reportsToExport.reduce((sum, r) => sum + (parseFloat(r.educational_supervision?.rate) || 0), 0) / totalReports).toFixed(1);
      const avgDiscipline = (reportsToExport.reduce((sum, r) => sum + (parseFloat(r.discipline_behavior?.rate) || 0), 0) / totalReports).toFixed(1);
      const avgActivities = (reportsToExport.reduce((sum, r) => sum + (parseFloat(r.activities_programs?.rate) || 0), 0) / totalReports).toFixed(1);
      const avgSocial = (reportsToExport.reduce((sum, r) => sum + (parseFloat(r.social_specialist?.rate) || 0), 0) / totalReports).toFixed(1);
      const avgTeaching = (reportsToExport.reduce((sum, r) => sum + (parseFloat(r.social_specialist?.teaching_performance_rate) || 0), 0) / totalReports).toFixed(1);

      content.push({
        text: '\nملخص الإحصائيات',
        style: 'sectionHeader',
        margin: [0, 20, 0, 10],
        fillColor: '#fff3e0'
      });

      content.push({
        table: {
          widths: ['*', 100],
          body: [
            ['إجمالي التقارير', totalReports],
            ['متوسط التقييم الأكاديمي', avgAcademic],
            ['متوسط تقييم الإشراف', avgSupervision],
            ['متوسط تقييم الانضباط', avgDiscipline],
            ['متوسط تقييم الأنشطة', avgActivities],
            ['متوسط تقييم الأخصائي الاجتماعي', avgSocial],
            ['متوسط الأداء التدريسي العام', avgTeaching]
          ]
        },
        layout: {
          fillColor: function (rowIndex) {
            return rowIndex % 2 === 0 ? '#f5f5f5' : null;
          }
        },
        margin: [0, 0, 0, 20]
      });

      // Footer
      content.push({
        text: `تم التصدير في: ${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
        alignment: 'center',
        fontSize: 9,
        color: '#999',
        margin: [0, 20, 0, 0]
      });

      // Generate PDF
      const docDefinition = {
        content: content,
        styles: {
          header: {
            fontSize: 18,
            color: '#1976D2',
            font: 'Cairo'
          },
          sectionHeader: {
            fontSize: 14,
            color: '#333',
            font: 'Cairo'
          }
        },
        defaultStyle: {
          font: 'Cairo',
          fontSize: 11
        },
        pageOrientation: 'portrait',
        pageMargins: [40, 60, 40, 60]
      };

      // Set up fonts - Initialize vfs and fonts BEFORE creating PDF
      pdfMake.vfs = pdfMakeFonts;
      pdfMake.fonts = {
        Cairo: {
          normal: 'Cairo-Regular.ttf',
          bold: 'Cairo-Regular.ttf',
          italics: 'Cairo-Regular.ttf',
          bolditalics: 'Cairo-Regular.ttf'
        },
        Roboto: {
          normal: 'Cairo-Regular.ttf',
          bold: 'Cairo-Regular.ttf',
          italics: 'Cairo-Regular.ttf',
          bolditalics: 'Cairo-Regular.ttf'
        },
        Nillima: {
          normal: 'Cairo-Regular.ttf',
          bold: 'Cairo-Regular.ttf',
          italics: 'Cairo-Regular.ttf',
          bolditalics: 'Cairo-Regular.ttf'
        }
      };

      pdfMake.createPdf(docDefinition).download(`تقارير_الجودة_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("تم تصدير التقارير بنجاح");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("فشل تصدير التقارير");
    }
  };

  // Get list of employees based on report type
  const getEmployeesForReportType = () => {
    if (reportTypeFilter === "vice_principal") {
      return users.filter(u => u.role === "vice_principal");
    } else if (reportTypeFilter === "supervisor") {
      return users.filter(u => u.role === "supervisor");
    } else if (reportTypeFilter === "activities") {
      return users.filter(u => u.role === "activities");
    } else if (reportTypeFilter === "social") {
      return users.filter(u => u.role === "social_specialist");
    } else if (reportTypeFilter === "quality") {
      return users.filter(u => u.role === "quality");
    }
    return [];
  };

  // Get aggregated absent teachers from Vice-Principal reports
  const getAggregatedAbsentTeachers = () => {
    const filtered = filterReportsByTimeAndBranch([...vicePrincipalReports]);
    const teachersMap = {};
    
    filtered.forEach(report => {
      if (report.absent_teachers && Array.isArray(report.absent_teachers)) {
        report.absent_teachers.forEach(teacher => {
          const name = typeof teacher === 'string' ? teacher : teacher.teacher;
          const days = typeof teacher === 'object' ? (teacher.absent_days || 0) : 0;
          if (name) {
            if (!teachersMap[name]) {
              teachersMap[name] = { count: 0, totalDays: 0 };
            }
            teachersMap[name].count += 1;
            teachersMap[name].totalDays += days;
          }
        });
      }
    });
    
    return Object.entries(teachersMap)
      .map(([name, data]) => ({ name, count: data.count, totalDays: data.totalDays }))
      .sort((a, b) => b.totalDays - a.totalDays);
  };

  const getAggregatedLateTeachers = () => {
    const filtered = filterReportsByTimeAndBranch([...supervisorReports]);
    const teachersMap = {};
    
    filtered.forEach(report => {
      if (report.late_teachers && Array.isArray(report.late_teachers)) {
        report.late_teachers.forEach(teacher => {
          let name, minutes;
          if (typeof teacher === 'object') {
            name = teacher.teacher || teacher.name;
            minutes = teacher.minutes_late || 0;
          } else {
            name = teacher;
            minutes = 0;
          }
          
          if (name) {
            if (!teachersMap[name]) {
              teachersMap[name] = { count: 0, totalMinutes: 0 };
            }
            teachersMap[name].count += 1;
            teachersMap[name].totalMinutes += minutes;
          }
        });
      }
    });
    
    return Object.entries(teachersMap)
      .map(([name, data]) => ({ 
        name, 
        count: data.count, 
        totalMinutes: data.totalMinutes 
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getAggregatedCoveringTeachers = () => {
    const filtered = filterReportsByTimeAndBranch([...supervisorReports]);
    const teachersMap = {};
    
    filtered.forEach(report => {
      if (report.covering_teachers && Array.isArray(report.covering_teachers)) {
        report.covering_teachers.forEach(teacher => {
          let name, subject;
          if (typeof teacher === 'object') {
            name = teacher.teacher || teacher.name;
            subject = teacher.subject || '';
          } else {
            name = teacher;
            subject = '';
          }
          
          if (name) {
            if (!teachersMap[name]) {
              teachersMap[name] = { count: 0, subjects: [] };
            }
            teachersMap[name].count += 1;
            if (subject && !teachersMap[name].subjects.includes(subject)) {
              teachersMap[name].subjects.push(subject);
            }
          }
        });
      }
    });
    
    return Object.entries(teachersMap)
      .map(([name, data]) => ({ 
        name, 
        count: data.count, 
        subjects: data.subjects.join(', ') 
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getAggregatedActivityTeachers = () => {
    const filtered = filterReportsByTimeAndBranch([...activitiesReports]);
    const teachersMap = {};
    
    filtered.forEach(report => {
      if (report.activities && Array.isArray(report.activities)) {
        report.activities.forEach(activity => {
          // Check both old field (supervising_teachers) and new field (supervisors)
          const supervisorsList = activity.supervisors || activity.supervising_teachers || [];
          
          if (Array.isArray(supervisorsList)) {
            supervisorsList.forEach(item => {
              // Handle both string names and IDs
              if (typeof item === 'string') {
                // If it's an ID (UUID format), find teacher name
                const teacher = teachers.find(t => t.id === item);
                const name = teacher ? teacher.name : item;
                if (name) {
                  teachersMap[name] = (teachersMap[name] || 0) + 1;
                }
              } else if (item && (item.name || item.teacher)) {
                // If it's an object with name
                const name = item.name || item.teacher;
                teachersMap[name] = (teachersMap[name] || 0) + 1;
              }
            });
          }
        });
      }
    });
    
    return Object.entries(teachersMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Get cooperating teachers from activities
  const getCooperatingTeachers = () => {
    const filtered = filterReportsByTimeAndBranch([...activitiesReports]);
    const teachersMap = {};
    
    filtered.forEach(report => {
      if (report.activities && Array.isArray(report.activities)) {
        report.activities.forEach(activity => {
          if (activity.cooperating_teachers && Array.isArray(activity.cooperating_teachers)) {
            activity.cooperating_teachers.forEach(teacherId => {
              // Find teacher name from teachers list
              const teacher = teachers.find(t => t.id === teacherId);
              if (teacher && teacher.name) {
                teachersMap[teacher.name] = (teachersMap[teacher.name] || 0) + 1;
              }
            });
          }
        });
      }
    });
    
    return Object.entries(teachersMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Helper function to filter by time and branch
  const filterReportsByTimeAndBranch = (reports) => {
    console.log("🔍 filterReportsByTimeAndBranch called with", reports.length, "reports");
    console.log("⏰ timeFilter:", timeFilter);
    console.log("🏢 branchFilter:", branchFilter);
    console.log("👤 user.branch:", user?.branch);
    
    let filtered = filterReportsByTimeOnly(reports);
    console.log("✅ After time filter:", filtered.length, "reports");
    
    // Only apply branch filter if user has branch="both" and branchFilter is not "all"
    if (user && user.branch === "both" && branchFilter !== "all") {
      filtered = filtered.filter(r => r.branch === branchFilter);
      console.log("✅ After branch filter:", filtered.length, "reports");
    }
    
    console.log("📊 Final filtered reports:", filtered.length);
    return filtered;
  };

  // Handle chart click to show teachers list
  const handleChartClick = (type) => {
    console.log("📊 Chart clicked, type:", type);
    let data = { title: "", teachers: [], type: type };
    
    switch(type) {
      case "absent":
        data.title = "قائمة المعلمين الغائبين";
        data.teachers = getAggregatedAbsentTeachers();
        console.log("✅ Absent teachers:", data.teachers.length);
        break;
      case "late":
        data.title = "قائمة المعلمين المتأخرين";
        data.teachers = getAggregatedLateTeachers();
        console.log("✅ Late teachers:", data.teachers.length);
        break;
      case "covering":
        data.title = "قائمة المعلمين المغطين";
        data.teachers = getAggregatedCoveringTeachers();
        console.log("✅ Covering teachers:", data.teachers.length);
        break;
      case "activity":
        data.title = "قائمة المعلمين المشرفين على الأنشطة";
        data.teachers = getAggregatedActivityTeachers();
        console.log("✅ Activity teachers:", data.teachers.length);
        break;
    }
    
    console.log("📋 Opening modal with data:", data);
    setTeachersListData(data);
    setShowTeachersListModal(true);
  };

  // Export teachers list to PDF
  const exportTeachersListToPDF = () => {
    if (!teachersListData.teachers || teachersListData.teachers.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    // Initialize pdfMake fonts
    if (pdfMakeFonts) {
      pdfMake.vfs = pdfMakeFonts;
    }
    
    pdfMake.fonts = {
      Cairo: {
        normal: 'Cairo-Regular.ttf',
        bold: 'Cairo-Regular.ttf',
        italics: 'Cairo-Regular.ttf',
        bolditalics: 'Cairo-Regular.ttf'
      },
      Roboto: {
        normal: 'Cairo-Regular.ttf',
        bold: 'Cairo-Regular.ttf',
        italics: 'Cairo-Regular.ttf',
        bolditalics: 'Cairo-Regular.ttf'
      },
      Nillima: {
        normal: 'Cairo-Regular.ttf',
        bold: 'Cairo-Regular.ttf',
        italics: 'Cairo-Regular.ttf',
        bolditalics: 'Cairo-Regular.ttf'
      }
    };

    // Build table headers based on type
    const tableHeaders = [
      { text: 'م', style: 'tableHeader', alignment: 'center' },
      { text: 'اسم المعلم', style: 'tableHeader', alignment: 'center' }
    ];

    if (teachersListData.type === 'absent') {
      tableHeaders.push({ text: 'عدد التقارير', style: 'tableHeader', alignment: 'center' });
      tableHeaders.push({ text: 'إجمالي أيام الغياب', style: 'tableHeader', alignment: 'center' });
    } else if (teachersListData.type === 'late') {
      tableHeaders.push({ text: 'عدد مرات التأخير', style: 'tableHeader', alignment: 'center' });
      tableHeaders.push({ text: 'مجموع الدقائق', style: 'tableHeader', alignment: 'center' });
    } else if (teachersListData.type === 'covering') {
      tableHeaders.push({ text: 'عدد الحصص المغطاة', style: 'tableHeader', alignment: 'center' });
      tableHeaders.push({ text: 'المواد', style: 'tableHeader', alignment: 'center' });
    } else if (teachersListData.type === 'activity') {
      tableHeaders.push({ text: 'عدد الأنشطة', style: 'tableHeader', alignment: 'center' });
    } else {
      tableHeaders.push({ text: 'عدد المرات', style: 'tableHeader', alignment: 'center' });
    }

    const tableBody = [tableHeaders];

    // Build table rows
    teachersListData.teachers.forEach((teacher, index) => {
      const row = [
        { text: (index + 1).toString(), alignment: 'center', style: 'tableCell' },
        { text: teacher.name, alignment: 'center', style: 'tableCell' }
      ];
      
      if (teachersListData.type === 'absent') {
        row.push({ text: teacher.count.toString(), alignment: 'center', style: 'tableCell' });
        row.push({ 
          text: `${teacher.totalDays || 0} ${(teacher.totalDays === 1) ? 'يوم' : 'أيام'}`, 
          alignment: 'center', 
          style: 'tableCellBold',
          fillColor: '#fee2e2'
        });
      } else if (teachersListData.type === 'late') {
        row.push({ text: teacher.count.toString(), alignment: 'center', style: 'tableCell' });
        row.push({ 
          text: `${teacher.totalMinutes || 0} دقيقة`, 
          alignment: 'center', 
          style: 'tableCellBold',
          fillColor: '#fed7aa'
        });
      } else if (teachersListData.type === 'covering') {
        row.push({ text: teacher.count.toString(), alignment: 'center', style: 'tableCell' });
        row.push({ 
          text: (teacher.subjects && teacher.subjects.length > 0) ? teacher.subjects.join(', ') : '-', 
          alignment: 'center', 
          style: 'tableCell' 
        });
      } else if (teachersListData.type === 'activity') {
        row.push({ text: teacher.count.toString(), alignment: 'center', style: 'tableCell' });
      } else {
        row.push({ text: teacher.count.toString(), alignment: 'center', style: 'tableCell' });
      }
      
      tableBody.push(row);
    });

    // Calculate column widths
    let columnWidths;
    if (teachersListData.type === 'absent' || teachersListData.type === 'late') {
      columnWidths = [30, '*', 80, 100];
    } else if (teachersListData.type === 'covering') {
      columnWidths = [30, '*', 80, 120];
    } else {
      columnWidths = [30, '*', 80];
    }

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 80, 40, 60],
      defaultStyle: {
        font: 'Cairo',
        fontSize: 11,
        alignment: 'right'
      },
      header: {
        columns: [
          {
            text: 'مدارس الفجر الجديد الأهلية',
            alignment: 'center',
            fontSize: 18,
            color: '#1e40af',
            margin: [0, 30, 0, 0]
          }
        ]
      },
      content: [
        {
          text: teachersListData.title,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          columns: [
            {
              text: `تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}`,
              style: 'info',
              alignment: 'right',
              width: '*'
            },
            {
              text: `إجمالي عدد المعلمين: ${teachersListData.teachers.length}`,
              style: 'info',
              alignment: 'left',
              width: '*'
            }
          ],
          margin: [0, 0, 0, 20]
        },
        {
          table: {
            headerRows: 1,
            widths: columnWidths,
            body: tableBody,
            dontBreakRows: true
          },
          layout: {
            fillColor: function (rowIndex, node, columnIndex) {
              if (rowIndex === 0) {
                return '#dbeafe';
              }
              return (rowIndex % 2 === 0) ? '#f9fafb' : null;
            },
            hLineWidth: function (i, node) {
              return 0.5;
            },
            vLineWidth: function (i, node) {
              return 0.5;
            },
            hLineColor: function (i, node) {
              return '#d1d5db';
            },
            vLineColor: function (i, node) {
              return '#d1d5db';
            },
            paddingLeft: function(i, node) { return 8; },
            paddingRight: function(i, node) { return 8; },
            paddingTop: function(i, node) { return 6; },
            paddingBottom: function(i, node) { return 6; }
          },
          margin: [0, 0, 0, 20]
        },
        {
          text: '* هذا التقرير تم إنشاؤه تلقائياً من نظام إدارة التقارير',
          style: 'footer',
          alignment: 'center'
        }
      ],
      styles: {
        subheader: {
          fontSize: 16,
          color: '#3b82f6',
          font: 'Cairo'
        },
        info: {
          fontSize: 9,
          color: '#666666',
          font: 'Cairo'
        },
        tableHeader: {
          alignment: 'center',
          fontSize: 11,
          color: '#1e40af',
          font: 'Cairo'
        },
        tableCell: {
          fontSize: 10,
          font: 'Cairo'
        },
        tableCellBold: {
          fontSize: 10,
          font: 'Cairo'
        },
        footer: {
          fontSize: 8,
          color: '#999999',
          font: 'Cairo'
        }
      }
    };

    pdfMake.createPdf(docDefinition).download(`${teachersListData.title}_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.pdf`);
    toast.success("تم تصدير التقرير بنجاح");
  };

  // Helper function to filter reports by time only
  const filterReportsByTimeOnly = (reports) => {
    const today = new Date();
    
    if (timeFilter === "daily") {
      const todayStr = today.toISOString().split('T')[0];
      return reports.filter(r => {
        if (r.week_start) {
          const weekStart = new Date(r.week_start);
          const weekEnd = new Date(r.week_end);
          const todayDate = new Date(todayStr);
          return todayDate >= weekStart && todayDate <= weekEnd;
        }
        return r.date === todayStr;
      });
    } else if (timeFilter === "weekly") {
      const currentDay = today.getDay();
      const daysFromSaturday = currentDay === 6 ? 0 : currentDay + 1;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromSaturday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);
      weekEnd.setHours(23, 59, 59, 999);
      
      return reports.filter(r => {
        if (r.week_start) {
          const reportWeekStart = new Date(r.week_start);
          const reportWeekEnd = new Date(r.week_end);
          return (reportWeekStart <= weekEnd && reportWeekEnd >= weekStart);
        }
        const reportDate = new Date(r.date);
        return reportDate >= weekStart && reportDate <= weekEnd;
      });
    } else if (timeFilter === "monthly") {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      return reports.filter(r => {
        if (r.week_start) {
          const reportWeekStart = new Date(r.week_start);
          return reportWeekStart.getMonth() === currentMonth && reportWeekStart.getFullYear() === currentYear;
        }
        const reportDate = new Date(r.date);
        return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
      });
    } else if (timeFilter === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      
      return reports.filter(r => {
        if (r.week_start) {
          const reportWeekStart = new Date(r.week_start);
          const reportWeekEnd = new Date(r.week_end);
          return (reportWeekStart <= end && reportWeekEnd >= start);
        }
        const reportDate = new Date(r.date);
        return reportDate >= start && reportDate <= end;
      });
    }
    
    return reports;
  };

  // Get detailed reports based on filters
  const getDetailedReports = () => {
    let allReports = [];
    
    if (reportTypeFilter === "all" || reportTypeFilter === "vice_principal") {
      const filtered = filterReportsByTimeOnly([...vicePrincipalReports]);
      const vpsFiltered = selectedVicePrincipal === "all" 
        ? filtered 
        : filtered.filter(r => r.user_id === selectedVicePrincipal);
      
      allReports = [...allReports, ...vpsFiltered.map(r => {
        const user = users.find(u => u.id === r.user_id);
        return {
          ...r,
          type: "vice_principal",
          userName: user ? (user.full_name || user.username) : "غير معروف"
        };
      })];
    }
    
    if (reportTypeFilter === "all" || reportTypeFilter === "supervisor") {
      const filtered = filterReportsByTimeOnly([...supervisorReports]);
      const supFiltered = selectedSpecificEmployee === "all" 
        ? filtered 
        : filtered.filter(r => r.user_id === selectedSpecificEmployee);
      
      allReports = [...allReports, ...supFiltered.map(r => {
        const user = users.find(u => u.id === r.user_id);
        return {
          ...r,
          type: "supervisor",
          userName: user ? (user.full_name || user.username) : "غير معروف"
        };
      })];
    }
    
    if (reportTypeFilter === "all" || reportTypeFilter === "activities") {
      const filtered = filterReportsByTimeOnly([...activitiesReports]);
      const actFiltered = selectedSpecificEmployee === "all" 
        ? filtered 
        : filtered.filter(r => r.user_id === selectedSpecificEmployee);
      
      allReports = [...allReports, ...actFiltered.map(r => {
        const user = users.find(u => u.id === r.user_id);
        return {
          ...r,
          type: "activities",
          userName: user ? (user.full_name || user.username) : "غير معروف"
        };
      })];
    }
    
    if (reportTypeFilter === "all" || reportTypeFilter === "social") {
      const filtered = filterReportsByTimeOnly([...socialReports]);
      const socFiltered = selectedSpecificEmployee === "all" 
        ? filtered 
        : filtered.filter(r => r.user_id === selectedSpecificEmployee);
      
      allReports = [...allReports, ...socFiltered.map(r => {
        const user = users.find(u => u.id === r.user_id);
        return {
          ...r,
          type: "social",
          userName: user ? (user.full_name || user.username) : "غير معروف"
        };
      })];
    }
    
    if (reportTypeFilter === "all" || reportTypeFilter === "quality") {
      const filtered = filterReportsByTimeOnly([...qualityReports]);
      const qualFiltered = selectedSpecificEmployee === "all" 
        ? filtered 
        : filtered.filter(r => r.user_id === selectedSpecificEmployee);
      
      allReports = [...allReports, ...qualFiltered.map(r => {
        const user = users.find(u => u.id === r.user_id);
        return {
          ...r,
          type: "quality",
          userName: user ? (user.full_name || user.username) : "غير معروف"
        };
      })];
    }
    
    if (reportTypeFilter === "all" || reportTypeFilter === "educational_supervision") {
      const filtered = filterReportsByTimeOnly([...educationalSupervisionReports]);
      const eduSupFiltered = selectedSpecificEmployee === "all" 
        ? filtered 
        : filtered.filter(r => r.user_id === selectedSpecificEmployee);
      
      allReports = [...allReports, ...eduSupFiltered.map(r => {
        const user = users.find(u => u.id === r.user_id);
        return {
          ...r,
          type: "educational_supervision",
          userName: user ? (user.full_name || user.username) : "غير معروف"
        };
      })];
    }
    
    return allReports.sort((a, b) => {
      const dateA = new Date(a.date || a.week_start);
      const dateB = new Date(b.date || b.week_start);
      return dateB - dateA;
    });
  };

  // Calculate overall statistics
  const getOverallStatistics = () => {
    let filteredSupervisorReports = filterReportsByTimeAndBranch([...supervisorReports]);
    let filteredActivitiesReports = filterReportsByTimeAndBranch([...activitiesReports]);
    let filteredSocialReports = filterReportsByTimeAndBranch([...socialReports]);
    let filteredQualityReports = filterReportsByTimeAndBranch([...qualityReports]);
    let filteredVPReports = filterReportsByTimeAndBranch([...vicePrincipalReports]);

    // Supervisor statistics
    const totalLateTeachers = filteredSupervisorReports.reduce((sum, r) => sum + (r.late_teachers?.length || 0), 0);
    // Get absent teachers from VP reports instead of supervisor reports
    const totalAbsentTeachers = filteredVPReports.reduce((sum, r) => {
      if (r.absent_teachers && Array.isArray(r.absent_teachers)) {
        return sum + r.absent_teachers.length;
      }
      return sum;
    }, 0);
    const totalCoveringTeachers = filteredSupervisorReports.reduce((sum, r) => sum + (r.covering_teachers?.length || 0), 0);
    const totalIncidents = filteredSupervisorReports.reduce((sum, r) => sum + (r.incidents?.length || 0), 0);
    const totalAbsentStudents = filteredSupervisorReports.reduce((sum, r) => sum + (r.absent_students_count || 0), 0);
    
    const avgDiscipline = filteredSupervisorReports.length > 0 ? 
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.student_discipline || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;
    const avgCleanliness = filteredSupervisorReports.length > 0 ?
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.classroom_cleanliness || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;
    const avgAttendance = filteredSupervisorReports.length > 0 ?
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.teacher_attendance_rate || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;
    const avgBehavior = filteredSupervisorReports.length > 0 ?
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.general_behavior || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;

    // Activities statistics
    const totalActivities = filteredActivitiesReports.reduce((sum, r) => sum + (r.activities?.length || 0), 0);
    const totalActivitiesParticipants = filteredActivitiesReports.reduce((sum, r) => {
      return sum + (r.activities || []).reduce((aSum, a) => aSum + (a.participants_count || 0), 0);
    }, 0);
    const avgActivitiesInteraction = filteredActivitiesReports.length > 0 ? 
      (filteredActivitiesReports.reduce((sum, r) => {
        const activities = r.activities || [];
        const avgInteraction = activities.length > 0 ? 
          activities.reduce((aSum, a) => aSum + (a.interaction_rate || 0), 0) / activities.length : 0;
        return sum + avgInteraction;
      }, 0) / filteredActivitiesReports.length).toFixed(1) : 0;

    // Social Specialist statistics
    const totalPsychologicalCases = filteredSocialReports.reduce((sum, r) => sum + (r.psychological_cases || 0), 0);
    const totalAcademicCases = filteredSocialReports.reduce((sum, r) => sum + (r.academic_cases || 0), 0);
    const totalBehavioralCases = filteredSocialReports.reduce((sum, r) => sum + (r.behavioral_cases || 0), 0);
    const totalStudentCases = totalPsychologicalCases + totalAcademicCases + totalBehavioralCases;
    const totalSessions = filteredSocialReports.reduce((sum, r) => sum + (r.sessions_count || 0), 0);
    const totalFamilyContacts = filteredSocialReports.reduce((sum, r) => sum + (r.family_contacts || 0), 0);

    // Quality statistics
    const totalQualityVisits = filteredQualityReports.length;
    const avgQualityTeachingRate = filteredQualityReports.length > 0 ?
      (filteredQualityReports.reduce((sum, r) => sum + (r.teaching_performance_rate || 0), 0) / filteredQualityReports.length).toFixed(1) : 0;

    return {
      totalLateTeachers,
      totalAbsentTeachers,
      totalCoveringTeachers,
      totalIncidents,
      totalAbsentStudents,
      avgDiscipline,
      avgCleanliness,
      avgAttendance,
      avgBehavior,
      totalActivities,
      totalActivitiesParticipants,
      avgActivitiesInteraction,
      totalStudentCases,
      totalPsychologicalCases,
      totalAcademicCases,
      totalBehavioralCases,
      totalSessions,
      totalFamilyContacts,
      totalQualityVisits,
      avgQualityTeachingRate,
      supervisorReportsCount: filteredSupervisorReports.length,
      activitiesReportsCount: filteredActivitiesReports.length,
      socialReportsCount: filteredSocialReports.length,
      qualityReportsCount: filteredQualityReports.length,
      totalAllReports: filteredSupervisorReports.length + filteredActivitiesReports.length + 
                       filteredSocialReports.length + filteredQualityReports.length
    };
  };

  // Get chart data for teachers
  const getTeachersChartData = () => {
    const stats = getOverallStatistics();
    return [
      { name: 'الغائبون', value: stats.totalAbsentTeachers, fill: '#ef4444' },
      { name: 'المتأخرون', value: stats.totalLateTeachers, fill: '#f97316' },
      { name: 'المغطون', value: stats.totalCoveringTeachers, fill: '#22c55e' }
    ];
  };

  // Get performance chart data
  const getPerformanceChartData = () => {
    const stats = getOverallStatistics();
    return [
      { name: 'انضباط الطلاب', value: parseFloat(stats.avgDiscipline) },
      { name: 'نظافة الفصول', value: parseFloat(stats.avgCleanliness) },
      { name: 'التزام المعلمين', value: parseFloat(stats.avgAttendance) },
      { name: 'السلوك العام', value: parseFloat(stats.avgBehavior) }
    ];
  };

  // Get activities chart data
  const getActivitiesChartData = () => {
    const stats = getOverallStatistics();
    return [
      { name: 'الأنشطة', value: stats.totalActivities },
      { name: 'المشاركين', value: Math.floor(stats.totalActivitiesParticipants / 10) }, // Scaled down for better visualization
      { name: 'التفاعل', value: parseFloat(stats.avgActivitiesInteraction) }
    ];
  };

  // Get social cases chart data
  const getSocialCasesChartData = () => {
    const stats = getOverallStatistics();
    return [
      { name: 'حالات نفسية', value: stats.totalPsychologicalCases, fill: '#ec4899' },
      { name: 'حالات أكاديمية', value: stats.totalAcademicCases, fill: '#f59e0b' },
      { name: 'حالات سلوكية', value: stats.totalBehavioralCases, fill: '#ef4444' }
    ];
  };

  // Generate PDF Export with charts and comprehensive data
  const exportToPDF = async () => {
    try {
      toast.info("جاري إنشاء التقرير...");
      
      const stats = getOverallStatistics();
      const reports = getDetailedReports();
      
      const timeFilterText = timeFilter === "daily" ? "اليوم" : 
                            timeFilter === "weekly" ? "هذا الأسبوع" : 
                            timeFilter === "monthly" ? "هذا الشهر" :
                            timeFilter === "custom" && customStartDate && customEndDate ? 
                              `من ${customStartDate} إلى ${customEndDate}` : "جميع الفترات";
      
      const reportTypeText = reportTypeFilter === "all" ? "جميع التقارير" :
                            reportTypeFilter === "vice_principal" ? "تقارير الوكلاء" :
                            reportTypeFilter === "supervisor" ? "تقارير المشرفين" :
                            reportTypeFilter === "activities" ? "تقارير الأنشطة" :
                            reportTypeFilter === "social" ? "تقارير الأخصائي الاجتماعي" :
                            reportTypeFilter === "quality" ? "تقارير الجودة" :
                            reportTypeFilter === "educational_supervision" ? "تقارير الإشراف التربوي" : "";
      
      const branchText = user.branch === 'boys' ? 'فرع البنين' : 'فرع البنات';
      const content = [];
      
      // === القسم 1: الإحصائيات الإجمالية ===
      const overallStats = [
        { label: 'إجمالي التقارير', value: stats.totalAllReports.toString(), color: '#dbeafe' },
        { label: 'المعلمون الغائبون', value: stats.totalAbsentTeachers.toString(), color: '#fee2e2' },
        { label: 'المعلمون المتأخرون', value: stats.totalLateTeachers.toString(), color: '#fed7aa' },
        { label: 'المعلمون المغطون', value: stats.totalCoveringTeachers.toString(), color: '#d1fae5' },
        { label: 'الطلاب الغائبون', value: stats.totalAbsentStudents.toString(), color: '#fce7f3' },
        { label: 'الحوادث المسجلة', value: stats.totalIncidents.toString(), color: '#fee2e2' }
      ];
      
      content.push(createSection('📊 الإحصائيات العامة', createStatsGrid(overallStats)));
      
      // === القسم 2: مؤشرات الأداء ===
      const performanceTable = createRTLTable(
        [
          { text: 'المؤشر', width: '*' },
          { text: 'القيمة', width: 80 }
        ],
        [
          ['انضباط الطلاب', `${stats.avgDiscipline}/10`],
          ['نظافة الفصول', `${stats.avgCleanliness}/10`],
          ['التزام المعلمين', `${stats.avgAttendance}/10`],
          ['السلوك العام', `${stats.avgBehavior}/10`]
        ],
        { showRowNumbers: false }
      );
      content.push(createSection('📈 مؤشرات الأداء', performanceTable));
      
      // === القسم 3: المخططات البيانية ===
      toast.info("جاري التقاط المخططات...");
      
      const teachersChartImage = await captureChartAsImage('#director-teachers-chart');
      if (teachersChartImage) {
        content.push(createSection('📊 توزيع حالات المعلمين', createChartImage(teachersChartImage, { width: 450, height: 250 })));
      }
      
      const performanceChartImage = await captureChartAsImage('#director-performance-chart');
      if (performanceChartImage) {
        content.push(createSection('📈 متوسط الأداء العام', createChartImage(performanceChartImage, { width: 450, height: 250 })));
      }
      
      const absentChartImage = await captureChartAsImage('#director-absent-teachers-chart');
      if (absentChartImage) {
        content.push(createSection('📉 تفاصيل غياب المعلمين', createChartImage(absentChartImage, { width: 450, height: 250 })));
      }
      
      const activitiesChartImage = await captureChartAsImage('#director-activities-chart');
      if (activitiesChartImage) {
        content.push(createSection('🎯 إحصائيات الأنشطة', createChartImage(activitiesChartImage, { width: 450, height: 250 })));
      }
      
      const socialChartImage = await captureChartAsImage('#director-social-chart');
      if (socialChartImage) {
        content.push(createSection('👥 توزيع حالات الأخصائي الاجتماعي', createChartImage(socialChartImage, { width: 450, height: 250 })));
      }
      
      // === القسم 3.1: جداول تفصيلية للمعلمين ===
      
      // جدول المعلمين الغائبين - يظهر فقط في: جميع التقارير، الوكيل، المشرفين
      if (reportTypeFilter === 'all' || reportTypeFilter === 'vice_principal' || reportTypeFilter === 'supervisor') {
        const absentTeachers = getAggregatedAbsentTeachers();
        if (absentTeachers.length > 0) {
          const absentTeachersTable = createRTLTable(
            [
              { text: 'اسم المعلم', width: '*' },
              { text: 'عدد أيام الغياب', width: 80 },
              { text: 'عدد التقارير', width: 80 }
            ],
            absentTeachers.slice(0, 20).map(teacher => [
              teacher.name,
              teacher.totalDays.toString(),
              teacher.count.toString()
            ]),
            { showRowNumbers: true, headerColor: '#fee2e2' }
          );
          content.push(createSection(`👤 المعلمون الغائبون (${absentTeachers.length} معلم)`, absentTeachersTable));
        }
      }
      
      // جدول المعلمين المتأخرين - يظهر فقط في: جميع التقارير، الوكيل، المشرفين
      if (reportTypeFilter === 'all' || reportTypeFilter === 'vice_principal' || reportTypeFilter === 'supervisor') {
        const lateTeachers = getAggregatedLateTeachers();
        if (lateTeachers.length > 0) {
          const lateTeachersTable = createRTLTable(
            [
              { text: 'اسم المعلم', width: '*' },
              { text: 'عدد مرات التأخير', width: 80 },
              { text: 'إجمالي الدقائق', width: 80 }
            ],
            lateTeachers.slice(0, 20).map(teacher => [
              teacher.name,
              teacher.count.toString(),
              teacher.totalMinutes ? teacher.totalMinutes.toString() + ' دقيقة' : '-'
            ]),
            { showRowNumbers: true, headerColor: '#fed7aa' }
          );
          content.push(createSection(`⏰ المعلمون المتأخرون (${lateTeachers.length} معلم)`, lateTeachersTable));
        }
      }
      
      // جدول المعلمين المغطين - يظهر فقط في: جميع التقارير، الوكيل، المشرفين
      if (reportTypeFilter === 'all' || reportTypeFilter === 'vice_principal' || reportTypeFilter === 'supervisor') {
        const coveringTeachers = getAggregatedCoveringTeachers();
        if (coveringTeachers.length > 0) {
          const coveringTeachersTable = createRTLTable(
            [
              { text: 'اسم المعلم', width: '*' },
              { text: 'عدد الحصص المغطاة', width: 80 },
              { text: 'المواد', width: 120 }
            ],
            coveringTeachers.slice(0, 20).map(teacher => [
              teacher.name,
              teacher.count.toString(),
              teacher.subjects && Array.isArray(teacher.subjects) && teacher.subjects.length > 0 ? teacher.subjects.slice(0, 3).join(', ') : '-'
            ]),
            { showRowNumbers: true, headerColor: '#d1fae5' }
          );
          content.push(createSection(`📚 المعلمون المغطون (${coveringTeachers.length} معلم)`, coveringTeachersTable));
        }
      }
      
      // جدول المعلمين المشاركين في الأنشطة - يظهر فقط في: جميع التقارير، الأنشطة
      if (reportTypeFilter === 'all' || reportTypeFilter === 'activities') {
        const activityTeachers = getAggregatedActivityTeachers();
        if (activityTeachers.length > 0) {
          const activityTeachersTable = createRTLTable(
            [
              { text: 'اسم المعلم', width: '*' },
              { text: 'عدد الأنشطة', width: 100 }
            ],
            activityTeachers.slice(0, 20).map(teacher => [
              teacher.name,
              teacher.count.toString()
            ]),
            { showRowNumbers: true, headerColor: '#e9d5ff' }
          );
          content.push(createSection(`🎯 المعلمون المشرفون على الأنشطة (${activityTeachers.length} معلم)`, activityTeachersTable));
        }

        // جدول المعلمين المتعاونين في الأنشطة
        const cooperatingTeachers = getCooperatingTeachers();
        if (cooperatingTeachers.length > 0) {
          const cooperatingTeachersTable = createRTLTable(
            [
              { text: 'اسم المعلم', width: '*' },
              { text: 'عدد الأنشطة', width: 100 }
            ],
            cooperatingTeachers.slice(0, 20).map(teacher => [
              teacher.name,
              teacher.count.toString()
            ]),
            { showRowNumbers: true, headerColor: '#fed7aa' }
          );
          content.push(createSection(`🤝 المعلمون المتعاونون في الأنشطة (${cooperatingTeachers.length} معلم)`, cooperatingTeachersTable));
        }
      }
      
      // جدول تقييم تحسن المعلمين (من الإشراف التربوي) - نفس عرض TeacherProgressView
      if ((reportTypeFilter === "all" || reportTypeFilter === "educational_supervision") && educationalSupervisionReports.length > 0) {
        // Group evaluations by teacher like TeacherProgressView does
        const teacherMap = {};
        
        educationalSupervisionReports.forEach(report => {
          report.teacher_evaluations?.forEach(eval_item => {
            if (!teacherMap[eval_item.teacher_id]) {
              teacherMap[eval_item.teacher_id] = {
                teacher_id: eval_item.teacher_id,
                teacher_name: eval_item.teacher_name,
                evaluations: []
              };
            }
            
            teacherMap[eval_item.teacher_id].evaluations.push({
              date: report.date,
              planning: eval_item.planning || 0,
              performance: eval_item.performance || 0,
              time_management: eval_item.time_management || 0,
              goal_achievement: eval_item.goal_achievement || 0,
              average: ((eval_item.planning + eval_item.performance + eval_item.time_management + eval_item.goal_achievement) / 4) || 0
            });
          });
        });

        const teacherProgress = Object.values(teacherMap).map(teacher => {
          // Sort evaluations by date
          teacher.evaluations.sort((a, b) => new Date(a.date) - new Date(b.date));
          
          const firstEval = teacher.evaluations[0]?.average || 0;
          const lastEval = teacher.evaluations[teacher.evaluations.length - 1]?.average || 0;
          const improvement = lastEval - firstEval;
          
          return {
            ...teacher,
            firstEval,
            lastEval,
            improvement,
            trend: improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'stable'
          };
        });
        
        if (teacherProgress.length > 0) {
          // Summary section
          content.push({
            text: 'ملخص تقييم تحسن المعلمين',
            style: 'sectionHeader',
            margin: [0, 10, 0, 10]
          });
          
          content.push({
            columns: [
              {
                width: '33%',
                stack: [
                  { text: 'معلمون محسّنون', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
                  { text: teacherProgress.filter(t => t.trend === 'up').length.toString(), fontSize: 20, color: '#16a34a' }
                ],
                alignment: 'center'
              },
              {
                width: '34%',
                stack: [
                  { text: 'معلمون مستقرون', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
                  { text: teacherProgress.filter(t => t.trend === 'stable').length.toString(), fontSize: 20, color: '#ca8a04' }
                ],
                alignment: 'center'
              },
              {
                width: '33%',
                stack: [
                  { text: 'يحتاجون دعم', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
                  { text: teacherProgress.filter(t => t.trend === 'down').length.toString(), fontSize: 20, color: '#dc2626' }
                ],
                alignment: 'center'
              }
            ],
            margin: [0, 0, 0, 15]
          });

          // Teacher progress table with detailed info
          const evaluationRows = teacherProgress.map(teacher => {
            const status = teacher.trend === 'up' ? '✅ تحسن' : teacher.trend === 'down' ? '⚠️ تراجع' : '➖ مستقر';
            const improvementText = teacher.improvement > 0 ? '+' + teacher.improvement.toFixed(1) : teacher.improvement.toFixed(1);
            
            return [
              teacher.teacher_name,
              teacher.evaluations.length.toString(),
              teacher.firstEval.toFixed(1) + '/10',
              teacher.lastEval.toFixed(1) + '/10',
              improvementText,
              status
            ];
          });
          
          const teacherEvalTable = createRTLTable(
            [
              { text: 'اسم المعلم', width: '*' },
              { text: 'عدد التقييمات', width: 70 },
              { text: 'أول تقييم', width: 60 },
              { text: 'آخر تقييم', width: 60 },
              { text: 'التحسن', width: 60 },
              { text: 'الحالة', width: 70 }
            ],
            evaluationRows,
            { showRowNumbers: true, headerColor: '#dbeafe' }
          );
          content.push(teacherEvalTable);
        }
      }
      
      // === القسم 4: تفاصيل الأنشطة ===
      if (reportTypeFilter === "all" || reportTypeFilter === "activities") {
        if (stats.activitiesReportsCount > 0) {
          const activitiesStats = [
            { label: 'إجمالي الأنشطة', value: stats.totalActivities.toString(), color: '#dbeafe' },
            { label: 'إجمالي المشاركين', value: stats.totalActivitiesParticipants.toString(), color: '#e9d5ff' },
            { label: 'متوسط التفاعل', value: `${stats.avgActivitiesInteraction}/10`, color: '#d1fae5' }
          ];
          content.push(createSection('🎯 تفاصيل الأنشطة', createStatsGrid(activitiesStats)));
        }
      }
      
      // === القسم 5: تفاصيل الأخصائي الاجتماعي ===
      if (reportTypeFilter === "all" || reportTypeFilter === "social") {
        if (stats.socialReportsCount > 0) {
          const socialStatsTable = createRTLTable(
            [
              { text: 'نوع الحالة', width: '*' },
              { text: 'العدد', width: 80 }
            ],
            [
              ['حالات نفسية', stats.totalPsychologicalCases.toString()],
              ['حالات أكاديمية', stats.totalAcademicCases.toString()],
              ['حالات سلوكية', stats.totalBehavioralCases.toString()],
              [{ text: 'إجمالي الحالات', fontSize: 11 }, { text: stats.totalStudentCases.toString(), fontSize: 11, fillColor: '#dbeafe' }]
            ],
            { showRowNumbers: false }
          );
          content.push(createSection('👥 إحصائيات الأخصائي الاجتماعي', {
            stack: [
              socialStatsTable,
              {
                columns: [
                  { text: `إجمالي الجلسات: ${stats.totalSessions}`, style: 'infoText', width: '*', alignment: 'right' },
                  { text: `التواصل مع الأسر: ${stats.totalFamilyContacts}`, style: 'infoText', width: '*', alignment: 'left' }
                ],
                margin: [0, 10, 0, 0]
              }
            ]
          }));
        }
      }
      
      // === القسم 6: تفاصيل الجودة ===
      if (reportTypeFilter === "all" || reportTypeFilter === "quality") {
        if (stats.qualityReportsCount > 0) {
          const qualityStats = [
            { label: 'إجمالي الزيارات', value: stats.totalQualityVisits.toString(), color: '#dbeafe' },
            { label: 'متوسط الأداء التدريسي', value: `${stats.avgQualityTeachingRate}/10`, color: '#d1fae5' }
          ];
          content.push(createSection('✅ إحصائيات الجودة', createStatsGrid(qualityStats)));
        }
      }
      
      // Generate PDF
      const filename = `تقرير_المدير_${user.branch === 'boys' ? 'بنين' : 'بنات'}_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.pdf`;
      
      generatePDF(content, filename, {
        title: 'تقرير المدير الشامل',
        orientation: 'portrait',
        additionalInfo: {
          leftInfo: `${branchText} | ${timeFilterText} | ${reportTypeText}`
        }
      });
      
      toast.success("تم تصدير التقرير الشامل بنجاح مع جميع المخططات والتفاصيل الكاملة");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("حدث خطأ أثناء إنشاء التقرير");
    }
  };
  

  // Calculate overall statistics
  const getOverallStatistics_OLD = () => {
    let filteredSupervisorReports = filterReportsByTimeOnly([...supervisorReports]);
    let filteredActivitiesReports = filterReportsByTimeOnly([...activitiesReports]);
    let filteredSocialReports = filterReportsByTimeOnly([...socialReports]);
    let filteredQualityReports = filterReportsByTimeOnly([...qualityReports]);

    // Supervisor statistics
    const totalLateTeachers = filteredSupervisorReports.reduce((sum, r) => sum + (r.late_teachers?.length || 0), 0);
    const totalAbsentTeachers = filteredSupervisorReports.reduce((sum, r) => sum + (r.absent_teachers?.length || 0), 0);
    const totalCoveringTeachers = filteredSupervisorReports.reduce((sum, r) => sum + (r.covering_teachers?.length || 0), 0);
    const totalIncidents = filteredSupervisorReports.reduce((sum, r) => sum + (r.incidents?.length || 0), 0);
    const totalAbsentStudents = filteredSupervisorReports.reduce((sum, r) => sum + (r.absent_students_count || 0), 0);
    
    const avgDiscipline = filteredSupervisorReports.length > 0 ? 
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.student_discipline || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;
    const avgCleanliness = filteredSupervisorReports.length > 0 ?
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.classroom_cleanliness || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;
    const avgAttendance = filteredSupervisorReports.length > 0 ?
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.teacher_attendance_rate || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;
    const avgBehavior = filteredSupervisorReports.length > 0 ?
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.general_behavior || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;

    // Activities statistics
    const totalActivities = filteredActivitiesReports.reduce((sum, r) => sum + (r.activities?.length || 0), 0);
    const totalActivitiesParticipants = filteredActivitiesReports.reduce((sum, r) => {
      return sum + (r.activities || []).reduce((aSum, a) => aSum + (a.participants_count || 0), 0);
    }, 0);
    const avgActivitiesInteraction = filteredActivitiesReports.length > 0 ? 
      (filteredActivitiesReports.reduce((sum, r) => {
        const activities = r.activities || [];
        const avgInteraction = activities.length > 0 ? 
          activities.reduce((aSum, a) => aSum + (a.interaction_rate || 0), 0) / activities.length : 0;
        return sum + avgInteraction;
      }, 0) / filteredActivitiesReports.length).toFixed(1) : 0;

    // Social Specialist statistics
    const totalPsychologicalCases = filteredSocialReports.reduce((sum, r) => sum + (r.psychological_cases || 0), 0);
    const totalAcademicCases = filteredSocialReports.reduce((sum, r) => sum + (r.academic_cases || 0), 0);
    const totalBehavioralCases = filteredSocialReports.reduce((sum, r) => sum + (r.behavioral_cases || 0), 0);
    const totalStudentCases = totalPsychologicalCases + totalAcademicCases + totalBehavioralCases;
    const totalSessions = filteredSocialReports.reduce((sum, r) => sum + (r.sessions_count || 0), 0);
    const totalFamilyContacts = filteredSocialReports.reduce((sum, r) => sum + (r.family_contacts || 0), 0);

    // Quality statistics
    const totalQualityVisits = filteredQualityReports.length;
    const avgQualityTeachingRate = filteredQualityReports.length > 0 ?
      (filteredQualityReports.reduce((sum, r) => sum + (r.teaching_performance_rate || 0), 0) / filteredQualityReports.length).toFixed(1) : 0;

    return {
      totalLateTeachers,
      totalAbsentTeachers,
      totalCoveringTeachers,
      totalIncidents,
      totalAbsentStudents,
      avgDiscipline,
      avgCleanliness,
      avgAttendance,
      avgBehavior,
      totalActivities,
      totalActivitiesParticipants,
      avgActivitiesInteraction,
      totalStudentCases,
      totalPsychologicalCases,
      totalAcademicCases,
      totalBehavioralCases,
      totalSessions,
      totalFamilyContacts,
      totalQualityVisits,
      avgQualityTeachingRate,
      supervisorReportsCount: filteredSupervisorReports.length,
      activitiesReportsCount: filteredActivitiesReports.length,
      socialReportsCount: filteredSocialReports.length,
      qualityReportsCount: filteredQualityReports.length,
      totalAllReports: filteredSupervisorReports.length + filteredActivitiesReports.length + 
                       filteredSocialReports.length + filteredQualityReports.length
    };
  };

  return (
    <DashboardLayout title="لوحة تحكم الجودة - مدارس الفجر الجديد الأهلية">
      <div className="space-y-6">
        {/* Tabs Navigation - Mobile Responsive */}
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row border-b overflow-x-auto">
              <button
                onClick={() => setActiveTab("quality-create")}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                  activeTab === "quality-create"
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="hidden sm:inline">✍️ إنشاء تقرير جودة</span>
                <span className="sm:hidden">✍️ إنشاء</span>
              </button>
              <button
                onClick={() => setActiveTab("quality-reports")}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                  activeTab === "quality-reports"
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="hidden sm:inline">📄 تقارير الجودة</span>
                <span className="sm:hidden">📄 التقارير</span>
              </button>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                  activeTab === "dashboard"
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="hidden sm:inline">📊 الإحصائيات الإجمالية</span>
                <span className="sm:hidden">📊 الإحصائيات</span>
              </button>
              <button
                onClick={() => setActiveTab("teacher-progress")}
                className={`flex-1 px-3 sm:px-6 py-3 sm:py-4 text-center text-sm sm:text-base font-medium transition-colors whitespace-nowrap ${
                  activeTab === "teacher-progress"
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="hidden sm:inline">📈 تقييم تحسن المعلمين</span>
                <span className="sm:hidden">📈 المعلمين</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Tab Content */}
        {activeTab === "quality-create" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تاريخ التقرير</CardTitle>
              </CardHeader>
              <CardContent>
                <Label>اختر التاريخ</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </CardContent>
            </Card>

            {/* القسم الأكاديمي */}
            <Card className="border-l-4 border-blue-500">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2">
                  📚 القسم الأكاديمي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label>تقييم الأداء الأكاديمي (من 1 إلى 10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.academic_performance_rate}
                    onChange={(e) => setFormData({ ...formData, academic_performance_rate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>ملاحظات القسم الأكاديمي</Label>
                  <Textarea
                    value={formData.academic_notes}
                    onChange={(e) => setFormData({ ...formData, academic_notes: e.target.value })}
                    placeholder="أضف ملاحظاتك حول الأداء الأكاديمي"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* قسم الإشراف */}
            <Card className="border-l-4 border-green-500">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2">
                  👁️ قسم الإشراف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label>تقييم جودة الإشراف (من 1 إلى 10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.supervision_quality_rate}
                    onChange={(e) => setFormData({ ...formData, supervision_quality_rate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>ملاحظات الإشراف</Label>
                  <Textarea
                    value={formData.supervision_notes}
                    onChange={(e) => setFormData({ ...formData, supervision_notes: e.target.value })}
                    placeholder="أضف ملاحظاتك حول جودة الإشراف"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* قسم الانضباط */}
            <Card className="border-l-4 border-orange-500">
              <CardHeader className="bg-orange-50">
                <CardTitle className="flex items-center gap-2">
                  ⚖️ قسم الانضباط
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label>تقييم الانضباط (من 1 إلى 10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.discipline_rate}
                    onChange={(e) => setFormData({ ...formData, discipline_rate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>ملاحظات الانضباط</Label>
                  <Textarea
                    value={formData.discipline_notes}
                    onChange={(e) => setFormData({ ...formData, discipline_notes: e.target.value })}
                    placeholder="أضف ملاحظاتك حول الانضباط"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* قسم الأنشطة */}
            <Card className="border-l-4 border-purple-500">
              <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center gap-2">
                  🎨 قسم الأنشطة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label>تقييم جودة الأنشطة (من 1 إلى 10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.activities_quality_rate}
                    onChange={(e) => setFormData({ ...formData, activities_quality_rate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>ملاحظات الأنشطة</Label>
                  <Textarea
                    value={formData.activities_notes}
                    onChange={(e) => setFormData({ ...formData, activities_notes: e.target.value })}
                    placeholder="أضف ملاحظاتك حول الأنشطة"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* قسم الأخصائي الاجتماعي */}
            <Card className="border-l-4 border-pink-500">
              <CardHeader className="bg-pink-50">
                <CardTitle className="flex items-center gap-2">
                  💬 قسم الأخصائي الاجتماعي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label>تقييم أداء الأخصائي الاجتماعي (من 1 إلى 10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.social_specialist_performance_rate}
                    onChange={(e) => setFormData({ ...formData, social_specialist_performance_rate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>ملاحظات الأخصائي الاجتماعي</Label>
                  <Textarea
                    value={formData.social_specialist_notes}
                    onChange={(e) => setFormData({ ...formData, social_specialist_notes: e.target.value })}
                    placeholder="أضف ملاحظاتك حول أداء الأخصائي الاجتماعي"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* معدل الأداء التدريسي العام */}
            <Card className="border-l-4 border-cyan-500">
              <CardHeader className="bg-cyan-50">
                <CardTitle className="flex items-center gap-2">
                  👨‍🏫 الأداء التدريسي العام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <Label>معدل الأداء التدريسي (من 1 إلى 10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.teaching_performance_rate}
                    onChange={(e) => setFormData({ ...formData, teaching_performance_rate: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* التوصيات العامة */}
            <Card>
              <CardHeader>
                <CardTitle>التوصيات العامة</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.general_recommendations}
                  onChange={(e) => setFormData({ ...formData, general_recommendations: e.target.value })}
                  placeholder="أضف التوصيات العامة"
                  rows={4}
                />
              </CardContent>
            </Card>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600">
              {loading ? "جاري الحفظ..." : editingQualityReport ? "تحديث التقرير" : "إنشاء تقرير جودة"}
            </Button>

            {editingQualityReport && (
              <Button
                type="button"
                onClick={() => {
                  setEditingQualityReport(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    academic_performance_rate: "",
                    academic_notes: "",
                    supervision_quality_rate: "",
                    supervision_notes: "",
                    discipline_rate: "",
                    discipline_notes: "",
                    activities_quality_rate: "",
                    activities_notes: "",
                    social_specialist_performance_rate: "",
                    social_specialist_notes: "",
                    teaching_performance_rate: "",
                    general_recommendations: ""
                  });
                }}
                variant="outline"
                className="w-full"
              >
                إلغاء التعديل
              </Button>
            )}
          </form>
        )}

        {activeTab === "quality-reports" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>تصفية التقارير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>عرض</Label>
                    <Select value={viewMode} onValueChange={setViewMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع التقارير</SelectItem>
                        <SelectItem value="daily">يومي</SelectItem>
                        <SelectItem value="monthly">شهري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {viewMode === "daily" && (
                    <div>
                      <Label>اختر اليوم</Label>
                      <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      />
                    </div>
                  )}

                  {viewMode === "monthly" && (
                    <div>
                      <Label>اختر الشهر</Label>
                      <Input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDateFilter("");
                        setMonthFilter("");
                        setViewMode("all");
                      }}
                    >
                      إعادة تعيين
                    </Button>
                    <Button
                      onClick={exportQualityReportsToPDF}
                      className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                    >
                      <FileDown className="w-4 h-4 ml-2" />
                      تصدير PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics Card */}
            {qualityReportsOwn.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    📊 ملخص الإحصائيات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                      <p className="text-sm text-gray-600 mb-1">إجمالي التقارير</p>
                      <p className="text-3xl font-bold text-blue-600">{qualityReportsOwn.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                      <p className="text-sm text-gray-600 mb-1">متوسط التقييم الأكاديمي</p>
                      <p className="text-3xl font-bold text-green-600">
                        {(qualityReportsOwn.reduce((sum, r) => sum + (parseFloat(r.academic_performance?.rate) || 0), 0) / qualityReportsOwn.length).toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                      <p className="text-sm text-gray-600 mb-1">متوسط تقييم الإشراف</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {(qualityReportsOwn.reduce((sum, r) => sum + (parseFloat(r.educational_supervision?.rate) || 0), 0) / qualityReportsOwn.length).toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                      <p className="text-sm text-gray-600 mb-1">متوسط تقييم الانضباط</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {(qualityReportsOwn.reduce((sum, r) => sum + (parseFloat(r.discipline_behavior?.rate) || 0), 0) / qualityReportsOwn.length).toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                      <p className="text-sm text-gray-600 mb-1">متوسط تقييم الأنشطة</p>
                      <p className="text-3xl font-bold text-pink-600">
                        {(qualityReportsOwn.reduce((sum, r) => sum + (parseFloat(r.activities_programs?.rate) || 0), 0) / qualityReportsOwn.length).toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                      <p className="text-sm text-gray-600 mb-1">متوسط تقييم الأخصائي</p>
                      <p className="text-3xl font-bold text-teal-600">
                        {(qualityReportsOwn.reduce((sum, r) => sum + (parseFloat(r.social_specialist?.rate) || 0), 0) / qualityReportsOwn.length).toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                      <p className="text-sm text-gray-600 mb-1">متوسط الأداء التدريسي</p>
                      <p className="text-3xl font-bold text-indigo-600">
                        {(qualityReportsOwn.reduce((sum, r) => sum + (parseFloat(r.social_specialist?.teaching_performance_rate) || 0), 0) / qualityReportsOwn.length).toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                      <p className="text-sm text-gray-600 mb-1">المعدل العام</p>
                      <p className="text-3xl font-bold text-blue-700">
                        {(() => {
                          const avg1 = qualityReportsOwn.reduce((sum, r) => sum + (parseFloat(r.academic_performance?.rate) || 0), 0) / qualityReportsOwn.length;
                          const avg2 = qualityReportsOwn.reduce((sum, r) => sum + (parseFloat(r.educational_supervision?.rate) || 0), 0) / qualityReportsOwn.length;
                          const avg3 = qualityReportsOwn.reduce((sum, r) => sum + (parseFloat(r.discipline_behavior?.rate) || 0), 0) / qualityReportsOwn.length;
                          const avg4 = qualityReportsOwn.reduce((sum, r) => sum + (parseFloat(r.activities_programs?.rate) || 0), 0) / qualityReportsOwn.length;
                          const avg5 = qualityReportsOwn.reduce((sum, r) => sum + (parseFloat(r.social_specialist?.rate) || 0), 0) / qualityReportsOwn.length;
                          return ((avg1 + avg2 + avg3 + avg4 + avg5) / 5).toFixed(1);
                        })()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">
                التقارير ({qualityReportsOwn.length})
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {qualityReportsOwn.map((report) => (
                  <Card
                    key={report.id}
                    className="report-card hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedQualityReport(report);
                      setShowQualityReportModal(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">
                            تقرير {new Date(report.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h4>
                          <p className="text-sm text-gray-500">
                            معدل الأداء التدريسي: {report.social_specialist?.teaching_performance_rate || 0}/10
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQualityReport(report);
                              setShowQualityReportModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4 ml-1" />
                            عرض
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(report);
                            }}
                          >
                            تعديل
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(report.id);
                            }}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Dialog open={showQualityReportModal} onOpenChange={setShowQualityReportModal}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    {selectedQualityReport && `تقرير ${new Date(selectedQualityReport.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                  </DialogTitle>
                </DialogHeader>

                {selectedQualityReport && (
                  <div className="space-y-6 p-4">
                    {/* القسم الأكاديمي */}
                    <Card className="border-l-4 border-blue-500">
                      <CardHeader className="bg-blue-50 py-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          📚 القسم الأكاديمي
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">التقييم:</span>
                          <span className="text-2xl font-bold text-blue-600">{selectedQualityReport.academic_performance?.rate || 0}/10</span>
                        </div>
                        {selectedQualityReport.academic_performance?.notes && (
                          <div className="p-3 bg-blue-50 rounded">
                            <div className="text-xs font-semibold text-blue-800 mb-1">الملاحظات:</div>
                            <p className="text-sm text-gray-700">{selectedQualityReport.academic_performance.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* قسم الإشراف */}
                    <Card className="border-l-4 border-green-500">
                      <CardHeader className="bg-green-50 py-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          👁️ قسم الإشراف
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">التقييم:</span>
                          <span className="text-2xl font-bold text-green-600">{selectedQualityReport.educational_supervision?.rate || 0}/10</span>
                        </div>
                        {selectedQualityReport.educational_supervision?.notes && (
                          <div className="p-3 bg-green-50 rounded">
                            <div className="text-xs font-semibold text-green-800 mb-1">الملاحظات:</div>
                            <p className="text-sm text-gray-700">{selectedQualityReport.educational_supervision.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* قسم الانضباط */}
                    <Card className="border-l-4 border-orange-500">
                      <CardHeader className="bg-orange-50 py-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          ⚖️ قسم الانضباط
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">التقييم:</span>
                          <span className="text-2xl font-bold text-orange-600">{selectedQualityReport.discipline_behavior?.rate || 0}/10</span>
                        </div>
                        {selectedQualityReport.discipline_behavior?.notes && (
                          <div className="p-3 bg-orange-50 rounded">
                            <div className="text-xs font-semibold text-orange-800 mb-1">الملاحظات:</div>
                            <p className="text-sm text-gray-700">{selectedQualityReport.discipline_behavior.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* قسم الأنشطة */}
                    <Card className="border-l-4 border-purple-500">
                      <CardHeader className="bg-purple-50 py-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          🎨 قسم الأنشطة
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">التقييم:</span>
                          <span className="text-2xl font-bold text-purple-600">{selectedQualityReport.activities_programs?.rate || 0}/10</span>
                        </div>
                        {selectedQualityReport.activities_programs?.notes && (
                          <div className="p-3 bg-purple-50 rounded">
                            <div className="text-xs font-semibold text-purple-800 mb-1">الملاحظات:</div>
                            <p className="text-sm text-gray-700">{selectedQualityReport.activities_programs.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* قسم الأخصائي الاجتماعي */}
                    <Card className="border-l-4 border-pink-500">
                      <CardHeader className="bg-pink-50 py-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          💬 قسم الأخصائي الاجتماعي
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">التقييم:</span>
                          <span className="text-2xl font-bold text-pink-600">{selectedQualityReport.social_specialist?.rate || 0}/10</span>
                        </div>
                        {selectedQualityReport.social_specialist?.notes && (
                          <div className="p-3 bg-pink-50 rounded">
                            <div className="text-xs font-semibold text-pink-800 mb-1">الملاحظات:</div>
                            <p className="text-sm text-gray-700">{selectedQualityReport.social_specialist.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* الأداء التدريسي العام */}
                    <Card className="border-l-4 border-cyan-500">
                      <CardHeader className="bg-cyan-50 py-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          👨‍🏫 الأداء التدريسي العام
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">معدل الأداء:</span>
                          <span className="text-2xl font-bold text-cyan-600">{selectedQualityReport.social_specialist?.teaching_performance_rate || 0}/10</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* التوصيات العامة */}
                    {selectedQualityReport.social_specialist?.general_recommendations && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">التوصيات العامة</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedQualityReport.social_specialist.general_recommendations}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === "teacher-progress" && (
          <TeacherProgressView branch={user.branch} />
        )}

        {activeTab === "dashboard" && (
          <>
            {/* Filters */}
            <Card>
          <CardHeader>
            <CardTitle>التصفية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">نوع التقرير</label>
                  <Select value={reportTypeFilter} onValueChange={(value) => {
                    setReportTypeFilter(value);
                    setSelectedSpecificEmployee("all");
                    setSelectedVicePrincipal("all");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع التقرير" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع التقارير</SelectItem>
                      <SelectItem value="vice_principal">الوكلاء</SelectItem>
                      <SelectItem value="supervisor">المشرفين</SelectItem>
                      <SelectItem value="activities">الأنشطة</SelectItem>
                      <SelectItem value="social">الأخصائي الاجتماعي</SelectItem>
                      <SelectItem value="quality">الجودة</SelectItem>
                      <SelectItem value="educational_supervision">الإشراف التربوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">الفترة الزمنية</label>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفترة الزمنية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفترات</SelectItem>
                      <SelectItem value="daily">اليوم</SelectItem>
                      <SelectItem value="weekly">هذا الأسبوع</SelectItem>
                      <SelectItem value="monthly">هذا الشهر</SelectItem>
                      <SelectItem value="custom">فترة مخصصة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Branch filter - only for directors with branch="both" */}
                {user && user.branch === "both" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">الفرع</label>
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفرع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفروع</SelectItem>
                        <SelectItem value="boys">البنين</SelectItem>
                        <SelectItem value="girls">البنات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Filter for Vice Principals */}
                {reportTypeFilter === "vice_principal" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">اختيار الوكيل</label>
                    <Select value={selectedVicePrincipal} onValueChange={setSelectedVicePrincipal}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الوكيل" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل الوكلاء</SelectItem>
                        {users.filter(u => u.role === "vice_principal").map(vp => (
                          <SelectItem key={vp.id} value={vp.id}>
                            {vp.full_name || vp.username} ({vp.branch === "boys" ? "بنين" : "بنات"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Filter for other employees */}
                {reportTypeFilter !== "all" && reportTypeFilter !== "vice_principal" && getEmployeesForReportType().length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">اختيار الموظف</label>
                    <Select value={selectedSpecificEmployee} onValueChange={setSelectedSpecificEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الموظف" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الموظفين</SelectItem>
                        {getEmployeesForReportType().map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name || emp.username} ({emp.branch === "boys" ? "بنين" : "بنات"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {timeFilter === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">من تاريخ</label>
                    <Input 
                      type="date" 
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">إلى تاريخ</label>
                    <Input 
                      type="date" 
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <Button 
                onClick={exportToPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                📄 تصدير التقرير إلى PDF
              </Button>
              
              <Button 
                onClick={() => setShowDetailedReports(!showDetailedReports)}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {showDetailedReports ? "إخفاء التقارير التفصيلية" : "عرض التقارير التفصيلية"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {(() => {
          const stats = getOverallStatistics();
          return (
            <>
              {/* Supervisor Statistics */}
              {(reportTypeFilter === "all" || reportTypeFilter === "supervisor") && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-700 mb-1 font-semibold">المعلمون الغائبون</div>
                      <div className="text-4xl font-bold text-red-700">{stats.totalAbsentTeachers}</div>
                      <p className="text-xs text-gray-600 mt-2">خلال {timeFilter === "daily" ? "اليوم" : timeFilter === "weekly" ? "الأسبوع" : timeFilter === "monthly" ? "الشهر" : "جميع الفترات"}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-700 mb-1 font-semibold">المعلمون المتأخرون</div>
                      <div className="text-4xl font-bold text-orange-700">{stats.totalLateTeachers}</div>
                      <p className="text-xs text-gray-600 mt-2">خلال {timeFilter === "daily" ? "اليوم" : timeFilter === "weekly" ? "الأسبوع" : timeFilter === "monthly" ? "الشهر" : "جميع الفترات"}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-700 mb-1 font-semibold">المعلمون المغطون</div>
                      <div className="text-4xl font-bold text-green-700">{stats.totalCoveringTeachers}</div>
                      <p className="text-xs text-gray-600 mt-2">خلال {timeFilter === "daily" ? "اليوم" : timeFilter === "weekly" ? "الأسبوع" : timeFilter === "monthly" ? "الشهر" : "جميع الفترات"}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-700 mb-1 font-semibold">الطلاب الغائبون</div>
                      <div className="text-4xl font-bold text-blue-700">{stats.totalAbsentStudents}</div>
                      <p className="text-xs text-gray-600 mt-2">خلال {timeFilter === "daily" ? "اليوم" : timeFilter === "weekly" ? "الأسبوع" : timeFilter === "monthly" ? "الشهر" : "جميع الفترات"}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>متوسط الأداء العام</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="stat-card bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-cyan-500 p-4 rounded-lg">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">انضباط الطلاب</div>
                        <div className="text-3xl font-bold text-cyan-700">{stats.avgDiscipline}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 p-4 rounded-lg">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">نظافة الفصول</div>
                        <div className="text-3xl font-bold text-blue-700">{stats.avgCleanliness}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 p-4 rounded-lg">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">التزام المعلمين</div>
                        <div className="text-3xl font-bold text-purple-700">{stats.avgAttendance}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500 p-4 rounded-lg">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">السلوك العام</div>
                        <div className="text-3xl font-bold text-green-700">{stats.avgBehavior}/10</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300">
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-700 mb-1 font-semibold">الحوادث والمخالفات</div>
                      <div className="text-4xl font-bold text-yellow-700">{stats.totalIncidents}</div>
                      <p className="text-xs text-gray-600 mt-2">إجمالي الحوادث المسجلة</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300">
                    <CardContent className="p-6">
                      <div className="text-sm text-gray-700 mb-1 font-semibold">تقارير المشرفين</div>
                      <div className="text-4xl font-bold text-purple-700">{stats.supervisorReportsCount}</div>
                      <p className="text-xs text-gray-600 mt-2">إجمالي تقارير المشرفين</p>
                    </CardContent>
                  </Card>
                </div>
              </>
              )}

              {/* Activities Statistics */}
              {(reportTypeFilter === "all" || reportTypeFilter === "activities") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-purple-700">🎯 إحصائيات الأنشطة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                      <CardContent className="p-6">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">إجمالي الأنشطة</div>
                        <div className="text-4xl font-bold text-purple-700">{stats.totalActivities}</div>
                        <p className="text-xs text-gray-600 mt-2">{stats.activitiesReportsCount} تقرير</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-l-4 border-indigo-500">
                      <CardContent className="p-6">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">إجمالي المشاركين</div>
                        <div className="text-4xl font-bold text-indigo-700">{stats.totalActivitiesParticipants}</div>
                        <p className="text-xs text-gray-600 mt-2">في جميع الأنشطة</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-l-4 border-violet-500">
                      <CardContent className="p-6">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">متوسط التفاعل</div>
                        <div className="text-4xl font-bold text-violet-700">{stats.avgActivitiesInteraction}/10</div>
                        <p className="text-xs text-gray-600 mt-2">معدل تفاعل الطلاب</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Social Specialist Statistics */}
              {(reportTypeFilter === "all" || reportTypeFilter === "social") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">👥 إحصائيات الأخصائي الاجتماعي</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-l-4 border-rose-500">
                      <CardContent className="p-4">
                        <div className="text-xs text-gray-700 mb-1 font-semibold">إجمالي الحالات</div>
                        <div className="text-3xl font-bold text-rose-700">{stats.totalStudentCases}</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-l-4 border-pink-500">
                      <CardContent className="p-4">
                        <div className="text-xs text-gray-700 mb-1 font-semibold">حالات نفسية</div>
                        <div className="text-3xl font-bold text-pink-700">{stats.totalPsychologicalCases}</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-500">
                      <CardContent className="p-4">
                        <div className="text-xs text-gray-700 mb-1 font-semibold">حالات أكاديمية</div>
                        <div className="text-3xl font-bold text-amber-700">{stats.totalAcademicCases}</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
                      <CardContent className="p-4">
                        <div className="text-xs text-gray-700 mb-1 font-semibold">حالات سلوكية</div>
                        <div className="text-3xl font-bold text-red-700">{stats.totalBehavioralCases}</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-l-4 border-emerald-500">
                      <CardContent className="p-4">
                        <div className="text-xs text-gray-700 mb-1 font-semibold">الجلسات</div>
                        <div className="text-3xl font-bold text-emerald-700">{stats.totalSessions}</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-l-4 border-teal-500">
                      <CardContent className="p-4">
                        <div className="text-xs text-gray-700 mb-1 font-semibold">تواصل مع الأسر</div>
                        <div className="text-3xl font-bold text-teal-700">{stats.totalFamilyContacts}</div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      📊 إجمالي: {stats.socialReportsCount} تقرير من الأخصائي الاجتماعي
                    </p>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Quality Statistics */}
              {(reportTypeFilter === "all" || reportTypeFilter === "quality") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-700">⭐ إحصائيات الجودة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
                      <CardContent className="p-6">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">إجمالي الزيارات</div>
                        <div className="text-4xl font-bold text-orange-700">{stats.totalQualityVisits}</div>
                        <p className="text-xs text-gray-600 mt-2">زيارات الجودة للمعلمين</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-l-4 border-amber-500">
                      <CardContent className="p-6">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">متوسط الأداء التدريسي</div>
                        <div className="text-4xl font-bold text-amber-700">{stats.avgQualityTeachingRate}/10</div>
                        <p className="text-xs text-gray-600 mt-2">معدل أداء المعلمين</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Charts Section */}
              <Card>
                <CardHeader>
                  <CardTitle>📊 الرسوم البيانية والتحليلات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Teachers Chart */}
                    {(reportTypeFilter === "all" || reportTypeFilter === "supervisor") && (
                      <div id="director-teachers-chart" key={`teachers-chart-${activeTab}`}>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">توزيع حالات المعلمين (انقر للتفاصيل)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart key={`pie-teachers-${reportTypeFilter}-${timeFilter}`}>
                            <Pie
                              data={getTeachersChartData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => `${entry.name}: ${entry.value}`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                              onClick={(data, index) => {
                                const types = ['absent', 'late', 'covering'];
                                if (types[index]) {
                                  handleChartClick(types[index]);
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              {getTeachersChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend onClick={(e) => {
                              const name = e.value;
                              if (name === 'الغائبون') handleChartClick('absent');
                              else if (name === 'المتأخرون') handleChartClick('late');
                              else if (name === 'المغطون') handleChartClick('covering');
                            }} wrapperStyle={{ cursor: 'pointer' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {/* Performance Chart */}
                    {(reportTypeFilter === "all" || reportTypeFilter === "supervisor") && (
                      <div id="director-performance-chart">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">متوسط الأداء العام</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={getPerformanceChartData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 10]} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {/* Absent Teachers Detailed Chart */}
                    {(reportTypeFilter === "all" || reportTypeFilter === "supervisor" || reportTypeFilter === "vice_principal") && (
                      <div id="director-absent-teachers-chart">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">تفاصيل غياب المعلمين (عدد الأيام)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={getAggregatedAbsentTeachers().slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis label={{ value: 'عدد أيام الغياب', angle: -90, position: 'insideLeft' }} />
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                                      <p className="font-semibold">{payload[0].payload.name}</p>
                                      <p className="text-red-600">أيام الغياب: {payload[0].payload.totalDays}</p>
                                      <p className="text-gray-600">عدد التقارير: {payload[0].payload.count}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend />
                            <Bar 
                              dataKey="totalDays" 
                              fill="#ef4444" 
                              name="أيام الغياب"
                              onClick={() => handleChartClick('absent')}
                              style={{ cursor: 'pointer' }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="text-center mt-4">
                          <Button
                            variant="outline"
                            onClick={() => handleChartClick('absent')}
                          >
                            👥 عرض القائمة الكاملة للمعلمين الغائبين
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Activities Chart */}
                    {(reportTypeFilter === "all" || reportTypeFilter === "activities") && (
                      <div id="director-activities-chart">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">إحصائيات الأنشطة (انقر على "المشاركين" للتفاصيل)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={getActivitiesChartData()} onClick={(e) => {
                            if (e && e.activeLabel === 'المشاركين') {
                              handleChartClick('activity');
                            }
                          }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend onClick={(e) => {
                              if (e.value === 'value' || e.dataKey === 'value') {
                                // نفترض أن النقر على أي جزء يفتح قائمة المعلمين المشاركين
                                handleChartClick('activity');
                              }
                            }} wrapperStyle={{ cursor: 'pointer' }} />
                            <Bar dataKey="value" fill="#8b5cf6" onClick={() => handleChartClick('activity')} style={{ cursor: 'pointer' }} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="text-center mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleChartClick('activity')}
                            className="text-xs"
                          >
                            👥 عرض قائمة المعلمين المشرفين
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Social Cases Chart */}
                    {(reportTypeFilter === "all" || reportTypeFilter === "social") && (
                      <div id="director-social-chart">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700">توزيع حالات الأخصائي الاجتماعي</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={getSocialCasesChartData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => `${entry.name}: ${entry.value}`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getSocialCasesChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Teacher Progress Section - Only show for educational_supervision or all */}
              {(reportTypeFilter === "all" || reportTypeFilter === "educational_supervision") && (
                <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-t-4 border-cyan-500">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-xl">📈 تقييم تحسن المعلمين</CardTitle>
                      <Button
                        onClick={() => setActiveTab("teacher-progress")}
                        variant="outline"
                        size="sm"
                        className="text-cyan-600 hover:text-cyan-700"
                      >
                        عرض التفاصيل الكاملة ←
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TeacherProgressView branch={user.branch} compact={true} />
                  </CardContent>
                </Card>
              )}

              {/* Activity Supervisors - Show for activities or all */}
              {(reportTypeFilter === "all" || reportTypeFilter === "activities") && (
                <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-t-4 border-purple-500">
                  <CardHeader>
                    <CardTitle className="text-xl">🎯 المعلمون المشرفون على الأنشطة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActivitySupervisorsView compact={true} />
                  </CardContent>
                </Card>
              )}

              {/* Cooperating Teachers - Show for activities or all */}
              {(reportTypeFilter === "all" || reportTypeFilter === "activities") && (
                <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-t-4 border-orange-500">
                  <CardHeader>
                    <CardTitle className="text-xl">🤝 المعلمون المتعاونون في الأنشطة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CooperatingTeachersView compact={true} />
                  </CardContent>
                </Card>
              )}

              {/* Detailed Reports Section */}
              {showDetailedReports && (
                <Card>
                  <CardHeader>
                    <CardTitle>📋 التقارير التفصيلية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const detailedReports = getDetailedReports();
                      
                      if (detailedReports.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            لا توجد تقارير متاحة بناءً على الفلاتر المحددة
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 mb-4">
                            إجمالي عدد التقارير: {detailedReports.length}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {detailedReports.map((report, index) => {
                              const reportTypeArabic = report.type === "vice_principal" ? "وكيل" :
                                                      report.type === "supervisor" ? "مشرف" :
                                                      report.type === "activities" ? "أنشطة" :
                                                      report.type === "social" ? "أخصائي اجتماعي" :
                                                      report.type === "quality" ? "جودة" :
                                                      report.type === "educational_supervision" ? "إشراف تربوي" : "";
                              
                              const bgColor = report.type === "vice_principal" ? "from-blue-50 to-blue-100 border-blue-500" :
                                            report.type === "supervisor" ? "from-purple-50 to-purple-100 border-purple-500" :
                                            report.type === "activities" ? "from-indigo-50 to-indigo-100 border-indigo-500" :
                                            report.type === "social" ? "from-green-50 to-green-100 border-green-500" :
                                            report.type === "quality" ? "from-orange-50 to-orange-100 border-orange-500" :
                                            report.type === "educational_supervision" ? "from-cyan-50 to-cyan-100 border-cyan-500" : "";
                              
                              return (
                                <Card 
                                  key={index} 
                                  className={`bg-gradient-to-br ${bgColor} border-r-4 cursor-pointer hover:shadow-lg transition-shadow`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Card clicked, opening modal for report:", report.type, report.userName);
                                    setSelectedReport(report);
                                    setShowReportModal(true);
                                  }}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-xs font-semibold px-2 py-1 rounded bg-white shadow-sm">
                                        {reportTypeArabic}
                                      </span>
                                      <span className="text-xs text-gray-600">
                                        {report.date || report.week_start || 'غير محدد'}
                                      </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-1">{report.userName || 'غير معروف'}</h3>
                                    <p className="text-xs text-gray-500 mb-2">
                                      {users.find(u => u.id === report.user_id)?.branch === "boys" ? "قسم البنين" : "قسم البنات"}
                                    </p>
                                    {report.notes && (
                                      <p className="text-xs text-gray-600 line-clamp-2">{report.notes}</p>
                                    )}
                                    {!report.notes && (
                                      <p className="text-xs text-gray-500 italic">
                                        {report.type === "supervisor" && `${report.late_teachers?.length || 0} متأخر، ${report.covering_teachers?.length || 0} مغطي`}
                                        {report.type === "activities" && `${report.activities?.length || 0} نشاط`}
                                        {report.type === "social" && `${(report.psychological_cases || 0) + (report.academic_cases || 0) + (report.behavioral_cases || 0)} حالة`}
                                        {report.type === "quality" && `${report.visited_teachers?.length || 0} زيارة`}
                                        {report.type === "educational_supervision" && `${report.teacher_evaluations?.length || 0} معلم مُقيّم`}
                                      </p>
                                    )}
                                    <div className="mt-3 text-xs text-blue-600 font-medium">
                                      👆 انقر لعرض التفاصيل الكاملة
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Overall Summary */}
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-sm mb-2 font-semibold opacity-90">إجمالي جميع التقارير</div>
                    <div className="text-6xl font-bold">{stats.totalAllReports}</div>
                    <p className="text-xs mt-3 opacity-80">
                      مشرفين: {stats.supervisorReportsCount} | أنشطة: {stats.activitiesReportsCount} | 
                      أخصائي: {stats.socialReportsCount} | جودة: {stats.qualityReportsCount}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          );
        })()}
        
        {/* Report Details Modal */}
        <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تفاصيل التقرير الكامل</DialogTitle>
            </DialogHeader>
            
            {selectedReport && (
              <div className="space-y-4" dir="rtl">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-semibold text-gray-700">اسم الموظف:</span>
                    <p className="text-gray-900">{selectedReport.userName || 'غير معروف'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">الجهة:</span>
                    <p className="text-gray-900">
                      {users.find(u => u.id === selectedReport.user_id)?.branch === "boys" ? "قسم البنين" : "قسم البنات"}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">التاريخ:</span>
                    <p className="text-gray-900">{selectedReport.date || selectedReport.week_start || 'غير محدد'}</p>
                  </div>
                  {selectedReport.week_end && (
                    <div>
                      <span className="font-semibold text-gray-700">نهاية الأسبوع:</span>
                      <p className="text-gray-900">{selectedReport.week_end}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700">نوع التقرير:</span>
                    <p className="text-gray-900">
                      {selectedReport.type === "vice_principal" ? "وكيل" :
                       selectedReport.type === "supervisor" ? "مشرف" :
                       selectedReport.type === "activities" ? "أنشطة" :
                       selectedReport.type === "social" ? "أخصائي اجتماعي" :
                       selectedReport.type === "quality" ? "جودة" : ""}
                    </p>
                  </div>
                </div>
                
                {/* Supervisor Report Details */}
                {selectedReport.type === "supervisor" && (
                  <div className="space-y-4">
                    {selectedReport.late_teachers && Array.isArray(selectedReport.late_teachers) && selectedReport.late_teachers.length > 0 && (
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">المعلمون المتأخرون:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedReport.late_teachers.map((lt, idx) => (
                            <li key={idx} className="text-sm">
                              {typeof lt === 'object' ? `${lt.teacher || ''} - ${lt.subject || ''} - ${lt.minutes_late || 0} دقيقة` : lt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedReport.covering_teachers && Array.isArray(selectedReport.covering_teachers) && selectedReport.covering_teachers.length > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">المعلمون المغطون:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedReport.covering_teachers.map((ct, idx) => (
                            <li key={idx} className="text-sm">
                              {typeof ct === 'object' ? `${ct.teacher || ''} - ${ct.subject || ''} (الحصة ${ct.period || ''})` : ct}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedReport.incidents && Array.isArray(selectedReport.incidents) && selectedReport.incidents.length > 0 && (
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">الحوادث:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedReport.incidents.map((inc, idx) => (
                            <li key={idx} className="text-sm">
                              {typeof inc === 'object' && inc !== null ? 
                                (inc.description || inc.action || JSON.stringify(inc)) : 
                                inc
                              }
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedReport.student_movement && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">حركة الطلاب:</h4>
                        <p className="text-sm">{selectedReport.student_movement}</p>
                        {selectedReport.student_movement_notes && (
                          <p className="text-xs text-gray-600 mt-2">ملاحظات: {selectedReport.student_movement_notes}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="text-xs text-gray-600">انضباط الطلاب</span>
                        <p className="text-2xl font-bold text-blue-700">{selectedReport.student_discipline || 0}/10</p>
                      </div>
                      <div className="p-3 bg-cyan-50 rounded-lg">
                        <span className="text-xs text-gray-600">نظافة الفصول</span>
                        <p className="text-2xl font-bold text-cyan-700">{selectedReport.classroom_cleanliness || 0}/10</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <span className="text-xs text-gray-600">التزام المعلمين</span>
                        <p className="text-2xl font-bold text-purple-700">{selectedReport.teacher_attendance_rate || 0}/10</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <span className="text-xs text-gray-600">السلوك العام</span>
                        <p className="text-2xl font-bold text-green-700">{selectedReport.general_behavior || 0}/10</p>
                      </div>
                    </div>
                    
                    {(selectedReport.general_notes || selectedReport.student_discipline_notes || selectedReport.classroom_cleanliness_notes || selectedReport.teacher_attendance_notes) && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">الملاحظات:</h4>
                        {selectedReport.student_discipline_notes && (
                          <p className="text-sm mb-2"><strong>انضباط الطلاب:</strong> {selectedReport.student_discipline_notes}</p>
                        )}
                        {selectedReport.classroom_cleanliness_notes && (
                          <p className="text-sm mb-2"><strong>نظافة الفصول:</strong> {selectedReport.classroom_cleanliness_notes}</p>
                        )}
                        {selectedReport.teacher_attendance_notes && (
                          <p className="text-sm mb-2"><strong>التزام المعلمين:</strong> {selectedReport.teacher_attendance_notes}</p>
                        )}
                        {selectedReport.general_notes && (
                          <p className="text-sm"><strong>ملاحظات عامة:</strong> {selectedReport.general_notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Activities Report Details */}
                {selectedReport.type === "activities" && selectedReport.activities && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-purple-800">الأنشطة:</h4>
                    {selectedReport.activities.map((activity, idx) => (
                      <div key={idx} className="p-4 bg-purple-50 rounded-lg">
                        <h5 className="font-semibold text-purple-900 mb-2">{activity.activity_name}</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="font-medium">عدد المشاركين:</span> {activity.participants_count}</div>
                          <div><span className="font-medium">معدل التفاعل:</span> {activity.interaction_rate}/10</div>
                          {activity.supervising_teachers && activity.supervising_teachers.length > 0 && (
                            <div className="col-span-2">
                              <span className="font-medium">المعلمون المشرفون:</span> {activity.supervising_teachers.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Social Specialist Report Details */}
                {selectedReport.type === "social" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-pink-50 rounded-lg">
                        <span className="text-xs text-gray-600">حالات نفسية</span>
                        <p className="text-2xl font-bold text-pink-700">{selectedReport.psychological_cases || 0}</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <span className="text-xs text-gray-600">حالات أكاديمية</span>
                        <p className="text-2xl font-bold text-amber-700">{selectedReport.academic_cases || 0}</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <span className="text-xs text-gray-600">حالات سلوكية</span>
                        <p className="text-2xl font-bold text-red-700">{selectedReport.behavioral_cases || 0}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <span className="text-xs text-gray-600">عدد الجلسات</span>
                        <p className="text-2xl font-bold text-emerald-700">{selectedReport.sessions_count || 0}</p>
                      </div>
                      <div className="p-3 bg-teal-50 rounded-lg">
                        <span className="text-xs text-gray-600">التواصل مع الأسر</span>
                        <p className="text-2xl font-bold text-teal-700">{selectedReport.family_contacts || 0}</p>
                      </div>
                    </div>
                    
                    {selectedReport.actions && selectedReport.actions.length > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">الإجراءات المتخذة:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedReport.actions.map((action, idx) => (
                            <li key={idx} className="text-sm">{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Quality Report Details */}
                {selectedReport.type === "quality" && (
                  <div className="space-y-4">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <span className="text-xs text-gray-600">معدل الأداء التدريسي</span>
                      <p className="text-2xl font-bold text-orange-700">{selectedReport.teaching_performance_rate || 0}/10</p>
                    </div>
                    
                    {selectedReport.visited_teachers && selectedReport.visited_teachers.length > 0 && (
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <h4 className="font-semibold text-amber-800 mb-2">المعلمون المزارون:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedReport.visited_teachers.map((teacher, idx) => (
                            <li key={idx} className="text-sm">{teacher}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Vice Principal Report Details */}
                {selectedReport.type === "vice_principal" && (
                  <div className="space-y-4">
                    {selectedReport.late_teachers && selectedReport.late_teachers.length > 0 && (
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">المعلمون المتأخرون:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedReport.late_teachers.map((lt, idx) => (
                            <li key={idx} className="text-sm">
                              {typeof lt === 'object' ? `${lt.teacher} - ${lt.subject} - ${lt.minutes_late} دقيقة` : lt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedReport.problems && selectedReport.problems.length > 0 && (
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">المشكلات:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedReport.problems.map((problem, idx) => (
                            <li key={idx} className="text-sm">
                              {typeof problem === 'object' ? `${problem.description} - ${problem.action || problem.actions}` : problem}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedReport.suggestions && selectedReport.suggestions.length > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">المقترحات:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedReport.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm">
                              {typeof suggestion === 'object' ? suggestion.description : suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Educational Supervision Report Details */}
                {selectedReport.type === "educational_supervision" && selectedReport.teacher_evaluations && (
                  <div className="space-y-4">
                    <div className="bg-cyan-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-cyan-800 mb-3">تقييم تحسين المعلمين</h4>
                      <TeacherProgressView branch={user.branch} compact={false} />
                    </div>
                  </div>
                )}
                
                {/* Notes */}
                {selectedReport.notes && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">ملاحظات:</h4>
                    <p className="text-sm text-gray-700">{selectedReport.notes}</p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={() => setShowReportModal(false)} variant="outline">
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Teachers List Modal */}
        <Dialog open={showTeachersListModal} onOpenChange={setShowTeachersListModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{teachersListData.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4" dir="rtl">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="font-semibold text-blue-800">
                  إجمالي عدد المعلمين: {teachersListData.teachers.length}
                </span>
                <Button 
                  onClick={exportTeachersListToPDF}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  📄 تصدير إلى PDF
                </Button>
              </div>
              
              {teachersListData.teachers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-center">#</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">اسم المعلم</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">
                          {teachersListData.type === 'late' ? 'عدد مرات التأخير' :
                           teachersListData.type === 'absent' ? 'عدد التقارير' :
                           teachersListData.type === 'covering' ? 'عدد الحصص المغطاة' :
                           teachersListData.type === 'activity' ? 'عدد الأنشطة' : 'عدد المرات'}
                        </th>
                        {teachersListData.type === 'late' && (
                          <th className="border border-gray-300 px-4 py-2 text-center">مجموع الدقائق</th>
                        )}
                        {teachersListData.type === 'absent' && (
                          <th className="border border-gray-300 px-4 py-2 text-center">إجمالي أيام الغياب</th>
                        )}
                        {teachersListData.type === 'covering' && (
                          <th className="border border-gray-300 px-4 py-2 text-center">المواد</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {teachersListData.teachers.map((teacher, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                            {teacher.name}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                              {teacher.count}
                            </span>
                          </td>
                          {teachersListData.type === 'late' && (
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-bold">
                                {teacher.totalMinutes} دقيقة
                              </span>
                            </td>
                          )}
                          {teachersListData.type === 'absent' && (
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold">
                                {teacher.totalDays || 0} {teacher.totalDays === 1 ? 'يوم' : 'أيام'}
                              </span>
                            </td>
                          )}
                          {teachersListData.type === 'covering' && (
                            <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                              {teacher.subjects || '-'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  لا توجد بيانات متاحة
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={() => setShowTeachersListModal(false)} variant="outline">
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QualityDashboard;
