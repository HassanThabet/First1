import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import pdfMake from "@digicole/pdfmake-rtl";
import pdfMakeFonts from "../fonts/vfs_fonts";

const DirectorReportsList = () => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReport, setEditingReport] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({
    report_date: "",
    challenges: "",
    actions_and_suggestions: "",
    notes: ""
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/reports/director`);
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("فشل تحميل التقارير");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setEditFormData({
      report_date: report.report_date,
      challenges: report.challenges || "",
      actions_and_suggestions: report.actions_and_suggestions || "",
      notes: report.notes || ""
    });
    setShowEditModal(true);
  };

  const handleUpdateReport = async () => {
    try {
      await axios.put(`${API}/reports/director/${editingReport.id}`, editFormData);
      toast.success("✅ تم تحديث التقرير وإرساله إلى رئيس مجلس الإدارة");
      setShowEditModal(false);
      setEditingReport(null);
      fetchReports();
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("فشل تحديث التقرير");
    }
  };

  const handleDeleteClick = (report) => {
    setReportToDelete(report);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API}/reports/director/${reportToDelete.id}`);
      toast.success("✅ تم حذف التقرير بنجاح");
      setShowDeleteConfirm(false);
      setReportToDelete(null);
      fetchReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("فشل حذف التقرير");
    }
  };

  const exportToPDF = (report) => {
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
      }
    };

    const reportDate = new Date(report.report_date).toLocaleDateString('ar-SA');
    const createdDate = new Date(report.created_at).toLocaleDateString('ar-SA');

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: 'Cairo',
        fontSize: 12,
        direction: 'rtl',
        alignment: 'right'
      },
      content: [
        {
          text: 'تقرير المدير',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        {
          text: `الفرع: ${report.branch === 'boys' ? 'البنين' : 'البنات'}`,
          margin: [0, 0, 0, 10]
        },
        {
          text: `تاريخ التقرير: ${reportDate}`,
          margin: [0, 0, 0, 20]
        },
        {
          text: 'البند الأول: التحديات',
          style: 'sectionHeader',
          margin: [0, 10, 0, 5]
        },
        {
          text: report.challenges || 'لا يوجد',
          margin: [0, 0, 0, 15]
        },
        {
          text: 'البند الثاني: الإجراءات المتخذة والمقترحات',
          style: 'sectionHeader',
          margin: [0, 10, 0, 5]
        },
        {
          text: report.actions_and_suggestions || 'لا يوجد',
          margin: [0, 0, 0, 15]
        },
        {
          text: 'البند الثالث: ملاحظات',
          style: 'sectionHeader',
          margin: [0, 10, 0, 5]
        },
        {
          text: report.notes || 'لا يوجد',
          margin: [0, 0, 0, 20]
        },
        {
          text: `تاريخ الإنشاء: ${createdDate}`,
          fontSize: 10,
          color: '#666',
          margin: [0, 20, 0, 0]
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: '#1e40af'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#2563eb'
        }
      }
    };

    pdfMake.createPdf(docDefinition).download(`تقرير_المدير_${reportDate}.pdf`);
    toast.success("تم تصدير التقرير بنجاح");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
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
                    تقرير بتاريخ {formatDate(report.report_date)}
                  </CardTitle>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    report.branch === 'boys' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                  }`}>
                    {report.branch === 'boys' ? 'البنين' : 'البنات'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">التحديات:</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{report.challenges}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">الإجراءات والمقترحات:</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{report.actions_and_suggestions}</p>
                </div>
                {report.notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">ملاحظات:</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{report.notes}</p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    {report.updated_at ? `آخر تحديث: ${formatDate(report.updated_at)}` : `تاريخ الإنشاء: ${formatDate(report.created_at)}`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => exportToPDF(report)}
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700"
                    >
                      📄 تصدير PDF
                    </Button>
                    <Button
                      onClick={() => handleEdit(report)}
                      size="sm"
                      variant="outline"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      ✏️ تعديل
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(report)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      🗑️ حذف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل التقرير</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">تاريخ التقرير</label>
              <Input
                type="date"
                value={editFormData.report_date}
                onChange={(e) => setEditFormData({ ...editFormData, report_date: e.target.value })}
                className="text-right"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">التحديات</label>
              <textarea
                value={editFormData.challenges}
                onChange={(e) => setEditFormData({ ...editFormData, challenges: e.target.value })}
                rows={5}
                className="w-full p-3 border rounded-md text-right resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">الإجراءات المتخذة والمقترحات</label>
              <textarea
                value={editFormData.actions_and_suggestions}
                onChange={(e) => setEditFormData({ ...editFormData, actions_and_suggestions: e.target.value })}
                rows={5}
                className="w-full p-3 border rounded-md text-right resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ملاحظات</label>
              <textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                rows={3}
                className="w-full p-3 border rounded-md text-right resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateReport} className="bg-blue-600 hover:bg-blue-700">
              حفظ التعديلات وإرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
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
            <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DirectorReportsList;
