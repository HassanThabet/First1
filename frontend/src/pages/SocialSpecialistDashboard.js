import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Heart, Users, Phone } from "lucide-react";

const SocialSpecialistDashboard = () => {
  return (
    <DashboardLayout title="لوحة تحكم الأخصائي الاجتماعي">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الحالات الطلابية</p>
                <h3 className="text-3xl font-bold text-cyan-600">32</h3>
              </div>
              <Heart className="w-12 h-12 text-cyan-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">الجلسات</p>
                <h3 className="text-3xl font-bold text-blue-600">68</h3>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">التواصل مع الأسر</p>
                <h3 className="text-3xl font-bold text-green-600">45</h3>
              </div>
              <Phone className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الحالات والبرامج الإرشادية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-cyan-50 rounded-lg">
                <h4 className="font-semibold text-cyan-900 mb-2">حالات نفسية</h4>
                <p className="text-2xl font-bold text-cyan-600">12</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">حالات أكاديمية</h4>
                <p className="text-2xl font-bold text-blue-600">15</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">حالات سلوكية</h4>
                <p className="text-2xl font-bold text-purple-600">5</p>
              </div>
            </div>
            <div className="text-center py-8">
              <Heart className="w-20 h-20 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                إدارة الحالات الطلابية
              </h3>
              <p className="text-gray-600">
                يمكنك إضافة ومتابعة الحالات والبرامج الإرشادية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default SocialSpecialistDashboard;