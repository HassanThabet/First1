import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Eye, BarChart3, Users as UsersIcon } from "lucide-react";

const ChairmanDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [users, setUsers] = useState([]);
  const [supervisorReports, setSupervisorReports] = useState([]);
  const [vicePrincipalReports, setVicePrincipalReports] = useState([]);
  const [activitiesReports, setActivitiesReports] = useState([]);
  const [socialReports, setSocialReports] = useState([]);
  const [qualityReports, setQualityReports] = useState([]);
  const [directorReports, setDirectorReports] = useState([]);
  
  // Filter states
  const [selectedBranch, setSelectedBranch] = useState("all"); // all, boys, girls
  const [selectedVPForStats, setSelectedVPForStats] = useState("all"); // For overview tab
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  
  // Modal states
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, supervisorRes, vpRes, activitiesRes, socialRes, qualityRes, directorRes] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/reports/supervisor`),
        axios.get(`${API}/reports/vice-principal`),
        axios.get(`${API}/reports/activities`),
        axios.get(`${API}/reports/social-specialist`),
        axios.get(`${API}/reports/quality`),
        axios.get(`${API}/reports/director`)
      ]);
      
      setUsers(usersRes.data);
      setSupervisorReports(supervisorRes.data);
      setVicePrincipalReports(vpRes.data);
      setActivitiesReports(activitiesRes.data);
      setSocialReports(socialRes.data);
      setQualityReports(qualityRes.data);
      setDirectorReports(directorRes.data);
    } catch (error) {
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  // Get filtered reports based on branch
  const getFilteredReports = () => {
    if (selectedBranch === "all") {
      return supervisorReports;
    }
    return supervisorReports.filter(r => r.branch === selectedBranch);
  };

  // Calculate overall statistics
  const getOverallStatistics = () => {
    let reports = [...supervisorReports];
    
    // Filter by branch first
    if (selectedBranch !== "all") {
      reports = reports.filter(r => r.branch === selectedBranch);
    }
    
    // Filter by selected Vice Principal if chosen
    if (selectedVPForStats !== "all") {
      // Get all supervisors under this VP
      const supervisorsUnderVP = users.filter(u => 
        u.role === "supervisor" && 
        u.assigned_to === selectedVPForStats
      );
      const supervisorIds = supervisorsUnderVP.map(s => s.id);
      reports = reports.filter(r => supervisorIds.includes(r.user_id));
    }
    
    // Apply time filter
    const today = new Date();
    if (timeFilter === "daily") {
      const todayStr = today.toISOString().split('T')[0];
      reports = reports.filter(r => r.date === todayStr);
    } else if (timeFilter === "weekly") {
      const currentDay = today.getDay();
      const daysFromSaturday = currentDay === 6 ? 0 : currentDay + 1;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromSaturday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);
      weekEnd.setHours(23, 59, 59, 999);
      
      reports = reports.filter(r => {
        const reportDate = new Date(r.date);
        return reportDate >= weekStart && reportDate <= weekEnd;
      });
    } else if (timeFilter === "monthly") {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      reports = reports.filter(r => {
        const reportDate = new Date(r.date);
        return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
      });
    }

    // Calculate statistics
    const totalLateTeachers = reports.reduce((sum, r) => sum + (r.late_teachers?.length || 0), 0);
    const totalAbsentTeachers = reports.reduce((sum, r) => sum + (r.absent_teachers?.length || 0), 0);
    const totalCoveringTeachers = reports.reduce((sum, r) => sum + (r.covering_teachers?.length || 0), 0);
    const totalIncidents = reports.reduce((sum, r) => sum + (r.incidents?.length || 0), 0);
    const totalAbsentStudents = reports.reduce((sum, r) => sum + (r.absent_students_count || 0), 0);
    
    const avgDiscipline = reports.length > 0 ? 
      (reports.reduce((sum, r) => sum + r.student_discipline, 0) / reports.length).toFixed(1) : 0;
    const avgCleanliness = reports.length > 0 ?
      (reports.reduce((sum, r) => sum + r.classroom_cleanliness, 0) / reports.length).toFixed(1) : 0;
    const avgAttendance = reports.length > 0 ?
      (reports.reduce((sum, r) => sum + r.teacher_attendance_rate, 0) / reports.length).toFixed(1) : 0;
    const avgBehavior = reports.length > 0 ?
      (reports.reduce((sum, r) => sum + r.general_behavior, 0) / reports.length).toFixed(1) : 0;

    // Get supervisor count for the selected VP
    let supervisorCount = 0;
    if (selectedVPForStats !== "all") {
      supervisorCount = users.filter(u => 
        u.role === "supervisor" && 
        u.assigned_to === selectedVPForStats
      ).length;
    }

    return {
      totalLateTeachers,
      totalAbsentTeachers,
      totalCoveringTeachers,
      totalIncidents,
      totalAbsentStudents,
      avgDiscipline,
      avgCleanliness,
      avgAttendance,
      avgBehavior,
      totalReports: reports.length,
      supervisorCount
    };
  };

  // Get reports for selected employee
  const getEmployeeReports = () => {
    if (selectedEmployee === "all") return [];
    
    const employee = users.find(u => u.id === selectedEmployee);
    if (!employee) return [];
    
    let reports = [];
    
    if (employee.role === "supervisor") {
      reports = supervisorReports.filter(r => r.user_id === employee.id);
    } else if (employee.role === "vice_principal") {
      const vpReports = vicePrincipalReports.filter(r => r.user_id === employee.id);
      const supervisorsUnderVP = users.filter(u => u.role === "supervisor" && u.assigned_to === employee.id);
      const supervisorIds = supervisorsUnderVP.map(s => s.id);
      const supervisorReportsUnderVP = supervisorReports.filter(r => supervisorIds.includes(r.user_id));
      reports = [...vpReports, ...supervisorReportsUnderVP];
    } else if (employee.role === "director") {
      reports = directorReports.filter(r => r.user_id === employee.id);
    } else if (employee.role === "activities") {
      reports = activitiesReports.filter(r => r.user_id === employee.id);
    } else if (employee.role === "social_specialist") {
      reports = socialReports.filter(r => r.user_id === employee.id);
    } else if (employee.role === "quality") {
      reports = qualityReports.filter(r => r.user_id === employee.id);
    }
    
    return reports;
  };

  const stats = getOverallStatistics();
  const employeeReports = getEmployeeReports();

  const roleNames = {
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
    girls: "البنات"
  };

  return (
    <DashboardLayout title="لوحة تحكم رئيس مجلس الإدارة">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات الشاملة</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center space-x-2 space-x-reverse">
            <UsersIcon className="w-4 h-4" />
            <span>تقارير الموظفين</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>التصفية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">الفرع</label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">الفرعين (البنين والبنات)</SelectItem>
                        <SelectItem value="boys">البنين</SelectItem>
                        <SelectItem value="girls">البنات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">الفترة الزمنية</label>
                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الفترات</SelectItem>
                        <SelectItem value="daily">اليوم</SelectItem>
                        <SelectItem value="weekly">هذا الأسبوع</SelectItem>
                        <SelectItem value="monthly">هذا الشهر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-700 mb-1 font-semibold">المعلمون الغائبون</div>
                  <div className="text-4xl font-bold text-red-700">{stats.totalAbsentTeachers}</div>
                  <p className="text-xs text-gray-600 mt-2">
                    {selectedBranch === "all" ? "الفرعين" : branchNames[selectedBranch]} - 
                    {timeFilter === "daily" ? " اليوم" : timeFilter === "weekly" ? " هذا الأسبوع" : timeFilter === "monthly" ? " هذا الشهر" : " جميع الفترات"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-700 mb-1 font-semibold">المعلمون المتأخرون</div>
                  <div className="text-4xl font-bold text-orange-700">{stats.totalLateTeachers}</div>
                  <p className="text-xs text-gray-600 mt-2">
                    {selectedBranch === "all" ? "الفرعين" : branchNames[selectedBranch]} - 
                    {timeFilter === "daily" ? " اليوم" : timeFilter === "weekly" ? " هذا الأسبوع" : timeFilter === "monthly" ? " هذا الشهر" : " جميع الفترات"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-700 mb-1 font-semibold">المعلمون المغطون</div>
                  <div className="text-4xl font-bold text-green-700">{stats.totalCoveringTeachers}</div>
                  <p className="text-xs text-gray-600 mt-2">
                    {selectedBranch === "all" ? "الفرعين" : branchNames[selectedBranch]} - 
                    {timeFilter === "daily" ? " اليوم" : timeFilter === "weekly" ? " هذا الأسبوع" : timeFilter === "monthly" ? " هذا الشهر" : " جميع الفترات"}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-700 mb-1 font-semibold">الطلاب الغائبون</div>
                  <div className="text-4xl font-bold text-blue-700">{stats.totalAbsentStudents}</div>
                  <p className="text-xs text-gray-600 mt-2">
                    {selectedBranch === "all" ? "الفرعين" : branchNames[selectedBranch]} - 
                    {timeFilter === "daily" ? " اليوم" : timeFilter === "weekly" ? " هذا الأسبوع" : timeFilter === "monthly" ? " هذا الشهر" : " جميع الفترات"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Averages */}
            <Card>
              <CardHeader>
                <CardTitle>متوسط الأداء العام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="stat-card bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-cyan-500">
                    <div className="text-sm text-gray-700 mb-1 font-semibold">انضباط الطلاب</div>
                    <div className="text-3xl font-bold text-cyan-700">{stats.avgDiscipline}/10</div>
                  </div>
                  <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                    <div className="text-sm text-gray-700 mb-1 font-semibold">نظافة الفصول</div>
                    <div className="text-3xl font-bold text-blue-700">{stats.avgCleanliness}/10</div>
                  </div>
                  <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                    <div className="text-sm text-gray-700 mb-1 font-semibold">التزام المعلمين</div>
                    <div className="text-3xl font-bold text-purple-700">{stats.avgAttendance}/10</div>
                  </div>
                  <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                    <div className="text-sm text-gray-700 mb-1 font-semibold">السلوك العام</div>
                    <div className="text-3xl font-bold text-green-700">{stats.avgBehavior}/10</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-700 mb-1 font-semibold">الحوادث والمخالفات</div>
                  <div className="text-4xl font-bold text-yellow-700">{stats.totalIncidents}</div>
                  <p className="text-xs text-gray-600 mt-2">إجمالي الحوادث المسجلة</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-700 mb-1 font-semibold">عدد التقارير</div>
                  <div className="text-4xl font-bold text-purple-700">{stats.totalReports}</div>
                  <p className="text-xs text-gray-600 mt-2">تقارير المشرفين</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <div className="space-y-6">
            {/* Employee Selector */}
            <Card>
              <CardHeader>
                <CardTitle>اختر موظف لعرض تقاريره</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">الفرع</label>
                  <Select value={selectedBranch} onValueChange={(value) => {
                    setSelectedBranch(value);
                    setSelectedEmployee("all");
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الفروع</SelectItem>
                      <SelectItem value="boys">البنين</SelectItem>
                      <SelectItem value="girls">البنات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">الموظف</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر موظف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الموظفين</SelectItem>
                      {users
                        .filter(u => 
                          ["director", "vice_principal", "supervisor", "activities", "educational_supervision", "social_specialist", "quality"].includes(u.role) &&
                          (selectedBranch === "all" || u.branch === selectedBranch)
                        )
                        .map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.username} - {roleNames[u.role]} - {branchNames[u.branch]}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Reports List - Same as Director Dashboard */}
            {selectedEmployee !== "all" && employeeReports.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">
                  التقارير ({employeeReports.length})
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {employeeReports.map((report) => (
                    <Card
                      key={report.id}
                      className="report-card hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedReport(report);
                        setReportType(report.date ? "supervisor" : report.week_start ? "vice_principal" : "other");
                        setShowReportModal(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800">
                              {report.date ? `تقرير مشرف - ${new Date(report.date).toLocaleDateString("ar-SA")}` :
                               report.week_start ? `تقرير وكيل - من ${new Date(report.week_start).toLocaleDateString("ar-SA")} إلى ${new Date(report.week_end).toLocaleDateString("ar-SA")}` :
                               "تقرير"}
                            </h4>
                            <p className="text-sm text-gray-500">
                              تم الإنشاء: {new Date(report.created_at).toLocaleString("ar-SA")}
                            </p>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReport(report);
                              setReportType(report.date ? "supervisor" : report.week_start ? "vice_principal" : "other");
                              setShowReportModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4 ml-1" />
                            عرض
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Report Modal - Same content as Director Dashboard */}
          <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedReport && (reportType === "supervisor" ? 
                    `تقرير مشرف - ${new Date(selectedReport.date).toLocaleDateString("ar-SA", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` :
                    reportType === "vice_principal" ?
                    `تقرير وكيل` : "تقرير"
                  )}
                </DialogTitle>
              </DialogHeader>

              {/* Same modal content as DirectorDashboard */}
              {selectedReport && reportType === "supervisor" && (
                <div className="space-y-6 p-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-4">المؤشرات الرئيسية</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="stat-card bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-cyan-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">انضباط الطلاب</div>
                        <div className="text-3xl font-bold text-cyan-700">{selectedReport.student_discipline}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">نظافة الفصول</div>
                        <div className="text-3xl font-bold text-blue-700">{selectedReport.classroom_cleanliness}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">التزام المعلمين</div>
                        <div className="text-3xl font-bold text-purple-700">{selectedReport.teacher_attendance_rate}/10</div>
                      </div>
                      <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                        <div className="text-sm text-gray-700 mb-1 font-semibold">السلوك العام</div>
                        <div className="text-3xl font-bold text-green-700">{selectedReport.general_behavior}/10</div>
                      </div>
                    </div>
                  </div>

                  {/* Teacher Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(selectedReport.late_teachers?.length > 0 || selectedReport.absent_teachers?.length > 0 || selectedReport.covering_teachers?.length > 0) && (
                      <div className="space-y-3">
                        <h4 className="text-md font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">بيانات المعلمين</h4>
                        
                        {selectedReport.late_teachers && selectedReport.late_teachers.length > 0 && (
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="text-sm font-bold text-orange-800 mb-2">
                              المعلمون المتأخرون ({selectedReport.late_teachers.length})
                            </div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {selectedReport.late_teachers.map((lt, i) => (
                                <li key={i}>• <strong>{lt.teacher}</strong> - {lt.subject} - حصة {lt.period}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {selectedReport.absent_teachers && selectedReport.absent_teachers.length > 0 && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="text-sm font-bold text-red-800 mb-2">
                              المعلمون الغائبون ({selectedReport.absent_teachers.length})
                            </div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {selectedReport.absent_teachers.map((at, i) => (
                                <li key={i}>• <strong>{at.teacher}</strong> - {at.subject} - حصة {at.period}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {selectedReport.covering_teachers && selectedReport.covering_teachers.length > 0 && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="text-sm font-bold text-green-800 mb-2">
                              المعلمون المغطون ({selectedReport.covering_teachers.length})
                            </div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {selectedReport.covering_teachers.map((ct, i) => (
                                <li key={i}>• <strong>{ct.teacher}</strong> - {ct.subject} - حصة {ct.period}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Other Info */}
                    <div className="space-y-3">
                      <h4 className="text-md font-bold text-gray-800 mb-3 border-b-2 border-gray-200 pb-2">معلومات إضافية</h4>
                      
                      {selectedReport.incidents && selectedReport.incidents.length > 0 && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-sm font-bold text-yellow-800 mb-2">
                            الحوادث والمخالفات ({selectedReport.incidents.length})
                          </div>
                          <div className="space-y-2">
                            {selectedReport.incidents.map((inc, i) => (
                              <div key={i} className="text-sm bg-white p-2 rounded">
                                <p className="font-semibold text-gray-800">{inc.description}</p>
                                <p className="text-gray-600 text-xs mt-1">الإجراء: {inc.action}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {selectedReport.general_notes && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-sm font-bold text-gray-800 mb-2">ملاحظات عامة</div>
                          <p className="text-sm text-gray-700 leading-relaxed">{selectedReport.general_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ChairmanDashboard;