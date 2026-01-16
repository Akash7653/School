import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { BookOpen, Users, LogOut, CheckCircle, Award, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [facultyData, setFacultyData] = useState(null);

  const normalizeList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (Array.isArray(val.data)) return val.data;
    if (Array.isArray(val.items)) return val.items;
    if (Array.isArray(val.results)) return val.results;
    console.warn('normalizeList: unexpected list shape', val);
    return [];
  };

  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [marksData, setMarksData] = useState({
    student_id: '',
    subject: '',
    exam_name: '',
    marks_obtained: '',
    total_marks: '',
    grade: '',
    exam_date: new Date().toISOString().split('T')[0]
  });

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, facultyRes] = await Promise.all([
        api.get('/students'),
        api.get('/faculty/me')
      ]);
      setStudents(normalizeList(studentsRes.data));
      setFacultyData(facultyRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAttendanceToggle = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const submitAttendance = async () => {
    setAttendanceSubmitting(true);
    try {
      const records = students.map(student => ({
        student_id: student.student_id,
        date: attendanceDate,
        status: selectedStudents.includes(student.student_id) ? 'PRESENT' : 'ABSENT',
        marked_by: facultyData.faculty_id
      }));

      await api.post('/attendance/bulk', { records });
      toast.success('Attendance marked successfully');
      setSelectedStudents([]);
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const submitMarks = async () => {
    try {
      await api.post('/marks', {
        ...marksData,
        marks_obtained: parseFloat(marksData.marks_obtained),
        total_marks: parseFloat(marksData.total_marks),
        uploaded_by: facultyData.faculty_id
      });
      toast.success('Marks uploaded successfully');
      setMarksData({
        student_id: '',
        subject: '',
        exam_name: '',
        marks_obtained: '',
        total_marks: '',
        grade: '',
        exam_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error('Failed to upload marks');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-slate-900 dark:text-white" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Sadhana Memorial School</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-faculty">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={() => logout()} data-testid="logout-button-faculty">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome, {user?.name}!</h2>
          <p className="text-slate-600 dark:text-slate-400">Subject: {facultyData?.subject}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6" data-testid="attendance-marking-section">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-slate-900 dark:text-white" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Mark Attendance</h3>
            </div>
            <div className="mb-4">
              <Label>Date</Label>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="mt-1"
                data-testid="attendance-date-input"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {students.map((student, index) => (
                <div key={student.student_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`student-attendance-${index}`}>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{student.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{student.class_name} - {student.section}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={selectedStudents.includes(student.student_id) ? 'default' : 'outline'}
                    onClick={() => handleAttendanceToggle(student.student_id)}
                    data-testid={`attendance-toggle-${index}`}
                  >
                    {selectedStudents.includes(student.student_id) ? 'Present' : 'Absent'}
                  </Button>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={submitAttendance} data-testid="submit-attendance-button" disabled={attendanceSubmitting}>{attendanceSubmitting ? 'Submitting...' : 'Submit Attendance'}</Button>
          </Card>

          <Card className="p-6" data-testid="marks-upload-section">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-slate-900 dark:text-white" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Upload Marks</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <Select onValueChange={(value) => setMarksData({ ...marksData, student_id: value })}>
                  <SelectTrigger className="mt-1" data-testid="marks-student-select">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.student_id} value={student.student_id}>{student.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={marksData.subject}
                  onChange={(e) => setMarksData({ ...marksData, subject: e.target.value })}
                  placeholder="e.g., Mathematics"
                  className="mt-1"
                  data-testid="marks-subject-input"
                />
              </div>
              <div>
                <Label>Exam Name</Label>
                <Input
                  value={marksData.exam_name}
                  onChange={(e) => setMarksData({ ...marksData, exam_name: e.target.value })}
                  placeholder="e.g., Mid-Term"
                  className="mt-1"
                  data-testid="marks-exam-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Marks Obtained</Label>
                  <Input
                    type="number"
                    value={marksData.marks_obtained}
                    onChange={(e) => setMarksData({ ...marksData, marks_obtained: e.target.value })}
                    placeholder="85"
                    className="mt-1"
                    data-testid="marks-obtained-input"
                  />
                </div>
                <div>
                  <Label>Total Marks</Label>
                  <Input
                    type="number"
                    value={marksData.total_marks}
                    onChange={(e) => setMarksData({ ...marksData, total_marks: e.target.value })}
                    placeholder="100"
                    className="mt-1"
                    data-testid="marks-total-input"
                  />
                </div>
              </div>
              <div>
                <Label>Grade</Label>
                <Input
                  value={marksData.grade}
                  onChange={(e) => setMarksData({ ...marksData, grade: e.target.value })}
                  placeholder="A+"
                  className="mt-1"
                  data-testid="marks-grade-input"
                />
              </div>
              <div>
                <Label>Exam Date</Label>
                <Input
                  type="date"
                  value={marksData.exam_date}
                  onChange={(e) => setMarksData({ ...marksData, exam_date: e.target.value })}
                  className="mt-1"
                  data-testid="marks-date-input"
                />
              </div>
              <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={submitMarks} data-testid="submit-marks-button">Upload Marks</Button>
            </div>
          </Card>

          <Card className="p-6 md:col-span-2" data-testid="students-list-section">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-slate-900 dark:text-white" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Students List</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {students.map((student, index) => (
                <div key={student.student_id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`student-card-${index}`}>
                  <p className="font-medium text-slate-900 dark:text-white">{student.name}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{student.class_name} - {student.section}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Roll: {student.roll_number}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;