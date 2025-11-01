import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, FileText, BarChart3, TrendingUp } from "lucide-react";

const ChairmanDashboard = () => {
  return (
    <DashboardLayout title="لوحة تحكم رئيس مجلس الإدارة">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي التقارير</p>
                <h3 className="text-3xl font-bold text-cyan-600">156</h3>
              </div>
              <FileText className="w-12 h-12 text-cyan-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الموظفون</p>
                <h3 className="text-3xl font-bold text-blue-600">24</h3>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">معدل الأداء</p>
                <h3 className="text-3xl font-bold text-green-600">8.5/10</h3>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">التقييم الشامل</p>
                <h3 className="text-3xl font-bold text-purple-600">ممتاز</h3>
              </div>
              <BarChart3 className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لوحة المعلومات الشاملة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BarChart3 className="w-24 h-24 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              عرض شامل لجميع التقارير والإحصائيات
            </h3>
            <p className="text-gray-600">
              يمكنك الاطلاع على تقارير المديرين وجميع الموظفين في الفرعين
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ChairmanDashboard;