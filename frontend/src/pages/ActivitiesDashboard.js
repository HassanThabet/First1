import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Activity, Users, Calendar } from "lucide-react";

const ActivitiesDashboard = () => {
  return (
    <DashboardLayout title="لوحة تحكم الأنشطة">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الأنشطة</p>
                <h3 className="text-3xl font-bold text-cyan-600">28</h3>
              </div>
              <Activity className="w-12 h-12 text-cyan-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">المشاركون</p>
                <h3 className="text-3xl font-bold text-blue-600">450</h3>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الأنشطة القادمة</p>
                <h3 className="text-3xl font-bold text-green-600">5</h3>
              </div>
              <Calendar className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إدارة الأنشطة والتقارير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Activity className="w-24 h-24 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              إدارة الأنشطة المدرسية
            </h3>
            <p className="text-gray-600">
              يمكنك إضافة وإدارة الأنشطة وإنشاء التقارير الأسبوعية
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ActivitiesDashboard;