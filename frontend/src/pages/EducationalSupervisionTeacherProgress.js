import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "../App";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";
import { toast } from "sonner";
import pdfMake from "@digicole/pdfmake-rtl";
import pdfMakeFonts from "../fonts/vfs_fonts";

const EducationalSupervisionTeacherProgress = () => {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [teacherProgress, setTeacherProgress] = useState([]);
  const [allTeacherProgress, setAllTeacherProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState("all");

  useEffect(() => {
    fetchReportsAndCalculateProgress();
  }, []);

  const fetchReportsAndCalculateProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/reports/educational-supervision`);
      const allReports = response.data;
      
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
        // Sort evaluations by date
        teacher.evaluations.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate improvement
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
      
      // Sort by improvement
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

  // Filter teachers based on selection
  useEffect(() => {
    if (selectedTeacher === "all") {
      setTeacherProgress(allTeacherProgress);
    } else {
      const filtered = allTeacherProgress.filter(t => t.teacher_id === selectedTeacher);
      setTeacherProgress(filtered);
    }
  }, [selectedTeacher, allTeacherProgress]);

  // Export teacher progress to PDF
  const exportToPDF = (teacher) => {
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

    // Prepare evaluation data for table
    const evaluationRows = teacher.evaluations.map((eval_item, idx) => [
      { text: (idx + 1).toString(), alignment: 'center' },
      { text: formatDate(eval_item.date), alignment: 'center' },
      { text: eval_item.planning.toString(), alignment: 'center' },
      { text: eval_item.performance.toString(), alignment: 'center' },
      { text: eval_item.time_management.toString(), alignment: 'center' },
      { text: eval_item.goal_achievement.toString(), alignment: 'center' },
      { text: eval_item.average.toFixed(1), alignment: 'center', bold: true }
    ]);

    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: 'Cairo',
        fontSize: 11,
        direction: 'rtl',
        alignment: 'right'
      },
      content: [
        {
          text: 'تقرير تقييم تحسن المعلم',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        {
          columns: [
            {
              width: '50%',
              text: [
                { text: 'المعلم: ', bold: true },
                { text: teacher.teacher_name }
              ]
            },
            {
              width: '50%',
              text: [
                { text: 'عدد التقييمات: ', bold: true },
                { text: teacher.evaluationCount.toString() }
              ],
              alignment: 'left'
            }
          ],
          margin: [0, 0, 0, 15]
        },
        {
          text: 'ملخص الأداء',
          style: 'sectionHeader',
          margin: [0, 10, 0, 10]
        },
        {
          columns: [
            {
              width: '33%',
              stack: [
                { text: 'التقييم الأول', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
                { text: `${teacher.firstAverage}/10`, fontSize: 24, bold: true, color: '#2563eb' }
              ],
              alignment: 'center'
            },
            {
              width: '34%',
              stack: [
                { text: 'التقييم الحالي', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
                { text: `${teacher.currentAverage}/10`, fontSize: 24, bold: true, color: '#16a34a' }
              ],
              alignment: 'center'
            },
            {
              width: '33%',
              stack: [
                { text: 'نسبة التحسن', fontSize: 10, color: '#666', margin: [0, 0, 0, 5] },
                { 
                  text: `${teacher.improvement > 0 ? '+' : ''}${teacher.improvement}%`, 
                  fontSize: 24, 
                  bold: true, 
                  color: teacher.trend === 'up' ? '#16a34a' : teacher.trend === 'down' ? '#dc2626' : '#ca8a04'
                }
              ],
              alignment: 'center'
            }
          ],
          margin: [0, 0, 0, 20]
        },
        {
          text: 'جدول التقييمات التفصيلي',
          style: 'sectionHeader',
          margin: [0, 15, 0, 10]
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
            },
            hLineWidth: function () { return 1; },
            vLineWidth: function () { return 1; },
            hLineColor: function () { return '#e5e7eb'; },
            vLineColor: function () { return '#e5e7eb'; }
          },
          margin: [0, 0, 0, 20]
        },
        {
          text: 'التقييم النوعي (آخر تقرير)',
          style: 'sectionHeader',
          margin: [0, 15, 0, 10]
        },
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: 'نقاط القوة', fontSize: 12, bold: true, color: '#16a34a', margin: [0, 0, 0, 5] },
                { 
                  text: teacher.evaluations[teacher.evaluations.length - 1]?.strengths || 'لا يوجد', 
                  fontSize: 10,
                  background: '#f0fdf4',
                  margin: [5, 5, 5, 5]
                }
              ]
            },
            {
              width: '50%',
              stack: [
                { text: 'نقاط التطوير', fontSize: 12, bold: true, color: '#ea580c', margin: [0, 0, 0, 5] },
                { 
                  text: teacher.evaluations[teacher.evaluations.length - 1]?.needs_support || 'لا يوجد', 
                  fontSize: 10,
                  background: '#fff7ed',
                  margin: [5, 5, 5, 5]
                }
              ]
            }
          ]
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: '#1e40af'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#2563eb'
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'white'
        }
      }
    };

    pdfMake.createPdf(docDefinition).download(`تقرير_تحسن_${teacher.teacher_name}.pdf`);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">تقييم تحسن المعلمين</h2>
        <div className="text-sm text-gray-600">
          عدد المعلمين المقيّمين: {allTeacherProgress.length}
        </div>
      </div>

      {/* Filter */}
      {allTeacherProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="font-semibold">تصفية حسب المعلم:</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعلمين</SelectItem>
                  {allTeacherProgress.map((teacher) => (
                    <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                      {teacher.teacher_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTeacher === "all" && (
                <span className="text-sm text-gray-600">
                  (عرض {teacherProgress.length} معلم)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {teacherProgress.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">لا توجد بيانات تقييم حتى الآن</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <CardContent className="p-6">
                <div className="text-sm text-gray-700 mb-1">معلمون محسّنون</div>
                <div className="text-3xl font-bold text-green-700">
                  {teacherProgress.filter(t => t.trend === "up").length}
                </div>
                <p className="text-xs text-gray-600 mt-1">نسبة تحسن إيجابية</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500">
              <CardContent className="p-6">
                <div className="text-sm text-gray-700 mb-1">معلمون مستقرون</div>
                <div className="text-3xl font-bold text-yellow-700">
                  {teacherProgress.filter(t => t.trend === "stable").length}
                </div>
                <p className="text-xs text-gray-600 mt-1">أداء ثابت</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
              <CardContent className="p-6">
                <div className="text-sm text-gray-700 mb-1">يحتاجون دعم</div>
                <div className="text-3xl font-bold text-red-700">
                  {teacherProgress.filter(t => t.trend === "down").length}
                </div>
                <p className="text-xs text-gray-600 mt-1">نسبة تراجع</p>
              </CardContent>
            </Card>
          </div>

          {/* Teacher Progress Cards */}
          <div className="grid gap-4">
            {teacherProgress.map((teacher, index) => (
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Line Chart */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">منحنى التحسن</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={teacher.evaluations}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={formatDate}
                            style={{ fontSize: '10px' }}
                          />
                          <YAxis domain={[0, 10]} />
                          <Tooltip 
                            labelFormatter={(value) => formatDate(value)}
                            formatter={(value) => [`${value.toFixed(1)}/10`, 'المتوسط']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="average" 
                            stroke="#2563eb" 
                            strokeWidth={2}
                            dot={{ fill: '#2563eb', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Radar Chart - Latest Evaluation */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3">التقييم الأخير</h4>
                      {teacher.evaluations.length > 0 && (
                        <ResponsiveContainer width="100%" height={200}>
                          <RadarChart data={[
                            { metric: 'التخطيط', value: teacher.evaluations[teacher.evaluations.length - 1].planning },
                            { metric: 'الأداء', value: teacher.evaluations[teacher.evaluations.length - 1].performance },
                            { metric: 'إدارة الوقت', value: teacher.evaluations[teacher.evaluations.length - 1].time_management },
                            { metric: 'تحقيق الأهداف', value: teacher.evaluations[teacher.evaluations.length - 1].goal_achievement }
                          ]}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="metric" style={{ fontSize: '11px' }} />
                            <PolarRadiusAxis domain={[0, 10]} />
                            <Radar dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.5} />
                          </RadarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-600">التقييم الأول</p>
                      <p className="text-2xl font-bold text-blue-600">{teacher.firstAverage}/10</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-600">التقييم الحالي</p>
                      <p className="text-2xl font-bold text-green-600">{teacher.currentAverage}/10</p>
                    </div>
                  </div>

                  {/* Latest Notes */}
                  {teacher.evaluations.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-green-800 mb-1">نقاط القوة:</p>
                        <p className="text-xs text-gray-700">
                          {teacher.evaluations[teacher.evaluations.length - 1].strengths}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-orange-800 mb-1">نقاط التطوير:</p>
                        <p className="text-xs text-gray-700">
                          {teacher.evaluations[teacher.evaluations.length - 1].needs_support}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EducationalSupervisionTeacherProgress;
