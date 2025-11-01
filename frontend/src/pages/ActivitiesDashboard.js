import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Plus, X, Eye, FileText } from "lucide-react";

const ActivitiesDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("create");
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [teachers, setTeachers] = useState([]); // New: teachers list
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  // Filters
  const [viewMode, setViewMode] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  
  // Merged reports filters
  const [mergedPeriod, setMergedPeriod] = useState("weekly"); // weekly or monthly
  const [mergedStartDate, setMergedStartDate] = useState("");
  const [mergedEndDate, setMergedEndDate] = useState("");

  const [activities, setActivities] = useState([{
    name: "",
    date: "",
    target_group: "",
    type: "",
    supervisors: [], // Changed from supervisor to supervisors (array)
    participants_count: 0,
    interaction_rate: 0,
    cooperating_teachers: [], // Changed from teacher_cooperation to cooperating_teachers (array)
    admin_cooperation: "",
    educational_impact: "",
    problems: "",
    recommendations: ""
  }]);

  useEffect(() => {
    fetchReports();
    fetchTeachers();
  }, []);

  useEffect(() => {
    filterReports();
  }, [viewMode, dateFilter, monthFilter, allReports]);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get(`${API}/teachers`);
      // Filter by branch if user has branch
      const branchTeachers = user.branch ? res.data.filter(t => t.branch === user.branch) : res.data;
      setTeachers(branchTeachers);
    } catch (error) {
      console.error("Failed to load teachers:", error);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API}/reports/activities`);
      setAllReports(res.data);
      setReports(res.data);
    } catch (error) {
      toast.error("فشل تحميل التقارير");
    }
  };

  const filterReports = () => {
    let filtered = [...allReports];

    if (viewMode === "daily" && dateFilter) {
      filtered = filtered.filter(report => 
        report.activities.some(activity => activity.date === dateFilter)
      );
    }

    if (viewMode === "monthly" && monthFilter) {
      const [year, month] = monthFilter.split('-');
      filtered = filtered.filter(report => {
        return report.activities.some(activity => {
          const activityDate = new Date(activity.date);
          return activityDate.getFullYear() === parseInt(year) && 
                 activityDate.getMonth() === parseInt(month) - 1;
        });
      });
    }

    setReports(filtered);
  };

  const addActivity = () => {
    setActivities([...activities, {
      name: "",
      date: "",
      target_group: "",
      type: "",
      supervisors: [],
      participants_count: 0,
      interaction_rate: 0,
      cooperating_teachers: [],
      admin_cooperation: "",
      educational_impact: "",
      problems: "",
      recommendations: ""
    }]);
  };

  const removeActivity = (index) => {
    const updated = activities.filter((_, i) => i !== index);
    setActivities(updated);
  };

  const updateActivity = (index, field, value) => {
    const updated = [...activities];
    updated[index][field] = value;
    setActivities(updated);
  };

  // Add supervisor to activity
  const addSupervisor = (activityIndex, teacherId) => {
    if (!teacherId) return;
    const updated = [...activities];
    if (!updated[activityIndex].supervisors.includes(teacherId)) {
      updated[activityIndex].supervisors = [...updated[activityIndex].supervisors, teacherId];
      setActivities(updated);
    }
  };

  // Remove supervisor from activity
  const removeSupervisor = (activityIndex, teacherId) => {
    const updated = [...activities];
    updated[activityIndex].supervisors = updated[activityIndex].supervisors.filter(id => id !== teacherId);
    setActivities(updated);
  };

  // Add cooperating teacher to activity
  const addCooperatingTeacher = (activityIndex, teacherId) => {
    if (!teacherId) return;
    const updated = [...activities];
    if (!updated[activityIndex].cooperating_teachers.includes(teacherId)) {
      updated[activityIndex].cooperating_teachers = [...updated[activityIndex].cooperating_teachers, teacherId];
      setActivities(updated);
    }
  };

  // Remove cooperating teacher from activity
  const removeCooperatingTeacher = (activityIndex, teacherId) => {
    const updated = [...activities];
    updated[activityIndex].cooperating_teachers = updated[activityIndex].cooperating_teachers.filter(id => id !== teacherId);
    setActivities(updated);
  };

  // Get teacher name by ID
  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : teacherId;
  };

  // Get merged reports based on period
  const getMergedReports = () => {
    let filtered = [...allReports];
    const today = new Date();

    if (mergedPeriod === "weekly") {
      // Current week (Saturday to Wednesday)
      const currentDay = today.getDay();
      const daysFromSaturday = currentDay === 6 ? 0 : currentDay + 1;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromSaturday);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4); // 5 days (Sat-Wed)
      weekEnd.setHours(23, 59, 59, 999);
      
      filtered = allReports.filter(report => {
        return report.activities.some(activity => {
          const activityDate = new Date(activity.date);
          return activityDate >= weekStart && activityDate <= weekEnd;
        });
      });
    } else if (mergedPeriod === "monthly") {
      // Current month
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      filtered = allReports.filter(report => {
        return report.activities.some(activity => {
          const activityDate = new Date(activity.date);
          return activityDate.getMonth() === currentMonth && 
                 activityDate.getFullYear() === currentYear;
        });
      });
    } else if (mergedPeriod === "custom" && mergedStartDate && mergedEndDate) {
      // Custom date range
      const startDate = new Date(mergedStartDate);
      const endDate = new Date(mergedEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = allReports.filter(report => {
        return report.activities.some(activity => {
          const activityDate = new Date(activity.date);
          return activityDate >= startDate && activityDate <= endDate;
        });
      });
    }

    return filtered;
  };

  // Get merged statistics
  const getMergedStatistics = () => {
    const mergedReports = getMergedReports();
    const allActivities = mergedReports.flatMap(r => r.activities);
    
    const totalActivities = allActivities.length;
    const totalParticipants = allActivities.reduce((sum, a) => sum + (a.participants_count || 0), 0);
    const avgInteraction = totalActivities > 0 ? 
      (allActivities.reduce((sum, a) => sum + (a.interaction_rate || 0), 0) / totalActivities).toFixed(1) : 0;
    
    // Count by type
    const typeCount = {};
    allActivities.forEach(a => {
      if (a.type) {
        typeCount[a.type] = (typeCount[a.type] || 0) + 1;
      }
    });
    
    return {
      totalActivities,
      totalParticipants,
      avgInteraction,
      typeCount,
      totalReports: mergedReports.length
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingReport) {
        await axios.put(`${API}/reports/activities/${editingReport.id}`, {
          activities: activities
        });
        toast.success("تم تحديث التقرير بنجاح");
        setEditingReport(null);
      } else {
        await axios.post(`${API}/reports/activities`, {
          activities: activities
        });
        toast.success("تم إنشاء التقرير بنجاح");
      }
      fetchReports();
      setActiveTab("reports");
      setActivities([{
        name: "",
        date: "",
        target_group: "",
        type: "",
        supervisors: [],
        participants_count: 0,
        interaction_rate: 0,
        cooperating_teachers: [],
        admin_cooperation: "",
        educational_impact: "",
        problems: "",
        recommendations: ""
      }]);
    } catch (error) {
      toast.error("فشل إنشاء التقرير");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setActivities(report.activities || [{
      name: "",
      date: "",
      target_group: "",
      type: "",
      supervisors: [],
      participants_count: 0,
      interaction_rate: 0,
      cooperating_teachers: [],
      admin_cooperation: "",
      educational_impact: "",
      problems: "",
      recommendations: ""
    }]);
    setActiveTab("create");
  };

  const handleDelete = async (reportId) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التقرير؟")) {
      try {
        await axios.delete(`${API}/reports/activities/${reportId}`);
        toast.success("تم حذف التقرير بنجاح");
        fetchReports();
      } catch (error) {
        toast.error("فشل حذف التقرير");
      }
    }
  };

  return (
    <DashboardLayout title="لوحة تحكم الأنشطة">
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
          <TabsTrigger value="merged" className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="w-4 h-4" />
            <span>التقارير المدمجة</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <form onSubmit={handleSubmit} className="space-y-6">
            {activities.map((activity, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>نشاط {index + 1}</CardTitle>
                    {activities.length > 1 && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeActivity(index)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>اسم النشاط *</Label>
                      <Input
                        value={activity.name}
                        onChange={(e) => updateActivity(index, "name", e.target.value)}
                        required
                        placeholder="مثال: يوم رياضي"
                      />
                    </div>
                    <div>
                      <Label>التاريخ *</Label>
                      <Input
                        type="date"
                        value={activity.date}
                        onChange={(e) => updateActivity(index, "date", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>الفئة المستهدفة *</Label>
                      <Input
                        value={activity.target_group}
                        onChange={(e) => updateActivity(index, "target_group", e.target.value)}
                        required
                        placeholder="مثال: طلاب المرحلة الابتدائية"
                      />
                    </div>
                    <div>
                      <Label>نوع النشاط *</Label>
                      <Select value={activity.type} onValueChange={(value) => updateActivity(index, "type", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع النشاط" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="رياضي">رياضي</SelectItem>
                          <SelectItem value="ثقافي">ثقافي</SelectItem>
                          <SelectItem value="اجتماعي">اجتماعي</SelectItem>
                          <SelectItem value="فني">فني</SelectItem>
                          <SelectItem value="علمي">علمي</SelectItem>
                          <SelectItem value="ديني">ديني</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>المشرفون على النشاط *</Label>
                    <div className="space-y-2">
                      <Select onValueChange={(value) => addSupervisor(index, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر معلم للإضافة" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} - {teacher.subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {activity.supervisors && activity.supervisors.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {activity.supervisors.map(teacherId => (
                            <div 
                              key={teacherId} 
                              className="flex items-center gap-1 bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{getTeacherName(teacherId)}</span>
                              <button
                                type="button"
                                onClick={() => removeSupervisor(index, teacherId)}
                                className="text-cyan-600 hover:text-cyan-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>عدد المشاركين *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={activity.participants_count}
                        onChange={(e) => updateActivity(index, "participants_count", parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label>معدل التفاعل (من 10) *</Label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={activity.interaction_rate}
                        onChange={(e) => updateActivity(index, "interaction_rate", parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>المعلمون المتعاونون</Label>
                    <div className="space-y-2">
                      <Select onValueChange={(value) => addCooperatingTeacher(index, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر معلم للإضافة" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.name} - {teacher.subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {activity.cooperating_teachers && activity.cooperating_teachers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {activity.cooperating_teachers.map(teacherId => (
                            <div 
                              key={teacherId} 
                              className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                            >
                              <span>{getTeacherName(teacherId)}</span>
                              <button
                                type="button"
                                onClick={() => removeCooperatingTeacher(index, teacherId)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>تعاون الإدارة</Label>
                    <Textarea
                      value={activity.admin_cooperation}
                      onChange={(e) => updateActivity(index, "admin_cooperation", e.target.value)}
                      placeholder="وصف تعاون الإدارة"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>الأثر التربوي</Label>
                    <Textarea
                      value={activity.educational_impact}
                      onChange={(e) => updateActivity(index, "educational_impact", e.target.value)}
                      placeholder="وصف الأثر التربوي للنشاط"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>المشاكل</Label>
                      <Textarea
                        value={activity.problems}
                        onChange={(e) => updateActivity(index, "problems", e.target.value)}
                        placeholder="المشاكل التي واجهت النشاط"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>التوصيات</Label>
                      <Textarea
                        value={activity.recommendations}
                        onChange={(e) => updateActivity(index, "recommendations", e.target.value)}
                        placeholder="التوصيات لتحسين الأنشطة"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={addActivity} className="w-full">
              <Plus className="w-4 h-4 ml-2" /> إضافة نشاط آخر
            </Button>

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600">
              {loading ? "جاري الإرسال..." : editingReport ? "تحديث التقرير" : "إرسال التقرير"}
            </Button>

            {editingReport && (
              <Button
                type="button"
                onClick={() => {
                  setEditingReport(null);
                  setActivities([{
                    name: "",
                    date: "",
                    target_group: "",
                    type: "",
                    supervisors: [],
                    participants_count: 0,
                    interaction_rate: 0,
                    cooperating_teachers: [],
                    admin_cooperation: "",
                    educational_impact: "",
                    problems: "",
                    recommendations: ""
                  }]);
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
                            تقرير الأنشطة - {report.activities.length} نشاط
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
                  تقرير الأنشطة - {selectedReport?.activities.length} نشاط
                </DialogTitle>
              </DialogHeader>

              {selectedReport && (
                <div className="space-y-6 p-4">
                  {selectedReport.activities.map((activity, index) => (
                    <Card key={index} className="border-2 border-cyan-200">
                      <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                        <CardTitle className="text-lg">
                          {index + 1}. {activity.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-cyan-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">التاريخ</div>
                            <div className="font-bold text-cyan-700">
                              {new Date(activity.date).toLocaleDateString("ar-SA")}
                            </div>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">النوع</div>
                            <div className="font-bold text-blue-700">{activity.type}</div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">المشاركون</div>
                            <div className="font-bold text-purple-700">{activity.participants_count}</div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">معدل التفاعل</div>
                            <div className="font-bold text-green-700">{activity.interaction_rate}/10</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-bold text-gray-800 mb-2">الفئة المستهدفة</div>
                            <p className="text-sm text-gray-700">{activity.target_group}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-bold text-gray-800 mb-2">المشرفون على النشاط</div>
                            {activity.supervisors && activity.supervisors.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {activity.supervisors.map((teacherId, i) => (
                                  <span key={i} className="inline-block bg-cyan-100 text-cyan-800 px-2 py-1 rounded text-xs">
                                    {getTeacherName(teacherId)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700">{activity.supervisor || '-'}</p>
                            )}
                          </div>
                        </div>

                        {((activity.cooperating_teachers && activity.cooperating_teachers.length > 0) || activity.teacher_cooperation) && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm font-bold text-blue-800 mb-2">المعلمون المتعاونون</div>
                            {activity.cooperating_teachers && activity.cooperating_teachers.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {activity.cooperating_teachers.map((teacherId, i) => (
                                  <span key={i} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                    {getTeacherName(teacherId)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700">{activity.teacher_cooperation}</p>
                            )}
                          </div>
                        )}

                        {activity.admin_cooperation && (
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div className="text-sm font-bold text-purple-800 mb-2">تعاون الإدارة</div>
                            <p className="text-sm text-gray-700">{activity.admin_cooperation}</p>
                          </div>
                        )}

                        {activity.educational_impact && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-sm font-bold text-green-800 mb-2">الأثر التربوي</div>
                            <p className="text-sm text-gray-700">{activity.educational_impact}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activity.problems && (
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="text-sm font-bold text-orange-800 mb-2">المشاكل</div>
                              <p className="text-sm text-gray-700">{activity.problems}</p>
                            </div>
                          )}

                          {activity.recommendations && (
                            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <div className="text-sm font-bold text-yellow-800 mb-2">التوصيات</div>
                              <p className="text-sm text-gray-700">{activity.recommendations}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ActivitiesDashboard;