import React, { useContext } from "react";
import { AuthContext } from "../App";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";

const DashboardLayout = ({ children, title }) => {
  const { user, logout } = useContext(AuthContext);

  const roleNames = {
    admin: "المدير العام",
    chairman: "رئيس مجلس الإدارة",
    director: "المدير",
    vice_principal: "الوكيل",
    supervisor: "المشرف",
    activities: "الأنشطة",
    educational_supervision: "الإشراف التربوي",
    social_specialist: "الأخصائي الاجتماعي",
    quality: "الجودة"
  };

  const branchNames = {
    boys: "البنين",
    girls: "البنات",
    both: "كلا الفرعين"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <User className="w-5 h-5 text-cyan-600" />
                <span className="font-bold text-gray-800">{user?.username}</span>
              </div>
              <span className="text-sm text-gray-600">
                {roleNames[user?.role]} - {branchNames[user?.branch]}
              </span>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              data-testid="logout-button"
              className="flex items-center space-x-2 space-x-reverse hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="dashboard-header" data-testid="dashboard-header">
          <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
          <p className="mt-2 text-cyan-50">مدارس الفجر الجديد الأهلية</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;