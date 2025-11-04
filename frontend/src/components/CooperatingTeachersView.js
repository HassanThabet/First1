import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';

const CooperatingTeachersView = ({ compact = false }) => {
  const [cooperatingData, setCooperatingData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCooperatingTeachers();
  }, []);

  const fetchCooperatingTeachers = async () => {
    try {
      setLoading(true);
      
      // Fetch activities reports and teachers
      const [activitiesRes, teachersRes] = await Promise.all([
        axios.get(`${API}/reports/activities`),
        axios.get(`${API}/teachers`)
      ]);

      const activities = activitiesRes.data;
      const teachers = teachersRes.data;

      // Create a map to count activities per cooperating teacher
      const cooperatingMap = new Map();

      activities.forEach(report => {
        if (report.activities && Array.isArray(report.activities)) {
          report.activities.forEach(activity => {
            if (activity.cooperating_teachers && Array.isArray(activity.cooperating_teachers)) {
              activity.cooperating_teachers.forEach(teacherId => {
                const teacher = teachers.find(t => t.id === teacherId);
                if (teacher) {
                  if (!cooperatingMap.has(teacherId)) {
                    cooperatingMap.set(teacherId, {
                      id: teacherId,
                      name: teacher.name,
                      count: 0,
                      activities: []
                    });
                  }
                  const data = cooperatingMap.get(teacherId);
                  data.count += 1;
                  data.activities.push({
                    name: activity.activity_name || activity.name,
                    date: report.week_start || activity.date,
                    reporterName: report.userName
                  });
                }
              });
            }
          });
        }
      });

      // Convert map to array and sort by count
      const cooperatingArray = Array.from(cooperatingMap.values())
        .sort((a, b) => b.count - a.count);

      setCooperatingData(cooperatingArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cooperating teachers:', error);
      toast.error('فشل تحميل بيانات المعلمين المتعاونين');
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

  if (cooperatingData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        لا توجد بيانات عن المعلمين المتعاونين
      </div>
    );
  }

  // Compact view - show only top 10
  if (compact) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-orange-100">
              <th className="border border-gray-300 px-4 py-2 text-right">#</th>
              <th className="border border-gray-300 px-4 py-2 text-right">اسم المعلم</th>
              <th className="border border-gray-300 px-4 py-2 text-center">عدد الأنشطة</th>
            </tr>
          </thead>
          <tbody>
            {cooperatingData.slice(0, 10).map((teacher, index) => (
              <tr key={teacher.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-2 text-right">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{teacher.name}</td>
                <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-orange-600">
                  {teacher.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cooperatingData.length > 10 && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            عرض أفضل 10 من أصل {cooperatingData.length} معلم
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
            <tr className="bg-orange-100">
              <th className="border border-gray-300 px-4 py-2 text-right">#</th>
              <th className="border border-gray-300 px-4 py-2 text-right">اسم المعلم</th>
              <th className="border border-gray-300 px-4 py-2 text-center">عدد الأنشطة</th>
              <th className="border border-gray-300 px-4 py-2 text-right">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {cooperatingData.map((teacher, index) => (
              <tr key={teacher.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-2 text-right">{index + 1}</td>
                <td className="border border-gray-300 px-4 py-2 text-right font-medium">{teacher.name}</td>
                <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-orange-600">
                  {teacher.count}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-right">
                  <details className="cursor-pointer">
                    <summary className="text-blue-600 hover:text-blue-800">
                      عرض الأنشطة ({teacher.activities.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600 pr-4">
                      {teacher.activities.map((activity, idx) => (
                        <li key={idx} className="border-r-2 border-orange-300 pr-2">
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
      
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-semibold text-orange-800 mb-2">📊 ملخص إحصائي</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">إجمالي المعلمين المتعاونين:</span>
            <span className="font-bold text-orange-600 mr-2">{cooperatingData.length}</span>
          </div>
          <div>
            <span className="text-gray-600">إجمالي الأنشطة:</span>
            <span className="font-bold text-orange-600 mr-2">
              {cooperatingData.reduce((sum, t) => sum + t.count, 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">متوسط الأنشطة لكل معلم:</span>
            <span className="font-bold text-orange-600 mr-2">
              {(cooperatingData.reduce((sum, t) => sum + t.count, 0) / cooperatingData.length).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CooperatingTeachersView;
