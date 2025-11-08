import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { Plus, X, FileText, BarChart3, Eye } from "lucide-react";

const SupervisorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("create");
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [weekFilter, setWeekFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [viewMode, setViewMode] = useState("all"); // all, daily, weekly, monthly

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    student_discipline: 10,
    student_discipline_notes: "",
    classroom_cleanliness: 10,
    classroom_cleanliness_notes: "",
    teacher_attendance_rate: 10,
    late_teachers: [],
    teacher_attendance_notes: "",
    student_movement: "",
    student_movement_classes: [],
    student_movement_notes: "",
    general_behavior: 10,
    general_notes: "",
    incidents: [],
    covering_teachers: [],
    absent_students_count: ""
  });
  
  const [editingReport, setEditingReport] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterReports();
  }, [dateFilter, weekFilter, monthFilter, viewMode, allReports]);

  const fetchData = async () => {
    try {
      const [teachersRes, subjectsRes, classroomsRes, reportsRes] = await Promise.all([
        axios.get(`${API}/teachers?branch=${user.branch}`),
        axios.get(`${API}/subjects`),
        axios.get(`${API}/classrooms?branch=${user.branch}`),
        axios.get(`${API}/reports/supervisor`)
      ]);
      setTeachers(teachersRes.data);
      setSubjects(subjectsRes.data);
      setClassrooms(classroomsRes.data);
      setAllReports(reportsRes.data);
      setReports(reportsRes.data);
    } catch (error) {
      toast.error("فشل تحميل البيانات");
    }
  };

  const filterReports = () => {
    let filtered = [...allReports];

    if (viewMode === "daily" && dateFilter) {
      filtered = filtered.filter(r => r.date === dateFilter);
    }

    if (viewMode === "weekly" && weekFilter) {
      const weekStart = new Date(weekFilter);
      const weekEnd = new Date(weekFilter);
      weekEnd.setDate(weekEnd.getDate() + 4); // 5 days (Sat-Wed)
      
      filtered = filtered.filter(r => {
        const reportDate = new Date(r.date);
        return reportDate >= weekStart && reportDate <= weekEnd;
      });
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

  const getWeeklyAverage = () => {
    if (reports.length === 0) return null;
    
    const totals = reports.reduce((acc, report) => ({
      discipline: acc.discipline + report.student_discipline,
      cleanliness: acc.cleanliness + report.classroom_cleanliness,
      attendance: acc.attendance + report.teacher_attendance_rate,
      behavior: acc.behavior + report.general_behavior
    }), { discipline: 0, cleanliness: 0, attendance: 0, behavior: 0 });

    return {
      discipline: (totals.discipline / reports.length).toFixed(1),
      cleanliness: (totals.cleanliness / reports.length).toFixed(1),
      attendance: (totals.attendance / reports.length).toFixed(1),
      behavior: (totals.behavior / reports.length).toFixed(1)
    };
  };

  const addLateTeacher = () => {
    setFormData({
      ...formData,
      late_teachers: [...formData.late_teachers, { subject: "", teacher: "", period: "" }]
    });
  };

  const removeLateTeacher = (index) => {
    const updated = formData.late_teachers.filter((_, i) => i !== index);
    setFormData({ ...formData, late_teachers: updated });
  };

  const updateLateTeacher = (index, field, value) => {
    const updated = [...formData.late_teachers];
    updated[index][field] = value;
    setFormData({ ...formData, late_teachers: updated });
  };

  const addIncident = () => {
    setFormData({
      ...formData,
      incidents: [...formData.incidents, { description: "", action: "" }]
    });
  };

  const removeIncident = (index) => {
    const updated = formData.incidents.filter((_, i) => i !== index);
    setFormData({ ...formData, incidents: updated });
  };

  const updateIncident = (index, field, value) => {
    const updated = [...formData.incidents];
    updated[index][field] = value;
    setFormData({ ...formData, incidents: updated });
  };

  const addCoveringTeacher = () => {
    setFormData({
      ...formData,
      covering_teachers: [...formData.covering_teachers, { subject: "", teacher: "", period: "" }]
    });
  };

  const removeCoveringTeacher = (index) => {
    const updated = formData.covering_teachers.filter((_, i) => i !== index);
    setFormData({ ...formData, covering_teachers: updated });
  };

  const updateCoveringTeacher = (index, field, value) => {
    const updated = [...formData.covering_teachers];
    updated[index][field] = value;
    setFormData({ ...formData, covering_teachers: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingReport) {
        // Update existing report
        await axios.put(`${API}/reports/supervisor/${editingReport.id}`, formData);
        toast.success("تم تحديث التقرير بنجاح");
        setEditingReport(null);
      } else {
        // Create new report
        await axios.post(`${API}/reports/supervisor`, formData);
        toast.success("تم إنشاء التقرير بنجاح");
      }
      fetchData();
      setActiveTab("reports");
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        student_discipline: 10,
        student_discipline_notes: "",
        classroom_cleanliness: 10,
        classroom_cleanliness_notes: "",
        teacher_attendance_rate: 10,
        late_teachers: [],
        teacher_attendance_notes: "",
        student_movement: "",
        student_movement_classes: [],
        student_movement_notes: "",
        general_behavior: 10,
        general_notes: "",
        incidents: [],
        covering_teachers: [],
        absent_students_count: 0
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل إنشاء التقرير");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setFormData({
      date: report.date,
      student_discipline: report.student_discipline,
      student_discipline_notes: report.student_discipline_notes || "",
      classroom_cleanliness: report.classroom_cleanliness,
      classroom_cleanliness_notes: report.classroom_cleanliness_notes || "",
      teacher_attendance_rate: report.teacher_attendance_rate,
      late_teachers: report.late_teachers || [],
      teacher_attendance_notes: report.teacher_attendance_notes || "",
      student_movement: report.student_movement || "",
      student_movement_classes: report.student_movement_classes || [],
      student_movement_notes: report.student_movement_notes || "",
      general_behavior: report.general_behavior,
      general_notes: report.general_notes || "",
      incidents: report.incidents || [],
      covering_teachers: report.covering_teachers || [],
      absent_students_count: report.absent_students_count || 0
    });
    setActiveTab("create");
  };

  const handleDelete = async (reportId) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التقرير؟")) {
      try {
        await axios.delete(`${API}/reports/supervisor/${reportId}`);
        toast.success("تم حذف التقرير بنجاح");
        fetchData();
      } catch (error) {
        toast.error("فشل حذف التقرير");
      }
    }
  };

  const getChartData = () => {
    return reports.slice(0, 7).reverse().map(report => ({
      date: new Date(report.date).toLocaleDateString("ar-SA"),
      انضباط_الطلاب: report.student_discipline,
      نظافة_الفصول: report.classroom_cleanliness,
      التزام_المعلمين: report.teacher_attendance_rate,
      السلوك_العام: report.general_behavior
    }));
  };

  return (
    <DashboardLayout title="لوحة تحكم المشرف">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="create" data-testid="create-report-tab" className="flex items-center space-x-2 space-x-reverse">
            <FileText className="w-4 h-4" />
            <span>إنشاء تقرير جديد</span>
          </TabsTrigger>
          <TabsTrigger value="reports" data-testid="reports-tab" className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="w-4 h-4" />
            <span>التقارير والإحصائيات</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Selection */}
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
                  data-testid="report-date-input"
                />
              </CardContent>
            </Card>

            {/* Student Discipline */}
            <Card>
              <CardHeader>
                <CardTitle>انضباط الطلاب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>النسبة من 10</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.student_discipline}
                    onChange={(e) => setFormData({ ...formData, student_discipline: parseInt(e.target.value) })}
                    data-testid="student-discipline-input"
                  />
                </div>
                <div>
                  <Label>ملاحظات (اختياري)</Label>
                  <Textarea
                    value={formData.student_discipline_notes}
                    onChange={(e) => setFormData({ ...formData, student_discipline_notes: e.target.value })}
                    placeholder="أضف ملاحظات إن وجدت"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Classroom Cleanliness */}
            <Card>
              <CardHeader>
                <CardTitle>نظافة الفصول والممرات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>النسبة من 10</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.classroom_cleanliness}
                    onChange={(e) => setFormData({ ...formData, classroom_cleanliness: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>ملاحظات (اختياري)</Label>
                  <Textarea
                    value={formData.classroom_cleanliness_notes}
                    onChange={(e) => setFormData({ ...formData, classroom_cleanliness_notes: e.target.value })}
                    placeholder="أضف ملاحظات إن وجدت"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Teacher Attendance */}
            <Card>
              <CardHeader>
                <CardTitle>التزام المعلمين بدخول الحصص</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>النسبة من 10</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.teacher_attendance_rate}
                    onChange={(e) => setFormData({ ...formData, teacher_attendance_rate: parseInt(e.target.value) })}
                  />
                </div>
                
                <div>
                  <Label className="mb-2 block">المعلمون المتأخرون</Label>
                  {formData.late_teachers.map((lt, index) => (
                    <div key={`late-teacher-${index}-${lt.teacher}-${lt.subject}`} className="flex gap-2 mb-2">
                      <Select 
                        value={lt.subject} 
                        onValueChange={(value) => updateLateTeacher(index, "subject", value)}
                        key={`subject-select-${index}`}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المادة" />
                        </SelectTrigger>
                        <SelectContent key={`subject-content-${index}`}>
                          {subjects.map(subject => (
                            <SelectItem key={`subject-${subject.id}-${index}`} value={subject.name}>{subject.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select 
                        value={lt.teacher} 
                        onValueChange={(value) => updateLateTeacher(index, "teacher", value)}
                        key={`teacher-select-${index}`}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المعلم" />
                        </SelectTrigger>
                        <SelectContent key={`teacher-content-${index}`}>
                          {teachers.filter(t => t.subject === lt.subject).map(teacher => (
                            <SelectItem key={`teacher-${teacher.id}-${index}`} value={teacher.name}>{teacher.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        key={`period-input-${index}`}
                        placeholder="رقم الحصة"
                        value={lt.period}
                        onChange={(e) => updateLateTeacher(index, "period", e.target.value)}
                      />
                      <Button type="button" variant="destructive" size="icon" onClick={() => removeLateTeacher(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addLateTeacher} className="w-full">
                    <Plus className="w-4 h-4 ml-2" /> إضافة معلم متأخر
                  </Button>
                </div>

                <div>
                  <Label>ملاحظات (اختياري)</Label>
                  <Textarea
                    value={formData.teacher_attendance_notes}
                    onChange={(e) => setFormData({ ...formData, teacher_attendance_notes: e.target.value })}
                    placeholder="أضف ملاحظات إن وجدت"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Student Movement */}
            <Card>
              <CardHeader>
                <CardTitle>خروج وتنقل الطلاب بين الحصص</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>اختر الصفوف</Label>
                  <Select onValueChange={(value) => {
                    if (!formData.student_movement_classes.includes(value)) {
                      setFormData({
                        ...formData,
                        student_movement_classes: [...formData.student_movement_classes, value]
                      });
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر صف" />
                    </SelectTrigger>
                    <SelectContent>
                      {classrooms.map(classroom => (
                        <SelectItem key={classroom.id} value={`${classroom.name} - ${classroom.section}`}>
                          {classroom.name} - {classroom.section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.student_movement_classes.map((cls, index) => (
                      <div key={index} className="bg-cyan-100 px-3 py-1 rounded-full flex items-center space-x-2 space-x-reverse">
                        <span className="text-sm">{cls}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              student_movement_classes: formData.student_movement_classes.filter((_, i) => i !== index)
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>ملاحظات (اختياري)</Label>
                  <Textarea
                    value={formData.student_movement_notes}
                    onChange={(e) => setFormData({ ...formData, student_movement_notes: e.target.value })}
                    placeholder="أضف ملاحظات إن وجدت"
                  />
                </div>
              </CardContent>
            </Card>

            {/* General Behavior */}
            <Card>
              <CardHeader>
                <CardTitle>السلوك العام</CardTitle>
              </CardHeader>
              <CardContent>
                <Label>النسبة من 10</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.general_behavior}
                  onChange={(e) => setFormData({ ...formData, general_behavior: parseInt(e.target.value) })}
                />
              </CardContent>
            </Card>

            {/* General Notes */}
            <Card>
              <CardHeader>
                <CardTitle>ملاحظات عامة</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.general_notes}
                  onChange={(e) => setFormData({ ...formData, general_notes: e.target.value })}
                  placeholder="أضف ملاحظات عامة إن وجدت"
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Incidents */}
            <Card>
              <CardHeader>
                <CardTitle>حوادث ومخالفات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.incidents.map((incident, index) => (
                  <div key={`incident-${index}-${incident.description?.substring(0,10)}`} className="border p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>الحادثة أو المخالفة {index + 1}</Label>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeIncident(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      key={`incident-desc-${index}`}
                      placeholder="وصف الحادثة أو المخالفة"
                      value={incident.description}
                      onChange={(e) => updateIncident(index, "description", e.target.value)}
                    />
                    <Textarea
                      key={`incident-action-${index}`}
                      placeholder="الإجراء المتخذ"
                      value={incident.action}
                      onChange={(e) => updateIncident(index, "action", e.target.value)}
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addIncident} className="w-full">
                  <Plus className="w-4 h-4 ml-2" /> إضافة حادثة
                </Button>
              </CardContent>
            </Card>

            {/* Covering Teachers */}
            <Card>
              <CardHeader>
                <CardTitle>المعلمون الذين غطوا الحصص</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.covering_teachers.map((ct, index) => (
                  <div key={`covering-teacher-${index}-${ct.teacher}-${ct.subject}`} className="flex gap-2 mb-2">
                    <Select 
                      value={ct.subject} 
                      onValueChange={(value) => updateCoveringTeacher(index, "subject", value)}
                      key={`cover-subject-select-${index}`}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent key={`cover-subject-content-${index}`}>
                        {subjects.map(subject => (
                          <SelectItem key={`cover-subject-${subject.id}-${index}`} value={subject.name}>{subject.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select 
                      value={ct.teacher} 
                      onValueChange={(value) => updateCoveringTeacher(index, "teacher", value)}
                      key={`cover-teacher-select-${index}`}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المعلم" />
                      </SelectTrigger>
                      <SelectContent key={`cover-teacher-content-${index}`}>
                        {teachers.filter(t => t.subject === ct.subject).map(teacher => (
                          <SelectItem key={`cover-teacher-${teacher.id}-${index}`} value={teacher.name}>{teacher.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      key={`cover-period-input-${index}`}
                      placeholder="رقم الحصة"
                      value={ct.period}
                      onChange={(e) => updateCoveringTeacher(index, "period", e.target.value)}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeCoveringTeacher(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addCoveringTeacher} className="w-full mt-2">
                  <Plus className="w-4 h-4 ml-2" /> إضافة معلم مغطي
                </Button>
              </CardContent>
            </Card>

            {/* Absent Students Count */}
            <Card>
              <CardHeader>
                <CardTitle>عدد الطلاب الغائبين</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  placeholder="أدخل عدد الطلاب الغائبين"
                  value={formData.absent_students_count}
                  onChange={(e) => setFormData({ ...formData, absent_students_count: e.target.value === "" ? "" : parseInt(e.target.value) || "" })}
                  data-testid="absent-students-input"
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={loading}
              data-testid="submit-report-button"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3"
            >
              {loading ? "جاري الإرسال..." : editingReport ? "تحديث التقرير" : "إرسال التقرير"}
            </Button>
            
            {editingReport && (
              <Button
                type="button"
                onClick={() => {
                  setEditingReport(null);
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    student_discipline: 10,
                    student_discipline_notes: "",
                    classroom_cleanliness: 10,
                    classroom_cleanliness_notes: "",
                    teacher_attendance_rate: 10,
                    late_teachers: [],
                    teacher_attendance_notes: "",
                    student_movement: "",
                    student_movement_classes: [],
                    student_movement_notes: "",
                    general_behavior: 10,
                    general_notes: "",
                    incidents: [],
                    absent_teachers: [],
                    covering_teachers: [],
                    absent_students_count: 0
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
                        <SelectItem value="weekly">أسبوعي</SelectItem>
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
                  
                  {viewMode === "weekly" && (
                    <div>
                      <Label>بداية الأسبوع (السبت)</Label>
                      <Input
                        type="date"
                        value={weekFilter}
                        onChange={(e) => setWeekFilter(e.target.value)}
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
                        setWeekFilter("");
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

            {/* Weekly Average */}
            {viewMode === "weekly" && reports.length > 0 && (
              <Card className="bg-gradient-to-r from-cyan-50 to-blue-50">
                <CardHeader>
                  <CardTitle>المتوسط الأسبوعي</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getWeeklyAverage() && (
                      <>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">انضباط الطلاب</div>
                          <div className="text-3xl font-bold text-cyan-600">{getWeeklyAverage().discipline}/10</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">نظافة الفصول</div>
                          <div className="text-3xl font-bold text-cyan-600">{getWeeklyAverage().cleanliness}/10</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">التزام المعلمين</div>
                          <div className="text-3xl font-bold text-cyan-600">{getWeeklyAverage().attendance}/10</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">السلوك العام</div>
                          <div className="text-3xl font-bold text-cyan-600">{getWeeklyAverage().behavior}/10</div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chart */}
            {reports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>الإحصائيات</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="انضباط_الطلاب" fill="#0891b2" />
                      <Bar dataKey="نظافة_الفصول" fill="#06b6d4" />
                      <Bar dataKey="التزام_المعلمين" fill="#22d3ee" />
                      <Bar dataKey="السلوك_العام" fill="#67e8f9" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Reports List */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-800">
                التقارير ({reports.length})
              </h3>

            {/* Reports List - Compact View */}
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
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800">
                                تقرير {new Date(report.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </h4>
                              <p className="text-sm text-gray-500">
                                تم الإنشاء: {new Date(report.created_at).toLocaleString("ar-SA")}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
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

            {/* Report Detail Modal */}
            <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    {selectedReport && `تقرير ${new Date(selectedReport.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                  </DialogTitle>
                </DialogHeader>
                
                {selectedReport && (
                  <div className="space-y-6 p-4">
                    {/* Main Statistics */}
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 ml-2 text-cyan-600" />
                        المؤشرات الرئيسية
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="stat-card bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-cyan-500">
                          <div className="text-sm text-gray-700 mb-1 font-semibold">انضباط الطلاب</div>
                          <div className="text-3xl font-bold text-cyan-700">{selectedReport.student_discipline}/10</div>
                          {selectedReport.student_discipline_notes && (
                            <div className="text-xs text-gray-600 mt-1">{selectedReport.student_discipline_notes}</div>
                          )}
                        </div>
                        <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                          <div className="text-sm text-gray-700 mb-1 font-semibold">نظافة الفصول</div>
                          <div className="text-3xl font-bold text-blue-700">{selectedReport.classroom_cleanliness}/10</div>
                          {selectedReport.classroom_cleanliness_notes && (
                            <div className="text-xs text-gray-600 mt-1">{selectedReport.classroom_cleanliness_notes}</div>
                          )}
                        </div>
                        <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                          <div className="text-sm text-gray-700 mb-1 font-semibold">التزام المعلمين</div>
                          <div className="text-3xl font-bold text-purple-700">{selectedReport.teacher_attendance_rate}/10</div>
                          {selectedReport.teacher_attendance_notes && (
                            <div className="text-xs text-gray-600 mt-1">{selectedReport.teacher_attendance_notes}</div>
                          )}
                        </div>
                        <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                          <div className="text-sm text-gray-700 mb-1 font-semibold">السلوك العام</div>
                          <div className="text-3xl font-bold text-green-700">{selectedReport.general_behavior}/10</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Detailed Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Teachers Info */}
                      {(selectedReport.late_teachers?.length > 0 || selectedReport.covering_teachers?.length > 0) && (
                        <div className="space-y-3">
                          <h4 className="text-md font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">
                            بيانات المعلمين
                          </h4>
                          
                          {selectedReport.late_teachers && selectedReport.late_teachers.length > 0 && (
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="text-sm font-bold text-orange-800 mb-2 flex items-center">
                                <span className="w-2 h-2 bg-orange-500 rounded-full ml-2"></span>
                                المعلمون المتأخرون ({selectedReport.late_teachers.length})
                              </div>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {selectedReport.late_teachers.map((lt, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="text-orange-600 ml-2">•</span>
                                    <span><strong>{lt.teacher}</strong> - {lt.subject} - حصة {lt.period}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {selectedReport.covering_teachers && selectedReport.covering_teachers.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="text-sm font-bold text-green-800 mb-2 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full ml-2"></span>
                                المعلمون المغطون ({selectedReport.covering_teachers.length})
                              </div>
                              <ul className="text-sm text-gray-700 space-y-1">
                                {selectedReport.covering_teachers.map((ct, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="text-green-600 ml-2">•</span>
                                    <span><strong>{ct.teacher}</strong> - {ct.subject} - حصة {ct.period}</span>
                                  </li>
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
                        
                        {selectedReport.incidents && selectedReport.incidents.length > 0 && (
                          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="text-sm font-bold text-yellow-800 mb-2 flex items-center">
                              <span className="w-2 h-2 bg-yellow-500 rounded-full ml-2"></span>
                              الحوادث والمخالفات ({selectedReport.incidents.length})
                            </div>
                            <div className="space-y-2">
                              {selectedReport.incidents.map((inc, i) => (
                                <div key={i} className="text-sm bg-white p-2 rounded">
                                  <p className="font-semibold text-gray-800">{inc.description}</p>
                                  <p className="text-gray-600 text-xs mt-1">
                                    <span className="font-semibold">الإجراء:</span> {inc.action}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {selectedReport.student_movement_classes && selectedReport.student_movement_classes.length > 0 && (
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="text-sm font-bold text-purple-800 mb-2">
                              الصفوف المتابعة للتنقل
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedReport.student_movement_classes.map((cls, i) => (
                                <span key={i} className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                                  {cls}
                                </span>
                              ))}
                            </div>
                            {selectedReport.student_movement_notes && (
                              <p className="text-xs text-gray-600 mt-2">{selectedReport.student_movement_notes}</p>
                            )}
                          </div>
                        )}
                        
                        {selectedReport.absent_students_count > 0 && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm font-bold text-blue-800">
                              عدد الطلاب الغائبين
                            </div>
                            <div className="text-2xl font-bold text-blue-600 mt-1">
                              {selectedReport.absent_students_count} طالب
                            </div>
                          </div>
                        )}
                        
                        {selectedReport.general_notes && (
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-sm font-bold text-gray-800 mb-2">
                              ملاحظات عامة
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{selectedReport.general_notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SupervisorDashboard;
