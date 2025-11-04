import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { 
  createSection, 
  createRTLTable, 
  generatePDF as generatePDFTemplate 
} from "../utils/pdfTemplate";

const ChairmanDirectorReportsView = () => {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [branchFilter, setBranchFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsRes, usersRes] = await Promise.all([
        axios.get(`${API}/reports/director`),
        axios.get(`${API}/users`)
      ]);
      setReports(reportsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("فشل تحميل التقارير");
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : "غير معروف";
  };

  const filteredReports = branchFilter === "all" 
    ? reports 
    : reports.filter(r => r.branch === branchFilter);

  const exportToPDF = (report) => {
    try {
      const reportDate = new Date(report.report_date).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const createdDate = new Date(report.created_at).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const directorName = getUserName(report.user_id);
      const branchText = report.branch === 'boys' ? 'البنين' : 'البنات';

      const content = [];

      // === معلومات أساسية ===
      const infoTable = createRTLTable(
        [
          { text: 'البيان', width: '*' },
          { text: 'القيمة', width: '*' }
        ],
        [
          ['المدير', directorName],
          ['الفرع', branchText],
          ['تاريخ التقرير', reportDate],
          ['تاريخ الإرسال', createdDate]
        ],
        { showRowNumbers: false, headerColor: '#dbeafe' }
      );
      content.push(createSection('📋 معلومات التقرير', infoTable));

      // === التحديات ===
      if (report.challenges) {
        content.push(createSection('⚠️ البند الأول: التحديات', {
          text: report.challenges,
          style: 'tableCell',
          alignment: 'right',
          margin: [10, 5, 10, 5]
        }));
      }

      // === الإجراءات والمقترحات ===
      if (report.actions_and_suggestions) {
        content.push(createSection('💡 البند الثاني: الإجراءات المتخذة والمقترحات', {
          text: report.actions_and_suggestions,
          style: 'tableCell',
          alignment: 'right',
          margin: [10, 5, 10, 5]
        }));
      }

      // === الملاحظات ===
      if (report.notes) {
        content.push(createSection('📝 البند الثالث: ملاحظات', {
          text: report.notes,
          style: 'tableCell',
          alignment: 'right',
          margin: [10, 5, 10, 5]
        }));
      }

      const filename = `تقرير_مدير_${directorName}_${reportDate.replace(/\//g, '-')}.pdf`;
      
      generatePDFTemplate(content, filename, {
        title: 'تقرير المدير',
        orientation: 'portrait',
        additionalInfo: {
          leftInfo: `${branchText} | ${reportDate}`
        }
      });

      toast.success("تم تصدير تقرير المدير بنجاح");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("حدث خطأ أثناء إنشاء التقرير");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const viewDetails = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
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
        <h2 className="text-2xl font-bold">تقارير المديرين</h2>
        <div className="flex items-center gap-4">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">جميع الفروع</option>
            <option value="boys">البنين</option>
            <option value="girls">البنات</option>
          </select>
          <div className="text-sm text-gray-600">
            إجمالي التقارير: {filteredReports.length}
          </div>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">لا توجد تقارير حتى الآن</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg mb-2">
                      تقرير المدير: {getUserName(report.user_id)}
                    </CardTitle>
                    <div className="text-sm text-gray-600">
                      تاريخ التقرير: {formatDate(report.report_date)}
                    </div>
                  </div>
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
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xs text-gray-500">
                    {report.updated_at ? `آخر تحديث: ${formatDate(report.updated_at)}` : `تاريخ الإرسال: ${formatDate(report.created_at)}`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => viewDetails(report)}
                      size="sm"
                      variant="outline"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      👁️ عرض التفاصيل
                    </Button>
                    <Button
                      onClick={() => exportToPDF(report)}
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700"
                    >
                      📄 تصدير PDF
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل تقرير المدير</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600">المدير</p>
                  <p className="font-medium">{getUserName(selectedReport.user_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الفرع</p>
                  <p className="font-medium">{selectedReport.branch === 'boys' ? 'البنين' : 'البنات'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">تاريخ التقرير</p>
                  <p className="font-medium">{formatDate(selectedReport.report_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">تاريخ الإرسال</p>
                  <p className="font-medium">{formatDate(selectedReport.created_at)}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">البند الأول: التحديات</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.challenges}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">البند الثاني: الإجراءات المتخذة والمقترحات</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.actions_and_suggestions}</p>
              </div>
              
              {selectedReport.notes && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">البند الثالث: ملاحظات</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              إغلاق
            </Button>
            <Button onClick={() => exportToPDF(selectedReport)} className="bg-green-600 hover:bg-green-700">
              📄 تصدير PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChairmanDirectorReportsView;
