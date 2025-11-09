import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

const EducationalSupervisionCreateReport = ({ onReportCreated }) => {
  const { user } = useContext(AuthContext);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [teacherEvaluations, setTeacherEvaluations] = useState([
    {
      teacher_id: "",
      teacher_name: "",
      planning: 5,
      performance: 5,
      time_management: 5,
      goal_achievement: 5,
      uses_strategies: "no",
      strategies_notes: "",
      strengths: "",
      needs_support: ""
    }
  ]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API}/teachers`, {
        params: { branch: user.branch }
      });
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("فشل تحميل المعلمين");
    }
  };

  const addTeacherEvaluation = () => {
    setTeacherEvaluations([
      ...teacherEvaluations,
      {
        teacher_id: "",
        teacher_name: "",
        planning: 5,
        performance: 5,
        time_management: 5,
        goal_achievement: 5,
        uses_strategies: "no",
        strategies_notes: "",
        strengths: "",
        needs_support: ""
      }
    ]);
  };

  const removeTeacherEvaluation = (index) => {
    if (teacherEvaluations.length === 1) {
      toast.error("يجب أن يحتوي التقرير على معلم واحد على الأقل");
      return;
    }
    const updated = teacherEvaluations.filter((_, i) => i !== index);
    setTeacherEvaluations(updated);
  };

  const updateEvaluation = (index, field, value) => {
    const updated = [...teacherEvaluations];
    updated[index][field] = value;
    
    // If teacher_id changes, update teacher_name
    if (field === "teacher_id") {
      const teacher = teachers.find(t => t.id === value);
      updated[index].teacher_name = teacher ? teacher.name : "";
    }
    
    setTeacherEvaluations(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    for (let i = 0; i < teacherEvaluations.length; i++) {
      const eval_item = teacherEvaluations[i];
      if (!eval_item.teacher_id) {
        toast.error(`الرجاء اختيار معلم للتقييم رقم ${i + 1}`);
        return;
      }
      if (!eval_item.strengths || !eval_item.needs_support) {
        toast.error(`الرجاء تعبئة نقاط القوة ونقاط الدعم للمعلم ${eval_item.teacher_name}`);
        return;
      }
    }

    setLoading(true);
    try {
      await axios.post(`${API}/reports/educational-supervision`, {
        date: reportDate,
        teacher_evaluations: teacherEvaluations
      });
      
      toast.success("✅ تم إرسال التقرير بنجاح إلى المدير ورئيس مجلس الإدارة والجودة");
      
      // Reset form
      setReportDate(new Date().toISOString().split('T')[0]);
      setTeacherEvaluations([
        {
          teacher_id: "",
          teacher_name: "",
          planning: 5,
          performance: 5,
          time_management: 5,
          goal_achievement: 5,
          uses_strategies: "no",
          strategies_notes: "",
          strengths: "",
          needs_support: ""
        }
      ]);
      
      if (onReportCreated) {
        onReportCreated();
      }
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error("فشل في إنشاء التقرير");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">تقرير تقييم المعلمين - الإشراف التربوي</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Report Date */}
            <div className="mb-6">
              <Label>تاريخ التقرير *</Label>
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
                className="text-right"
              />
            </div>

            {/* Teacher Evaluations */}
            {teacherEvaluations.map((evaluation, index) => (
              <Card key={`evaluation-${index}-${evaluation.teacher_name || ''}`} className="relative border-2 border-blue-200">
                <CardHeader className="bg-blue-50">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">تقييم المعلم #{index + 1}</CardTitle>
                    {teacherEvaluations.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeTeacherEvaluation(index)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 mt-4">
                  {/* Teacher Selection */}
                  <div>
                    <Label>اختر المعلم *</Label>
                    <Select
                      value={evaluation.teacher_id}
                      onValueChange={(value) => updateEvaluation(index, "teacher_id", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر معلم" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name} - {teacher.subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Performance Ratings */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-semibold text-gray-800 mb-3">متوسط أداء المعلم (من 10)</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Planning */}
                      <div>
                        <Label>التخطيط: {evaluation.planning}/10</Label>
                        <Input
                          type="range"
                          min="0"
                          max="10"
                          value={evaluation.planning}
                          onChange={(e) => updateEvaluation(index, "planning", parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Performance */}
                      <div>
                        <Label>الأداء: {evaluation.performance}/10</Label>
                        <Input
                          type="range"
                          min="0"
                          max="10"
                          value={evaluation.performance}
                          onChange={(e) => updateEvaluation(index, "performance", parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Time Management */}
                      <div>
                        <Label>إدارة الوقت: {evaluation.time_management}/10</Label>
                        <Input
                          type="range"
                          min="0"
                          max="10"
                          value={evaluation.time_management}
                          onChange={(e) => updateEvaluation(index, "time_management", parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Goal Achievement */}
                      <div>
                        <Label>تحقيق الأهداف: {evaluation.goal_achievement}/10</Label>
                        <Input
                          type="range"
                          min="0"
                          max="10"
                          value={evaluation.goal_achievement}
                          onChange={(e) => updateEvaluation(index, "goal_achievement", parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Average */}
                    <div className="text-center bg-blue-100 p-3 rounded-lg">
                      <span className="font-bold text-blue-900">
                        المتوسط الكلي: {((evaluation.planning + evaluation.performance + evaluation.time_management + evaluation.goal_achievement) / 4).toFixed(1)}/10
                      </span>
                    </div>
                  </div>

                  {/* Strategies */}
                  <div className="bg-green-50 p-4 rounded-lg space-y-3">
                    <div>
                      <Label>هل استخدم استراتيجيات تدريس فعّالة؟</Label>
                      <Select
                        value={evaluation.uses_strategies}
                        onValueChange={(value) => updateEvaluation(index, "uses_strategies", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">نعم</SelectItem>
                          <SelectItem value="no">لا</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>ملاحظات حول الاستراتيجيات</Label>
                      <textarea
                        value={evaluation.strategies_notes}
                        onChange={(e) => updateEvaluation(index, "strategies_notes", e.target.value)}
                        rows={2}
                        className="w-full p-2 border rounded-md text-right"
                        placeholder="أضف ملاحظاتك هنا..."
                      />
                    </div>
                  </div>

                  {/* Strengths */}
                  <div>
                    <Label>نقاط القوة *</Label>
                    <textarea
                      value={evaluation.strengths}
                      onChange={(e) => updateEvaluation(index, "strengths", e.target.value)}
                      required
                      rows={3}
                      className="w-full p-3 border rounded-md text-right"
                      placeholder="اذكر نقاط القوة للمعلم..."
                    />
                  </div>

                  {/* Needs Support */}
                  <div>
                    <Label>نقاط تحتاج دعم وتطوير *</Label>
                    <textarea
                      value={evaluation.needs_support}
                      onChange={(e) => updateEvaluation(index, "needs_support", e.target.value)}
                      required
                      rows={3}
                      className="w-full p-3 border rounded-md text-right"
                      placeholder="اذكر النقاط التي تحتاج دعم وتطوير..."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Teacher Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={addTeacherEvaluation}
                variant="outline"
                className="border-blue-600 text-blue-600"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة معلم آخر للتقييم
              </Button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 ml-2" />
                {loading ? "جاري الحفظ..." : "حفظ وإرسال التقرير"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EducationalSupervisionCreateReport;
