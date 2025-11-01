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

const SocialSpecialistDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("create");
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  // Filters
  const [viewMode, setViewMode] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  
  // Merged reports filters
  const [mergedPeriod, setMergedPeriod] = useState("weekly");
  const [mergedStartDate, setMergedStartDate] = useState("");
  const [mergedEndDate, setMergedEndDate] = useState("");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    psychological_cases: 0,
    academic_cases: 0,
    behavioral_cases: 0,
    sessions_count: 0,
    families_contacted: 0,
    referrals_count: 0,
    follow_ups_count: 0,
    guidance_programs: "",
    challenges: "",
    recommendations: ""
  });

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [viewMode, dateFilter, monthFilter, allReports]);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API}/reports/social-specialist`);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingReport) {
        await axios.put(`${API}/reports/social-specialist/${editingReport.id}`, formData);
        toast.success("تم تحديث التقرير بنجاح");
        setEditingReport(null);
      } else {
        await axios.post(`${API}/reports/social-specialist`, formData);
        toast.success("تم إنشاء التقرير بنجاح");
      }
      fetchReports();
      setActiveTab("reports");
      setFormData({
        date: new Date().toISOString().split('T')[0],
        psychological_cases: 0,
        academic_cases: 0,
        behavioral_cases: 0,
        sessions_count: 0,
        families_contacted: 0,
        referrals_count: 0,
        follow_ups_count: 0,
        guidance_programs: "",
        challenges: "",
        recommendations: ""
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
      psychological_cases: report.psychological_cases,
      academic_cases: report.academic_cases,
      behavioral_cases: report.behavioral_cases,
      sessions_count: report.sessions_count,
      families_contacted: report.families_contacted,
      referrals_count: report.referrals_count,
      follow_ups_count: report.follow_ups_count,
      guidance_programs: report.guidance_programs || "",
      challenges: report.challenges || "",
      recommendations: report.recommendations || ""
    });
    setActiveTab("create");
  };

  const handleDelete = async (reportId) => {
    if (window.confirm("هل أنت متأكد من حذف هذا التقرير؟")) {
      try {
        await axios.delete(`${API}/reports/social-specialist/${reportId}`);
        toast.success("تم حذف التقرير بنجاح");
        fetchReports();
      } catch (error) {
        toast.error("فشل حذف التقرير");
      }
    }
  };

  // Get merged reports based on period
  const getMergedReports = () => {
    let filtered = [...allReports];
    const today = new Date();

    if (mergedPeriod === "weekly") {
      const currentDay = today.getDay();
      const daysFromSaturday = currentDay === 6 ? 0 : currentDay + 1;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromSaturday);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);
      weekEnd.setHours(23, 59, 59, 999);
      
      filtered = allReports.filter(r => {
        const reportDate = new Date(r.date);
        return reportDate >= weekStart && reportDate <= weekEnd;
      });
    } else if (mergedPeriod === "monthly") {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      filtered = allReports.filter(r => {
        const reportDate = new Date(r.date);
        return reportDate.getMonth() === currentMonth && 
               reportDate.getFullYear() === currentYear;
      });
    } else if (mergedPeriod === "custom" && mergedStartDate && mergedEndDate) {
      const startDate = new Date(mergedStartDate);
      const endDate = new Date(mergedEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = allReports.filter(r => {
        const reportDate = new Date(r.date);
        return reportDate >= startDate && reportDate <= endDate;
      });
    }

    return filtered;
  };

  // Get merged statistics
  const getMergedStatistics = () => {
    const mergedReports = getMergedReports();
    
    const totalPsychological = mergedReports.reduce((sum, r) => sum + (r.psychological_cases || 0), 0);
    const totalAcademic = mergedReports.reduce((sum, r) => sum + (r.academic_cases || 0), 0);
    const totalBehavioral = mergedReports.reduce((sum, r) => sum + (r.behavioral_cases || 0), 0);
    const totalCases = totalPsychological + totalAcademic + totalBehavioral;
    
    const totalSessions = mergedReports.reduce((sum, r) => sum + (r.sessions_count || 0), 0);
    const totalFamilies = mergedReports.reduce((sum, r) => sum + (r.families_contacted || 0), 0);
    const totalReferrals = mergedReports.reduce((sum, r) => sum + (r.referrals_count || 0), 0);
    const totalFollowUps = mergedReports.reduce((sum, r) => sum + (r.follow_ups_count || 0), 0);
    
    return {
      totalPsychological,
      totalAcademic,
      totalBehavioral,
      totalCases,
      totalSessions,
      totalFamilies,
      totalReferrals,
      totalFollowUps,
      totalReports: mergedReports.length
    };
  };

  return (
    <DashboardLayout title="لوحة تحكم الأخصائي الاجتماعي">
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

            <Card>
              <CardHeader>
                <CardTitle>الحالات الطلابية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>الحالات النفسية</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.psychological_cases}
                      onChange={(e) => setFormData({ ...formData, psychological_cases: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>الحالات الأكاديمية</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.academic_cases}
                      onChange={(e) => setFormData({ ...formData, academic_cases: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>الحالات السلوكية</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.behavioral_cases}
                      onChange={(e) => setFormData({ ...formData, behavioral_cases: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                {/* Total Cases Display */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border-2 border-purple-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-purple-800 mb-1">إجمالي عدد الحالات الطلابية</p>
                      <p className="text-xs text-purple-600">مجموع جميع الحالات (نفسية + أكاديمية + سلوكية)</p>
                    </div>
                    <div className="text-4xl font-bold text-purple-700">
                      {(formData.psychological_cases || 0) + (formData.academic_cases || 0) + (formData.behavioral_cases || 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الإجراءات المتخذة</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>عدد الجلسات</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sessions_count}
                    onChange={(e) => setFormData({ ...formData, sessions_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>التواصل مع الأسر</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.families_contacted}
                    onChange={(e) => setFormData({ ...formData, families_contacted: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>عدد الإحالات</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.referrals_count}
                    onChange={(e) => setFormData({ ...formData, referrals_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>المتابعات</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.follow_ups_count}
                    onChange={(e) => setFormData({ ...formData, follow_ups_count: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>البرامج الإرشادية</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.guidance_programs}
                  onChange={(e) => setFormData({ ...formData, guidance_programs: e.target.value })}
                  placeholder="وصف البرامج الإرشادية المنفذة"
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التحديات</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.challenges}
                  onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                  placeholder="التحديات التي واجهتها"
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التوصيات</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  placeholder="التوصيات المقترحة"
                  rows={4}
                />
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
                  setFormData({
                    date: new Date().toISOString().split('T')[0],
                    psychological_cases: 0,
                    academic_cases: 0,
                    behavioral_cases: 0,
                    sessions_count: 0,
                    families_contacted: 0,
                    referrals_count: 0,
                    follow_ups_count: 0,
                    guidance_programs: "",
                    challenges: "",
                    recommendations: ""
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
                            تقرير {new Date(report.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </h4>
                          <p className="text-sm text-gray-500">
                            إجمالي الحالات: {report.psychological_cases + report.academic_cases + report.behavioral_cases}
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
                  {selectedReport && `تقرير ${new Date(selectedReport.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                </DialogTitle>
              </DialogHeader>

              {selectedReport && (
                <div className="space-y-6 p-4">
                  {/* Cases Statistics */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">الحالات الطلابية</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="stat-card bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-cyan-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">الحالات النفسية</div>
                        <div className="text-3xl font-bold text-cyan-700">{selectedReport.psychological_cases}</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">الحالات الأكاديمية</div>
                        <div className="text-3xl font-bold text-blue-700">{selectedReport.academic_cases}</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">الحالات السلوكية</div>
                        <div className="text-3xl font-bold text-purple-700">{selectedReport.behavioral_cases}</div>
                      </div>
                    </div>
                    
                    {/* Total Cases */}
                    <div className="p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl border-2 border-purple-300 shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-purple-800 mb-1">📊 إجمالي عدد الحالات الطلابية</p>
                          <p className="text-sm text-purple-600">مجموع جميع الحالات المسجلة في التقرير</p>
                        </div>
                        <div className="text-5xl font-extrabold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {selectedReport.psychological_cases + selectedReport.academic_cases + selectedReport.behavioral_cases}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Taken */}
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">الإجراءات المتخذة</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-sm font-bold text-green-800">الجلسات</div>
                        <div className="text-2xl font-bold text-green-600 mt-1">{selectedReport.sessions_count}</div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm font-bold text-blue-800">التواصل مع الأسر</div>
                        <div className="text-2xl font-bold text-blue-600 mt-1">{selectedReport.families_contacted}</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-sm font-bold text-orange-800">الإحالات</div>
                        <div className="text-2xl font-bold text-orange-600 mt-1">{selectedReport.referrals_count}</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-sm font-bold text-purple-800">المتابعات</div>
                        <div className="text-2xl font-bold text-purple-600 mt-1">{selectedReport.follow_ups_count}</div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4">
                    {selectedReport.guidance_programs && (
                      <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                        <div className="text-sm font-bold text-cyan-800 mb-2">البرامج الإرشادية</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{selectedReport.guidance_programs}</p>
                      </div>
                    )}

                    {selectedReport.challenges && (
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-sm font-bold text-orange-800 mb-2">التحديات</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{selectedReport.challenges}</p>
                      </div>
                    )}

                    {selectedReport.recommendations && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-sm font-bold text-green-800 mb-2">التوصيات</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{selectedReport.recommendations}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default SocialSpecialistDashboard;