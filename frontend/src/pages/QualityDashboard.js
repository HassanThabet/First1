import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Award, CheckCircle, AlertCircle } from "lucide-react";

const QualityDashboard = () => {
  return (
    <DashboardLayout title="لوحة تحكم الجودة">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">معدل الجودة</p>
                <h3 className="text-3xl font-bold text-cyan-600">92%</h3>
              </div>
              <Award className="w-12 h-12 text-cyan-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الإيجابيات</p>
                <h3 className="text-3xl font-bold text-green-600">48</h3>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الملاحظات</p>
                <h3 className="text-3xl font-bold text-orange-600">12</h3>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تقارير الجودة الشاملة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-cyan-50 rounded-lg">
              <h4 className="font-semibold text-cyan-900 mb-2">الأداء الأكاديمي</h4>
              <p className="text-sm text-cyan-700">مستوى ممتاز</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">الإشراف التربوي</h4>
              <p className="text-sm text-blue-700">مستوى جيد جداً</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">الانضباط والسلوك</h4>
              <p className="text-sm text-green-700">مستوى ممتاز</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">الأنشطة والبرامج</h4>
              <p className="text-sm text-purple-700">مستوى جيد جداً</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">الأخصائي الاجتماعي</h4>
              <p className="text-sm text-orange-700">مستوى جيد</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default QualityDashboard;