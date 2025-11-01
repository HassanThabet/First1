import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const VicePrincipalDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("create");
  const [supervisorReports, setSupervisorReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

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
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="create" data-testid="create-report-tab">إنشاء تقرير</TabsTrigger>
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
              {loading ? "جاري الإرسال..." : "إرسال التقرير"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="supervisor-reports">
          <div className="space-y-4">
            {supervisorReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle>تقرير {new Date(report.date).toLocaleDateString("ar-SA")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="stat-card">
                      <div className="text-sm text-gray-600">انضباط الطلاب</div>
                      <div className="text-2xl font-bold text-cyan-600">{report.student_discipline}/10</div>
                    </div>
                    <div className="stat-card">
                      <div className="text-sm text-gray-600">نظافة الفصول</div>
                      <div className="text-2xl font-bold text-cyan-600">{report.classroom_cleanliness}/10</div>
                    </div>
                    <div className="stat-card">
                      <div className="text-sm text-gray-600">التزام المعلمين</div>
                      <div className="text-2xl font-bold text-cyan-600">{report.teacher_attendance_rate}/10</div>
                    </div>
                    <div className="stat-card">
                      <div className="text-sm text-gray-600">السلوك العام</div>
                      <div className="text-2xl font-bold text-cyan-600">{report.general_behavior}/10</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports">
          <div className="space-y-4">
            {myReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle>
                    تقرير من {new Date(report.week_start).toLocaleDateString("ar-SA")} 
                    إلى {new Date(report.week_end).toLocaleDateString("ar-SA")}
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