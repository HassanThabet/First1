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
import { Eye, FileText, BarChart3 } from "lucide-react";

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
  const [users, setUsers] = useState([]);
  const [timeFilter, setTimeFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all");
  const [selectedSpecificEmployee, setSelectedSpecificEmployee] = useState("all");
  
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

  // Calculate overall statistics
  const getOverallStatistics = () => {
    let filteredSupervisorReports = filterReportsByTimeOnly([...supervisorReports]);
    let filteredActivitiesReports = filterReportsByTimeOnly([...activitiesReports]);
    let filteredSocialReports = filterReportsByTimeOnly([...socialReports]);
    let filteredQualityReports = filterReportsByTimeOnly([...qualityReports]);

    // Supervisor statistics
    const totalLateTeachers = filteredSupervisorReports.reduce((sum, r) => sum + (r.late_teachers?.length || 0), 0);
    const totalAbsentTeachers = filteredSupervisorReports.reduce((sum, r) => sum + (r.absent_teachers?.length || 0), 0);
    const totalCoveringTeachers = filteredSupervisorReports.reduce((sum, r) => sum + (r.covering_teachers?.length || 0), 0);
    const totalIncidents = filteredSupervisorReports.reduce((sum, r) => sum + (r.incidents?.length || 0), 0);

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
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default QualityDashboard;