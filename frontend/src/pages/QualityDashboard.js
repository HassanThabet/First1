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
  }, []);

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
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="create" className="flex items-center space-x-2 space-x-reverse">
            <FileText className="w-4 h-4" />
            <span>إنشاء تقرير جديد</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2 space-x-reverse">
            <Eye className="w-4 h-4" />
            <span>التقارير</span>
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
      </Tabs>
    </DashboardLayout>
  );
};

export default QualityDashboard;