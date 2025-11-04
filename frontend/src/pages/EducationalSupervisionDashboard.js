import React, { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent } from "../components/ui/card";
import EducationalSupervisionCreateReport from "./EducationalSupervisionCreateReport";
import EducationalSupervisionReportsList from "./EducationalSupervisionReportsList";
import EducationalSupervisionTeacherProgress from "./EducationalSupervisionTeacherProgress";

const EducationalSupervisionDashboard = () => {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <DashboardLayout title="لوحة تحكم الإشراف التربوي - مدارس الفجر الجديد الأهلية">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">عدد المعلمين</p>
                <h3 className="text-3xl font-bold text-cyan-600">45</h3>
              </div>
              <GraduationCap className="w-12 h-12 text-cyan-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">معدل الأداء</p>
                <h3 className="text-3xl font-bold text-green-600">8.8/10</h3>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">التقييمات</p>
                <h3 className="text-3xl font-bold text-blue-600">120</h3>
              </div>
              <Award className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تقييم أداء المعلمين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <GraduationCap className="w-24 h-24 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              نظام تقييم المعلمين
            </h3>
            <p className="text-gray-600">
              يمكنك تقييم أداء المعلمين وإضافة التقارير ونقاط القوة والتطوير
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default EducationalSupervisionDashboard;