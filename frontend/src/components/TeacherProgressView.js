import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";
import { toast } from "sonner";
import pdfMake from "@digicole/pdfmake-rtl";
import pdfMakeFonts from "../fonts/vfs_fonts";

const TeacherProgressView = ({ branch = null }) => {
  const [reports, setReports] = useState([]);
  const [teacherProgress, setTeacherProgress] = useState([]);
  const [allTeacherProgress, setAllTeacherProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState("all");

  useEffect(() => {
    fetchReportsAndCalculateProgress();
  }, [branch]);

  const fetchReportsAndCalculateProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/reports/educational-supervision`);
      let allReports = response.data;
      
      // Filter by branch if specified
      if (branch) {
        allReports = allReports.filter(r => r.branch === branch);
      }
      
      // Group evaluations by teacher
      const teacherMap = {};
      
      allReports.forEach(report => {
        report.teacher_evaluations?.forEach(eval_item => {
          if (!teacherMap[eval_item.teacher_id]) {
            teacherMap[eval_item.teacher_id] = {
              teacher_id: eval_item.teacher_id,
              teacher_name: eval_item.teacher_name,
              evaluations: []
            };
          }
          
          teacherMap[eval_item.teacher_id].evaluations.push({
            date: report.date,
            planning: eval_item.planning,
            performance: eval_item.performance,
            time_management: eval_item.time_management,
            goal_achievement: eval_item.goal_achievement,
            average: (eval_item.planning + eval_item.performance + 
                     eval_item.time_management + eval_item.goal_achievement) / 4,
            uses_strategies: eval_item.uses_strategies === "yes",
            strengths: eval_item.strengths,
            needs_support: eval_item.needs_support
          });
        });
      });
      
      // Calculate progress for each teacher
      const progressData = Object.values(teacherMap).map(teacher => {
        teacher.evaluations.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let improvement = 0;
        let trend = "stable";
        if (teacher.evaluations.length > 1) {
          const first = teacher.evaluations[0].average;
          const last = teacher.evaluations[teacher.evaluations.length - 1].average;
          improvement = ((last - first) / first * 100).toFixed(1);
          
          if (improvement > 5) trend = "up";
          else if (improvement < -5) trend = "down";
        }
        
        return {
          ...teacher,
          improvement: parseFloat(improvement),
          trend,
          evaluationCount: teacher.evaluations.length,
          currentAverage: teacher.evaluations[teacher.evaluations.length - 1]?.average.toFixed(1) || 0,
          firstAverage: teacher.evaluations[0]?.average.toFixed(1) || 0
        };
      });
      
      progressData.sort((a, b) => b.improvement - a.improvement);
      
      setReports(allReports);
      setAllTeacherProgress(progressData);
      setTeacherProgress(progressData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeacher === "all") {
      setTeacherProgress(allTeacherProgress);
    } else {
      const filtered = allTeacherProgress.filter(t => t.teacher_id === selectedTeacher);
      setTeacherProgress(filtered);
    }
  }, [selectedTeacher, allTeacherProgress]);

  const exportToPDF = (teacher = null) => {
    if (pdfMakeFonts) {
      pdfMake.vfs = pdfMakeFonts;
    }
    
    pdfMake.fonts = {
      Cairo: {
        normal: 'Cairo-Regular.ttf',
        bold: 'Cairo-Regular.ttf',
        italics: 'Cairo-Regular.ttf',
        bolditalics: 'Cairo-Regular.ttf'
      },
      Roboto: {
        normal: 'Cairo-Regular.ttf',
        bold: 'Cairo-Regular.ttf',
        italics: 'Cairo-Regular.ttf',
        bolditalics: 'Cairo-Regular.ttf'
      },
      Nillima: {
        normal: 'Cairo-Regular.ttf',
        bold: 'Cairo-Regular.ttf',
        italics: 'Cairo-Regular.ttf',
        bolditalics: 'Cairo-Regular.ttf'
      }
    };

    const teachersToExport = teacher ? [teacher] : teacherProgress;
    const content = [];

    // Header
    content.push({
      text: teacher ? 'تقرير تقييم تحسن المعلم' : 'تقرير تقييم تحسن المعلمين',
      style: 'header',
      alignment: 'center',
      margin: [0, 0, 0, 20]
    });

    // Summary if multiple teachers
    if (!teacher && teacherProgress.length > 1) {
      content.push({
        text: 'ملخص عام',
        style: 'sectionHeader',
        margin: [0, 10, 0, 10]
      });
      
      content.push({
        columns: [
          {
            width: '33%',
            stack: [
              { text: 'معلمون محسّنون', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
              { text: teacherProgress.filter(t => t.trend === 'up').length.toString(), fontSize: 24, bold: true, color: '#16a34a' }
            ],
            alignment: 'center'
          },
          {
            width: '34%',
            stack: [
              { text: 'معلمون مستقرون', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
              { text: teacherProgress.filter(t => t.trend === 'stable').length.toString(), fontSize: 24, bold: true, color: '#ca8a04' }
            ],
            alignment: 'center'
          },
          {
            width: '33%',
            stack: [
              { text: 'يحتاجون دعم', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
              { text: teacherProgress.filter(t => t.trend === 'down').length.toString(), fontSize: 24, bold: true, color: '#dc2626' }
            ],
            alignment: 'center'
          }
        ],
        margin: [0, 0, 0, 20]
      });
    }

    // Each teacher details
    teachersToExport.forEach((t, idx) => {
      if (idx > 0) {
        content.push({ text: '', pageBreak: 'before' });
      }

      const evaluationRows = t.evaluations.map((eval_item, evalIdx) => [
        { text: (evalIdx + 1).toString(), alignment: 'center' },
        { text: new Date(eval_item.date).toLocaleDateString('ar-SA'), alignment: 'center' },
        { text: eval_item.planning.toString(), alignment: 'center' },
        { text: eval_item.performance.toString(), alignment: 'center' },
        { text: eval_item.time_management.toString(), alignment: 'center' },
        { text: eval_item.goal_achievement.toString(), alignment: 'center' },
        { text: eval_item.average.toFixed(1), alignment: 'center', bold: true }
      ]);

      content.push(
        {
          text: t.teacher_name,
          style: 'sectionHeader',
          margin: [0, 15, 0, 10]
        },
        {
          columns: [
            {
              width: '33%',
              stack: [
                { text: 'التقييم الأول', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
                { text: `${t.firstAverage}/10`, fontSize: 20, bold: true, color: '#2563eb' }
              ],
              alignment: 'center'
            },
            {
              width: '34%',
              stack: [
                { text: 'التقييم الحالي', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
                { text: `${t.currentAverage}/10`, fontSize: 20, bold: true, color: '#16a34a' }
              ],
              alignment: 'center'
            },
            {
              width: '33%',
              stack: [
                { text: 'نسبة التحسن', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
                { 
                  text: `${t.improvement > 0 ? '+' : ''}${t.improvement}%`, 
                  fontSize: 20, 
                  bold: true, 
                  color: t.trend === 'up' ? '#16a34a' : t.trend === 'down' ? '#dc2626' : '#ca8a04'
                }
              ],
              alignment: 'center'
            }
          ],
          margin: [0, 0, 0, 15]
        },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [
              [
                { text: '#', style: 'tableHeader', alignment: 'center' },
                { text: 'التاريخ', style: 'tableHeader', alignment: 'center' },
                { text: 'التخطيط', style: 'tableHeader', alignment: 'center' },
                { text: 'الأداء', style: 'tableHeader', alignment: 'center' },
                { text: 'إدارة الوقت', style: 'tableHeader', alignment: 'center' },
                { text: 'الأهداف', style: 'tableHeader', alignment: 'center' },
                { text: 'المتوسط', style: 'tableHeader', alignment: 'center' }
              ],
              ...evaluationRows
            ]
          },
          layout: {
            fillColor: function (rowIndex) {
              return (rowIndex === 0) ? '#2563eb' : (rowIndex % 2 === 0) ? '#f3f4f6' : null;
            }
          },
          margin: [0, 0, 0, 15]
        }
      );
    });

    content.push({
      styles: {
        header: { fontSize: 18, bold: true, color: '#1e40af' },
        sectionHeader: { fontSize: 14, bold: true, color: '#2563eb' },
        tableHeader: { bold: true, fontSize: 10, color: 'white' }
      }
    });

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: { font: 'Cairo', fontSize: 11, direction: 'rtl', alignment: 'right' },
      content: content,
      styles: {
        header: { fontSize: 18, bold: true, color: '#1e40af' },
        sectionHeader: { fontSize: 14, bold: true, color: '#2563eb' },
        tableHeader: { bold: true, fontSize: 10, color: 'white' }
      }
    };

    pdfMake.createPdf(docDefinition).download(
      teacher ? `تقرير_تحسن_${teacher.teacher_name}.pdf` : 'تقرير_تحسن_جميع_المعلمين.pdf'
    );
    toast.success("تم تصدير التقرير بنجاح");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  if (allTeacherProgress.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">لا توجد بيانات تقييم حتى الآن</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter and Export */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Label className="font-semibold">تصفية حسب المعلم:</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعلمين ({allTeacherProgress.length})</SelectItem>
                  {allTeacherProgress.map((teacher) => (
                    <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                      {teacher.teacher_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => exportToPDF()}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileText className="w-4 h-4 ml-2" />
              تصدير الكل PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="text-sm text-gray-700 mb-1">معلمون محسّنون</div>
            <div className="text-3xl font-bold text-green-700">
              {teacherProgress.filter(t => t.trend === "up").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500">
          <CardContent className="p-6">
            <div className="text-sm text-gray-700 mb-1">معلمون مستقرون</div>
            <div className="text-3xl font-bold text-yellow-700">
              {teacherProgress.filter(t => t.trend === "stable").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
          <CardContent className="p-6">
            <div className="text-sm text-gray-700 mb-1">يحتاجون دعم</div>
            <div className="text-3xl font-bold text-red-700">
              {teacherProgress.filter(t => t.trend === "down").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Progress Cards */}
      <div className="grid gap-4">
        {teacherProgress.map((teacher) => (
          <Card key={teacher.teacher_id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{teacher.teacher_name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    عدد التقييمات: {teacher.evaluationCount}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {teacher.trend === "up" && <TrendingUp className="w-5 h-5 text-green-600" />}
                      {teacher.trend === "down" && <TrendingDown className="w-5 h-5 text-red-600" />}
                      {teacher.trend === "stable" && <Minus className="w-5 h-5 text-yellow-600" />}
                      <span className={`text-lg font-bold ${
                        teacher.trend === "up" ? "text-green-600" : 
                        teacher.trend === "down" ? "text-red-600" : 
                        "text-yellow-600"
                      }`}>
                        {teacher.improvement > 0 ? "+" : ""}{teacher.improvement}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">نسبة التحسن</p>
                  </div>
                  <Button
                    onClick={() => exportToPDF(teacher)}
                    size="sm"
                    variant="outline"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <FileText className="w-4 h-4 ml-1" />
                    تصدير PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={teacher.evaluations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} style={{ fontSize: '10px' }} />
                    <YAxis domain={[0, 10]} />
                    <Tooltip labelFormatter={(value) => formatDate(value)} />
                    <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={2} name="المتوسط" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">التقييم الأول</p>
                  <p className="text-2xl font-bold text-blue-600">{teacher.firstAverage}/10</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">التقييم الحالي</p>
                  <p className="text-2xl font-bold text-green-600">{teacher.currentAverage}/10</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeacherProgressView;
