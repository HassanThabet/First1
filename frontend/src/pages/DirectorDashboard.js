import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Eye, BarChart3, Users as UsersIcon, TrendingUp, FileDown } from "lucide-react";
import pdfMake from '../utils/pdfConfig';

const DirectorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [users, setUsers] = useState([]);
  const [supervisorReports, setSupervisorReports] = useState([]);
  const [vicePrincipalReports, setVicePrincipalReports] = useState([]);
  const [activitiesReports, setActivitiesReports] = useState([]);
  const [socialReports, setSocialReports] = useState([]);
  const [qualityReports, setQualityReports] = useState([]);
  
  // Filter states
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all"); // all, vice_principal, supervisor, activities, social, quality
  const [selectedSpecificEmployee, setSelectedSpecificEmployee] = useState("all"); // For specific employee within type
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  // Modal states
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, supervisorRes, vpRes, activitiesRes, socialRes, qualityRes] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/reports/supervisor`),
        axios.get(`${API}/reports/vice-principal`),
        axios.get(`${API}/reports/activities`),
        axios.get(`${API}/reports/social-specialist`),
        axios.get(`${API}/reports/quality`)
      ]);
      
      // Filter users by branch
      const branchUsers = usersRes.data.filter(u => u.branch === user.branch);
      setUsers(branchUsers);
      
      // Filter reports by branch
      setSupervisorReports(supervisorRes.data.filter(r => r.branch === user.branch));
      setVicePrincipalReports(vpRes.data.filter(r => r.branch === user.branch));
      setActivitiesReports(activitiesRes.data.filter(r => r.branch === user.branch));
      setSocialReports(socialRes.data.filter(r => r.branch === user.branch));
      setQualityReports(qualityRes.data.filter(r => r.branch === user.branch));
    } catch (error) {
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to filter reports by time only (without employee filter)
  const filterReportsByTimeOnly = (reports) => {
    const today = new Date();
    
    if (timeFilter === "daily") {
      const todayStr = today.toISOString().split('T')[0];
      return reports.filter(r => {
        // For VP reports that use week_start/week_end
        if (r.week_start) {
          const weekStart = new Date(r.week_start);
          const weekEnd = new Date(r.week_end);
          const todayDate = new Date(todayStr);
          return todayDate >= weekStart && todayDate <= weekEnd;
        }
        // For other reports that use date
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
        // For VP reports that use week_start/week_end
        if (r.week_start) {
          const reportWeekStart = new Date(r.week_start);
          const reportWeekEnd = new Date(r.week_end);
          return (reportWeekStart <= weekEnd && reportWeekEnd >= weekStart);
        }
        // For other reports that use date
        const reportDate = new Date(r.date);
        return reportDate >= weekStart && reportDate <= weekEnd;
      });
    } else if (timeFilter === "monthly") {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      return reports.filter(r => {
        // For VP reports that use week_start/week_end
        if (r.week_start) {
          const reportWeekStart = new Date(r.week_start);
          return reportWeekStart.getMonth() === currentMonth && reportWeekStart.getFullYear() === currentYear;
        }
        // For other reports that use date
        const reportDate = new Date(r.date);
        return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
      });
    } else if (timeFilter === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      
      return reports.filter(r => {
        // For VP reports that use week_start/week_end
        if (r.week_start) {
          const reportWeekStart = new Date(r.week_start);
          const reportWeekEnd = new Date(r.week_end);
          return (reportWeekStart <= end && reportWeekEnd >= start);
        }
        // For other reports that use date
        const reportDate = new Date(r.date);
        return reportDate >= start && reportDate <= end;
      });
    }
    
    return reports;
  };

  // Helper function to filter reports by time and employee
  const filterReportsByTime = (reports) => {
    let filtered = reports;
    
    // Filter by specific employee if selected
    if (selectedSpecificEmployee !== "all") {
      filtered = filtered.filter(r => r.user_id === selectedSpecificEmployee);
    }
    
    return filterReportsByTimeOnly(filtered);
  };

  // Calculate overall statistics
  const getOverallStatistics = () => {
    // For overall statistics, use time filter only (no employee filter)
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
      // Supervisor stats
      totalLateTeachers,
      totalAbsentTeachers,
      totalCoveringTeachers,
      totalIncidents,
      totalAbsentStudents,
      avgDiscipline,
      avgCleanliness,
      avgAttendance,
      avgBehavior,
      supervisorReportsCount: filteredSupervisorReports.length,
      
      // Activities stats
      totalActivities,
      totalActivitiesParticipants,
      avgActivitiesInteraction,
      activitiesReportsCount: filteredActivitiesReports.length,
      
      // Social Specialist stats
      totalStudentCases,
      totalPsychologicalCases,
      totalAcademicCases,
      totalBehavioralCases,
      totalSessions,
      totalFamilyContacts,
      socialReportsCount: filteredSocialReports.length,
      
      // Quality stats
      totalQualityVisits,
      avgQualityTeachingRate,
      qualityReportsCount: filteredQualityReports.length,
      
      // Total
      totalAllReports: filteredSupervisorReports.length + filteredActivitiesReports.length + 
                       filteredSocialReports.length + filteredQualityReports.length
    };
  };

  // Get reports for selected employee
  const getEmployeeReports = () => {
    if (selectedEmployee === "all") return [];
    
    const employee = users.find(u => u.id === selectedEmployee);
    if (!employee) return [];
    
    let reports = [];
    
    if (employee.role === "supervisor") {
      reports = supervisorReports.filter(r => r.user_id === employee.id);
    } else if (employee.role === "vice_principal") {
      // Get VP reports and all supervisor reports under this VP
      const vpReports = vicePrincipalReports.filter(r => r.user_id === employee.id);
      const supervisorsUnderVP = users.filter(u => u.role === "supervisor" && u.assigned_to === employee.id);
      const supervisorIds = supervisorsUnderVP.map(s => s.id);
      const supervisorReportsUnderVP = supervisorReports.filter(r => supervisorIds.includes(r.user_id));
      
      reports = [...vpReports, ...supervisorReportsUnderVP];
    } else if (employee.role === "activities") {
      reports = activitiesReports.filter(r => r.user_id === employee.id);
    } else if (employee.role === "social_specialist") {
      reports = socialReports.filter(r => r.user_id === employee.id);
    } else if (employee.role === "quality") {
      reports = qualityReports.filter(r => r.user_id === employee.id);
    }
    
    return reports;
  };

  const stats = getOverallStatistics();
  const employeeReports = getEmployeeReports();

  const roleNames = {
    vice_principal: "الوكيل",
    supervisor: "المشرف",
    activities: "الأنشطة",
    social_specialist: "الأخصائي الاجتماعي",
    quality: "الجودة"
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      const stats = getOverallStatistics();
      
      // Prepare period text
      let periodText = 'جميع الفترات';
      if (timeFilter === 'daily') {
        periodText = 'تقرير يومي - ' + new Date().toLocaleDateString('ar-SA');
      } else if (timeFilter === 'weekly') {
        periodText = 'تقرير أسبوعي';
      } else if (timeFilter === 'monthly') {
        periodText = 'تقرير شهري';
      } else if (timeFilter === 'custom' && customStartDate && customEndDate) {
        periodText = `من ${customStartDate} إلى ${customEndDate}`;
      }

      // Prepare report type text
      let reportTypeText = 'جميع التقارير';
      if (reportTypeFilter === 'vice_principal') reportTypeText = 'الوكلاء';
      else if (reportTypeFilter === 'supervisor') reportTypeText = 'المشرفين';
      else if (reportTypeFilter === 'activities') reportTypeText = 'الأنشطة';
      else if (reportTypeFilter === 'social') reportTypeText = 'الأخصائي الاجتماعي';
      else if (reportTypeFilter === 'quality') reportTypeText = 'الجودة';

      // Prepare employee text
      let employeeText = 'الجميع';
      if (selectedSpecificEmployee !== 'all') {
        const emp = users.find(u => u.id === selectedSpecificEmployee);
        employeeText = emp ? emp.username : 'غير محدد';
      }

      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        defaultStyle: {
          font: 'Cairo',
          alignment: 'right'
        },
        content: [
          // Header
          {
            text: 'مدارس الفجر الجديد الأهلية',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 10]
          },
          {
            text: 'تقرير المدير - الإحصائيات الإجمالية',
            style: 'subheader',
            alignment: 'center',
            margin: [0, 0, 0, 5]
          },
          {
            text: `الفرع: ${user.branch === 'boys' ? 'البنين' : 'البنات'}`,
            alignment: 'center',
            fontSize: 12,
            margin: [0, 0, 0, 3]
          },
          {
            text: `نوع التقرير: ${reportTypeText}`,
            alignment: 'center',
            fontSize: 12,
            margin: [0, 0, 0, 3]
          },
          {
            text: `الموظف: ${employeeText}`,
            alignment: 'center',
            fontSize: 12,
            margin: [0, 0, 0, 3]
          },
          {
            text: periodText,
            alignment: 'center',
            fontSize: 12,
            margin: [0, 0, 0, 5]
          },
          {
            text: `تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`,
            alignment: 'center',
            fontSize: 10,
            margin: [0, 0, 0, 15]
          },
          
          // Overall Summary
          {
            text: 'ملخص عام',
            style: 'sectionHeader',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: `إجمالي التقارير: ${stats.totalAllReports}`, alignment: 'center', fillColor: '#E3F2FD' },
                  { text: `تقارير المشرفين: ${stats.supervisorReportsCount}`, alignment: 'center', fillColor: '#E3F2FD' }
                ],
                [
                  { text: `تقارير الأنشطة: ${stats.activitiesReportsCount}`, alignment: 'center', fillColor: '#F3E5F5' },
                  { text: `تقارير الأخصائي: ${stats.socialReportsCount}`, alignment: 'center', fillColor: '#F3E5F5' }
                ],
                [
                  { text: `تقارير الجودة: ${stats.qualityReportsCount}`, alignment: 'center', fillColor: '#E8F5E9', colSpan: 2 },
                  {}
                ]
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 15]
          },

          // Supervisor Statistics
          {
            text: 'إحصائيات المشرفين',
            style: 'sectionHeader',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: 'المقياس', style: 'tableHeader', alignment: 'center' },
                  { text: 'القيمة', style: 'tableHeader', alignment: 'center' }
                ],
                [{ text: 'المعلمون المتأخرون', alignment: 'right' }, { text: String(stats.totalLateTeachers), alignment: 'center' }],
                [{ text: 'المعلمون الغائبون', alignment: 'right' }, { text: String(stats.totalAbsentTeachers), alignment: 'center' }],
                [{ text: 'المعلمون المغطون', alignment: 'right' }, { text: String(stats.totalCoveringTeachers), alignment: 'center' }],
                [{ text: 'الحوادث', alignment: 'right' }, { text: String(stats.totalIncidents), alignment: 'center' }],
                [{ text: 'الطلاب الغائبون', alignment: 'right' }, { text: String(stats.totalAbsentStudents), alignment: 'center' }],
                [{ text: 'متوسط الانضباط', alignment: 'right' }, { text: String(stats.avgDiscipline) + '/10', alignment: 'center' }],
                [{ text: 'متوسط النظافة', alignment: 'right' }, { text: String(stats.avgCleanliness) + '/10', alignment: 'center' }],
                [{ text: 'متوسط الحضور', alignment: 'right' }, { text: String(stats.avgAttendance) + '%', alignment: 'center' }],
                [{ text: 'متوسط السلوك العام', alignment: 'right' }, { text: String(stats.avgBehavior) + '/10', alignment: 'center' }]
              ]
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? '#2196F3' : (rowIndex % 2 === 0 ? '#F5F5F5' : null);
              }
            },
            margin: [0, 0, 0, 15]
          },

          // Activities Statistics
          {
            text: 'إحصائيات الأنشطة',
            style: 'sectionHeader',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: 'المقياس', style: 'tableHeader', alignment: 'center' },
                  { text: 'القيمة', style: 'tableHeader', alignment: 'center' }
                ],
                [{ text: 'إجمالي الأنشطة', alignment: 'right' }, { text: String(stats.totalActivities), alignment: 'center' }],
                [{ text: 'إجمالي المشاركين', alignment: 'right' }, { text: String(stats.totalActivitiesParticipants), alignment: 'center' }],
                [{ text: 'متوسط التفاعل', alignment: 'right' }, { text: String(stats.avgActivitiesInteraction) + '/10', alignment: 'center' }]
              ]
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? '#9C27B0' : (rowIndex % 2 === 0 ? '#F5F5F5' : null);
              }
            },
            margin: [0, 0, 0, 15]
          },

          // Social Specialist Statistics
          {
            text: 'إحصائيات الأخصائي الاجتماعي',
            style: 'sectionHeader',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: 'المقياس', style: 'tableHeader', alignment: 'center' },
                  { text: 'القيمة', style: 'tableHeader', alignment: 'center' }
                ],
                [{ text: 'إجمالي حالات الطلاب', alignment: 'right' }, { text: String(stats.totalStudentCases), alignment: 'center' }],
                [{ text: 'حالات نفسية', alignment: 'right' }, { text: String(stats.totalPsychologicalCases), alignment: 'center' }],
                [{ text: 'حالات أكاديمية', alignment: 'right' }, { text: String(stats.totalAcademicCases), alignment: 'center' }],
                [{ text: 'حالات سلوكية', alignment: 'right' }, { text: String(stats.totalBehavioralCases), alignment: 'center' }],
                [{ text: 'الجلسات', alignment: 'right' }, { text: String(stats.totalSessions), alignment: 'center' }],
                [{ text: 'التواصل مع الأسر', alignment: 'right' }, { text: String(stats.totalFamilyContacts), alignment: 'center' }]
              ]
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? '#4CAF50' : (rowIndex % 2 === 0 ? '#F5F5F5' : null);
              }
            },
            margin: [0, 0, 0, 15]
          },

          // Quality Statistics
          {
            text: 'إحصائيات الجودة',
            style: 'sectionHeader',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: 'المقياس', style: 'tableHeader', alignment: 'center' },
                  { text: 'القيمة', style: 'tableHeader', alignment: 'center' }
                ],
                [{ text: 'إجمالي الزيارات', alignment: 'right' }, { text: String(stats.totalQualityVisits), alignment: 'center' }],
                [{ text: 'متوسط الأداء التدريسي', alignment: 'right' }, { text: String(stats.avgQualityTeachingRate) + '/10', alignment: 'center' }]
              ]
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? '#FF9800' : (rowIndex % 2 === 0 ? '#F5F5F5' : null);
              }
            }
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            color: '#1565C0'
          },
          subheader: {
            fontSize: 16,
            bold: true,
            color: '#1565C0'
          },
          sectionHeader: {
            fontSize: 14,
            bold: true,
            color: '#1565C0'
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: 'white'
          }
        },
        footer: function(currentPage, pageCount) {
          return {
            text: `صفحة ${currentPage} من ${pageCount}`,
            alignment: 'center',
            fontSize: 9,
            margin: [0, 10, 0, 0]
          };
        }
      };

      let filename = `تقرير_المدير_${user.branch === 'boys' ? 'بنين' : 'بنات'}`;
      if (timeFilter === 'daily') filename += '_يومي';
      else if (timeFilter === 'weekly') filename += '_أسبوعي';
      else if (timeFilter === 'monthly') filename += '_شهري';
      filename += '.pdf';

      pdfMake.createPdf(docDefinition).download(filename);
      toast.success('تم تصدير PDF بنجاح');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('فشل تصدير PDF');
    }
  };

  return (
    <DashboardLayout title="لوحة تحكم المدير">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات الإجمالية</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center space-x-2 space-x-reverse">
            <UsersIcon className="w-4 h-4" />
            <span>تقارير فردية</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Time Filter */}
            <Card>
              <CardHeader>
                <CardTitle>التصفية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">الفرع</label>
                      <Input 
                        value={user.branch === "boys" ? "البنين" : "البنات"} 
                        disabled 
                        className="bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">نوع التقرير</label>
                      <Select value={reportTypeFilter} onValueChange={(value) => {
                        setReportTypeFilter(value);
                        setSelectedSpecificEmployee("all");
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع التقارير</SelectItem>
                          <SelectItem value="vice_principal">الوكلاء</SelectItem>
                          <SelectItem value="supervisor">المشرفين</SelectItem>
                          <SelectItem value="activities">الأنشطة</SelectItem>
                          <SelectItem value="social">الأخصائي الاجتماعي</SelectItem>
                          <SelectItem value="quality">الجودة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {reportTypeFilter !== "all" && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {reportTypeFilter === "vice_principal" && "اختر الوكيل"}
                          {reportTypeFilter === "supervisor" && "اختر المشرف"}
                          {reportTypeFilter === "activities" && "اختر مسؤول الأنشطة"}
                          {reportTypeFilter === "social" && "اختر الأخصائي"}
                          {reportTypeFilter === "quality" && "اختر مسؤول الجودة"}
                        </label>
                        <Select value={selectedSpecificEmployee} onValueChange={setSelectedSpecificEmployee}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {reportTypeFilter === "vice_principal" && "جميع الوكلاء"}
                              {reportTypeFilter === "supervisor" && "جميع المشرفين"}
                              {reportTypeFilter === "activities" && "جميع مسؤولي الأنشطة"}
                              {reportTypeFilter === "social" && "جميع الأخصائيين"}
                              {reportTypeFilter === "quality" && "جميع مسؤولي الجودة"}
                            </SelectItem>
                            {users
                              .filter(u => u.role === reportTypeFilter && u.branch === user.branch)
                              .map(emp => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.username}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">الفترة الزمنية</label>
                      <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger>
                          <SelectValue />
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

                  {reportTypeFilter !== "all" && (
                    <div>
                      <Button 
                        onClick={exportToPDF}
                        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <FileDown className="w-4 h-4 ml-2" />
                        تصدير PDF
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Supervisor Statistics - Show only when reportTypeFilter is "all" or "supervisor" */}
            {(reportTypeFilter === "all" || reportTypeFilter === "supervisor") && (
            <>
            {/* Statistics Cards */}
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

            {/* Performance Averages */}
            <Card>
              <CardHeader>
                <CardTitle>متوسط الأداء العام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="stat-card bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-cyan-500">
                    <div className="text-sm text-gray-700 mb-1 font-semibold">انضباط الطلاب</div>
                    <div className="text-3xl font-bold text-cyan-700">{stats.avgDiscipline}/10</div>
                  </div>
                  <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                    <div className="text-sm text-gray-700 mb-1 font-semibold">نظافة الفصول</div>
                    <div className="text-3xl font-bold text-blue-700">{stats.avgCleanliness}/10</div>
                  </div>
                  <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                    <div className="text-sm text-gray-700 mb-1 font-semibold">التزام المعلمين</div>
                    <div className="text-3xl font-bold text-purple-700">{stats.avgAttendance}/10</div>
                  </div>
                  <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                    <div className="text-sm text-gray-700 mb-1 font-semibold">السلوك العام</div>
                    <div className="text-3xl font-bold text-green-700">{stats.avgBehavior}/10</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Stats */}
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

            {/* Activities Statistics - Show only when reportTypeFilter is "all" or "activities" */}
            {(reportTypeFilter === "all" || reportTypeFilter === "activities") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-700">📅 إحصائيات الأنشطة</CardTitle>
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

            {/* Social Specialist Statistics - Show only when reportTypeFilter is "all" or "social" */}
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

            {/* Quality Statistics - Show only when reportTypeFilter is "all" or "quality" */}
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

            {/* Detailed Reports Section - Based on Filter */}
            <>
                {/* Supervisor Detailed Reports */}
                {(reportTypeFilter === "all" || reportTypeFilter === "supervisor") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-blue-700">التفاصيل الكاملة - تقارير المشرفين</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filterReportsByTime(supervisorReports).map((report) => {
                          const supervisor = users.find(u => u.id === report.user_id);
                          return (
                            <Card key={report.id} className="border-l-4 border-blue-500">
                              <CardContent className="p-6">
                                <div className="mb-4 pb-4 border-b">
                                  <h3 className="text-lg font-bold text-blue-700">المشرف: {supervisor?.username || 'غير معروف'}</h3>
                                  <p className="text-sm text-gray-600">التاريخ: {new Date(report.date).toLocaleDateString('ar-SA')}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {/* Late Teachers */}
                                  <div className="bg-orange-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-orange-700 mb-2">المعلمون المتأخرون ({report.late_teachers?.length || 0})</h4>
                                    {report.late_teachers && report.late_teachers.length > 0 ? (
                                      <ul className="list-disc list-inside text-sm space-y-1">
                                        {report.late_teachers.map((teacher, idx) => (
                                          <li key={idx}>
                                            {typeof teacher === 'string' ? teacher : `${teacher.teacher || ''} - ${teacher.subject || ''} - حصة ${teacher.period || ''}`}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-gray-500">لا يوجد</p>
                                    )}
                                  </div>

                                  {/* Absent Teachers */}
                                  <div className="bg-red-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-red-700 mb-2">المعلمون الغائبون ({report.absent_teachers?.length || 0})</h4>
                                    {report.absent_teachers && report.absent_teachers.length > 0 ? (
                                      <ul className="list-disc list-inside text-sm space-y-1">
                                        {report.absent_teachers.map((teacher, idx) => (
                                          <li key={idx}>
                                            {typeof teacher === 'string' ? teacher : `${teacher.teacher || ''} - ${teacher.subject || ''} - حصة ${teacher.period || ''}`}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-gray-500">لا يوجد</p>
                                    )}
                                  </div>

                                  {/* Covering Teachers */}
                                  <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-green-700 mb-2">المعلمون المغطون ({report.covering_teachers?.length || 0})</h4>
                                    {report.covering_teachers && report.covering_teachers.length > 0 ? (
                                      <ul className="list-disc list-inside text-sm space-y-1">
                                        {report.covering_teachers.map((teacher, idx) => (
                                          <li key={idx}>
                                            {typeof teacher === 'string' ? teacher : `${teacher.teacher || ''} - ${teacher.subject || ''} - حصة ${teacher.period || ''}`}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-gray-500">لا يوجد</p>
                                    )}
                                  </div>

                                  {/* Absent Students */}
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-blue-700 mb-2">الطلاب الغائبون</h4>
                                    <p className="text-2xl font-bold text-blue-700">{report.absent_students_count || 0}</p>
                                  </div>

                                  {/* Ratings */}
                                  <div className="bg-purple-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-purple-700 mb-2">التقييمات</h4>
                                    <div className="text-sm space-y-1">
                                      <p>الانضباط: <span className="font-bold">{report.student_discipline || 0}/10</span></p>
                                      <p>النظافة: <span className="font-bold">{report.classroom_cleanliness || 0}/10</span></p>
                                      <p>حضور المعلمين: <span className="font-bold">{report.teacher_attendance_rate || 0}%</span></p>
                                      <p>السلوك العام: <span className="font-bold">{report.general_behavior || 0}/10</span></p>
                                    </div>
                                  </div>

                                  {/* Incidents */}
                                  <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-yellow-700 mb-2">الحوادث ({report.incidents?.length || 0})</h4>
                                    {report.incidents && report.incidents.length > 0 ? (
                                      <ul className="list-disc list-inside text-sm space-y-1">
                                        {report.incidents.map((incident, idx) => (
                                          <li key={idx}>{incident}</li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="text-sm text-gray-500">لا يوجد</p>
                                    )}
                                  </div>
                                </div>

                                {/* Notes */}
                                {report.notes && (
                                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-700 mb-2">ملاحظات</h4>
                                    <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                        {filterReportsByTime(supervisorReports).length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <p className="text-lg">لا توجد تقارير للمشرفين للفترة المحددة</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Vice-Principal Detailed Reports */}
                {(reportTypeFilter === "all" || reportTypeFilter === "vice_principal") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-cyan-700">التفاصيل الكاملة - تقارير الوكلاء</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filterReportsByTime(vicePrincipalReports).map((report) => {
                          const vp = users.find(u => u.id === report.user_id);
                          return (
                            <Card key={report.id} className="border-l-4 border-cyan-500">
                              <CardContent className="p-6">
                                <div className="mb-4 pb-4 border-b">
                                  <h3 className="text-lg font-bold text-cyan-700">الوكيل: {vp?.username || 'غير معروف'}</h3>
                                  <p className="text-sm text-gray-600">
                                    الفترة: {new Date(report.week_start).toLocaleDateString('ar-SA')} - {new Date(report.week_end).toLocaleDateString('ar-SA')}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Problems and Actions */}
                                  {report.problems && report.problems.length > 0 && (
                                    <div className="bg-orange-50 p-4 rounded-lg">
                                      <h4 className="font-semibold text-orange-700 mb-2">المشاكل والإجراءات ({report.problems.length})</h4>
                                      <div className="space-y-2">
                                        {report.problems.map((problem, idx) => (
                                          <div key={idx} className="text-sm bg-white p-2 rounded">
                                            {typeof problem === 'string' ? (
                                              <p>{problem}</p>
                                            ) : (
                                              <>
                                                <p className="font-semibold text-gray-800">المشكلة: {problem.description || '-'}</p>
                                                <p className="text-gray-600 text-xs mt-1">الإجراء: {problem.actions || '-'}</p>
                                              </>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Suggestions */}
                                  {report.suggestions && report.suggestions.length > 0 && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                      <h4 className="font-semibold text-blue-700 mb-2">الاقتراحات ({report.suggestions.length})</h4>
                                      <ul className="list-disc list-inside text-sm space-y-1">
                                        {report.suggestions.map((suggestion, idx) => (
                                          <li key={idx}>{typeof suggestion === 'string' ? suggestion : suggestion.description || '-'}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>

                                {/* Notes */}
                                {report.notes && (
                                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-700 mb-2">ملاحظات</h4>
                                    <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                        {filterReportsByTime(vicePrincipalReports).length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <p className="text-lg">لا توجد تقارير للوكلاء للفترة المحددة</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Activities Detailed Reports */}
                {(reportTypeFilter === "all" || reportTypeFilter === "activities") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-purple-700">التفاصيل الكاملة - تقارير الأنشطة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filterReportsByTime(activitiesReports).map((report) => {
                          const activityUser = users.find(u => u.id === report.user_id);
                          return (
                            <Card key={report.id} className="border-l-4 border-purple-500">
                              <CardContent className="p-6">
                                <div className="mb-4 pb-4 border-b">
                                  <h3 className="text-lg font-bold text-purple-700">مسؤول الأنشطة: {activityUser?.username || 'غير معروف'}</h3>
                                  <p className="text-sm text-gray-600">التاريخ: {new Date(report.date).toLocaleDateString('ar-SA')}</p>
                                </div>

                                <div className="space-y-4">
                                  {report.activities && report.activities.length > 0 ? (
                                    report.activities.map((activity, idx) => (
                                      <div key={idx} className="bg-purple-50 p-4 rounded-lg">
                                        <h4 className="font-semibold text-purple-700 mb-3">النشاط {idx + 1}: {activity.name}</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                          <div>
                                            <span className="text-gray-600">التاريخ:</span>
                                            <span className="font-semibold mr-2">{new Date(activity.date).toLocaleDateString('ar-SA')}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">النوع:</span>
                                            <span className="font-semibold mr-2">{activity.type || '-'}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">الفئة المستهدفة:</span>
                                            <span className="font-semibold mr-2">{activity.target_group || '-'}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">المشاركون:</span>
                                            <span className="font-semibold mr-2">{activity.participants_count || 0}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">التفاعل:</span>
                                            <span className="font-semibold mr-2">{activity.interaction_rate || 0}/10</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600">الأثر التعليمي:</span>
                                            <span className="font-semibold mr-2">{activity.educational_impact || '-'}</span>
                                          </div>
                                        </div>
                                        {activity.notes && (
                                          <div className="mt-3 pt-3 border-t">
                                            <p className="text-xs text-gray-600">ملاحظات:</p>
                                            <p className="text-sm">{activity.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-center text-gray-500">لا توجد أنشطة في هذا التقرير</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                        {filterReportsByTime(activitiesReports).length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <p className="text-lg">لا توجد تقارير للأنشطة للفترة المحددة</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Social Specialist Detailed Reports */}
                {(reportTypeFilter === "all" || reportTypeFilter === "social") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-700">التفاصيل الكاملة - تقارير الأخصائي الاجتماعي</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filterReportsByTime(socialReports).map((report) => {
                          const socialUser = users.find(u => u.id === report.user_id);
                          const totalCases = (report.psychological_cases || 0) + (report.academic_cases || 0) + (report.behavioral_cases || 0);
                          return (
                            <Card key={report.id} className="border-l-4 border-green-500">
                              <CardContent className="p-6">
                                <div className="mb-4 pb-4 border-b">
                                  <h3 className="text-lg font-bold text-green-700">الأخصائي: {socialUser?.username || 'غير معروف'}</h3>
                                  <p className="text-sm text-gray-600">التاريخ: {new Date(report.date).toLocaleDateString('ar-SA')}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div className="bg-rose-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-rose-700 mb-2">إجمالي الحالات</h4>
                                    <p className="text-3xl font-bold text-rose-700">{totalCases}</p>
                                  </div>

                                  <div className="bg-pink-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-pink-700 mb-2">حالات نفسية</h4>
                                    <p className="text-3xl font-bold text-pink-700">{report.psychological_cases || 0}</p>
                                  </div>

                                  <div className="bg-amber-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-amber-700 mb-2">حالات أكاديمية</h4>
                                    <p className="text-3xl font-bold text-amber-700">{report.academic_cases || 0}</p>
                                  </div>

                                  <div className="bg-red-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-red-700 mb-2">حالات سلوكية</h4>
                                    <p className="text-3xl font-bold text-red-700">{report.behavioral_cases || 0}</p>
                                  </div>

                                  <div className="bg-emerald-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-emerald-700 mb-2">الجلسات</h4>
                                    <p className="text-3xl font-bold text-emerald-700">{report.sessions_count || 0}</p>
                                  </div>

                                  <div className="bg-teal-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-teal-700 mb-2">التواصل مع الأسر</h4>
                                    <p className="text-3xl font-bold text-teal-700">{report.family_contacts || 0}</p>
                                  </div>

                                  <div className="bg-cyan-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-cyan-700 mb-2">التحويلات الخارجية</h4>
                                    <p className="text-3xl font-bold text-cyan-700">{report.referrals_out || 0}</p>
                                  </div>

                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-blue-700 mb-2">المتابعات</h4>
                                    <p className="text-3xl font-bold text-blue-700">{report.follow_ups || 0}</p>
                                  </div>
                                </div>

                                {report.notes && (
                                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-700 mb-2">ملاحظات</h4>
                                    <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                        {filterReportsByTime(socialReports).length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <p className="text-lg">لا توجد تقارير للأخصائي الاجتماعي للفترة المحددة</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quality Detailed Reports */}
                {reportTypeFilter === "quality" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-orange-700">التفاصيل الكاملة - تقارير الجودة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filterReportsByTime(qualityReports).map((report) => {
                          const qualityUser = users.find(u => u.id === report.user_id);
                          return (
                            <Card key={report.id} className="border-l-4 border-orange-500">
                              <CardContent className="p-6">
                                <div className="mb-4 pb-4 border-b">
                                  <h3 className="text-lg font-bold text-orange-700">مسؤول الجودة: {qualityUser?.username || 'غير معروف'}</h3>
                                  <p className="text-sm text-gray-600">التاريخ: {new Date(report.date).toLocaleDateString('ar-SA')}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-blue-700 mb-2">المعلم</h4>
                                    <p className="text-lg font-bold text-blue-700">{report.teacher_name || '-'}</p>
                                  </div>

                                  <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-green-700 mb-2">المادة</h4>
                                    <p className="text-lg font-bold text-green-700">{report.subject || '-'}</p>
                                  </div>

                                  <div className="bg-amber-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-amber-700 mb-2">الأداء التدريسي</h4>
                                    <p className="text-3xl font-bold text-amber-700">{report.teaching_performance_rate || 0}/10</p>
                                  </div>

                                  <div className="bg-purple-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-purple-700 mb-2">التقييم العام</h4>
                                    <p className="text-lg font-bold text-purple-700">{report.overall_evaluation || '-'}</p>
                                  </div>
                                </div>

                                {report.strengths && (
                                  <div className="mt-4 bg-green-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-green-700 mb-2">نقاط القوة</h4>
                                    <p className="text-sm whitespace-pre-wrap">{report.strengths}</p>
                                  </div>
                                )}

                                {report.areas_for_improvement && (
                                  <div className="mt-4 bg-orange-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-orange-700 mb-2">مجالات التحسين</h4>
                                    <p className="text-sm whitespace-pre-wrap">{report.areas_for_improvement}</p>
                                  </div>
                                )}

                                {report.notes && (
                                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-700 mb-2">ملاحظات إضافية</h4>
                                    <p className="text-sm whitespace-pre-wrap">{report.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                        {filterReportsByTime(qualityReports).length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <p className="text-lg">لا توجد تقارير للجودة للفترة المحددة</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <div className="space-y-6">
            {/* Employee Selector */}
            <Card>
              <CardHeader>
                <CardTitle>اختر موظف لعرض تقاريره</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر موظف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الموظفين</SelectItem>
                    {users.filter(u => ["vice_principal", "supervisor", "activities", "social_specialist", "quality"].includes(u.role)).map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.username} - {roleNames[u.role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Reports List */}
            {selectedEmployee !== "all" && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">
                  التقارير ({employeeReports.length})
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {employeeReports.map((report) => (
                    <Card
                      key={report.id}
                      className="report-card hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedReport(report);
                        setReportType(report.date ? "supervisor" : report.week_start ? "vice_principal" : "other");
                        setShowReportModal(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">
                              {report.date ? `تقرير مشرف - ${new Date(report.date).toLocaleDateString("ar-SA")}` :
                               report.week_start ? `تقرير وكيل - من ${new Date(report.week_start).toLocaleDateString("ar-SA")} إلى ${new Date(report.week_end).toLocaleDateString("ar-SA")}` :
                               "تقرير"}
                            </h4>
                            <p className="text-sm text-gray-500">
                              تم الإنشاء: {new Date(report.created_at).toLocaleString("ar-SA")}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                              setReportType(report.date ? "supervisor" : report.week_start ? "vice_principal" : "other");
                              setShowReportModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4 ml-1" />
                            عرض
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Report Detail Modal */}
          <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedReport && (reportType === "supervisor" ? 
                    `تقرير مشرف - ${new Date(selectedReport.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` :
                    reportType === "vice_principal" ?
                    `تقرير وكيل` : "تقرير"
                  )}
                </DialogTitle>
              </DialogHeader>

              {selectedReport && reportType === "supervisor" && (
                <div className="space-y-6 p-4">
                  {/* Same content as SupervisorDashboard modal */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">المؤشرات الرئيسية</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="stat-card bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-cyan-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">انضباط الطلاب</div>
                        <div className="text-3xl font-bold text-cyan-700">{selectedReport.student_discipline}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">نظافة الفصول</div>
                        <div className="text-3xl font-bold text-blue-700">{selectedReport.classroom_cleanliness}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">التزام المعلمين</div>
                        <div className="text-3xl font-bold text-purple-700">{selectedReport.teacher_attendance_rate}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">السلوك العام</div>
                        <div className="text-3xl font-bold text-green-700">{selectedReport.general_behavior}/10</div>
                      </div>
                    </div>
                  </div>

                  {/* Teacher Details - Same as supervisor modal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(selectedReport.late_teachers?.length > 0 || selectedReport.absent_teachers?.length > 0 || selectedReport.covering_teachers?.length > 0) && (
                      <div className="space-y-3">
                        <h4 className="text-md font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">بيانات المعلمين</h4>
                        
                        {selectedReport.late_teachers && selectedReport.late_teachers.length > 0 && (
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-sm font-bold text-orange-800 mb-2">
                              المعلمون المتأخرون ({selectedReport.late_teachers.length})
                            </div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {selectedReport.late_teachers.map((lt, i) => (
                                <li key={i}>
                                  {typeof lt === 'string' ? `• ${lt}` : `• ${lt.teacher || ''} - ${lt.subject || ''} - حصة ${lt.period || ''}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {selectedReport.absent_teachers && selectedReport.absent_teachers.length > 0 && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-sm font-bold text-red-800 mb-2">
                              المعلمون الغائبون ({selectedReport.absent_teachers.length})
                            </div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {selectedReport.absent_teachers.map((at, i) => (
                                <li key={i}>
                                  {typeof at === 'string' ? `• ${at}` : `• ${at.teacher || ''} - ${at.subject || ''} - حصة ${at.period || ''}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {selectedReport.covering_teachers && selectedReport.covering_teachers.length > 0 && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-sm font-bold text-green-800 mb-2">
                              المعلمون المغطون ({selectedReport.covering_teachers.length})
                            </div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {selectedReport.covering_teachers.map((ct, i) => (
                                <li key={i}>
                                  {typeof ct === 'string' ? `• ${ct}` : `• ${ct.teacher || ''} - ${ct.subject || ''} - حصة ${ct.period || ''}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Other Info */}
                    <div className="space-y-3">
                      <h4 className="text-md font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">معلومات إضافية</h4>
                      
                      {selectedReport.incidents && selectedReport.incidents.length > 0 && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-sm font-bold text-yellow-800 mb-2">
                            الحوادث والمخالفات ({selectedReport.incidents.length})
                          </div>
                          <div className="space-y-2">
                            {selectedReport.incidents.map((inc, i) => (
                              <div key={i} className="text-sm bg-white p-2 rounded">
                                <p className="font-semibold text-gray-800">{inc.description}</p>
                                <p className="text-gray-600 text-xs mt-1">الإجراء: {inc.action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedReport.absent_students_count > 0 && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm font-bold text-blue-800">عدد الطلاب الغائبين</div>
                          <div className="text-2xl font-bold text-blue-600 mt-1">
                            {selectedReport.absent_students_count} طالب
                          </div>
                        </div>
                      )}
                      
                      {selectedReport.general_notes && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm font-bold text-gray-800 mb-2">ملاحظات عامة</div>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedReport.general_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport && reportType === "vice_principal" && (
                <div className="space-y-6 p-4">
                  {selectedReport.problems && selectedReport.problems.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                        المشاكل ({selectedReport.problems.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedReport.problems.map((problem, i) => (
                          <div key={i} className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 mb-2">{problem.description}</p>
                                <div className="bg-white p-2 rounded">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-gray-800">الإجراءات المتخذة:</span> {problem.actions}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedReport.suggestions && selectedReport.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                        الاقتراحات ({selectedReport.suggestions.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedReport.suggestions.map((suggestion, i) => (
                          <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {i + 1}
                              </div>
                              <p className="flex-1 text-gray-800">{suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DirectorDashboard;