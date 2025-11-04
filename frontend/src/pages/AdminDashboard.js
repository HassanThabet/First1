import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import DashboardLayout from "../components/DashboardLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users, BookOpen, School, Key } from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // Form states
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    role: "supervisor",
    branch: "boys",
    assigned_to: ""
  });

  const [teacherForm, setTeacherForm] = useState({
    name: "",
    subject: "",
    branch: "boys"
  });

  const [subjectForm, setSubjectForm] = useState({
    name: ""
  });

  const [classroomForm, setClassroomForm] = useState({
    name: "",
    section: "",
    branch: "boys"
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      switch (activeTab) {
        case "users":
          const usersRes = await axios.get(`${API}/users`);
          setUsers(usersRes.data);
          break;
        case "teachers":
          const teachersRes = await axios.get(`${API}/teachers`);
          setTeachers(teachersRes.data);
          break;
        case "subjects":
          const subjectsRes = await axios.get(`${API}/subjects`);
          setSubjects(subjectsRes.data);
          break;
        case "classrooms":
          const classroomsRes = await axios.get(`${API}/classrooms`);
          setClassrooms(classroomsRes.data);
          break;
      }
    } catch (error) {
      toast.error("فشل تحميل البيانات");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await axios.put(`${API}/users/${editingItem.id}`, userForm);
        toast.success("تم تحديث المستخدم بنجاح");
      } else {
        await axios.post(`${API}/users`, userForm);
        toast.success("تم إنشاء المستخدم بنجاح");
      }
      setDialogOpen(false);
      setEditingItem(null);
      setUserForm({ username: "", password: "", role: "supervisor", branch: "boys", assigned_to: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل العملية");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      try {
        await axios.delete(`${API}/users/${id}`);
        toast.success("تم حذف المستخدم بنجاح");
        fetchData();
      } catch (error) {
        toast.error("فشل حذف المستخدم");
      }
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await axios.put(`${API}/teachers/${editingItem.id}`, teacherForm);
        toast.success("تم تحديث المعلم بنجاح");
      } else {
        await axios.post(`${API}/teachers`, teacherForm);
        toast.success("تم إضافة المعلم بنجاح");
      }
      setDialogOpen(false);
      setEditingItem(null);
      setTeacherForm({ name: "", subject: "", branch: "boys" });
      fetchData();
    } catch (error) {
      toast.error("فشل العملية");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المعلم؟")) {
      try {
        await axios.delete(`${API}/teachers/${id}`);
        toast.success("تم حذف المعلم بنجاح");
        fetchData();
      } catch (error) {
        toast.error("فشل حذف المعلم");
      }
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await axios.put(`${API}/subjects/${editingItem.id}`, subjectForm);
        toast.success("تم تحديث المادة بنجاح");
      } else {
        await axios.post(`${API}/subjects`, subjectForm);
        toast.success("تم إضافة المادة بنجاح");
      }
      setDialogOpen(false);
      setEditingItem(null);
      setSubjectForm({ name: "" });
      fetchData();
    } catch (error) {
      toast.error("فشل العملية");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المادة؟")) {
      try {
        await axios.delete(`${API}/subjects/${id}`);
        toast.success("تم حذف المادة بنجاح");
        fetchData();
      } catch (error) {
        toast.error("فشل حذف المادة");
      }
    }
  };

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await axios.put(`${API}/classrooms/${editingItem.id}`, classroomForm);
        toast.success("تم تحديث الصف بنجاح");
      } else {
        await axios.post(`${API}/classrooms`, classroomForm);
        toast.success("تم إضافة الصف بنجاح");
      }
      setDialogOpen(false);
      setEditingItem(null);
      setClassroomForm({ name: "", section: "", branch: "boys" });
      fetchData();
    } catch (error) {
      toast.error("فشل العملية");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClassroom = async (id) => {
    if (window.confirm("هل أنت متأكد من حذف هذا الصف؟")) {
      try {
        await axios.delete(`${API}/classrooms/${id}`);
        toast.success("تم حذف الصف بنجاح");
        fetchData();
      } catch (error) {
        toast.error("فشل حذف الصف");
      }
    }
  };

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
    <DashboardLayout title="لوحة تحكم المدير العام">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="users" data-testid="users-tab" className="flex items-center space-x-2 space-x-reverse">
            <Users className="w-4 h-4" />
            <span>المستخدمون</span>
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center space-x-2 space-x-reverse">
            <Users className="w-4 h-4" />
            <span>المعلمون</span>
          </TabsTrigger>
          <TabsTrigger value="subjects" className="flex items-center space-x-2 space-x-reverse">
            <BookOpen className="w-4 h-4" />
            <span>المواد</span>
          </TabsTrigger>
          <TabsTrigger value="classrooms" className="flex items-center space-x-2 space-x-reverse">
            <School className="w-4 h-4" />
            <span>الصفوف</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>إدارة المستخدمين</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingItem(null);
                      setUserForm({ username: "", password: "", role: "supervisor", branch: "boys", assigned_to: "" });
                    }} data-testid="add-user-button">
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة مستخدم
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div>
                        <Label>اسم المستخدم</Label>
                        <Input
                          value={userForm.username}
                          onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                          required
                          data-testid="user-username-input"
                        />
                      </div>
                      <div>
                        <Label>كلمة المرور</Label>
                        {editingItem && (
                          <p className="text-xs text-gray-500 mb-1">اتركها فارغة للاحتفاظ بكلمة المرور الحالية</p>
                        )}
                        <Input
                          type="password"
                          placeholder={editingItem ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          required={!editingItem}
                          data-testid="user-password-input"
                        />
                      </div>
                      <div>
                        <Label>الدور</Label>
                        <Select value={userForm.role} onValueChange={(value) => {
                          // When selecting chairman, automatically set branch to "both"
                          if (value === "chairman") {
                            setUserForm({ ...userForm, role: value, branch: "both" });
                          } else {
                            // For other roles, keep the current branch or reset to "boys"
                            setUserForm({ ...userForm, role: value, branch: userForm.branch === "both" ? "boys" : userForm.branch });
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chairman">رئيس مجلس الإدارة</SelectItem>
                            <SelectItem value="director">المدير</SelectItem>
                            <SelectItem value="vice_principal">الوكيل</SelectItem>
                            <SelectItem value="supervisor">المشرف</SelectItem>
                            <SelectItem value="activities">الأنشطة</SelectItem>
                            <SelectItem value="educational_supervision">الإشراف التربوي</SelectItem>
                            <SelectItem value="social_specialist">الأخصائي الاجتماعي</SelectItem>
                            <SelectItem value="quality">الجودة</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {userForm.role !== "chairman" && (
                        <div>
                          <Label>الفرع</Label>
                          <Select value={userForm.branch} onValueChange={(value) => setUserForm({ ...userForm, branch: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="boys">البنين</SelectItem>
                              <SelectItem value="girls">البنات</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {userForm.role === "chairman" && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>ℹ️ ملاحظة:</strong> رئيس مجلس الإدارة له صلاحية الوصول لكلا الفرعين (البنين والبنات) تلقائياً
                          </p>
                        </div>
                      )}
                      {userForm.role === "supervisor" && (
                        <div>
                          <Label>الوكيل المسؤول</Label>
                          <Select value={userForm.assigned_to} onValueChange={(value) => setUserForm({ ...userForm, assigned_to: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الوكيل" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.filter(u => u.role === "vice_principal" && u.branch === userForm.branch).map(vp => (
                                <SelectItem key={vp.id} value={vp.id}>{vp.username}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Button type="submit" disabled={loading} className="w-full" data-testid="save-user-button">
                        {loading ? "جاري الحفظ..." : editingItem ? "تحديث" : "إضافة"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-800">{user.username}</div>
                      <div className="text-sm text-gray-600">
                        {roleNames[user.role]} - {branchNames[user.branch]}
                      </div>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(user);
                          setUserForm({
                            username: user.username,
                            password: "",
                            role: user.role,
                            branch: user.branch,
                            assigned_to: user.assigned_to || ""
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>إدارة المعلمين</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingItem(null);
                      setTeacherForm({ name: "", subject: "", branch: "boys" });
                    }}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة معلم
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "تعديل معلم" : "إضافة معلم جديد"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTeacher} className="space-y-4">
                      <div>
                        <Label>اسم المعلم</Label>
                        <Input
                          value={teacherForm.name}
                          onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>المادة</Label>
                        <Select value={teacherForm.subject} onValueChange={(value) => setTeacherForm({ ...teacherForm, subject: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المادة" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map(subject => (
                              <SelectItem key={subject.id} value={subject.name}>{subject.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>الفرع</Label>
                        <Select value={teacherForm.branch} onValueChange={(value) => setTeacherForm({ ...teacherForm, branch: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="boys">البنين</SelectItem>
                            <SelectItem value="girls">البنات</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "جاري الحفظ..." : editingItem ? "تحديث" : "إضافة"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-800">{teacher.name}</div>
                      <div className="text-sm text-gray-600">
                        {teacher.subject} - {branchNames[teacher.branch]}
                      </div>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(teacher);
                          setTeacherForm({ name: teacher.name, subject: teacher.subject, branch: teacher.branch });
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTeacher(teacher.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subjects Tab */}
        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>إدارة المواد الدراسية</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingItem(null);
                      setSubjectForm({ name: "" });
                    }}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة مادة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "تعديل مادة" : "إضافة مادة جديدة"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubject} className="space-y-4">
                      <div>
                        <Label>اسم المادة</Label>
                        <Input
                          value={subjectForm.name}
                          onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "جاري الحفظ..." : editingItem ? "تحديث" : "إضافة"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-800">{subject.name}</div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(subject);
                          setSubjectForm({ name: subject.name });
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSubject(subject.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classrooms Tab */}
        <TabsContent value="classrooms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>إدارة الصفوف</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingItem(null);
                      setClassroomForm({ name: "", section: "", branch: "boys" });
                    }}>
                      <Plus className="w-4 h-4 ml-2" />
                      إضافة صف
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "تعديل صف" : "إضافة صف جديد"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateClassroom} className="space-y-4">
                      <div>
                        <Label>اسم الصف</Label>
                        <Input
                          value={classroomForm.name}
                          onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
                          required
                          placeholder="مثال: الصف الأول"
                        />
                      </div>
                      <div>
                        <Label>الشعبة</Label>
                        <Input
                          value={classroomForm.section}
                          onChange={(e) => setClassroomForm({ ...classroomForm, section: e.target.value })}
                          required
                          placeholder="مثال: أ"
                        />
                      </div>
                      <div>
                        <Label>الفرع</Label>
                        <Select value={classroomForm.branch} onValueChange={(value) => setClassroomForm({ ...classroomForm, branch: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="boys">البنين</SelectItem>
                            <SelectItem value="girls">البنات</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "جاري الحفظ..." : editingItem ? "تحديث" : "إضافة"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {classrooms.map((classroom) => (
                  <div key={classroom.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-800">{classroom.name} - {classroom.section}</div>
                      <div className="text-sm text-gray-600">{branchNames[classroom.branch]}</div>
                    </div>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(classroom);
                          setClassroomForm({ name: classroom.name, section: classroom.section, branch: classroom.branch });
                          setDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClassroom(classroom.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminDashboard;
