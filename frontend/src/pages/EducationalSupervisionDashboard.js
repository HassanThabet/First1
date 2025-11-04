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
      <div className="space-y-6">
        {/* Tabs Navigation */}
        <Card>
          <CardContent className="p-0">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === "create"
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                ✍️ إنشاء تقرير تقييم
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === "reports"
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                📄 تقاريري
              </button>
              <button
                onClick={() => setActiveTab("progress")}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === "progress"
                    ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                📈 تقييم تحسن المعلمين
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Tab Content */}
        {activeTab === "create" && (
          <EducationalSupervisionCreateReport onReportCreated={() => setActiveTab("reports")} />
        )}

        {activeTab === "reports" && (
          <EducationalSupervisionReportsList />
        )}

        {activeTab === "progress" && (
          <EducationalSupervisionTeacherProgress />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EducationalSupervisionDashboard;