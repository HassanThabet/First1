import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { FileText, Users, TrendingUp } from "lucide-react";

const DirectorDashboard = () => {
  return (
    <DashboardLayout title="لوحة تحكم المدير">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">التقارير الواردة</p>
                <h3 className="text-3xl font-bold text-cyan-600">42</h3>
              </div>
              <FileText className="w-12 h-12 text-cyan-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الموظفون التابعون</p>
                <h3 className="text-3xl font-bold text-blue-600">12</h3>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">معدل الأداء العام</p>
                <h3 className="text-3xl font-bold text-green-600">8.7/10</h3>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>التقارير الواردة من الأقسام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-cyan-50 rounded-lg">
              <h4 className="font-semibold text-cyan-900 mb-2">تقارير الوكلاء</h4>
              <p className="text-sm text-cyan-700">عدد التقارير: 8</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">تقارير الأنشطة</h4>
              <p className="text-sm text-blue-700">عدد التقارير: 12</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">تقارير الجودة</h4>
              <p className="text-sm text-purple-700">عدد التقارير: 6</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">تقارير الإشراف التربوي</h4>
              <p className="text-sm text-green-700">عدد التقارير: 10</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">تقارير الأخصائي الاجتماعي</h4>
              <p className="text-sm text-orange-700">عدد التقارير: 6</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default DirectorDashboard;