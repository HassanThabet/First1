import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { Eye, Edit, Trash2 } from "lucide-react";

const EducationalSupervisionReportsList = () => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/reports/educational-supervision`);
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("فشل تحميل التقارير");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/reports/educational-supervision/${reportToDelete.id}`);
      toast.success("تم حذف التقرير بنجاح");
      setShowDeleteConfirm(false);
      setReportToDelete(null);
      fetchReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("فشل حذف التقرير");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const calculateAverage = (evaluation) => {
    const sum = evaluation.planning + evaluation.performance + 
                evaluation.time_management + evaluation.goal_achievement;
    return (sum / 4).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">تقاريري</h2>
        <div className="text-sm text-gray-600">
          إجمالي التقارير: {reports.length}
        </div>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">لا توجد تقارير حتى الآن</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">
                    تقرير بتاريخ {formatDate(report.date)}
                  </CardTitle>
                  <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {report.teacher_evaluations?.length || 0} معلم
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">ملخص التقييمات:</h4>
                  {report.teacher_evaluations?.slice(0, 3).map((eval_item, idx) => (
                    <div key={idx} className="text-sm text-gray-700 flex justify-between items-center py-1">
                      <span>{eval_item.teacher_name}</span>
                      <span className="font-bold text-blue-600">
                        {calculateAverage(eval_item)}/10
                      </span>
                    </div>
                  ))}
                  {report.teacher_evaluations?.length > 3 && (
                    <p className="text-xs text-gray-500 mt-1">
                      ... و {report.teacher_evaluations.length - 3} معلمين آخرين
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    {report.updated_at ? `آخر تحديث: ${formatDate(report.updated_at)}` : `تاريخ الإنشاء: ${formatDate(report.created_at)}`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowDetailModal(true);
                      }}
                      size="sm"
                      variant="outline"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setReportToDelete(report);
                        setShowDeleteConfirm(true);
                      }}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل التقرير</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm"><strong>التاريخ:</strong> {formatDate(selectedReport.date)}</p>
                <p className="text-sm"><strong>عدد المعلمين المقيّمين:</strong> {selectedReport.teacher_evaluations?.length || 0}</p>
              </div>

              {selectedReport.teacher_evaluations?.map((eval_item, idx) => (
                <Card key={idx} className="border-2 border-blue-200">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-lg">
                      {eval_item.teacher_name}
                      <span className="text-sm text-gray-600 mr-3">
                        (المتوسط: {calculateAverage(eval_item)}/10)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">التخطيط</p>
                        <p className="text-lg font-bold text-blue-600">{eval_item.planning}/10</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">الأداء</p>
                        <p className="text-lg font-bold text-blue-600">{eval_item.performance}/10</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">إدارة الوقت</p>
                        <p className="text-lg font-bold text-blue-600">{eval_item.time_management}/10</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">تحقيق الأهداف</p>
                        <p className="text-lg font-bold text-blue-600">{eval_item.goal_achievement}/10</p>
                      </div>
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-semibold mb-1">استخدام الاستراتيجيات:</p>
                      <p className="text-sm">{eval_item.uses_strategies === "yes" ? "✅ نعم" : "❌ لا"}</p>
                      {eval_item.strategies_notes && (
                        <p className="text-sm text-gray-700 mt-2">
                          <strong>ملاحظات:</strong> {eval_item.strategies_notes}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-green-700 mb-1">نقاط القوة:</p>
                      <p className="text-sm bg-green-50 p-2 rounded">{eval_item.strengths}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-orange-700 mb-1">نقاط تحتاج دعم:</p>
                      <p className="text-sm bg-orange-50 p-2 rounded">{eval_item.needs_support}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-center py-4">
            هل أنت متأكد من حذف هذا التقرير؟
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              إلغاء
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EducationalSupervisionReportsList;
