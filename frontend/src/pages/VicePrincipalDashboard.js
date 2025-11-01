import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { Plus, X, FileDown, Eye } from "lucide-react";
import * as XLSX from 'xlsx';
import pdfMake from '../utils/pdfConfig';

const VicePrincipalDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("create");
  const [supervisorReports, setSupervisorReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [selectedSupervisorReport, setSelectedSupervisorReport] = useState(null);
  const [selectedMyReport, setSelectedMyReport] = useState(null);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [showMyReportModal, setShowMyReportModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Export filters
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportFilterType, setExportFilterType] = useState("all"); // all, daily, weekly, monthly

  const [formData, setFormData] = useState({
    problems: [],
    suggestions: [],
    week_start: "",
    week_end: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [supervisorRes, myReportsRes] = await Promise.all([
        axios.get(`${API}/reports/supervisor`),
        axios.get(`${API}/reports/vice-principal`)
      ]);
      setSupervisorReports(supervisorRes.data);
      setMyReports(myReportsRes.data);
    } catch (error) {
      toast.error("فشل تحميل البيانات");
    }
  };

  // Calculate merged statistics from supervisor reports
  const getMergedStatistics = () => {
    if (supervisorReports.length === 0) return null;

    const totals = supervisorReports.reduce((acc, report) => ({
      discipline: acc.discipline + report.student_discipline,
      cleanliness: acc.cleanliness + report.classroom_cleanliness,
      attendance: acc.attendance + report.teacher_attendance_rate,
      behavior: acc.behavior + report.general_behavior,
      absentStudents: acc.absentStudents + (report.absent_students_count || 0),
      lateTeachers: acc.lateTeachers + (report.late_teachers?.length || 0),
      absentTeachers: acc.absentTeachers + (report.absent_teachers?.length || 0),
      coveringTeachers: acc.coveringTeachers + (report.covering_teachers?.length || 0),
      incidents: acc.incidents + (report.incidents?.length || 0)
    }), {
      discipline: 0,
      cleanliness: 0,
      attendance: 0,
      behavior: 0,
      absentStudents: 0,
      lateTeachers: 0,
      absentTeachers: 0,
      coveringTeachers: 0,
      incidents: 0
    });

    const count = supervisorReports.length;

    return {
      averages: {
        discipline: (totals.discipline / count).toFixed(1),
        cleanliness: (totals.cleanliness / count).toFixed(1),
        attendance: (totals.attendance / count).toFixed(1),
        behavior: (totals.behavior / count).toFixed(1)
      },
      totals: {
        absentStudents: totals.absentStudents,
        lateTeachers: totals.lateTeachers,
        absentTeachers: totals.absentTeachers,
        coveringTeachers: totals.coveringTeachers,
        incidents: totals.incidents,
        reports: count
      }
    };
  };

  // Export to Excel with comprehensive data and advanced filtering
  const exportToExcel = () => {
    setShowExportDialog(true);
  };

  const handleExportWithDateRange = () => {
    if (supervisorReports.length === 0) {
      toast.error("لا توجد تقارير للتصدير");
      return;
    }

    // Filter reports based on selected criteria
    let reportsToExport = [...supervisorReports];
    const today = new Date();
    
    if (exportFilterType === "daily") {
      // Export today's report only
      const todayStr = new Date().toISOString().split('T')[0];
      reportsToExport = supervisorReports.filter(report => report.date === todayStr);
    } else if (exportFilterType === "weekly") {
      // Export this week's reports (Saturday to Wednesday)
      const currentDay = today.getDay();
      const daysFromSaturday = currentDay === 6 ? 0 : currentDay + 1;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromSaturday);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4); // 5 days (Sat-Wed)
      weekEnd.setHours(23, 59, 59, 999);
      
      reportsToExport = supervisorReports.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate >= weekStart && reportDate <= weekEnd;
      });
    } else if (exportFilterType === "monthly") {
      // Export this month's reports
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      reportsToExport = supervisorReports.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
      });
    } else if (exportFilterType === "custom" && exportStartDate && exportEndDate) {
      // Custom date range
      const startDate = new Date(exportStartDate);
      const endDate = new Date(exportEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      reportsToExport = supervisorReports.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate >= startDate && reportDate <= endDate;
      });
    } else if (exportFilterType === "custom" && exportStartDate && !exportEndDate) {
      const startDate = new Date(exportStartDate);
      reportsToExport = supervisorReports.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate >= startDate;
      });
    } else if (exportFilterType === "custom" && !exportStartDate && exportEndDate) {
      const endDate = new Date(exportEndDate);
      endDate.setHours(23, 59, 59, 999);
      reportsToExport = supervisorReports.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate <= endDate;
      });
    }

    if (reportsToExport.length === 0) {
      toast.error("لا توجد تقارير في الفترة المحددة");
      return;
    }

    // Sort reports by date
    reportsToExport.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Prepare comprehensive data for Excel
    const excelData = [];
    
    reportsToExport.forEach((report, index) => {
      const reportDate = new Date(report.date).toLocaleDateString('ar-SA', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Main report row with all scores
      const mainRow = {
        '#': index + 1,
        'التاريخ': reportDate,
        'اليوم': new Date(report.date).toLocaleDateString('ar-SA', { weekday: 'long' }),
        'انضباط الطلاب': `${report.student_discipline}/10`,
        'نظافة الفصول': `${report.classroom_cleanliness}/10`,
        'التزام المعلمين': `${report.teacher_attendance_rate}/10`,
        'السلوك العام': `${report.general_behavior}/10`,
        'عدد الطلاب الغائبين': report.absent_students_count || 0,
      };
      
      // Add detailed teacher information
      if (report.late_teachers && report.late_teachers.length > 0) {
        const lateTeachersDetails = report.late_teachers.map(lt => 
          `${lt.teacher} (${lt.subject} - حصة ${lt.period})`
        ).join('\n');
        mainRow['المعلمون المتأخرون'] = lateTeachersDetails;
        mainRow['عدد المعلمين المتأخرين'] = report.late_teachers.length;
      } else {
        mainRow['المعلمون المتأخرون'] = '-';
        mainRow['عدد المعلمين المتأخرين'] = 0;
      }
      
      if (report.absent_teachers && report.absent_teachers.length > 0) {
        const absentTeachersDetails = report.absent_teachers.map(at => 
          `${at.teacher} (${at.subject} - حصة ${at.period})`
        ).join('\n');
        mainRow['المعلمون الغائبون'] = absentTeachersDetails;
        mainRow['عدد المعلمين الغائبين'] = report.absent_teachers.length;
      } else {
        mainRow['المعلمون الغائبون'] = '-';
        mainRow['عدد المعلمين الغائبين'] = 0;
      }
      
      if (report.covering_teachers && report.covering_teachers.length > 0) {
        const coveringTeachersDetails = report.covering_teachers.map(ct => 
          `${ct.teacher} (${ct.subject} - حصة ${ct.period})`
        ).join('\n');
        mainRow['المعلمون الذين غطوا الحصص'] = coveringTeachersDetails;
        mainRow['عدد المعلمين المغطين'] = report.covering_teachers.length;
      } else {
        mainRow['المعلمون الذين غطوا الحصص'] = '-';
        mainRow['عدد المعلمين المغطين'] = 0;
      }
      
      // Add incidents with full details
      if (report.incidents && report.incidents.length > 0) {
        const incidentsDetails = report.incidents.map((inc, i) => 
          `${i + 1}. الحادثة: ${inc.description}\n   الإجراء المتخذ: ${inc.action}`
        ).join('\n\n');
        mainRow['الحوادث والمخالفات - التفاصيل'] = incidentsDetails;
        mainRow['عدد الحوادث'] = report.incidents.length;
      } else {
        mainRow['الحوادث والمخالفات - التفاصيل'] = '-';
        mainRow['عدد الحوادث'] = 0;
      }
      
      // Add movement classes
      if (report.student_movement_classes && report.student_movement_classes.length > 0) {
        mainRow['الصفوف المتابعة للتنقل'] = report.student_movement_classes.join(' | ');
      } else {
        mainRow['الصفوف المتابعة للتنقل'] = '-';
      }
      
      // Add all notes
      mainRow['ملاحظات انضباط الطلاب'] = report.student_discipline_notes || '-';
      mainRow['ملاحظات نظافة الفصول'] = report.classroom_cleanliness_notes || '-';
      mainRow['ملاحظات التزام المعلمين'] = report.teacher_attendance_notes || '-';
      mainRow['ملاحظات تنقل الطلاب'] = report.student_movement_notes || '-';
      mainRow['الملاحظات العامة'] = report.general_notes || '-';
      
      excelData.push(mainRow);
    });

    // Add summary statistics at the end
    const totalStudentsAbsent = reportsToExport.reduce((sum, r) => sum + (r.absent_students_count || 0), 0);
    const totalLateTeachers = reportsToExport.reduce((sum, r) => sum + (r.late_teachers?.length || 0), 0);
    const totalAbsentTeachers = reportsToExport.reduce((sum, r) => sum + (r.absent_teachers?.length || 0), 0);
    const totalCoveringTeachers = reportsToExport.reduce((sum, r) => sum + (r.covering_teachers?.length || 0), 0);
    const totalIncidents = reportsToExport.reduce((sum, r) => sum + (r.incidents?.length || 0), 0);
    
    const avgDiscipline = (reportsToExport.reduce((sum, r) => sum + r.student_discipline, 0) / reportsToExport.length).toFixed(1);
    const avgCleanliness = (reportsToExport.reduce((sum, r) => sum + r.classroom_cleanliness, 0) / reportsToExport.length).toFixed(1);
    const avgAttendance = (reportsToExport.reduce((sum, r) => sum + r.teacher_attendance_rate, 0) / reportsToExport.length).toFixed(1);
    const avgBehavior = (reportsToExport.reduce((sum, r) => sum + r.general_behavior, 0) / reportsToExport.length).toFixed(1);

    // Add empty row
    excelData.push({});
    
    // Add summary row
    excelData.push({
      '#': '',
      'التاريخ': '📊 الإحصائيات الإجمالية',
      'اليوم': '',
      'انضباط الطلاب': `${avgDiscipline}/10`,
      'نظافة الفصول': `${avgCleanliness}/10`,
      'التزام المعلمين': `${avgAttendance}/10`,
      'السلوك العام': `${avgBehavior}/10`,
      'عدد الطلاب الغائبين': totalStudentsAbsent,
      'المعلمون المتأخرون': '',
      'عدد المعلمين المتأخرين': totalLateTeachers,
      'المعلمون الغائبون': '',
      'عدد المعلمين الغائبين': totalAbsentTeachers,
      'المعلمون الذين غطوا الحصص': '',
      'عدد المعلمين المغطين': totalCoveringTeachers,
      'الحوادث والمخالفات - التفاصيل': '',
      'عدد الحوادث': totalIncidents,
      'الصفوف المتابعة للتنقل': '',
      'ملاحظات انضباط الطلاب': '',
      'ملاحظات نظافة الفصول': '',
      'ملاحظات التزام المعلمين': '',
      'ملاحظات تنقل الطلاب': '',
      'الملاحظات العامة': `إجمالي ${reportsToExport.length} تقرير`
    });

    // Create worksheet with proper styling
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths for better readability
    worksheet['!cols'] = [
      { wch: 5 },   // #
      { wch: 25 },  // التاريخ
      { wch: 10 },  // اليوم
      { wch: 12 },  // انضباط الطلاب
      { wch: 12 },  // نظافة الفصول
      { wch: 12 },  // التزام المعلمين
      { wch: 12 },  // السلوك العام
      { wch: 18 },  // عدد الطلاب الغائبين
      { wch: 50 },  // المعلمون المتأخرون
      { wch: 20 },  // عدد المعلمين المتأخرين
      { wch: 50 },  // المعلمون الغائبون
      { wch: 20 },  // عدد المعلمين الغائبين
      { wch: 50 },  // المعلمون المغطون
      { wch: 20 },  // عدد المعلمين المغطين
      { wch: 60 },  // الحوادث - التفاصيل
      { wch: 15 },  // عدد الحوادث
      { wch: 40 },  // الصفوف المتابعة
      { wch: 35 },  // ملاحظات الانضباط
      { wch: 35 },  // ملاحظات النظافة
      { wch: 35 },  // ملاحظات الالتزام
      { wch: 35 },  // ملاحظات التنقل
      { wch: 45 }   // الملاحظات العامة
    ];

    // Enable text wrapping for long content
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[cellAddress]) continue;
        if (!worksheet[cellAddress].s) worksheet[cellAddress].s = {};
        worksheet[cellAddress].s.alignment = { wrapText: true, vertical: 'top' };
      }
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقارير المشرفين التفصيلية');

    // Generate filename with appropriate description
    let filename = 'تقارير_المشرفين_شاملة';
    if (exportFilterType === "daily") {
      filename += `_يوم_${new Date().toLocaleDateString('ar-SA')}`;
    } else if (exportFilterType === "weekly") {
      filename += `_أسبوعي`;
    } else if (exportFilterType === "monthly") {
      const monthName = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
      filename += `_شهر_${monthName}`;
    } else if (exportFilterType === "custom" && exportStartDate && exportEndDate) {
      filename += `_من_${exportStartDate}_إلى_${exportEndDate}`;
    } else if (exportFilterType === "custom" && exportStartDate) {
      filename += `_من_${exportStartDate}`;
    } else if (exportFilterType === "custom" && exportEndDate) {
      filename += `_حتى_${exportEndDate}`;
    } else {
      filename += `_جميع_التقارير`;
    }
    filename += '.xlsx';

    // Download
    XLSX.writeFile(workbook, filename);
    toast.success(`تم تصدير ${reportsToExport.length} تقرير بنجاح مع كافة التفاصيل`);
    setShowExportDialog(false);
    setExportStartDate("");
    setExportEndDate("");
    setExportFilterType("all");
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      if (supervisorReports.length === 0) {
        toast.error("لا توجد تقارير للتصدير");
        return;
      }

      const stats = getMergedStatistics();

      // Prepare period text
      let periodText = 'جميع التقارير';
      
      // Prepare detailed reports data
      const reportsData = supervisorReports.map((report, index) => {
        const reportDate = new Date(report.date);
        return [
          String(index + 1),
          reportDate.toLocaleDateString('ar-SA'),
          String(report.late_teachers?.length || 0),
          String(report.absent_teachers?.length || 0),
          String(report.covering_teachers?.length || 0),
          String(report.absent_students_count || 0),
          String(report.student_discipline || 0) + '/10',
          String(report.classroom_cleanliness || 0) + '/10'
        ];
      });

      const docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'landscape',
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
            text: 'تقرير الوكيل - تقارير المشرفين المجمعة',
            style: 'subheader',
            alignment: 'center',
            margin: [0, 0, 0, 5]
          },
          {
            text: `الفرع: ${user.branch === 'boys' ? 'البنين' : 'البنات'}`,
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
          
          // Statistics Summary
          {
            text: 'الإحصائيات الإجمالية',
            style: 'sectionHeader',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'إجمالي التقارير', style: 'tableHeader', alignment: 'center' },
                  { text: 'المعلمون المتأخرون', style: 'tableHeader', alignment: 'center' },
                  { text: 'المعلمون الغائبون', style: 'tableHeader', alignment: 'center' },
                  { text: 'المعلمون المغطون', style: 'tableHeader', alignment: 'center' }
                ],
                [
                  { text: String(stats.totalReports), alignment: 'center' },
                  { text: String(stats.totalLateTeachers), alignment: 'center' },
                  { text: String(stats.totalAbsentTeachers), alignment: 'center' },
                  { text: String(stats.totalCoveringTeachers), alignment: 'center' }
                ]
              ]
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? '#2196F3' : '#E3F2FD';
              }
            },
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'الطلاب الغائبون', style: 'tableHeader', alignment: 'center' },
                  { text: 'متوسط الانضباط', style: 'tableHeader', alignment: 'center' },
                  { text: 'متوسط النظافة', style: 'tableHeader', alignment: 'center' },
                  { text: 'متوسط الحضور', style: 'tableHeader', alignment: 'center' }
                ],
                [
                  { text: String(stats.totalAbsentStudents), alignment: 'center' },
                  { text: String(stats.avgDiscipline) + '/10', alignment: 'center' },
                  { text: String(stats.avgCleanliness) + '/10', alignment: 'center' },
                  { text: String(stats.avgAttendance) + '%', alignment: 'center' }
                ]
              ]
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? '#4CAF50' : '#E8F5E9';
              }
            },
            margin: [0, 0, 0, 15]
          },

          // Detailed Reports
          {
            text: `تفاصيل التقارير (${supervisorReports.length})`,
            style: 'sectionHeader',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: [25, 60, 50, 50, 50, 60, 50, 50],
              body: [
                [
                  { text: '#', style: 'tableHeader' },
                  { text: 'التاريخ', style: 'tableHeader' },
                  { text: 'متأخرون', style: 'tableHeader' },
                  { text: 'غائبون', style: 'tableHeader' },
                  { text: 'مغطون', style: 'tableHeader' },
                  { text: 'طلاب غائبون', style: 'tableHeader' },
                  { text: 'الانضباط', style: 'tableHeader' },
                  { text: 'النظافة', style: 'tableHeader' }
                ],
                ...reportsData
              ]
            },
            layout: {
              fillColor: function (rowIndex) {
                return rowIndex === 0 ? '#9C27B0' : (rowIndex % 2 === 0 ? '#F5F5F5' : null);
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
            fontSize: 9,
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

      const filename = `تقرير_الوكيل_${user.branch === 'boys' ? 'بنين' : 'بنات'}.pdf`;
      pdfMake.createPdf(docDefinition).download(filename);
      toast.success('تم تصدير PDF بنجاح');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('فشل تصدير PDF');
    }
  };

  const addProblem = () => {
    setFormData({
      ...formData,
      problems: [...formData.problems, { description: "", actions: "" }]
    });
  };

  const removeProblem = (index) => {
    const updated = formData.problems.filter((_, i) => i !== index);
    setFormData({ ...formData, problems: updated });
  };

  const updateProblem = (index, field, value) => {
    const updated = [...formData.problems];
    updated[index][field] = value;
    setFormData({ ...formData, problems: updated });
  };

  const addSuggestion = () => {
    setFormData({
      ...formData,
      suggestions: [...formData.suggestions, ""]
    });
  };

  const removeSuggestion = (index) => {
    const updated = formData.suggestions.filter((_, i) => i !== index);
    setFormData({ ...formData, suggestions: updated });
  };

  const updateSuggestion = (index, value) => {
    const updated = [...formData.suggestions];
    updated[index] = value;
    setFormData({ ...formData, suggestions: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingReport) {
        await axios.put(`${API}/reports/vice-principal/${editingReport.id}`, {
          ...formData,
          supervisor_reports: supervisorReports.map(r => r.id)
        });
        toast.success("تم تحديث التقرير بنجاح");
        setEditingReport(null);
      } else {
        await axios.post(`${API}/reports/vice-principal`, {
          ...formData,
          supervisor_reports: supervisorReports.map(r => r.id)
        });
        toast.success("تم إنشاء التقرير بنجاح");
      }
      fetchData();
      setActiveTab("reports");
      setFormData({ problems: [], suggestions: [], week_start: "", week_end: "" });
    } catch (error) {
      toast.error("فشل إنشاء التقرير");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      problems: report.problems || [],
      suggestions: report.suggestions || [],
      week_start: report.week_start,
      week_end: report.week_end
    });
    setActiveTab("create");
  };

  const handleDelete = async (reportId) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التقرير؟")) {
      try {
        await axios.delete(`${API}/reports/vice-principal/${reportId}`);
        toast.success("تم حذف التقرير بنجاح");
        fetchData();
      } catch (error) {
        toast.error("فشل حذف التقرير");
      }
    }
  };

  return (
    <DashboardLayout title="لوحة تحكم الوكيل">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="create" data-testid="create-report-tab">إنشاء تقرير</TabsTrigger>
          <TabsTrigger value="merged-stats">الإحصائيات المدمجة</TabsTrigger>
          <TabsTrigger value="supervisor-reports">تقارير المشرفين</TabsTrigger>
          <TabsTrigger value="reports">تقاريري</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>فترة التقرير</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">بداية الأسبوع</label>
                  <input
                    type="date"
                    value={formData.week_start}
                    onChange={(e) => setFormData({ ...formData, week_start: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">نهاية الأسبوع</label>
                  <input
                    type="date"
                    value={formData.week_end}
                    onChange={(e) => setFormData({ ...formData, week_end: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المشاكل والإجراءات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.problems.map((problem, index) => (
                  <div key={index} className="border p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold">مشكلة {index + 1}</h4>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeProblem(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="وصف المشكلة"
                      value={problem.description}
                      onChange={(e) => updateProblem(index, "description", e.target.value)}
                    />
                    <Textarea
                      placeholder="الإجراءات المتخذة"
                      value={problem.actions}
                      onChange={(e) => updateProblem(index, "actions", e.target.value)}
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addProblem} className="w-full">
                  <Plus className="w-4 h-4 ml-2" /> إضافة مشكلة
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الاقتراحات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      placeholder="أضف اقتراح"
                      value={suggestion}
                      onChange={(e) => updateSuggestion(index, e.target.value)}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeSuggestion(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addSuggestion} className="w-full">
                  <Plus className="w-4 h-4 ml-2" /> إضافة اقتراح
                </Button>
              </CardContent>
            </Card>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600">
              {loading ? "جاري الإرسال..." : editingReport ? "تحديث التقرير" : "إرسال التقرير"}
            </Button>
            
            {editingReport && (
              <Button
                type="button"
                onClick={() => {
                  setEditingReport(null);
                  setFormData({ problems: [], suggestions: [], week_start: "", week_end: "" });
                }}
                variant="outline"
                className="w-full"
              >
                إلغاء التعديل
              </Button>
            )}
          </form>
        </TabsContent>

        <TabsContent value="merged-stats">
          {getMergedStatistics() ? (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-2xl">
                      إحصائيات مدمجة من {supervisorReports.length} تقرير
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={exportToPDF}
                        variant="secondary"
                        className="bg-white text-red-600 hover:bg-red-50"
                      >
                        <FileDown className="w-4 h-4 ml-2" />
                        تصدير PDF
                      </Button>
                      <Button
                        onClick={exportToExcel}
                        variant="secondary"
                        className="bg-white text-cyan-700 hover:bg-cyan-50"
                      >
                        <FileDown className="w-4 h-4 ml-2" />
                        تصدير Excel
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Average Scores */}
              <Card>
                <CardHeader>
                  <CardTitle>المتوسطات العامة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="stat-card bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-cyan-500">
                      <div className="text-sm text-gray-700 mb-1 font-semibold">انضباط الطلاب</div>
                      <div className="text-4xl font-bold text-cyan-700">
                        {getMergedStatistics().averages.discipline}/10
                      </div>
                    </div>
                    <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                      <div className="text-sm text-gray-700 mb-1 font-semibold">نظافة الفصول</div>
                      <div className="text-4xl font-bold text-blue-700">
                        {getMergedStatistics().averages.cleanliness}/10
                      </div>
                    </div>
                    <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                      <div className="text-sm text-gray-700 mb-1 font-semibold">التزام المعلمين</div>
                      <div className="text-4xl font-bold text-purple-700">
                        {getMergedStatistics().averages.attendance}/10
                      </div>
                    </div>
                    <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                      <div className="text-sm text-gray-700 mb-1 font-semibold">السلوك العام</div>
                      <div className="text-4xl font-bold text-green-700">
                        {getMergedStatistics().averages.behavior}/10
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>الإحصائيات التفصيلية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <div className="text-sm text-gray-600 mb-1">إجمالي الطلاب الغائبين</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {getMergedStatistics().totals.absentStudents}
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                      <div className="text-sm text-gray-600 mb-1">إجمالي المعلمين المتأخرين</div>
                      <div className="text-3xl font-bold text-orange-600">
                        {getMergedStatistics().totals.lateTeachers}
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                      <div className="text-sm text-gray-600 mb-1">إجمالي المعلمين الغائبين</div>
                      <div className="text-3xl font-bold text-red-600">
                        {getMergedStatistics().totals.absentTeachers}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <div className="text-sm text-gray-600 mb-1">إجمالي المعلمين المغطين</div>
                      <div className="text-3xl font-bold text-green-600">
                        {getMergedStatistics().totals.coveringTeachers}
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                      <div className="text-sm text-gray-600 mb-1">إجمالي الحوادث والمخالفات</div>
                      <div className="text-3xl font-bold text-yellow-600">
                        {getMergedStatistics().totals.incidents}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                      <div className="text-sm text-gray-600 mb-1">عدد التقارير المدمجة</div>
                      <div className="text-3xl font-bold text-purple-600">
                        {getMergedStatistics().totals.reports}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>الرسم البياني للمتوسطات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <div className="w-full max-w-2xl">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-semibold">انضباط الطلاب</span>
                            <span className="text-sm font-bold text-cyan-600">{getMergedStatistics().averages.discipline}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-4 rounded-full transition-all"
                              style={{ width: `${getMergedStatistics().averages.discipline * 10}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-semibold">نظافة الفصول</span>
                            <span className="text-sm font-bold text-blue-600">{getMergedStatistics().averages.cleanliness}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all"
                              style={{ width: `${getMergedStatistics().averages.cleanliness * 10}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-semibold">التزام المعلمين</span>
                            <span className="text-sm font-bold text-purple-600">{getMergedStatistics().averages.attendance}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full transition-all"
                              style={{ width: `${getMergedStatistics().averages.attendance * 10}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-semibold">السلوك العام</span>
                            <span className="text-sm font-bold text-green-600">{getMergedStatistics().averages.behavior}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all"
                              style={{ width: `${getMergedStatistics().averages.behavior * 10}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">لا توجد تقارير من المشرفين حتى الآن</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="supervisor-reports">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                تقارير المشرفين ({supervisorReports.length})
              </h3>
              <div className="flex gap-2">
                <Button onClick={exportToPDF} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                  <FileDown className="w-4 h-4 ml-2" />
                  PDF
                </Button>
                <Button onClick={exportToExcel} variant="outline">
                  <FileDown className="w-4 h-4 ml-2" />
                  Excel
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {supervisorReports.map((report) => (
                <Card 
                  key={report.id}
                  className="report-card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedSupervisorReport(report);
                    setShowSupervisorModal(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">
                          تقرير {new Date(report.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h4>
                        <p className="text-sm text-gray-500">
                          تم الإنشاء: {new Date(report.created_at).toLocaleString("ar-SA")}
                        </p>
                      </div>
                      
                      <div className="hidden md:flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-600">الانضباط</div>
                          <div className="text-lg font-bold text-cyan-600">{report.student_discipline}/10</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600">النظافة</div>
                          <div className="text-lg font-bold text-blue-600">{report.classroom_cleanliness}/10</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600">الالتزام</div>
                          <div className="text-lg font-bold text-purple-600">{report.teacher_attendance_rate}/10</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-600">السلوك</div>
                          <div className="text-lg font-bold text-green-600">{report.general_behavior}/10</div>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSupervisorReport(report);
                          setShowSupervisorModal(true);
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

          {/* Supervisor Report Modal */}
          <Dialog open={showSupervisorModal} onOpenChange={setShowSupervisorModal}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedSupervisorReport && `تقرير ${new Date(selectedSupervisorReport.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                </DialogTitle>
              </DialogHeader>
              
              {selectedSupervisorReport && (
                <div className="space-y-6 p-4">
                  {/* Main Statistics */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">المؤشرات الرئيسية</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="stat-card bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-cyan-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">انضباط الطلاب</div>
                        <div className="text-3xl font-bold text-cyan-700">{selectedSupervisorReport.student_discipline}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">نظافة الفصول</div>
                        <div className="text-3xl font-bold text-blue-700">{selectedSupervisorReport.classroom_cleanliness}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">التزام المعلمين</div>
                        <div className="text-3xl font-bold text-purple-700">{selectedSupervisorReport.teacher_attendance_rate}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">السلوك العام</div>
                        <div className="text-3xl font-bold text-green-700">{selectedSupervisorReport.general_behavior}/10</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Teachers Info */}
                    {(selectedSupervisorReport.late_teachers?.length > 0 || selectedSupervisorReport.absent_teachers?.length > 0 || selectedSupervisorReport.covering_teachers?.length > 0) && (
                      <div className="space-y-3">
                        <h4 className="text-md font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">
                          بيانات المعلمين
                        </h4>
                        
                        {selectedSupervisorReport.late_teachers && selectedSupervisorReport.late_teachers.length > 0 && (
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-sm font-bold text-orange-800 mb-2">
                              المعلمون المتأخرون ({selectedSupervisorReport.late_teachers.length})
                            </div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {selectedSupervisorReport.late_teachers.map((lt, i) => (
                                <li key={i}>• <strong>{lt.teacher}</strong> - {lt.subject} - حصة {lt.period}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {selectedSupervisorReport.absent_teachers && selectedSupervisorReport.absent_teachers.length > 0 && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-sm font-bold text-red-800 mb-2">
                              المعلمون الغائبون ({selectedSupervisorReport.absent_teachers.length})
                            </div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {selectedSupervisorReport.absent_teachers.map((at, i) => (
                                <li key={i}>• <strong>{at.teacher}</strong> - {at.subject} - حصة {at.period}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {selectedSupervisorReport.covering_teachers && selectedSupervisorReport.covering_teachers.length > 0 && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-sm font-bold text-green-800 mb-2">
                              المعلمون المغطون ({selectedSupervisorReport.covering_teachers.length})
                            </div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {selectedSupervisorReport.covering_teachers.map((ct, i) => (
                                <li key={i}>• <strong>{ct.teacher}</strong> - {ct.subject} - حصة {ct.period}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Other Info */}
                    <div className="space-y-3">
                      <h4 className="text-md font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">
                        معلومات إضافية
                      </h4>
                      
                      {selectedSupervisorReport.incidents && selectedSupervisorReport.incidents.length > 0 && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-sm font-bold text-yellow-800 mb-2">
                            الحوادث والمخالفات ({selectedSupervisorReport.incidents.length})
                          </div>
                          <div className="space-y-2">
                            {selectedSupervisorReport.incidents.map((inc, i) => (
                              <div key={i} className="text-sm bg-white p-2 rounded">
                                <p className="font-semibold text-gray-800">{inc.description}</p>
                                <p className="text-gray-600 text-xs mt-1">الإجراء: {inc.action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedSupervisorReport.absent_students_count > 0 && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm font-bold text-blue-800">عدد الطلاب الغائبين</div>
                          <div className="text-2xl font-bold text-blue-600 mt-1">
                            {selectedSupervisorReport.absent_students_count} طالب
                          </div>
                        </div>
                      )}
                      
                      {selectedSupervisorReport.general_notes && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm font-bold text-gray-800 mb-2">ملاحظات عامة</div>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedSupervisorReport.general_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              تقاريري ({myReports.length})
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {myReports.map((report) => (
                <Card 
                  key={report.id}
                  className="report-card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedMyReport(report);
                    setShowMyReportModal(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">
                          تقرير من {new Date(report.week_start).toLocaleDateString("ar-SA")} 
                          إلى {new Date(report.week_end).toLocaleDateString("ar-SA")}
                        </h4>
                        <p className="text-sm text-gray-500">
                          عدد المشاكل: {report.problems.length} | عدد الاقتراحات: {report.suggestions.length}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMyReport(report);
                            setShowMyReportModal(true);
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

          {/* My Report Modal */}
          <Dialog open={showMyReportModal} onOpenChange={setShowMyReportModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedMyReport && (
                    `تقرير من ${new Date(selectedMyReport.week_start).toLocaleDateString("ar-SA")} 
                    إلى ${new Date(selectedMyReport.week_end).toLocaleDateString("ar-SA")}`
                  )}
                </DialogTitle>
              </DialogHeader>
              
              {selectedMyReport && (
                <div className="space-y-6 p-4">
                  {selectedMyReport.problems.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                        المشاكل ({selectedMyReport.problems.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedMyReport.problems.map((problem, i) => (
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
                  
                  {selectedMyReport.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                        الاقتراحات ({selectedMyReport.suggestions.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedMyReport.suggestions.map((suggestion, i) => (
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

      {/* Export Date Range Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">تصدير تقارير المشرفين إلى Excel</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 p-4">
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3">
              <p className="text-sm text-cyan-800 font-semibold">
                ✨ سيتم تصدير جميع التفاصيل الكاملة:
              </p>
              <ul className="text-xs text-cyan-700 mt-2 space-y-1 mr-4">
                <li>• أسماء جميع المعلمين (المتأخرين، الغائبين، المغطين)</li>
                <li>• تفاصيل الحوادث والإجراءات المتخذة</li>
                <li>• الصفوف المتابعة للتنقل</li>
                <li>• جميع الملاحظات والتقييمات</li>
                <li>• إحصائيات إجمالية في نهاية الملف</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">نوع التصدير</Label>
                <Select value={exportFilterType} onValueChange={setExportFilterType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع التقارير</SelectItem>
                    <SelectItem value="daily">اليوم فقط</SelectItem>
                    <SelectItem value="weekly">هذا الأسبوع (السبت - الأربعاء)</SelectItem>
                    <SelectItem value="monthly">هذا الشهر</SelectItem>
                    <SelectItem value="custom">نطاق مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {exportFilterType === "custom" && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm font-semibold text-gray-700">تحديد النطاق الزمني</p>
                  <div>
                    <Label className="text-sm">من تاريخ (اختياري)</Label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">إلى تاريخ (اختياري)</Label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent mt-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 يمكنك ترك أحد الحقلين فارغاً للتصدير من/إلى تاريخ معين
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>ملاحظة:</strong> سيتم دمج جميع البيانات في ملف Excel واحد شامل مع صفوف منفصلة لكل تقرير، وإحصائيات إجمالية في النهاية.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleExportWithDateRange}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <FileDown className="w-4 h-4 ml-2" />
                تصدير إلى Excel
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowExportDialog(false);
                  setExportStartDate("");
                  setExportEndDate("");
                  setExportFilterType("all");
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VicePrincipalDashboard;