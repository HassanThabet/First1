import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

const ActivitySupervisorsView = ({ compact = false, timeFilter = 'all', customStartDate = '', customEndDate = '' }) => {
  const [supervisorsData, setSupervisorsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivitySupervisors();
  }, [timeFilter, customStartDate, customEndDate]);

  const fetchActivitySupervisors = async () => {
    try {
      setLoading(true);
      
      // Fetch activities reports and teachers
      const [activitiesRes, teachersRes] = await Promise.all([
        axios.get(`${API}/reports/activities`),
        axios.get(`${API}/teachers`)
      ]);

      let activities = activitiesRes.data;
      const teachers = teachersRes.data;

      // Apply time filter
      if (timeFilter !== 'all') {
        activities = activities.filter(report => {
          if (!report.activities || report.activities.length === 0) return false;
          
          // Get the earliest activity date in the report
          const activityDates = report.activities.map(a => new Date(a.date)).filter(d => !isNaN(d));
          if (activityDates.length === 0) return false;
          
          const reportDate = activityDates[0];
          const now = new Date();
          
          if (timeFilter === 'today') {
            return reportDate.toDateString() === now.toDateString();
          } else if (timeFilter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return reportDate >= weekAgo && reportDate <= now;
          } else if (timeFilter === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return reportDate >= monthAgo && reportDate <= now;
          } else if (timeFilter === 'custom' && customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            return reportDate >= start && reportDate <= end;
          }
          
          return true;
        });
      }

      // Create a map to count activities per teacher
      const supervisorMap = new Map();

      activities.forEach(report => {
        if (report.activities && Array.isArray(report.activities)) {
          report.activities.forEach(activity => {
            if (activity.supervisors && Array.isArray(activity.supervisors)) {
              activity.supervisors.forEach(teacherId => {
                const teacher = teachers.find(t => t.id === teacherId);
                if (teacher) {
                  if (!supervisorMap.has(teacherId)) {
                    supervisorMap.set(teacherId, {
                      id: teacherId,
                      name: teacher.name,
                      count: 0,
                      activities: []
                    });
                  }
                  const data = supervisorMap.get(teacherId);
                  data.count += 1;
                  data.activities.push({
                    name: activity.activity_name,
                    date: report.week_start,
                    reporterName: report.userName
                  });
                }
              });
            }
          });
        }
      });

      // Convert map to array and sort by count
      const supervisorsArray = Array.from(supervisorMap.values())
        .sort((a, b) => b.count - a.count);

      setSupervisorsData(supervisorsArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching activity supervisors:', error);
      toast.error('فشل تحميل بيانات المشرفين على الأنشطة');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        جاري التحميل...
      </div>
    );
  }

  if (supervisorsData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        لا توجد بيانات عن المشرفين على الأنشطة
      </div>
    );
  }

  // Compact view - show only top 10
  if (compact) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-purple-100">
              <th className="border border-gray-300 px-4 py-2 text-right">#</th>
              <th className="border border-gray-300 px-4 py-2 text-right">اسم المعلم</th>
              <th className="border border-gray-300 px-4 py-2 text-center">عدد الأنشطة</th>
            </tr>
          </thead>
          <tbody>
            {supervisorsData.slice(0, 10).map((supervisor, index) => (
              <tr key={supervisor.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-2 text-right">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{supervisor.name}</td>
                <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-purple-600">
                  {supervisor.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {supervisorsData.length > 10 && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            عرض أفضل 10 من أصل {supervisorsData.length} معلم
          </p>
        )}
      </div>
    );
  }

  // Full view - show all with details
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-purple-100">
              <th className="border border-gray-300 px-4 py-2 text-right">#</th>
              <th className="border border-gray-300 px-4 py-2 text-right">اسم المعلم</th>
              <th className="border border-gray-300 px-4 py-2 text-center">عدد الأنشطة</th>
              <th className="border border-gray-300 px-4 py-2 text-right">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {supervisorsData.map((supervisor, index) => (
              <tr key={supervisor.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-2 text-right">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-2 text-right font-medium">{supervisor.name}</td>
                <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-purple-600">
                  {supervisor.count}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  <details className="cursor-pointer">
                    <summary className="text-blue-600 hover:text-blue-800">
                      عرض الأنشطة ({supervisor.activities.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600 pr-4">
                      {supervisor.activities.map((activity, idx) => (
                        <li key={idx} className="border-r-2 border-purple-300 pr-2">
                          <span className="font-medium">{activity.name}</span>
                          <span className="text-gray-500 text-xs mr-2">
                            ({activity.date})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-800 mb-2">📊 ملخص إحصائي</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">إجمالي المشرفين:</span>
            <span className="font-bold text-purple-600 mr-2">{supervisorsData.length}</span>
          </div>
          <div>
            <span className="text-gray-600">إجمالي الأنشطة:</span>
            <span className="font-bold text-purple-600 mr-2">
              {supervisorsData.reduce((sum, s) => sum + s.count, 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">متوسط الأنشطة لكل معلم:</span>
            <span className="font-bold text-purple-600 mr-2">
              {(supervisorsData.reduce((sum, s) => sum + s.count, 0) / supervisorsData.length).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivitySupervisorsView;
