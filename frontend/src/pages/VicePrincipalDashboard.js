import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { Plus, X, FileDown, Eye } from "lucide-react";
import * as XLSX from 'xlsx';

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

  // Export to Excel
  const exportToExcel = () => {
    if (supervisorReports.length === 0) {
      toast.error("لا توجد تقارير للتصدير");
      return;
    }

    // Prepare data for Excel
    const excelData = supervisorReports.map(report => ({
      'التاريخ': new Date(report.date).toLocaleDateString('ar-SA'),
      'انضباط الطلاب': `${report.student_discipline}/10`,
      'نظافة الفصول': `${report.classroom_cleanliness}/10`,
      'التزام المعلمين': `${report.teacher_attendance_rate}/10`,
      'السلوك العام': `${report.general_behavior}/10`,
      'عدد الطلاب الغائبين': report.absent_students_count || 0,
      'عدد المعلمين المتأخرين': report.late_teachers?.length || 0,
      'عدد المعلمين الغائبين': report.absent_teachers?.length || 0,
      'عدد المعلمين المغطين': report.covering_teachers?.length || 0,
      'عدد الحوادث': report.incidents?.length || 0,
      'الملاحظات العامة': report.general_notes || '-'
    }));

    // Add summary row
    const stats = getMergedStatistics();
    if (stats) {
      excelData.push({
        'التاريخ': 'المتوسط العام',
        'انضباط الطلاب': `${stats.averages.discipline}/10`,
        'نظافة الفصول': `${stats.averages.cleanliness}/10`,
        'التزام المعلمين': `${stats.averages.attendance}/10`,
        'السلوك العام': `${stats.averages.behavior}/10`,
        'عدد الطلاب الغائبين': stats.totals.absentStudents,
        'عدد المعلمين المتأخرين': stats.totals.lateTeachers,
        'عدد المعلمين الغائبين': stats.totals.absentTeachers,
        'عدد المعلمين المغطين': stats.totals.coveringTeachers,
        'عدد الحوادث': stats.totals.incidents,
        'الملاحظات العامة': `إجمالي ${stats.totals.reports} تقرير`
      });
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // التاريخ
      { wch: 15 }, // انضباط الطلاب
      { wch: 15 }, // نظافة الفصول
      { wch: 15 }, // التزام المعلمين
      { wch: 15 }, // السلوك العام
      { wch: 20 }, // عدد الطلاب الغائبين
      { wch: 20 }, // عدد المعلمين المتأخرين
      { wch: 20 }, // عدد المعلمين الغائبين
      { wch: 20 }, // عدد المعلمين المغطين
      { wch: 15 }, // عدد الحوادث
      { wch: 30 }  // الملاحظات العامة
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقارير المشرفين');

    // Generate filename with date
    const today = new Date().toLocaleDateString('ar-SA').replace(/\//g, '-');
    const filename = `تقارير_المشرفين_${today}.xlsx`;

    // Download
    XLSX.writeFile(workbook, filename);
    toast.success("تم تصدير التقارير بنجاح");
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
                    <Button
                      onClick={exportToExcel}
                      variant="secondary"
                      className="bg-white text-cyan-700 hover:bg-cyan-50"
                    >
                      <FileDown className="w-4 h-4 ml-2" />
                      تصدير إلى Excel
                    </Button>
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
              <Button onClick={exportToExcel} variant="outline">
                <FileDown className="w-4 h-4 ml-2" />
                تصدير الكل
              </Button>
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
            {myReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      تقرير من {new Date(report.week_start).toLocaleDateString("ar-SA")} 
                      إلى {new Date(report.week_end).toLocaleDateString("ar-SA")}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(report)}>
                        تعديل
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(report.id)}>
                        حذف
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {report.problems.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">المشاكل:</h4>
                        {report.problems.map((problem, i) => (
                          <div key={i} className="bg-gray-50 p-3 rounded-lg mb-2">
                            <p className="font-medium">{problem.description}</p>
                            <p className="text-sm text-gray-600 mt-1">الإجراءات: {problem.actions}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {report.suggestions.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">الاقتراحات:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {report.suggestions.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default VicePrincipalDashboard;