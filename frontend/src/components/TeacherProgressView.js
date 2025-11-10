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

const TeacherProgressView = ({ branch = null, compact = false }) => {
  const [reports, setReports] = useState([]);
  const [teacherProgress, setTeacherProgress] = useState([]);
  const [allTeacherProgress, setAllTeacherProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  const [expandedTeachers, setExpandedTeachers] = useState({});

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
            supervisor_name: report.supervisor_name || report.created_by_name || "غير محدد",
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
        // Sort evaluations from oldest to newest first for calculations
        const sortedEvals = [...teacher.evaluations].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        let improvement = 0;
        let trend = "stable";
        let previousAverage = 0;
        if (sortedEvals.length > 1) {
          const first = sortedEvals[0].average;
          const last = sortedEvals[sortedEvals.length - 1].average;
          previousAverage = sortedEvals.length > 1 ? sortedEvals[sortedEvals.length - 2].average : first;
          improvement = ((last - first) / first * 100).toFixed(1);
          
          if (improvement > 5) trend = "up";
          else if (improvement < -5) trend = "down";
        }
        
        // Now reverse the order for display (newest to oldest)
        teacher.evaluations = sortedEvals.reverse();
        
        return {
          ...teacher,
          improvement: parseFloat(improvement),
          trend,
          evaluationCount: teacher.evaluations.length,
          currentAverage: sortedEvals[0]?.average.toFixed(1) || 0,
          firstAverage: sortedEvals[sortedEvals.length - 1]?.average.toFixed(1) || 0,
          previousAverage: previousAverage.toFixed(1)
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
          text: 'ملخص التقييمات',
          style: 'sectionHeader',
          margin: [0, 10, 0, 10],
          fontSize: 12
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

      // Add detailed evaluations
      content.push({
        text: 'التقييمات التفصيلية',
        style: 'sectionHeader',
        margin: [0, 15, 0, 10],
        fontSize: 12
      });

      t.evaluations.forEach((eval_item, evalIdx) => {
        content.push(
          {
            text: `التقييم #${evalIdx + 1} - ${new Date(eval_item.date).toLocaleDateString('ar-SA')}`,
            fontSize: 11,
            bold: true,
            color: '#2563eb',
            margin: [0, 10, 0, 5]
          },
          {
            table: {
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'التخطيط', bold: true, fillColor: '#dbeafe', alignment: 'center' },
                  { text: 'الأداء', bold: true, fillColor: '#dcfce7', alignment: 'center' },
                  { text: 'إدارة الوقت', bold: true, fillColor: '#f3e8ff', alignment: 'center' },
                  { text: 'تحقيق الأهداف', bold: true, fillColor: '#fed7aa', alignment: 'center' }
                ],
                [
                  { text: `${eval_item.planning}/10`, alignment: 'center', fontSize: 12, bold: true },
                  { text: `${eval_item.performance}/10`, alignment: 'center', fontSize: 12, bold: true },
                  { text: `${eval_item.time_management}/10`, alignment: 'center', fontSize: 12, bold: true },
                  { text: `${eval_item.goal_achievement}/10`, alignment: 'center', fontSize: 12, bold: true }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => '#e5e7eb',
              vLineColor: () => '#e5e7eb'
            },
            margin: [0, 0, 0, 5]
          },
          {
            table: {
              widths: ['*'],
              body: [
                [{ text: 'المعدل', bold: true, fillColor: '#cffafe', alignment: 'center' }],
                [{ text: `${eval_item.average.toFixed(1)}/10`, alignment: 'center', fontSize: 14, bold: true, color: '#0891b2' }]
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => '#e5e7eb',
              vLineColor: () => '#e5e7eb'
            },
            margin: [0, 0, 0, 5]
          },
          {
            table: {
              widths: ['*'],
              body: [
                [{ text: 'استخدام استراتيجيات تعليمية', bold: true, fillColor: '#fef3c7', alignment: 'center' }],
                [{ 
                  text: eval_item.uses_strategies ? 'نعم ✓' : 'لا ✗', 
                  alignment: 'center', 
                  fontSize: 11, 
                  bold: true,
                  color: eval_item.uses_strategies ? '#16a34a' : '#dc2626'
                }]
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => '#e5e7eb',
              vLineColor: () => '#e5e7eb'
            },
            margin: [0, 0, 0, 5]
          }
        );

        if (eval_item.strengths) {
          content.push({
            table: {
              widths: ['*'],
              body: [
                [{ text: '💪 نقاط القوة', bold: true, fillColor: '#dcfce7', alignment: 'right' }],
                [{ text: eval_item.strengths || '-', alignment: 'right', fontSize: 10 }]
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => '#e5e7eb',
              vLineColor: () => '#e5e7eb'
            },
            margin: [0, 0, 0, 5]
          });
        }

        if (eval_item.needs_support) {
          content.push({
            table: {
              widths: ['*'],
              body: [
                [{ text: '🎯 نقاط تحتاج دعم', bold: true, fillColor: '#fecaca', alignment: 'right' }],
                [{ text: eval_item.needs_support || '-', alignment: 'right', fontSize: 10 }]
              ]
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => '#e5e7eb',
              vLineColor: () => '#e5e7eb'
            },
            margin: [0, 0, 0, 10]
          });
        }
      });
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

  const toggleTeacherDetails = (teacherId) => {
    setExpandedTeachers(prev => ({
      ...prev,
      [teacherId]: !prev[teacherId]
    }));
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

  // Compact view for dashboard
  if (compact) {
    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
            <CardContent className="p-4">
              <div className="text-xs text-gray-700 mb-1">معلمون محسّنون</div>
              <div className="text-2xl font-bold text-green-700">
                {allTeacherProgress.filter(t => t.trend === "up").length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500">
            <CardContent className="p-4">
              <div className="text-xs text-gray-700 mb-1">معلمون مستقرون</div>
              <div className="text-2xl font-bold text-yellow-700">
                {allTeacherProgress.filter(t => t.trend === "stable").length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
            <CardContent className="p-4">
              <div className="text-xs text-gray-700 mb-1">يحتاجون دعم</div>
              <div className="text-2xl font-bold text-red-700">
                {allTeacherProgress.filter(t => t.trend === "down").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top 3 Teachers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allTeacherProgress.slice(0, 3).map((teacher) => (
            <Card key={teacher.teacher_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm">{teacher.teacher_name}</h4>
                  <div className="flex items-center gap-1">
                    {teacher.trend === "up" && <TrendingUp className="w-4 h-4 text-green-600" />}
                    {teacher.trend === "down" && <TrendingDown className="w-4 h-4 text-red-600" />}
                    {teacher.trend === "stable" && <Minus className="w-4 h-4 text-yellow-600" />}
                    <span className={`text-sm font-bold ${
                      teacher.trend === "up" ? "text-green-600" : 
                      teacher.trend === "down" ? "text-red-600" : 
                      "text-yellow-600"
                    }`}>
                      {teacher.improvement > 0 ? "+" : ""}{teacher.improvement}%
                    </span>
                  </div>
                </div>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={teacher.evaluations}>
                      <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={2} dot={false} />
                      <YAxis domain={[0, 10]} hide />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-gray-600">أول: {teacher.firstAverage}/10</span>
                  <span className="text-gray-900 font-bold">حالي: {teacher.currentAverage}/10</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Filter and Export */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <Label className="font-semibold whitespace-nowrap">تصفية حسب المعلم:</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
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
              className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
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

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">التقييم الأول</p>
                  <p className="text-2xl font-bold text-blue-600">{teacher.firstAverage}/10</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">التقييم الحالي</p>
                  <p className="text-2xl font-bold text-green-600">{teacher.currentAverage}/10</p>
                </div>
              </div>

              {/* All Evaluations Details */}
              <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-bold text-sm text-cyan-900">📋 جميع التقييمات التفصيلية:</h5>
                  <Button
                    onClick={() => toggleTeacherDetails(teacher.teacher_id)}
                    size="sm"
                    variant="outline"
                    className="text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50"
                  >
                    {expandedTeachers[teacher.teacher_id] ? '▲ إخفاء التفاصيل' : '▼ عرض التفاصيل'}
                  </Button>
                </div>
                
                {expandedTeachers[teacher.teacher_id] && (
                  <div className="space-y-3">
                    {teacher.evaluations.map((eval_item, evalIdx) => (
                      <div key={`eval-detail-${evalIdx}`} className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg border-2 border-cyan-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-cyan-900">التقييم #{evalIdx + 1}</span>
                          <span className="text-xs text-gray-600">{new Date(eval_item.date).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <div className="mb-3">
                          <span className="text-xs text-gray-500">المشرف التربوي: </span>
                          <span className="text-xs font-semibold text-blue-700">{eval_item.supervisor_name}</span>
                        </div>
                        
                        {/* Ratings Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                          <div className="bg-blue-50 p-2 rounded border border-blue-200">
                            <p className="text-xs text-blue-600 font-semibold">التخطيط</p>
                            <p className="text-lg font-bold text-blue-800">{eval_item.planning}/10</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded border border-green-200">
                            <p className="text-xs text-green-600 font-semibold">الأداء</p>
                            <p className="text-lg font-bold text-green-800">{eval_item.performance}/10</p>
                          </div>
                          <div className="bg-purple-50 p-2 rounded border border-purple-200">
                            <p className="text-xs text-purple-600 font-semibold">إدارة الوقت</p>
                            <p className="text-lg font-bold text-purple-800">{eval_item.time_management}/10</p>
                          </div>
                          <div className="bg-orange-50 p-2 rounded border border-orange-200">
                            <p className="text-xs text-orange-600 font-semibold">تحقيق الأهداف</p>
                            <p className="text-lg font-bold text-orange-800">{eval_item.goal_achievement}/10</p>
                          </div>
                        </div>

                        {/* Average */}
                        <div className="bg-gradient-to-r from-cyan-100 to-blue-100 p-2 rounded border-2 border-cyan-300 mb-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-cyan-900">المعدل:</span>
                            <span className="text-xl font-bold text-cyan-900">{eval_item.average.toFixed(1)}/10</span>
                          </div>
                        </div>

                        {/* Strategies */}
                        <div className="bg-yellow-50 p-2 rounded border border-yellow-200 mb-2">
                          <span className="text-xs font-semibold text-yellow-800">استخدام استراتيجيات تعليمية: </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            eval_item.uses_strategies ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                          }`}>
                            {eval_item.uses_strategies ? 'نعم ✓' : 'لا ✗'}
                          </span>
                        </div>

                        {/* Strengths */}
                        {eval_item.strengths && (
                          <div className="bg-green-50 p-2 rounded border border-green-200 mb-2">
                            <p className="text-xs font-semibold text-green-800 mb-1">💪 نقاط القوة:</p>
                            <p className="text-xs text-gray-800">{eval_item.strengths}</p>
                          </div>
                        )}

                        {/* Needs Support */}
                        {eval_item.needs_support && (
                          <div className="bg-red-50 p-2 rounded border border-red-200">
                            <p className="text-xs font-semibold text-red-800 mb-1">🎯 نقاط تحتاج دعم:</p>
                            <p className="text-xs text-gray-800">{eval_item.needs_support}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeacherProgressView;
