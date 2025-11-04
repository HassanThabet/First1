import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Eye, FileText, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import pdfMake from "@digicole/pdfmake-rtl";
import pdfMakeFonts from "../fonts/vfs_fonts";

const QualityDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("create");
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  
  // For statistics tab
  const [supervisorReports, setSupervisorReports] = useState([]);
  const [activitiesReports, setActivitiesReports] = useState([]);
  const [socialReports, setSocialReports] = useState([]);
  const [qualityReports, setQualityReports] = useState([]);
  const [vicePrincipalReports, setVicePrincipalReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [selectedSpecificEmployee, setSelectedSpecificEmployee] = useState("all");
  const [showDetailedReports, setShowDetailedReports] = useState(false);
  const [showTeachersListModal, setShowTeachersListModal] = useState(false);
  const [teachersListData, setTeachersListData] = useState({ title: "", teachers: [], type: "" });
  
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  // Filters
  const [viewMode, setViewMode] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    academic_performance: { positives: "", observations: "", actions: "" },
    educational_supervision: { positives: "", observations: "", actions: "" },
    discipline_behavior: { positives: "", observations: "", actions: "" },
    activities_programs: { positives: "", observations: "", actions: "" },
    social_specialist: { positives: "", observations: "", actions: "" }
  });

  useEffect(() => {
    fetchReports();
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [usersRes, supervisorRes, activitiesRes, socialRes, qualityRes, vpRes] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/reports/supervisor`),
        axios.get(`${API}/reports/activities`),
        axios.get(`${API}/reports/social-specialist`),
        axios.get(`${API}/reports/quality`),
        axios.get(`${API}/reports/vice-principal`)
      ]);
      
      setUsers(usersRes.data);
      setSupervisorReports(supervisorRes.data);
      setActivitiesReports(activitiesRes.data);
      setSocialReports(socialRes.data);
      setQualityReports(qualityRes.data);
      setVicePrincipalReports(vpRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  useEffect(() => {
    filterReports();
  }, [viewMode, dateFilter, monthFilter, allReports]);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API}/reports/quality`);
      setAllReports(res.data);
      setReports(res.data);
    } catch (error) {
      toast.error("فشل تحميل التقارير");
    }
  };

  const filterReports = () => {
    let filtered = [...allReports];

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

    setReports(filtered);
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

  // Get detailed reports for display
  const getDetailedReports = () => {
    let allReports = [];
    
    if (reportTypeFilter === "all" || reportTypeFilter === "vice_principal") {
      const filtered = filterReportsByTimeOnly([...vicePrincipalReports]);
      const vpsFiltered = selectedSpecificEmployee === "all" 
        ? filtered 
        : filtered.filter(r => r.user_id === selectedSpecificEmployee);
      
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
    
    return allReports.sort((a, b) => {
      const dateA = new Date(a.date || a.week_start);
      const dateB = new Date(b.date || b.week_start);
      return dateB - dateA;
    });
  };

  // Calculate overall statistics
  const getOverallStatistics = () => {
    let filteredSupervisorReports = filterReportsByTimeOnly([...supervisorReports]);
    let filteredActivitiesReports = filterReportsByTimeOnly([...activitiesReports]);
    let filteredSocialReports = filterReportsByTimeOnly([...socialReports]);
    let filteredQualityReports = filterReportsByTimeOnly([...qualityReports]);
    let filteredVPReports = filterReportsByTimeOnly([...vicePrincipalReports]);

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

    // Calculate averages
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

    // Social Specialist statistics
    const totalPsychologicalCases = filteredSocialReports.reduce((sum, r) => sum + (r.psychological_cases || 0), 0);
    const totalAcademicCases = filteredSocialReports.reduce((sum, r) => sum + (r.academic_cases || 0), 0);
    const totalBehavioralCases = filteredSocialReports.reduce((sum, r) => sum + (r.behavioral_cases || 0), 0);
    const totalStudentCases = totalPsychologicalCases + totalAcademicCases + totalBehavioralCases;

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
      totalStudentCases,
      totalPsychologicalCases,
      totalAcademicCases,
      totalBehavioralCases,
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

  // Get aggregated teachers from reports
  const getAggregatedAbsentTeachers = () => {
    const filtered = filterReportsByTimeOnly([...vicePrincipalReports]);
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
    const filtered = filterReportsByTimeOnly([...supervisorReports]);
    const teachersMap = {};
    
    filtered.forEach(report => {
      if (report.late_teachers && Array.isArray(report.late_teachers)) {
        report.late_teachers.forEach(teacher => {
          const name = typeof teacher === 'string' ? teacher : teacher.teacher;
          const minutes = typeof teacher === 'object' ? (teacher.minutes_late || 0) : 0;
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
      .map(([name, data]) => ({ name, count: data.count, totalMinutes: data.totalMinutes }))
      .sort((a, b) => b.count - a.count);
  };

  const getAggregatedCoveringTeachers = () => {
    const filtered = filterReportsByTimeOnly([...supervisorReports]);
    const teachersMap = {};
    const subjectsMap = {};
    
    filtered.forEach(report => {
      if (report.covering_teachers && Array.isArray(report.covering_teachers)) {
        report.covering_teachers.forEach(teacher => {
          const name = typeof teacher === 'object' ? teacher.teacher : teacher;
          const subject = typeof teacher === 'object' ? teacher.subject : '';
          if (name) {
            teachersMap[name] = (teachersMap[name] || 0) + 1;
            if (subject) {
              if (!subjectsMap[name]) subjectsMap[name] = [];
              if (!subjectsMap[name].includes(subject)) {
                subjectsMap[name].push(subject);
              }
            }
          }
        });
      }
    });
    
    return Object.entries(teachersMap)
      .map(([name, count]) => ({ 
        name, 
        count,
        subjects: subjectsMap[name] || []
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Chart data functions
  const getTeachersChartData = () => {
    const stats = getOverallStatistics();
    return [
      { name: 'الغائبون', value: stats.totalAbsentTeachers, fill: '#ef4444' },
      { name: 'المتأخرون', value: stats.totalLateTeachers, fill: '#f97316' },
      { name: 'المغطون', value: stats.totalCoveringTeachers, fill: '#22c55e' }
    ];
  };

  const getPerformanceChartData = () => {
    const stats = getOverallStatistics();
    return [
      { name: 'انضباط الطلاب', value: parseFloat(stats.avgDiscipline) },
      { name: 'نظافة الفصول', value: parseFloat(stats.avgCleanliness) },
      { name: 'التزام المعلمين', value: parseFloat(stats.avgAttendance) },
      { name: 'السلوك العام', value: parseFloat(stats.avgBehavior) }
    ];
  };

  // Handle chart click to show teachers list
  const handleChartClick = (type) => {
    let teachers = [];
    let title = "";
    
    if (type === 'absent') {
      teachers = getAggregatedAbsentTeachers();
      title = "قائمة المعلمين الغائبين";
    } else if (type === 'late') {
      teachers = getAggregatedLateTeachers();
      title = "قائمة المعلمين المتأخرين";
    } else if (type === 'covering') {
      teachers = getAggregatedCoveringTeachers();
      title = "قائمة المعلمين المغطين";
    }
    
    setTeachersListData({ title, teachers, type });
    setShowTeachersListModal(true);
  };

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
            bold: true,
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
          bold: true,
          color: '#3b82f6'
        },
        info: {
          fontSize: 9,
          color: '#666666'
        },
        tableHeader: {
          bold: true,
          alignment: 'center',
          fontSize: 11,
          color: '#1e40af'
        },
        tableCell: {
          fontSize: 10
        },
        tableCellBold: {
          fontSize: 10,
          bold: true
        },
        footer: {
          fontSize: 8,
          color: '#999999',
          italics: true
        }
      }
    };

    pdfMake.createPdf(docDefinition).download(`${teachersListData.title}_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.pdf`);
    toast.success("تم تصدير التقرير بنجاح");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingReport) {
        await axios.put(`${API}/reports/quality/${editingReport.id}`, formData);
        toast.success("تم تحديث التقرير بنجاح");
        setEditingReport(null);
      } else {
        await axios.post(`${API}/reports/quality`, formData);
        toast.success("تم إنشاء التقرير بنجاح");
      }
      fetchReports();
      setActiveTab("reports");
      setFormData({
        date: new Date().toISOString().split('T')[0],
        academic_performance: { positives: "", observations: "", actions: "" },
        educational_supervision: { positives: "", observations: "", actions: "" },
        discipline_behavior: { positives: "", observations: "", actions: "" },
        activities_programs: { positives: "", observations: "", actions: "" },
        social_specialist: { positives: "", observations: "", actions: "" }
      });
    } catch (error) {
      toast.error("فشل إنشاء التقرير");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      date: report.date,
      academic_performance: report.academic_performance || { positives: "", observations: "", actions: "" },
      educational_supervision: report.educational_supervision || { positives: "", observations: "", actions: "" },
      discipline_behavior: report.discipline_behavior || { positives: "", observations: "", actions: "" },
      activities_programs: report.activities_programs || { positives: "", observations: "", actions: "" },
      social_specialist: report.social_specialist || { positives: "", observations: "", actions: "" }
    });
    setActiveTab("create");
  };

  const handleDelete = async (reportId) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التقرير؟")) {
      try {
        await axios.delete(`${API}/reports/quality/${reportId}`);
        toast.success("تم حذف التقرير بنجاح");
        fetchReports();
      } catch (error) {
        toast.error("فشل حذف التقرير");
      }
    }
  };

  const updateField = (section, field, value) => {
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: value
      }
    });
  };

  const sections = [
    { key: "academic_performance", title: "الأداء الأكاديمي", color: "cyan" },
    { key: "educational_supervision", title: "الإشراف التربوي", color: "blue" },
    { key: "discipline_behavior", title: "الانضباط والسلوك", color: "purple" },
    { key: "activities_programs", title: "الأنشطة والبرامج", color: "green" },
    { key: "social_specialist", title: "الأخصائي الاجتماعي", color: "orange" }
  ];

  return (
    <DashboardLayout title="لوحة تحكم الجودة">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="create" className="flex items-center space-x-2 space-x-reverse">
            <FileText className="w-4 h-4" />
            <span>إنشاء تقرير جديد</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2 space-x-reverse">
            <Eye className="w-4 h-4" />
            <span>التقارير</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات الإجمالية</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
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

            {sections.map((section) => (
              <Card key={section.key}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>الإيجابيات</Label>
                    <Textarea
                      value={formData[section.key].positives}
                      onChange={(e) => updateField(section.key, "positives", e.target.value)}
                      placeholder="اذكر الإيجابيات"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>الملاحظات</Label>
                    <Textarea
                      value={formData[section.key].observations}
                      onChange={(e) => updateField(section.key, "observations", e.target.value)}
                      placeholder="اذكر الملاحظات"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>الإجراءات المقترحة</Label>
                    <Textarea
                      value={formData[section.key].actions}
                      onChange={(e) => updateField(section.key, "actions", e.target.value)}
                      placeholder="اذكر الإجراءات المقترحة"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600">
              {loading ? "جاري الإرسال..." : editingReport ? "تحديث التقرير" : "إرسال التقرير"}
            </Button>

            {editingReport && (
              <Button
                type="button"
                onClick={() => {
                  setEditingReport(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    academic_performance: { positives: "", observations: "", actions: "" },
                    educational_supervision: { positives: "", observations: "", actions: "" },
                    discipline_behavior: { positives: "", observations: "", actions: "" },
                    activities_programs: { positives: "", observations: "", actions: "" },
                    social_specialist: { positives: "", observations: "", actions: "" }
                  });
                }}
                variant="outline"
                className="w-full"
              >
                إلغاء التعديل
              </Button>
            )}
          </form>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-6">
            {/* Filters */}
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

                  <div className="flex items-end">
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">
                التقارير ({reports.length})
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {reports.map((report) => (
                  <Card
                    key={report.id}
                    className="report-card hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedReport(report);
                      setShowReportModal(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">
                            تقرير الجودة - {new Date(report.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h4>
                          <p className="text-sm text-gray-500">
                            تم الإنشاء: {new Date(report.created_at).toLocaleString("ar-SA")}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                              setShowReportModal(true);
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
          </div>

          {/* Report Detail Modal */}
          <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedReport && `تقرير الجودة - ${new Date(selectedReport.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                </DialogTitle>
              </DialogHeader>

              {selectedReport && (
                <div className="space-y-4 p-4">
                  {sections.map((section) => (
                    <Card key={section.key} className={`border-2 border-${section.color}-200`}>
                      <CardHeader className={`bg-gradient-to-r from-${section.color}-50 to-${section.color}-100`}>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-4">
                        {selectedReport[section.key]?.positives && (
                          <div className={`p-3 bg-green-50 rounded-lg border border-green-200`}>
                            <div className="text-sm font-bold text-green-800 mb-2">الإيجابيات</div>
                            <p className="text-sm text-gray-700">{selectedReport[section.key].positives}</p>
                          </div>
                        )}
                        {selectedReport[section.key]?.observations && (
                          <div className={`p-3 bg-orange-50 rounded-lg border border-orange-200`}>
                            <div className="text-sm font-bold text-orange-800 mb-2">الملاحظات</div>
                            <p className="text-sm text-gray-700">{selectedReport[section.key].observations}</p>
                          </div>
                        )}
                        {selectedReport[section.key]?.actions && (
                          <div className={`p-3 bg-blue-50 rounded-lg border border-blue-200`}>
                            <div className="text-sm font-bold text-blue-800 mb-2">الإجراءات المقترحة</div>
                            <p className="text-sm text-gray-700">{selectedReport[section.key].actions}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Statistics Tab - نسخة كاملة من لوحة المدير */}
        <TabsContent value="statistics">
          <div className="space-y-6">
            {/* Time Filter */}
            <Card>
              <CardHeader>
                <CardTitle>التصفية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </div>
              </CardContent>
            </Card>

            {/* Toggle Button for Detailed Reports */}
            <Card>
              <CardContent className="p-4">
                <Button 
                  onClick={() => setShowDetailedReports(!showDetailedReports)}
                  variant="outline"
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {showDetailedReports ? "إخفاء التقارير التفصيلية" : "عرض التقارير التفصيلية"}
                </Button>
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
                          <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">توزيع حالات المعلمين (انقر للتفاصيل)</h3>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
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
                            <div className="text-center mt-4">
                              <Button
                                variant="outline"
                                onClick={() => handleChartClick('absent')}
                                className="mx-2"
                              >
                                👥 عرض قائمة المعلمين الغائبين
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Performance Chart */}
                        {(reportTypeFilter === "all" || reportTypeFilter === "supervisor") && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-700">معدلات الأداء العام</h3>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={getPerformanceChartData()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis domain={[0, 10]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill="#3b82f6" name="التقييم" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

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

                  {/* Detailed Reports Section */}
                  <>
                    {/* Supervisor Detailed Reports */}
                    {(reportTypeFilter === "all" || reportTypeFilter === "supervisor") && supervisorReports.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-blue-700">📋 تقارير المشرفين التفصيلية</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {filterReportsByTimeOnly(supervisorReports).slice(0, 5).map((report) => {
                              const supervisor = users.find(u => u.id === report.user_id);
                              return (
                                <Card key={report.id} className="border-l-4 border-blue-500">
                                  <CardContent className="p-4">
                                    <div className="mb-3 pb-3 border-b">
                                      <h3 className="text-md font-bold text-blue-700">المشرف: {supervisor?.username || 'غير معروف'}</h3>
                                      <p className="text-xs text-gray-600">التاريخ: {new Date(report.date).toLocaleDateString('ar-SA')}</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                      <div className="bg-orange-50 p-2 rounded">
                                        <p className="font-semibold text-orange-700">متأخرون: {report.late_teachers?.length || 0}</p>
                                      </div>
                                      <div className="bg-red-50 p-2 rounded">
                                        <p className="font-semibold text-red-700">غائبون: {report.absent_teachers?.length || 0}</p>
                                      </div>
                                      <div className="bg-green-50 p-2 rounded">
                                        <p className="font-semibold text-green-700">مغطون: {report.covering_teachers?.length || 0}</p>
                                      </div>
                                      <div className="bg-blue-50 p-2 rounded">
                                        <p className="font-semibold text-blue-700">طلاب غائبون: {report.absent_students_count || 0}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                            {filterReportsByTimeOnly(supervisorReports).length > 5 && (
                              <p className="text-sm text-gray-500 text-center">... و {filterReportsByTimeOnly(supervisorReports).length - 5} تقرير إضافي</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Vice-Principal Detailed Reports */}
                    {(reportTypeFilter === "all" || reportTypeFilter === "vice_principal") && vicePrincipalReports.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-cyan-700">📋 تقارير الوكلاء التفصيلية</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {filterReportsByTimeOnly(vicePrincipalReports).slice(0, 5).map((report) => {
                              const vp = users.find(u => u.id === report.user_id);
                              return (
                                <Card key={report.id} className="border-l-4 border-cyan-500">
                                  <CardContent className="p-4">
                                    <div className="mb-3 pb-3 border-b">
                                      <h3 className="text-md font-bold text-cyan-700">الوكيل: {vp?.username || 'غير معروف'}</h3>
                                      <p className="text-xs text-gray-600">
                                        الفترة: {new Date(report.week_start).toLocaleDateString('ar-SA')} - {new Date(report.week_end).toLocaleDateString('ar-SA')}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div className="bg-orange-50 p-2 rounded">
                                        <p className="font-semibold text-orange-700">مشاكل: {report.problems?.length || 0}</p>
                                      </div>
                                      <div className="bg-blue-50 p-2 rounded">
                                        <p className="font-semibold text-blue-700">اقتراحات: {report.suggestions?.length || 0}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                            {filterReportsByTimeOnly(vicePrincipalReports).length > 5 && (
                              <p className="text-sm text-gray-500 text-center">... و {filterReportsByTimeOnly(vicePrincipalReports).length - 5} تقرير إضافي</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Activities Detailed Reports */}
                    {(reportTypeFilter === "all" || reportTypeFilter === "activities") && activitiesReports.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-purple-700">📋 تقارير الأنشطة التفصيلية</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {filterReportsByTimeOnly(activitiesReports).slice(0, 5).map((report) => {
                              const activityUser = users.find(u => u.id === report.user_id);
                              return (
                                <Card key={report.id} className="border-l-4 border-purple-500">
                                  <CardContent className="p-4">
                                    <div className="mb-3 pb-3 border-b">
                                      <h3 className="text-md font-bold text-purple-700">مسؤول الأنشطة: {activityUser?.username || 'غير معروف'}</h3>
                                      <p className="text-xs text-gray-600">التاريخ: {new Date(report.date).toLocaleDateString('ar-SA')}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div className="bg-purple-50 p-2 rounded">
                                        <p className="font-semibold text-purple-700">عدد الأنشطة: {report.activities?.length || 0}</p>
                                      </div>
                                      <div className="bg-indigo-50 p-2 rounded">
                                        <p className="font-semibold text-indigo-700">المشاركون: {report.activities?.reduce((sum, a) => sum + (a.participants_count || 0), 0) || 0}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                            {filterReportsByTimeOnly(activitiesReports).length > 5 && (
                              <p className="text-sm text-gray-500 text-center">... و {filterReportsByTimeOnly(activitiesReports).length - 5} تقرير إضافي</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Social Specialist Detailed Reports */}
                    {(reportTypeFilter === "all" || reportTypeFilter === "social") && socialReports.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-green-700">📋 تقارير الأخصائي الاجتماعي التفصيلية</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {filterReportsByTimeOnly(socialReports).slice(0, 5).map((report) => {
                              const socialUser = users.find(u => u.id === report.user_id);
                              return (
                                <Card key={report.id} className="border-l-4 border-green-500">
                                  <CardContent className="p-4">
                                    <div className="mb-3 pb-3 border-b">
                                      <h3 className="text-md font-bold text-green-700">الأخصائي: {socialUser?.username || 'غير معروف'}</h3>
                                      <p className="text-xs text-gray-600">التاريخ: {new Date(report.date).toLocaleDateString('ar-SA')}</p>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                      <div className="bg-purple-50 p-2 rounded">
                                        <p className="font-semibold text-purple-700">نفسية: {report.psychological_cases || 0}</p>
                                      </div>
                                      <div className="bg-blue-50 p-2 rounded">
                                        <p className="font-semibold text-blue-700">أكاديمية: {report.academic_cases || 0}</p>
                                      </div>
                                      <div className="bg-red-50 p-2 rounded">
                                        <p className="font-semibold text-red-700">سلوكية: {report.behavioral_cases || 0}</p>
                                      </div>
                                      <div className="bg-green-50 p-2 rounded">
                                        <p className="font-semibold text-green-700">جلسات: {report.sessions_count || 0}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                            {filterReportsByTimeOnly(socialReports).length > 5 && (
                              <p className="text-sm text-gray-500 text-center">... و {filterReportsByTimeOnly(socialReports).length - 5} تقرير إضافي</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Quality Detailed Reports */}
                    {(reportTypeFilter === "all" || reportTypeFilter === "quality") && qualityReports.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-orange-700">📋 تقارير الجودة التفصيلية</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {filterReportsByTimeOnly(qualityReports).slice(0, 5).map((report) => {
                              const qualityUser = users.find(u => u.id === report.user_id);
                              return (
                                <Card key={report.id} className="border-l-4 border-orange-500">
                                  <CardContent className="p-4">
                                    <div className="mb-3 pb-3 border-b">
                                      <h3 className="text-md font-bold text-orange-700">مسؤول الجودة: {qualityUser?.username || 'غير معروف'}</h3>
                                      <p className="text-xs text-gray-600">التاريخ: {new Date(report.date).toLocaleDateString('ar-SA')}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div className="bg-blue-50 p-2 rounded">
                                        <p className="font-semibold text-blue-700">المعلم: {report.teacher_name || '-'}</p>
                                      </div>
                                      <div className="bg-amber-50 p-2 rounded">
                                        <p className="font-semibold text-amber-700">الأداء: {report.teaching_performance_rate || 0}/10</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                            {filterReportsByTimeOnly(qualityReports).length > 5 && (
                              <p className="text-sm text-gray-500 text-center">... و {filterReportsByTimeOnly(qualityReports).length - 5} تقرير إضافي</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                </>
              );
            })()}
          </div>
        </TabsContent>
      </Tabs>

      {/* Teachers List Modal */}
      <Dialog open={showTeachersListModal} onOpenChange={setShowTeachersListModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{teachersListData.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {teachersListData.teachers.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
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
                          <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                            {index + 1}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">
                            {teacher.name}
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center text-sm">
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
                            <td className="border border-gray-300 px-4 py-2 text-center text-xs">
                              {teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects.join(', ') : '-'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <DialogFooter>
                  <Button onClick={exportTeachersListToPDF} variant="outline">
                    تصدير إلى PDF
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">لا توجد بيانات متاحة</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default QualityDashboard;