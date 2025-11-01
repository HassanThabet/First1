import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import { Eye, BarChart3, Users as UsersIcon, TrendingUp, FileDown } from "lucide-react";
import pdfMake from '../utils/pdfConfig';

const DirectorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [users, setUsers] = useState([]);
  const [supervisorReports, setSupervisorReports] = useState([]);
  const [vicePrincipalReports, setVicePrincipalReports] = useState([]);
  const [activitiesReports, setActivitiesReports] = useState([]);
  const [socialReports, setSocialReports] = useState([]);
  const [qualityReports, setQualityReports] = useState([]);
  
  // Filter states
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedVPForStats, setSelectedVPForStats] = useState("all"); // For overview tab
  const [timeFilter, setTimeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("all"); // all, supervisor, activities, social, quality, educational
  
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
      const [usersRes, supervisorRes, vpRes, activitiesRes, socialRes, qualityRes] = await Promise.all([
        axios.get(`${API}/users`),
        axios.get(`${API}/reports/supervisor`),
        axios.get(`${API}/reports/vice-principal`),
        axios.get(`${API}/reports/activities`),
        axios.get(`${API}/reports/social-specialist`),
        axios.get(`${API}/reports/quality`)
      ]);
      
      // Filter users by branch
      const branchUsers = usersRes.data.filter(u => u.branch === user.branch);
      setUsers(branchUsers);
      
      // Filter reports by branch
      setSupervisorReports(supervisorRes.data.filter(r => r.branch === user.branch));
      setVicePrincipalReports(vpRes.data.filter(r => r.branch === user.branch));
      setActivitiesReports(activitiesRes.data.filter(r => r.branch === user.branch));
      setSocialReports(socialRes.data.filter(r => r.branch === user.branch));
      setQualityReports(qualityRes.data.filter(r => r.branch === user.branch));
    } catch (error) {
      toast.error("فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to filter reports by time
  const filterReportsByTime = (reports) => {
    const today = new Date();
    
    if (timeFilter === "daily") {
      const todayStr = today.toISOString().split('T')[0];
      return reports.filter(r => r.date === todayStr);
    } else if (timeFilter === "weekly") {
      const currentDay = today.getDay();
      const daysFromSaturday = currentDay === 6 ? 0 : currentDay + 1;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysFromSaturday);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 4);
      weekEnd.setHours(23, 59, 59, 999);
      
      return reports.filter(r => {
        const reportDate = new Date(r.date);
        return reportDate >= weekStart && reportDate <= weekEnd;
      });
    } else if (timeFilter === "monthly") {
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      return reports.filter(r => {
        const reportDate = new Date(r.date);
        return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
      });
    }
    
    return reports;
  };

  // Calculate overall statistics
  const getOverallStatistics = () => {
    let filteredSupervisorReports = [...supervisorReports];
    let filteredActivitiesReports = [...activitiesReports];
    let filteredSocialReports = [...socialReports];
    let filteredQualityReports = [...qualityReports];
    
    // Filter by selected Vice Principal if chosen
    if (selectedVPForStats !== "all") {
      const supervisorsUnderVP = users.filter(u => 
        u.role === "supervisor" && 
        u.assigned_to === selectedVPForStats &&
        u.branch === user.branch
      );
      const supervisorIds = supervisorsUnderVP.map(s => s.id);
      filteredSupervisorReports = filteredSupervisorReports.filter(r => supervisorIds.includes(r.user_id));
    }
    
    // Apply time filter to all report types
    filteredSupervisorReports = filterReportsByTime(filteredSupervisorReports);
    filteredActivitiesReports = filterReportsByTime(filteredActivitiesReports);
    filteredSocialReports = filterReportsByTime(filteredSocialReports);
    filteredQualityReports = filterReportsByTime(filteredQualityReports);

    // Supervisor statistics
    const totalLateTeachers = filteredSupervisorReports.reduce((sum, r) => sum + (r.late_teachers?.length || 0), 0);
    const totalAbsentTeachers = filteredSupervisorReports.reduce((sum, r) => sum + (r.absent_teachers?.length || 0), 0);
    const totalCoveringTeachers = filteredSupervisorReports.reduce((sum, r) => sum + (r.covering_teachers?.length || 0), 0);
    const totalIncidents = filteredSupervisorReports.reduce((sum, r) => sum + (r.incidents?.length || 0), 0);
    const totalAbsentStudents = filteredSupervisorReports.reduce((sum, r) => sum + (r.absent_students_count || 0), 0);
    
    const avgDiscipline = filteredSupervisorReports.length > 0 ? 
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.student_discipline || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;
    const avgCleanliness = filteredSupervisorReports.length > 0 ?
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.classroom_cleanliness || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;
    const avgAttendance = filteredSupervisorReports.length > 0 ?
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.teacher_attendance_rate || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;
    const avgBehavior = filteredSupervisorReports.length > 0 ?
      (filteredSupervisorReports.reduce((sum, r) => sum + (r.general_behavior || 0), 0) / filteredSupervisorReports.length).toFixed(1) : 0;

    // Activities statistics
    const totalActivities = filteredActivitiesReports.reduce((sum, r) => sum + (r.activities?.length || 0), 0);
    const totalActivitiesParticipants = filteredActivitiesReports.reduce((sum, r) => {
      return sum + (r.activities || []).reduce((aSum, a) => aSum + (a.participants_count || 0), 0);
    }, 0);
    const avgActivitiesInteraction = filteredActivitiesReports.length > 0 ? 
      (filteredActivitiesReports.reduce((sum, r) => {
        const activities = r.activities || [];
        const avgInteraction = activities.length > 0 ? 
          activities.reduce((aSum, a) => aSum + (a.interaction_rate || 0), 0) / activities.length : 0;
        return sum + avgInteraction;
      }, 0) / filteredActivitiesReports.length).toFixed(1) : 0;

    // Social Specialist statistics
    const totalPsychologicalCases = filteredSocialReports.reduce((sum, r) => sum + (r.psychological_cases || 0), 0);
    const totalAcademicCases = filteredSocialReports.reduce((sum, r) => sum + (r.academic_cases || 0), 0);
    const totalBehavioralCases = filteredSocialReports.reduce((sum, r) => sum + (r.behavioral_cases || 0), 0);
    const totalStudentCases = totalPsychologicalCases + totalAcademicCases + totalBehavioralCases;
    const totalSessions = filteredSocialReports.reduce((sum, r) => sum + (r.sessions_count || 0), 0);
    const totalFamilyContacts = filteredSocialReports.reduce((sum, r) => sum + (r.family_contacts || 0), 0);

    // Quality statistics
    const totalQualityVisits = filteredQualityReports.length;
    const avgQualityTeachingRate = filteredQualityReports.length > 0 ?
      (filteredQualityReports.reduce((sum, r) => sum + (r.teaching_performance_rate || 0), 0) / filteredQualityReports.length).toFixed(1) : 0;

    let supervisorCount = 0;
    if (selectedVPForStats !== "all") {
      supervisorCount = users.filter(u => 
        u.role === "supervisor" && 
        u.assigned_to === selectedVPForStats &&
        u.branch === user.branch
      ).length;
    }

    return {
      // Supervisor stats
      totalLateTeachers,
      totalAbsentTeachers,
      totalCoveringTeachers,
      totalIncidents,
      totalAbsentStudents,
      avgDiscipline,
      avgCleanliness,
      avgAttendance,
      avgBehavior,
      supervisorReportsCount: filteredSupervisorReports.length,
      supervisorCount,
      
      // Activities stats
      totalActivities,
      totalActivitiesParticipants,
      avgActivitiesInteraction,
      activitiesReportsCount: filteredActivitiesReports.length,
      
      // Social Specialist stats
      totalStudentCases,
      totalPsychologicalCases,
      totalAcademicCases,
      totalBehavioralCases,
      totalSessions,
      totalFamilyContacts,
      socialReportsCount: filteredSocialReports.length,
      
      // Quality stats
      totalQualityVisits,
      avgQualityTeachingRate,
      qualityReportsCount: filteredQualityReports.length,
      
      // Total
      totalAllReports: filteredSupervisorReports.length + filteredActivitiesReports.length + 
                       filteredSocialReports.length + filteredQualityReports.length
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
      // Get VP reports and all supervisor reports under this VP
      const vpReports = vicePrincipalReports.filter(r => r.user_id === employee.id);
      const supervisorsUnderVP = users.filter(u => u.role === "supervisor" && u.assigned_to === employee.id);
      const supervisorIds = supervisorsUnderVP.map(s => s.id);
      const supervisorReportsUnderVP = supervisorReports.filter(r => supervisorIds.includes(r.user_id));
      
      reports = [...vpReports, ...supervisorReportsUnderVP];
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
    vice_principal: "الوكيل",
    supervisor: "المشرف",
    activities: "الأنشطة",
    social_specialist: "الأخصائي الاجتماعي",
    quality: "الجودة"
  };

  return (
    <DashboardLayout title="لوحة تحكم المدير">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2 space-x-reverse">
            <BarChart3 className="w-4 h-4" />
            <span>الإحصائيات الإجمالية</span>
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center space-x-2 space-x-reverse">
            <UsersIcon className="w-4 h-4" />
            <span>تقارير الموظفين</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Time Filter */}
            <Card>
              <CardHeader>
                <CardTitle>التصفية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">الفرع</label>
                    <Input 
                      value={user.branch === "boys" ? "البنين" : "البنات"} 
                      disabled 
                      className="bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">الوكيل</label>
                    <Select value={selectedVPForStats} onValueChange={setSelectedVPForStats}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الوكلاء</SelectItem>
                        {users
                          .filter(u => u.role === "vice_principal" && u.branch === user.branch)
                          .map(vp => (
                            <SelectItem key={vp.id} value={vp.id}>
                              {vp.username}
                            </SelectItem>
                          ))}
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
                
                {selectedVPForStats !== "all" && stats.supervisorCount > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>📊 الإحصائيات الحالية:</strong> تعرض بيانات {stats.supervisorCount} مشرف تابع للوكيل المختار
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-700 mb-1 font-semibold">المعلمون الغائبون</div>
                  <div className="text-4xl font-bold text-red-700">{stats.totalAbsentTeachers}</div>
                  <p className="text-xs text-gray-600 mt-2">خلال {timeFilter === "daily" ? "اليوم" : timeFilter === "weekly" ? "الأسبوع" : timeFilter === "monthly" ? "الشهر" : "جميع الفترات"}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-700 mb-1 font-semibold">المعلمون المتأخرون</div>
                  <div className="text-4xl font-bold text-orange-700">{stats.totalLateTeachers}</div>
                  <p className="text-xs text-gray-600 mt-2">خلال {timeFilter === "daily" ? "اليوم" : timeFilter === "weekly" ? "الأسبوع" : timeFilter === "monthly" ? "الشهر" : "جميع الفترات"}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-700 mb-1 font-semibold">المعلمون المغطون</div>
                  <div className="text-4xl font-bold text-green-700">{stats.totalCoveringTeachers}</div>
                  <p className="text-xs text-gray-600 mt-2">خلال {timeFilter === "daily" ? "اليوم" : timeFilter === "weekly" ? "الأسبوع" : timeFilter === "monthly" ? "الشهر" : "جميع الفترات"}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                <CardContent className="p-6">
                  <div className="text-sm text-gray-700 mb-1 font-semibold">الطلاب الغائبون</div>
                  <div className="text-4xl font-bold text-blue-700">{stats.totalAbsentStudents}</div>
                  <p className="text-xs text-gray-600 mt-2">خلال {timeFilter === "daily" ? "اليوم" : timeFilter === "weekly" ? "الأسبوع" : timeFilter === "monthly" ? "الشهر" : "جميع الفترات"}</p>
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
              <CardContent>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر موظف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الموظفين</SelectItem>
                    {users.filter(u => ["vice_principal", "supervisor", "activities", "social_specialist", "quality"].includes(u.role)).map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.username} - {roleNames[u.role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Reports List */}
            {selectedEmployee !== "all" && (
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

          {/* Report Detail Modal */}
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

              {selectedReport && reportType === "supervisor" && (
                <div className="space-y-6 p-4">
                  {/* Same content as SupervisorDashboard modal */}
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

                  {/* Teacher Details - Same as supervisor modal */}
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
                      
                      {selectedReport.absent_students_count > 0 && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-sm font-bold text-blue-800">عدد الطلاب الغائبين</div>
                          <div className="text-2xl font-bold text-blue-600 mt-1">
                            {selectedReport.absent_students_count} طالب
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

              {selectedReport && reportType === "vice_principal" && (
                <div className="space-y-6 p-4">
                  {selectedReport.problems && selectedReport.problems.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                        المشاكل ({selectedReport.problems.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedReport.problems.map((problem, i) => (
                          <div key={i} className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800 mb-2">{problem.description}</p>
                                <div className="bg-white p-2 rounded">
                                  <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-gray-800">الإجراءات المتخذة:</span> {problem.actions}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedReport.suggestions && selectedReport.suggestions.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">
                        الاقتراحات ({selectedReport.suggestions.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedReport.suggestions.map((suggestion, i) => (
                          <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {i + 1}
                              </div>
                              <p className="flex-1 text-gray-800">{suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DirectorDashboard;