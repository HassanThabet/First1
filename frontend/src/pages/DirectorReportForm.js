import React, { useState, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

const DirectorReportForm = ({ onReportCreated }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().split('T')[0],
    challenges: "",
    actions_and_suggestions: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.challenges || !formData.actions_and_suggestions) {
      toast.error("الرجاء تعبئة جميع الحقول المطلوبة");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API}/reports/director`, formData);
      toast.success("✅ تم إرسال التقرير إلى رئيس مجلس الإدارة بنجاح");
      
      // Reset form
      setFormData({
        report_date: new Date().toISOString().split('T')[0],
        challenges: "",
        actions_and_suggestions: "",
        notes: ""
      });
      
      if (onReportCreated) {
        onReportCreated();
      }
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error("فشل في إنشاء التقرير");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">تقرير المدير</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* تاريخ التقرير */}
            <div>
              <label className="block text-sm font-medium mb-2">تاريخ التقرير *</label>
              <Input
                type="date"
                value={formData.report_date}
                onChange={(e) => handleInputChange("report_date", e.target.value)}
                required
                className="text-right"
              />
            </div>

            {/* البند الأول: التحديات */}
            <div>
              <label className="block text-sm font-medium mb-2">البند الأول: التحديات *</label>
              <textarea
                value={formData.challenges}
                onChange={(e) => handleInputChange("challenges", e.target.value)}
                required
                rows={6}
                className="w-full p-3 border rounded-md text-right resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="اكتب التحديات التي واجهتها..."
              />
            </div>

            {/* البند الثاني: الإجراءات المتخذة والمقترحات */}
            <div>
              <label className="block text-sm font-medium mb-2">البند الثاني: الإجراءات المتخذة والمقترحات *</label>
              <textarea
                value={formData.actions_and_suggestions}
                onChange={(e) => handleInputChange("actions_and_suggestions", e.target.value)}
                required
                rows={6}
                className="w-full p-3 border rounded-md text-right resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="اكتب الإجراءات المتخذة والمقترحات..."
              />
            </div>

            {/* البند الثالث: ملاحظات */}
            <div>
              <label className="block text-sm font-medium mb-2">البند الثالث: ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={4}
                className="w-full p-3 border rounded-md text-right resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="اكتب أي ملاحظات إضافية..."
              />
            </div>

            {/* زر الإرسال */}
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "جاري الإرسال..." : "إرسال التقرير إلى رئيس مجلس الإدارة"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectorReportForm;
