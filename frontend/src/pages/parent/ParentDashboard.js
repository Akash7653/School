import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Users, TrendingUp, DollarSign, Bell, LogOut, CreditCard, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../../context/ThemeContext';

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childAttendance, setChildAttendance] = useState(null);
  const [childMarks, setChildMarks] = useState([]);
  const [childFees, setChildFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linkStudentId, setLinkStudentId] = useState('');

  const normalizeList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (Array.isArray(val.data)) return val.data;
    if (Array.isArray(val.items)) return val.items;
    if (Array.isArray(val.results)) return val.results;
    console.warn('normalizeList: unexpected list shape', val);
    return [];
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildData(selectedChild.student_id);
    }
  }, [selectedChild]);

  const fetchData = async () => {
    try {
      const childrenRes = await api.get('/parents/me/children');
      const normalized = normalizeList(childrenRes.data);
      setChildren(normalized);
      if (normalized.length > 0) {
        setSelectedChild(normalized[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (studentId) => {
    try {
      console.log('fetchChildData called with studentId:', studentId, 'Type:', typeof studentId, 'Length:', studentId?.length);
      
      const [attendanceRes, marksRes, feesRes, paymentsRes] = await Promise.all([
        api.get(`/attendance/student/${studentId}`).catch(() => ({ data: null })),
        api.get(`/marks/student/${studentId}`).catch(() => ({ data: [] })),
        api.get(`/parents/student/${studentId}/fees`).catch((err) => {
          console.error('Fees API error:', err.config?.url, err.response?.status, err.response?.data);
          return { data: {} };
        }),
        api.get(`/payments/student/${studentId}`).catch(() => ({ data: [] }))
      ]);

      setChildAttendance(attendanceRes.data);
      setChildMarks(attendanceRes.data ? normalizeList(marksRes.data) : []);
      
      // Handle fee tracking response - it's a single object, not an array
      if (feesRes.data && feesRes.data.total_fee_amount) {
        setChildFees([{
          fee_id: feesRes.data.tracking_id,
          fee_type: 'Total Fees',
          amount: feesRes.data.total_fee_amount,
          paid_amount: feesRes.data.paid_amount,
          pending_amount: feesRes.data.pending_amount,
          status: feesRes.data.payment_status
        }]);
      } else {
        setChildFees([]);
      }
      
      setPayments(normalizeList(paymentsRes.data) || []);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLinkChild = async () => {
    if (!linkStudentId.trim()) {
      toast.error('Please enter a student ID');
      return;
    }

    try {
      await api.post(`/parents/link-child/${linkStudentId}`);
      toast.success('Child linked successfully');
      setLinkStudentId('');
      fetchData();
    } catch (error) {
      const msg = (await import('../../utils/formatApiError')).default(error);
      toast.error(msg || 'Failed to link child');
    }
  };

  const handlePayFee = async (fee) => {
    try {
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page and try again.');
        console.error('Razorpay script not loaded');
        return;
      }

      const paymentAmount = fee.pending_amount || fee.amount || 0;
      console.log('Creating payment order for:', { amount: paymentAmount, student_id: selectedChild.student_id });
      
      const orderRes = await api.post('/payments/create-order', {
        amount: paymentAmount,
        currency: 'INR',
        fee_id: fee.fee_id,
        student_id: selectedChild.student_id
      });

      console.log('Order created:', orderRes.data);

      if (!orderRes.data.order_id || !orderRes.data.key_id) {
        toast.error('Invalid payment response from server');
        console.error('Missing order_id or key_id:', orderRes.data);
        return;
      }

      const options = {
        key: orderRes.data.key_id,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        order_id: orderRes.data.order_id,
        name: 'Sadhana Memorial School',
        description: `Payment for ${fee.fee_type}`,
        prefill: {
          name: 'Student',
          email: ''
        },
        handler: async (response) => {
          try {
            console.log('Payment successful, verifying...');
            toast.loading('Verifying payment...');
            
            const paymentAmount = fee.pending_amount || fee.amount || 0;
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              fee_id: fee.fee_id,
              student_id: selectedChild.student_id,
              amount: paymentAmount
            });
            
            console.log('Payment verified:', verifyRes.data);
            toast.dismiss();
            toast.success('Payment successful! Your fees have been updated.');
            
            // Refresh child data to update the UI
            await new Promise(resolve => setTimeout(resolve, 500));
            await fetchChildData(selectedChild.student_id);
            
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.dismiss();
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        theme: {
          color: '#10B981'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
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
            <Users className="h-8 w-8 text-slate-900 dark:text-white" />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Sadhana Memorial School</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-parent">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={() => logout()} data-testid="logout-button-parent">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Welcome back, {user?.name}!</h2>
          
          {/* Link Child Section - Always Visible */}
          <Card className="p-6 mb-6" data-testid="link-child-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Link Your Children</h3>
                <p className="text-sm text-slate-500">Add multiple children accounts using their Student ID (SMS-YYYY-CLASS+SECTION-ROLL)</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter student ID (e.g., SMS-2026-10A-001)"
                value={linkStudentId}
                onChange={(e) => setLinkStudentId(e.target.value)}
                data-testid="student-id-input"
              />
              <Button onClick={handleLinkChild} data-testid="link-child-button">+ Link Child</Button>
            </div>
          </Card>

          {/* Children Selection Buttons */}
          {children.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Your Children ({children.length})</p>
              <div className="flex gap-2 flex-wrap">
                {children.map((child) => (
                  <Button
                    key={child.student_id}
                    variant={selectedChild?.student_id === child.student_id ? 'default' : 'outline'}
                    onClick={() => setSelectedChild(child)}
                    data-testid={`child-button-${child.student_id}`}
                    className="text-sm"
                  >
                    <span>{child.name}</span>
                    <span className="ml-2 text-xs text-slate-500 font-mono">#{child.student_id}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {selectedChild && (
          <>
            <div className="mb-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{selectedChild.name}</p>
                    <p className="text-sm text-slate-500">ID: <span className="font-mono text-slate-700 dark:text-slate-300">{selectedChild.student_id}</span></p>
                  </div>
                  <div className="text-sm text-slate-500">{selectedChild.class_name} - {selectedChild.section}</div>
                </div>
              </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                { icon: TrendingUp, label: 'Attendance', value: `${childAttendance?.percentage || 0}%`, color: 'bg-emerald-500', testId: 'attendance-stat' },
                { icon: DollarSign, label: 'Pending Fees', value: childFees.filter(f => f.status === 'PENDING').length, color: 'bg-orange-500', testId: 'fees-stat' },
                { icon: Bell, label: 'Total Subjects', value: childMarks.length > 0 ? [...new Set(childMarks.map(m => m.subject))].length : 0, color: 'bg-yellow-600', testId: 'subjects-stat' }
              ].map((stat, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
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
              <Card className="p-6" data-testid="marks-section-parent">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Marks</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {childMarks.slice(0, 8).map((mark, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`mark-item-${index}`}>
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
                  {childMarks.length === 0 && <p className="text-sm text-slate-500">No marks available</p>}
                </div>
              </Card>

              <Card className="p-6" data-testid="fees-payment-section">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Fees & Payments</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {childFees.map((fee, index) => (
                    <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`fee-item-${index}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{fee.fee_type}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Status: {fee.status}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${fee.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'}`}>
                          {fee.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Total</p>
                          <p className="font-bold text-slate-900 dark:text-white">₹{fee.amount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Paid</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{fee.paid_amount || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">Pending</p>
                          <p className="font-bold text-orange-600 dark:text-orange-400">₹{fee.pending_amount || fee.amount}</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        {fee.status === 'PENDING' && fee.pending_amount > 0 && (
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => handlePayFee(fee)} data-testid={`pay-fee-button-${index}`}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay ₹{fee.pending_amount || fee.amount}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {childFees.length === 0 && <p className="text-sm text-slate-500">No fees information</p>}
                </div>
              </Card>

              <Card className="p-6 md:col-span-2" data-testid="payment-history-section">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Payment History</h3>
                <div className="space-y-2">
                  {payments.filter(p => p.status === 'SUCCESS').map((payment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg" data-testid={`payment-${index}`}>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">Payment #{payment.transaction_id}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{new Date(payment.payment_date).toLocaleDateString()}</p>
                      </div>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{payment.amount}</p>
                    </div>
                  ))}
                  {payments.filter(p => p.status === 'SUCCESS').length === 0 && <p className="text-sm text-slate-500">No payment history</p>}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
