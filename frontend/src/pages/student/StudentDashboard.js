import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { 
  GraduationCap, Calendar, BookOpen, DollarSign, Bell, 
  LogOut, TrendingUp, Award, Sun, Moon, Clipboard, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [studentData, setStudentData] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [marks, setMarks] = useState([]);
  const [fees, setFees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // First get student data
      const studentRes = await api.get('/students/me');
      const student = studentRes.data;
      setStudentData(student);

      // Then get other data using student_id
      if (student?.student_id) {
        const [attendanceRes, marksRes, feesRes, announcementsRes] = await Promise.all([
          api.get(`/attendance/student/${student.student_id}`),
          api.get(`/marks/student/${student.student_id}`),
          api.get(`/fees/student/${student.student_id}`),
          api.get('/announcements')
        ]);

        setAttendance(attendanceRes.data);
        setMarks(marksRes.data);
        setFees(feesRes.data);
        setAnnouncements(announcementsRes.data);

        if (student.class_name && student.section) {
          const timetableRes = await api.get(`/timetable/${student.class_name}/${student.section}`);
          setTimetable(timetableRes.data);
        }
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const copyStudentId = async () => {
    if (!studentData?.student_id) return;
    try {
      await navigator.clipboard.writeText(studentData.student_id);
      toast.success('Student ID copied');
    } catch (err) {
      console.error('copy failed', err);
      toast.error('Failed to copy Student ID');
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    try {
      const response = await api.post('/chat', { message: chatInput });
      const botMessage = { sender: 'bot', text: response.data.response };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );
  }

  const pendingFees = Array.isArray(fees) && fees.length > 0 
    ? fees.filter(f => f.payment_status === 'PENDING' || f.payment_status === 'PARTIAL')
    : [];
    
  const totalPendingAmount = pendingFees.length > 0 
    ? (pendingFees[0]?.pending_amount || pendingFees[0]?.pending || 0)
    : 0;
  
  const feeStatus = fees && fees.length > 0 
    ? fees[0]?.payment_status || 'PENDING'
    : 'PENDING';
  
  const averageMarks = marks.length > 0
    ? (marks.reduce((acc, m) => acc + (m.marks_obtained / m.total_marks * 100), 0) / marks.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-slate-900 dark:text-white" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Sadhana Memorial School</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-student">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setChatOpen(true)} data-testid="open-chat-button">
              <MessageCircle className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={handleLogout} data-testid="logout-button">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-slate-600 dark:text-slate-400 flex items-center gap-3">
            <span>Class: {studentData?.class_name} | Section: {studentData?.section} | Roll No: {studentData?.roll_number}</span>
            <span className="ml-2 text-sm font-mono">Student ID: {studentData?.student_id}</span>
            <button onClick={copyStudentId} aria-label="Copy student id" title="Copy student ID" className="ml-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" data-testid="copy-student-id">
              <Clipboard className="h-4 w-4 text-slate-700 dark:text-slate-200" />
            </button>
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: TrendingUp, label: 'Attendance', value: `${attendance?.percentage || 0}%`, color: 'bg-emerald-500', testId: 'attendance-card' },
            { icon: Award, label: 'Average Marks', value: `${averageMarks}%`, color: 'bg-orange-500', testId: 'marks-card' },
            { icon: BookOpen, label: 'Class', value: studentData?.class_name || 'N/A', color: 'bg-blue-500', testId: 'class-card' },
            { icon: DollarSign, label: 'Pending Fees', value: totalPendingAmount > 0 ? `₹${Number(totalPendingAmount).toLocaleString()}` : '₹0', color: feeStatus === 'PAID' ? 'bg-green-500' : 'bg-slate-700 dark:bg-slate-600', testId: 'fees-card' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6" data-testid={stat.testId}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6" data-testid="announcements-section">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-slate-900 dark:text-white" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Announcements</h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {announcements.length > 0 ? announcements.map((announcement, index) => (
                <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`announcement-${index}`}>
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm">{announcement.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{announcement.content}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-500">No announcements</p>
              )}
            </div>
          </Card>

          <Card className="p-6" data-testid="marks-section">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-slate-900 dark:text-white" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Marks</h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {marks.slice(0, 5).map((mark, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`mark-${index}`}>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{mark.subject}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{mark.exam_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{mark.marks_obtained}/{mark.total_marks}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{mark.grade || 'N/A'}</p>
                  </div>
                </div>
              ))}
              {marks.length === 0 && <p className="text-sm text-slate-500">No marks available</p>}
            </div>
          </Card>

          <Card className="p-6" data-testid="fees-section">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-slate-900 dark:text-white" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Fee Status</h3>
            </div>
            <div className="space-y-3">
              {fees && Object.keys(fees).length > 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`fee-details`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white text-sm">Academic Year: {fees.academic_year || '2025-2026'}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Status: {fees.payment_status || 'PENDING'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${(fees.payment_status === 'PAID') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : (fees.payment_status === 'PARTIAL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300')}`}>
                      {fees.payment_status || 'PENDING'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                    <div className="bg-white dark:bg-slate-700 p-3 rounded">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Amount</p>
                      <p className="font-bold text-slate-900 dark:text-white">₹{Number(fees.total_fee_amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-700 p-3 rounded">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Paid</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{Number(fees.paid_amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-700 p-3 rounded">
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Pending</p>
                      <p className={`font-bold ${(fees.pending_amount === 0 || fees.payment_status === 'PAID') ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {fees.pending_amount === 0 || fees.payment_status === 'PAID' ? '₹0' : `₹${Number(fees.pending_amount || 0).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  {fees.payment_history && fees.payment_history.length > 0 && (
                    <div className="mt-4 border-t border-slate-200 dark:border-slate-600 pt-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Payment History</p>
                      <div className="space-y-2">
                        {fees.payment_history.slice(0, 3).map((payment, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span>{payment.date || 'N/A'}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">₹{Number(payment.amount || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">No fees information available</p>
              )}
            </div>
          </Card>

          <Card className="p-6" data-testid="timetable-section">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-slate-900 dark:text-white" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Timetable</h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {timetable.length > 0 ? timetable.map((day, index) => (
                <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`timetable-${index}`}>
                  <h4 className="font-medium text-slate-900 dark:text-white text-sm mb-2">{day.day}</h4>
                  <div className="space-y-1">
                    {day.periods?.slice(0, 3).map((period, idx) => (
                      <p key={idx} className="text-xs text-slate-600 dark:text-slate-400">
                        {period.time}: {period.subject} - {period.faculty}
                      </p>
                    ))}
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500">No timetable available</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
