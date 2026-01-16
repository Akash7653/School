import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import StatCard from '../../components/admin/StatCard';
import OverviewPanel from '../../components/admin/OverviewPanel';
import MiniChart from '../../components/admin/MiniChart';
import ListPanel from '../../components/admin/ListPanel';
import StudentDirectory from '../../components/admin/StudentDirectory';
import StudentDetailModal from '../../components/admin/StudentDetailModal';
import { Shield, Users, GraduationCap, BookOpen, IndianRupee, LogOut, TrendingUp, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  // Sidebar open state (responsive)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Active section for sidebar navigation (overview | students | teachers | classes | fees | reports)
  const [activeSection, setActiveSection] = useState('overview');
  // Timeseries data for finance chart
  const [timeseries, setTimeseries] = useState([]);
  
  // Student Directory and Detail Modal state
  const [showStudentDirectory, setShowStudentDirectory] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Classes/Sections/Fee UI state
  const [classes, setClasses] = useState([]);
  const [className, setClassName] = useState('');

  const [sectionClassId, setSectionClassId] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [sectionCapacity, setSectionCapacity] = useState(20);

  const [feeClassId, setFeeClassId] = useState('');
  const [feeSection, setFeeSection] = useState('');
  const [tuitionFee, setTuitionFee] = useState('');
  const [examFee, setExamFee] = useState('');
  const [labFee, setLabFee] = useState('');
  const [transport, setTransport] = useState('');
  const [frequency, setFrequency] = useState('yearly');

  // Fee Report State
  const [classWiseFeeReport, setClassWiseFeeReport] = useState([]);
  const [selectedClassForSectionReport, setSelectedClassForSectionReport] = useState('');
  const [sectionWiseFeeReport, setSectionWiseFeeReport] = useState([]);

  const normalizeList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (Array.isArray(val.data)) return val.data;
    if (Array.isArray(val.students)) return val.students;
    if (Array.isArray(val.items)) return val.items;
    if (Array.isArray(val.results)) return val.results;
    // Unexpected shape — fall back to empty array and log to console for debugging
    console.warn('normalizeList: unexpected list shape', val);
    return [];
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, studentsRes, facultyRes, pendingRes, classesRes, financeRes, timeseriesRes] = await Promise.all([
        api.get('/admin/stats').catch(e => { console.error('Stats error:', e); return { data: {} }; }),
        api.get('/students').catch(e => { console.error('Students error:', e); return { data: [] }; }),
        api.get('/faculty').catch(e => { console.error('Faculty error:', e); return { data: [] }; }),
        api.get('/admin/users/pending').catch(e => { console.error('Pending error:', e); return { data: [] }; }),
        api.get('/admin/classes').catch(e => { console.error('Classes error:', e); return { data: [] }; }),
        api.get('/admin/finance/summary').catch(e => { console.error('Finance error:', e); return { data: {} }; }),
        api.get('/admin/finance/timeseries').catch(e => { console.error('Timeseries error:', e); return { data: [] }; })
      ]);
      
      console.log('Fetched data:', { statsRes: statsRes.data, students: studentsRes.data, faculty: facultyRes.data, finance: financeRes.data });
      
      setStats(statsRes.data);
      setStudents(normalizeList(studentsRes.data));
      setFaculty(normalizeList(facultyRes.data));
      setPendingUsers(normalizeList(pendingRes.data));
      setClasses(normalizeList(classesRes.data));
      setFinance(financeRes.data);
      setTimeseries(Array.isArray(timeseriesRes.data) ? timeseriesRes.data : []);
      
    } catch (error) {
      console.error('fetchData error', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [processingUserIds, setProcessingUserIds] = useState([]);

  const approveUser = async (userId) => {
    if (!confirm('Approve this user?')) return;
    setProcessingUserIds(prev => [...prev, userId]);
    try {
      await api.post(`/admin/users/approve/${userId}`);
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
      toast.success('User approved');
    } catch (error) {
      const msg = (await import('../../utils/formatApiError')).default(error);
      toast.error(msg || 'Failed to approve user');
    } finally {
      setProcessingUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  const rejectUser = async (userId) => {
    if (!confirm('Reject and delete this user? This cannot be undone.')) return;
    setProcessingUserIds(prev => [...prev, userId]);
    try {
      await api.post(`/admin/users/reject/${userId}`);
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
      toast.success('User rejected');
    } catch (error) {
      const msg = (await import('../../utils/formatApiError')).default(error);
      toast.error(msg || 'Failed to reject user');
    } finally {
      setProcessingUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  // Create class
  const createClass = async () => {
    if (!className.trim()) return toast.error('Class name is required');
    try {
      await api.post('/admin/classes', null, { params: { name: className } });
      setClassName('');
      toast.success('Class created');
      fetchData();
    } catch (err) {
      const msg = (await import('../../utils/formatApiError')).default(err);
      toast.error(msg || 'Failed to create class');
    }
  };

  // Create section
  const createSection = async () => {
    if (!sectionClassId) return toast.error('Select a class');
    if (!sectionName.trim()) return toast.error('Section name is required');
    if (Number(sectionCapacity) <= 0) return toast.error('Capacity must be > 0');
    try {
      await api.post('/admin/sections', null, { params: { class_id: sectionClassId, name: sectionName, capacity: Number(sectionCapacity) } });
      setSectionClassId('');
      setSectionName('');
      setSectionCapacity(20);
      toast.success('Section created');
      fetchData();
    } catch (err) {
      const msg = (await import('../../utils/formatApiError')).default(err);
      toast.error(msg || 'Failed to create section');
    }
  };

  // Create fee structure
  const createFee = async () => {
    if (!feeClassId) return toast.error('Select a class for fee');
    if (Number(tuitionFee) < 0) return toast.error('Tuition fee must be >= 0');
    try {
      await api.post('/admin/fees', null, { params: { class_id: feeClassId, tuition_fee: Number(tuitionFee), exam_fee: Number(examFee) || 0, lab_fee: Number(labFee) || 0, transport: Number(transport) || 0, scholarship: 0, section: feeSection || null, frequency } });
      setFeeClassId('');
      setFeeSection('');
      setTuitionFee('');
      setExamFee('');
      setLabFee('');
      setTransport('');
      setFrequency('yearly');
      toast.success('Fee structure created');
      fetchData();
    } catch (err) {
      const msg = (await import('../../utils/formatApiError')).default(err);
      toast.error(msg || 'Failed to create fee');
    }
  };

  // Delete class
  const deleteClass = async (classId) => {
    if (!confirm('Delete this class? This will remove associated sections and fee structures.')) return;
    try {
      await api.delete(`/admin/classes/${classId}`);
      toast.success('Class deleted');
      fetchData();
    } catch (err) {
      const msg = (await import('../../utils/formatApiError')).default(err);
      toast.error(msg || 'Failed to delete class');
    }
  };

  const deleteStudent = async (studentId) => {
    try {
      await api.delete(`/admin/students/${studentId}`);
      toast.success('Student deleted successfully');
      fetchData();
    } catch (err) {
      const msg = (await import('../../utils/formatApiError')).default(err);
      toast.error(msg || 'Failed to delete student');
    }
  };

  const deleteFaculty = async (facultyId) => {
    try {
      await api.delete(`/admin/faculty/${facultyId}`);
      toast.success('Faculty deleted successfully');
      fetchData();
    } catch (err) {
      const msg = (await import('../../utils/formatApiError')).default(err);
      toast.error(msg || 'Failed to delete faculty');
    }
  };

  // Fetch class-wise fee report
  const fetchClassWiseFeeReport = async () => {
    try {
      const res = await api.get('/admin/fees/report/class-wise');
      setClassWiseFeeReport(res.data.report || []);
      setActiveSection('fee-reports');
      toast.success('Class-wise fee report loaded');
    } catch (err) {
      const msg = (await import('../../utils/formatApiError')).default(err);
      toast.error(msg || 'Failed to fetch class-wise fee report');
    }
  };

  // Fetch section-wise fee report
  const fetchSectionWiseFeeReport = async (classValue) => {
    if (!classValue) {
      toast.error('Please select a class');
      return;
    }
    try {
      const res = await api.get(`/admin/fees/report/section-wise/${classValue}`);
      setSectionWiseFeeReport(res.data.sections || []);
      toast.success('Section-wise fee report loaded');
    } catch (err) {
      const msg = (await import('../../utils/formatApiError')).default(err);
      toast.error(msg || 'Failed to fetch section-wise fee report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600 dark:text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  const chartData = [
    { name: 'Students', value: stats?.total_students || 0 },
    { name: 'Faculty', value: stats?.total_faculty || 0 },
    { name: 'Parents', value: stats?.total_parents || 0 },
    { name: 'Pending Fees', value: stats?.pending_fees || 0 }
  ];

  // Defensive: normalize lists to arrays to avoid runtime .slice errors
  const safeStudents = Array.isArray(students) ? students : (students?.data || []);
  const safeFaculty = Array.isArray(faculty) ? faculty : (faculty?.data || []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-slate-900 dark:text-white" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Sadhana Memorial School</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Skip link for keyboard users */}
            <a href="#main-content" className="sr-only focus:not-sr-only px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-sm">Skip to main</a>

            {/* Sidebar toggle for small screens */}
            <button
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <svg className="h-5 w-5 text-slate-700 dark:text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-admin">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={() => logout()} data-testid="logout-button-admin">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 grid grid-cols-12 gap-6">
        {/* Overlay for small screens when sidebar is open */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
        )}

        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'fixed inset-y-0 left-0 top-16 w-64 z-50 lg:relative lg:inset-auto lg:top-auto lg:w-auto lg:z-auto' : 'hidden lg:block'} col-span-12 lg:col-span-3 transition-all`} role="complementary" aria-label="Admin sidebar navigation">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-4 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto lg:h-auto lg:overflow-visible">
            <div className="mb-6 flex justify-between items-center lg:block">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Dashboard</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Admin Panel</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                <svg className="h-5 w-5 text-slate-700 dark:text-slate-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <nav className="space-y-2" role="navigation" aria-label="Admin menu">
              <button role="menuitem" onClick={() => { setActiveSection('overview'); setSidebarOpen(false); }} aria-current={activeSection === 'overview'} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 ${activeSection === 'overview' ? 'bg-emerald-50 dark:bg-slate-800' : 'hover:bg-emerald-100 dark:hover:bg-slate-700'}`}>
                <TrendingUp className="h-4 w-4 text-emerald-600" /> <span className="text-sm">Overview</span>
              </button>
              <button role="menuitem" onClick={() => { setShowStudentDirectory(true); setSidebarOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 hover:bg-emerald-100 dark:hover:bg-slate-700`}>
                <Users className="h-4 w-4 text-emerald-600" /> <span className="text-sm">Student Directory</span>
              </button>
              <button role="menuitem" onClick={() => { setActiveSection('students'); setSidebarOpen(false); }} aria-current={activeSection === 'students'} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 ${activeSection === 'students' ? 'bg-emerald-50 dark:bg-slate-800' : 'hover:bg-emerald-100 dark:hover:bg-slate-700'}`}>
                <Users className="h-4 w-4 text-blue-600" /> <span className="text-sm">Students</span>
              </button>
              <button role="menuitem" onClick={() => { setActiveSection('teachers'); setSidebarOpen(false); }} aria-current={activeSection === 'teachers'} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 ${activeSection === 'teachers' ? 'bg-emerald-50 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <GraduationCap className="h-4 w-4 text-orange-500" /> <span className="text-sm">Teachers</span>
              </button>
              <button role="menuitem" onClick={() => { setActiveSection('fees'); setSidebarOpen(false); }} aria-current={activeSection === 'fees'} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 ${activeSection === 'fees' ? 'bg-emerald-50 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <IndianRupee className="h-4 w-4 text-slate-700" /> <span className="text-sm">Fees</span>
              </button>
              <button role="menuitem" onClick={() => { fetchClassWiseFeeReport(); setSidebarOpen(false); }} aria-current={activeSection === 'fee-reports'} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 ${activeSection === 'fee-reports' ? 'bg-emerald-50 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <TrendingUp className="h-4 w-4 text-green-600" /> <span className="text-sm">Fee Reports</span>
              </button>
              <button role="menuitem" onClick={() => { setActiveSection('reports'); setSidebarOpen(false); }} aria-current={activeSection === 'reports'} className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 ${activeSection === 'reports' ? 'bg-emerald-50 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <Shield className="h-4 w-4 text-indigo-500" /> <span className="text-sm">Reports</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main id="main-content" role="main" onClick={() => sidebarOpen && setSidebarOpen(false)} className="col-span-12 lg:col-span-9">
          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Admin Dashboard</h2>
              <p className="text-slate-600 dark:text-slate-400">Manage Sadhana Memorial School</p>
            </div>
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-semibold transition-colors"
            >
              <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </motion.div>

          {/* Overview (default) */}
          {activeSection === 'overview' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <StatCard icon={Users} label="Total Students" value={stats?.total_students || 0} color="bg-emerald-500" testId="students-stat" />
                <StatCard icon={BookOpen} label="Total Faculty" value={stats?.total_faculty || 0} color="bg-blue-500" testId="faculty-stat" />
                <StatCard icon={GraduationCap} label="Total Parents" value={stats?.total_parents || 0} color="bg-yellow-400" testId="parents-stat" />
                <StatCard icon={IndianRupee} label="Pending Fees" value={stats?.pending_fees || 0} color="bg-slate-700" testId="pending-fees-stat" isCurrency={true} />
              </div>

              {/* Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <OverviewPanel title="Financial Overview">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Total Expected</p>
                        <p className="text-2xl font-bold">₹{(finance ? Number(finance.total_expected).toLocaleString() : (stats?.total_students * 10000).toLocaleString())}</p>
                        <p className="text-sm text-slate-500">{finance ? 'Based on recorded fee records' : 'Estimate based on students * avg fee'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Collected</p>
                        <p className="text-2xl font-bold">₹{finance ? Number(finance.collected).toLocaleString() : '0'}</p>
                        <p className="text-sm text-slate-500">Real-time payments will appear here</p>
                      </div>
                    </div>
                    {finance && (
                      <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div><strong>Pending:</strong> ₹{Number(finance.pending).toLocaleString()}</div>
                          <div className="text-xs sm:text-sm"><strong>By status:</strong> {Object.entries(finance.by_status || {}).map(([k,v]) => (`${k}: ${v.count}`)).join(' • ')}</div>
                        </div>
                      </div>
                    )}
                  </OverviewPanel>

                  <OverviewPanel title="Attendance Overview">
                    <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6">
                      <div>
                        <p className="text-sm text-slate-500 mb-2">Overall Attendance (this month)</p>
                        <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-2xl font-bold text-emerald-600">92%</div>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm text-slate-500 mb-2">Present days trend</p>
                        <MiniChart />
                      </div>
                    </div>
                  </OverviewPanel>
                </div>

                <div>
                  <OverviewPanel title="Fee Collection Summary">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-slate-600"><span>Total Fees</span><span>₹{finance ? Number(finance.total_expected).toLocaleString() : (stats?.total_students * 10000).toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm text-slate-600"><span>Collected</span><span>₹{finance ? Number(finance.collected).toLocaleString() : '0'}</span></div>
                      <div className="flex justify-between text-sm text-slate-600"><span>Pending</span><span>₹{finance ? Number(finance.pending).toLocaleString() : (stats?.pending_fees * 500).toLocaleString()}</span></div>
                    </div>
                    {timeseries && timeseries.length > 0 && (
                      <div className="mt-4 h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={timeseries}>
                            <defs>
                              <linearGradient id="col" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" />
                            <Tooltip />
                            <Area type="monotone" dataKey="amount" stroke="#10B981" fillOpacity={1} fill="url(#col)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </OverviewPanel>

                  <ListPanel
                    title="Pending Registrations"
                    items={pendingUsers}
                    renderItem={(u, i) => (
                      <div key={u?.user_id || i} className="flex items-center justify-between p-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name} <span className="text-xs text-slate-500">· {u.role}</span></p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => approveUser(u.user_id)}
                            disabled={processingUserIds.includes(u.user_id)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-sm disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectUser(u.user_id)}
                            disabled={processingUserIds.includes(u.user_id)}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  />

                  <ListPanel
                    title="Teacher List"
                    items={safeFaculty.slice(0, 5)}
                    renderItem={(f, i) => (
                      <div key={f?.faculty_id || i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</p>
                          <p className="text-xs text-slate-500">{f.subject || 'Subject'}</p>
                        </div>
                        <div className="text-sm text-slate-400">{f.email || ''}</div>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Bottom lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ListPanel
                  title="Recent Students"
                  items={safeStudents.slice(0, 10)}
                  renderItem={(student, index) => (
                    <div key={student?.student_id || index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`admin-student-${index}`}>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{student?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{student.class_name} - {student.section}</p>
                      </div>
                      <span className="text-xs font-mono text-slate-500">{student.roll_number}</span>
                    </div>
                  )}
                />

                <ListPanel
                  title="Faculty Members"
                  items={safeFaculty.slice(0, 10)}
                  renderItem={(facultyMember, index) => (
                    <div key={facultyMember?.faculty_id || index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`admin-faculty-${index}`}>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{facultyMember?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{facultyMember.subject}</p>
                      </div>
                    </div>
                  )}
                />
              </div>
            </>
          )}

          {/* Students section */}
          {activeSection === 'students' && (
            <div className="grid grid-cols-1 gap-6">
              <OverviewPanel title="All Students">
                <ListPanel
                  title="Students"
                  items={students}
                  renderItem={(student, i) => (
                    <div key={student.student_id || i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{student.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{student.class_name} - {student.section}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs font-mono text-slate-500">{student.roll_number}</span>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Delete student ${student.name}? This action cannot be undone.`)) {
                              deleteStudent(student.student_id);
                            }
                          }} 
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                />
              </OverviewPanel>
            </div>
          )}

          {/* Teachers section */}
          {activeSection === 'teachers' && (
            <div>
              <OverviewPanel title="All Teachers">
                <ListPanel
                  title="Teachers"
                  items={faculty}
                  renderItem={(t, i) => (
                    <div key={t.faculty_id || i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{t.name}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{t.subject}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="text-sm text-slate-400">{t.email}</div>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Delete faculty ${t.name}? This action cannot be undone.`)) {
                              deleteFaculty(t.faculty_id);
                            }
                          }} 
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                />
              </OverviewPanel>
            </div>
          )}

          {/* Classes section */}
          {activeSection === 'classes' && (
            <div>
              <OverviewPanel title="Manage Classes">
                <div className="mb-4 flex gap-2">
                  <input value={className} onChange={(e)=>setClassName(e.target.value)} className="flex-1 border rounded p-2" placeholder="New class name" />
                  <button onClick={createClass} className="px-4 py-2 bg-emerald-500 text-white rounded">Create</button>
                </div>
                <div className="space-y-2">
                  {(classes || []).map((c) => (
                    <div key={c.class_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium">{c.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=>deleteClass(c.class_id)} className="px-3 py-1 bg-red-500 text-white rounded">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </OverviewPanel>
            </div>
          )}

          {/* Fees section */}
          {activeSection === 'fees' && (
            <div>
              <OverviewPanel title="Financial Overview">
                <div className="flex gap-6 items-center">
                  <div className="w-1/2">
                    <p className="text-sm text-slate-500 mb-2">Total Expected</p>
                    <p className="text-2xl font-bold">₹{(finance ? Number(finance.total_expected).toLocaleString() : (stats?.total_students * 10000).toLocaleString())}</p>
                  </div>
                  <div className="w-1/2">
                    <p className="text-sm text-slate-500 mb-2">Collected</p>
                    <p className="text-2xl font-bold">₹{finance ? Number(finance.collected).toLocaleString() : '0'}</p>
                  </div>
                </div>
              </OverviewPanel>

              <OverviewPanel title="Fee Collection Summary">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-slate-600"><span>Total Fees</span><span>₹{finance ? Number(finance.total_expected).toLocaleString() : (stats?.total_students * 10000).toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm text-slate-600"><span>Collected</span><span>₹{finance ? Number(finance.collected).toLocaleString() : '0'}</span></div>
                  <div className="flex justify-between text-sm text-slate-600"><span>Pending</span><span>₹{finance ? Number(finance.pending).toLocaleString() : (stats?.pending_fees * 500).toLocaleString()}</span></div>
                </div>
              </OverviewPanel>
            </div>
          )}

          {/* Fee Reports section */}
          {activeSection === 'fee-reports' && (
            <div className="space-y-6">
              {/* Class-wise Fee Report */}
              <OverviewPanel title="Class-wise Fee Report">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Class</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Students</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Total Expected</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Collected</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Pending</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Collection %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classWiseFeeReport.map((item, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">Class {item.class}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{item.student_count}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">₹{Number(item.total_expected).toLocaleString()}</td>
                          <td className="py-2 px-3 text-green-600 font-medium">₹{Number(item.total_paid).toLocaleString()}</td>
                          <td className="py-2 px-3 text-red-600">₹{Number(item.total_pending).toLocaleString()}</td>
                          <td className="py-2 px-3 text-blue-600 font-medium">{item.collection_percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </OverviewPanel>

              {/* Section-wise Fee Report */}
              <OverviewPanel title="Section-wise Fee Report">
                <div className="mb-4 flex gap-2">
                  <select 
                    value={selectedClassForSectionReport} 
                    onChange={(e) => setSelectedClassForSectionReport(e.target.value)}
                    className="flex-1 border border-slate-300 rounded p-2 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select a Class</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(cls => (
                      <option key={cls} value={cls}>Class {cls}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => fetchSectionWiseFeeReport(selectedClassForSectionReport)} 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Load Report
                  </button>
                </div>

                {sectionWiseFeeReport.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Section</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Students</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Total Expected</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Collected</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Pending</th>
                          <th className="text-left py-2 px-3 font-semibold text-slate-900 dark:text-white">Collection %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionWiseFeeReport.map((item, i) => (
                          <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <td className="py-2 px-3 text-slate-900 dark:text-white font-medium">Section {item.section}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{item.student_count}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">₹{Number(item.total_expected).toLocaleString()}</td>
                            <td className="py-2 px-3 text-green-600 font-medium">₹{Number(item.total_paid).toLocaleString()}</td>
                            <td className="py-2 px-3 text-red-600">₹{Number(item.total_pending).toLocaleString()}</td>
                            <td className="py-2 px-3 text-blue-600 font-medium">{item.collection_percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </OverviewPanel>
            </div>
          )}

          {/* Reports section */}
          {activeSection === 'reports' && (
            <OverviewPanel title="Reports">
              <p className="text-sm text-slate-500">Reports and exports will be available here.</p>
            </OverviewPanel>
          )}

        </main>
      </div>

      {/* Student Directory Modal */}
      {showStudentDirectory && (
        <div className="fixed inset-0 bg-black/50 z-50 p-4 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <StudentDirectory 
                  students={students} 
                  onStudentSelect={(student) => {
                    setSelectedStudent(student);
                    setShowStudentDirectory(false);
                  }}
                  onClose={() => setShowStudentDirectory(false)}
                  onRefresh={async () => {
                    try {
                      // Force refresh students list to get latest payment status
                      const studentsRes = await api.get('/students').catch(() => ({ data: [] }));
                      const freshStudents = normalizeList(studentsRes.data);
                      setStudents(freshStudents);
                      // Don't call fetchData() here to avoid duplicate API calls
                    } catch (error) {
                      console.error('Error refreshing students:', error);
                      toast.error('Failed to refresh student list');
                    }
                  }}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;