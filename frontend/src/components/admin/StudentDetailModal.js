import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Calendar, MapPin, BookOpen, DollarSign, Users } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'sonner';

const StudentDetailModal = ({ student, onClose }) => {
  const [parents, setParents] = useState([]);
  const [feeTracking, setFeeTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLinkParent, setShowLinkParent] = useState(false);
  const [parentData, setParentData] = useState({
    relationship: 'Father',
    parent_name: '',
    parent_email: '',
    parent_phone: '',
    parent_occupation: '',
    parent_address: '',
    parent_pin_code: ''
  });

  useEffect(() => {
    if (student) {
      fetchDetails();
    }
  }, [student]);

  // Refresh fee data when modal is opened
  useEffect(() => {
    if (student && !loading) {
      // Refresh fee tracking to get latest payment status
      const refreshFees = async () => {
        const studentIdentifier = student.unique_student_id || student.student_id;
        try {
          const feeRes = await api.get(`/fees/student/${studentIdentifier}`).catch(() => null);
          if (feeRes?.data) {
            setFeeTracking(feeRes.data);
          }
        } catch (e) {
          console.error('Error refreshing fees:', e);
        }
      };
      refreshFees();
    }
  }, [student, loading]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      
      // Use unique_student_id if available, otherwise use student_id
      const studentIdentifier = student.unique_student_id || student.student_id;
      
      // Fetch fee tracking first
      const feeRes = await api.get(`/fees/student/${studentIdentifier}`).catch(() => null);
      setFeeTracking(feeRes?.data || null);

      // Fetch parents - prioritize parent_mapping (registration data) as it has complete details
      let fetchedParents = [];
      
      // First try parent_mapping endpoint (has all registration details)
      if (student.unique_student_id) {
        try {
          const mappingRes = await api.get(`/parent-mapping/student/${student.unique_student_id}`).catch(() => null);
          // Backend returns {parent_mappings: [...], count: N}
          if (mappingRes?.data?.parent_mappings && mappingRes.data.parent_mappings.length > 0) {
            // Convert parent_mapping format to parent format for display
            fetchedParents = mappingRes.data.parent_mappings.map(mapping => ({
              name: mapping.parent_name,
              email: mapping.parent_email,
              phone: mapping.parent_phone,
              relationship: mapping.relationship,
              occupation: mapping.parent_occupation,
              address: mapping.parent_address,
              pin_code: mapping.parent_pin_code,
              parent_id: mapping.parent_id
            }));
          }
        } catch (e) {
          console.log('No parent mapping found:', e);
        }
      }
      
      // If no parents found from parent_mapping, try fetching from parent_ids
      if (fetchedParents.length === 0 && student.parent_ids && student.parent_ids.length > 0) {
        const parentPromises = student.parent_ids.map(parentId =>
          api.get(`/parents/${parentId}`).catch(() => null)
        );
        const parentResults = await Promise.all(parentPromises);
        fetchedParents = parentResults.filter(r => r?.data).map(r => r.data);
      }
      
      // Also check if there are parents linked via children_ids (parent portal linking)
      // This happens when parent links child through parent portal
      if (fetchedParents.length === 0 && student.student_id) {
        try {
          // Check if student has parent_id field (from old linking method)
          if (student.parent_id) {
            const parentRes = await api.get(`/parents/${student.parent_id}`).catch(() => null);
            if (parentRes?.data) {
              fetchedParents = [{
                name: parentRes.data.name,
                email: parentRes.data.email,
                phone: parentRes.data.phone,
                relationship: 'Parent',
                parent_id: parentRes.data.parent_id
              }];
            }
          }
          
          // Also check parents collection for parents who have this student in children_ids
          if (fetchedParents.length === 0) {
            const parentsByStudentRes = await api.get(`/parents/by-student/${student.student_id}`).catch(() => null);
            if (parentsByStudentRes?.data?.parents && parentsByStudentRes.data.parents.length > 0) {
              fetchedParents = parentsByStudentRes.data.parents.map(parent => ({
                name: parent.name,
                email: parent.email,
                phone: parent.phone,
                relationship: 'Parent',
                parent_id: parent.parent_id
              }));
            }
          }
        } catch (e) {
          console.log('Error checking parent via children_ids:', e);
        }
      }
      
      setParents(fetchedParents);
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Failed to fetch student details');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkParent = async (e) => {
    e.preventDefault();
    try {
      if (!parentData.parent_name || !parentData.parent_email || !parentData.parent_phone) {
        toast.error('Please fill in required fields');
        return;
      }

      const payload = {
        parent_id: `parent_${Date.now()}`,
        student_id: student.student_id,
        unique_student_id: student.unique_student_id,
        ...parentData
      };

      await api.post('/parent-mapping/register', payload);
      toast.success('Parent linked successfully!');
      setShowLinkParent(false);
      setParentData({
        relationship: 'Father',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        parent_occupation: '',
        parent_address: '',
        parent_pin_code: ''
      });
      fetchDetails(); // Refresh parent list
    } catch (error) {
      console.error('Error linking parent:', error);
      toast.error('Failed to link parent');
    }
  };

  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{student.name}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{student.unique_student_id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Student Information */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                Academic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Class</p>
                  <p className="font-semibold text-slate-900 dark:text-white">Class {student.class_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Section</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{student.section}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Roll Number</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{student.roll_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Admission Number</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{student.admission_number}</p>
                </div>
                {student.date_of_birth && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Date of Birth</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{student.date_of_birth}</p>
                  </div>
                )}
                {student.gender && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Gender</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{student.gender}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Contact Information
              </h3>
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <span className="text-slate-900 dark:text-white">{student.email}</span>
                </div>
                {student.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-slate-400 mt-1" />
                    <span className="text-slate-900 dark:text-white">{student.address}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Fee Information */}
            {feeTracking ? (
              <section>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Fee Status
                </h3>
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Fee</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">
                        ₹{Number(feeTracking.total_fee_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Paid</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{Number(feeTracking.paid_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Pending</p>
                      <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        ₹{Number(feeTracking.pending_amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Payment Status</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      feeTracking.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      feeTracking.payment_status === 'PARTIAL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {feeTracking.payment_status || 'PENDING'}
                    </span>
                  </div>
                  {feeTracking.payment_history && feeTracking.payment_history.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Payment History</p>
                      <div className="space-y-3">
                        {feeTracking.payment_history.map((payment, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 p-3 rounded">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">₹{Number(payment.amount || 0).toLocaleString()}</span>
                              <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded">{payment.method || 'Online'}</span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                              <div><strong>Date:</strong> {payment.date}</div>
                              {payment.razorpay_payment_id && <div><strong>Payment ID:</strong> {payment.razorpay_payment_id}</div>}
                              {payment.razorpay_order_id && <div><strong>Order ID:</strong> {payment.razorpay_order_id}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!feeTracking.payment_history || feeTracking.payment_history.length === 0) && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3 text-center">
                      <p className="text-sm text-slate-500">No payment history recorded</p>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  Fee Status
                </h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold mb-2">No fee information available</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">Ensure that the student has been registered in a class and section where a fee structure is defined.</p>
                  <div className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                    <div><strong>Student ID:</strong> {student.student_id}</div>
                    <div><strong>Class:</strong> {student.class_name || 'Not assigned'}</div>
                    <div><strong>Section:</strong> {student.section || 'Not assigned'}</div>
                    <div><strong>Check:</strong> Is a fee structure created for Class {student.class_name} Section {student.section}?</div>
                  </div>
                </div>
              </section>
            )}

            {/* Parents Information */}
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Parent/Guardian Information
              </h3>
              {parents.length > 0 ? (
                <div className="space-y-4">
                  {parents.map((parent, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Name</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{parent.name || parent.parent_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Relation</p>
                          <p className="font-semibold text-slate-900 dark:text-white">{parent.relationship || 'Parent'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Email</p>
                          <p className="font-semibold text-slate-900 dark:text-white break-all text-sm">{parent.email || parent.parent_email}</p>
                        </div>
                        {(parent.phone || parent.parent_phone) && (
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Phone</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{parent.phone || parent.parent_phone}</p>
                          </div>
                        )}
                        {(parent.address || parent.parent_address) && (
                          <div className="sm:col-span-2">
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Address</p>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{parent.address || parent.parent_address}</p>
                            {parent.pin_code || parent.parent_pin_code ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PIN: {parent.pin_code || parent.parent_pin_code}</p>
                            ) : null}
                          </div>
                        )}
                        {(parent.occupation || parent.parent_occupation) && (
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Occupation</p>
                            <p className="font-semibold text-slate-900 dark:text-white">{parent.occupation || parent.parent_occupation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                showLinkParent ? (
                  <form onSubmit={handleLinkParent} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Relationship</label>
                        <select
                          value={parentData.relationship}
                          onChange={(e) => setParentData({...parentData, relationship: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm dark:bg-slate-700 dark:border-slate-600"
                        >
                          <option>Father</option>
                          <option>Mother</option>
                          <option>Guardian</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Name *</label>
                        <input
                          type="text"
                          placeholder="Parent name"
                          value={parentData.parent_name}
                          onChange={(e) => setParentData({...parentData, parent_name: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm dark:bg-slate-700 dark:border-slate-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Email *</label>
                        <input
                          type="email"
                          placeholder="Email"
                          value={parentData.parent_email}
                          onChange={(e) => setParentData({...parentData, parent_email: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm dark:bg-slate-700 dark:border-slate-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Phone *</label>
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={parentData.parent_phone}
                          onChange={(e) => setParentData({...parentData, parent_phone: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm dark:bg-slate-700 dark:border-slate-600"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Occupation</label>
                        <input
                          type="text"
                          placeholder="Occupation"
                          value={parentData.parent_occupation}
                          onChange={(e) => setParentData({...parentData, parent_occupation: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm dark:bg-slate-700 dark:border-slate-600"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Pin Code</label>
                        <input
                          type="text"
                          placeholder="Pin code"
                          value={parentData.parent_pin_code}
                          onChange={(e) => setParentData({...parentData, parent_pin_code: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm dark:bg-slate-700 dark:border-slate-600"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Address</label>
                        <textarea
                          placeholder="Address"
                          value={parentData.parent_address}
                          onChange={(e) => setParentData({...parentData, parent_address: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded text-sm dark:bg-slate-700 dark:border-slate-600"
                          rows="2"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded text-sm font-semibold"
                      >
                        Link Parent
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLinkParent(false)}
                        className="flex-1 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-2 rounded text-sm font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300 font-semibold mb-3">No parent linked to this student</p>
                    <button
                      onClick={() => setShowLinkParent(true)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-semibold"
                    >
                      Link Parent Now
                    </button>
                  </div>
                )
              )}
            </section>

            {/* Close Button */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetailModal;
