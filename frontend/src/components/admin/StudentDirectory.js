import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../ui/card';
import { X, ChevronRight, Users, DollarSign, BookOpen } from 'lucide-react';

const StudentDirectory = ({ students, onStudentSelect, onClose, onRefresh }) => {
  // Filter states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedFeeStatus, setSelectedFeeStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [studentsWithFees, setStudentsWithFees] = useState(students || []);

  // Update studentsWithFees when students prop changes
  useEffect(() => {
    setStudentsWithFees(students || []);
  }, [students]);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  // Get unique classes and sections from students
  const classes = useMemo(() => {
    // Always include classes 1-10
    const allClasses = Array.from({ length: 10 }, (_, i) => String(i + 1));
    // Add any other classes from students if they exist
    const classSet = new Set(allClasses);
    studentsWithFees?.forEach(s => {
      if (s.class_name) classSet.add(s.class_name);
    });
    return Array.from(classSet).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      return numA - numB;
    });
  }, [studentsWithFees]);

  const sections = useMemo(() => {
    // Always include standard sections A, B, C, D, E
    const allSections = ['A', 'B', 'C', 'D', 'E'];
    const sectionSet = new Set(allSections);
    
    // Add any sections from students in the selected class
    if (selectedClass) {
      studentsWithFees?.forEach(s => {
        if (s.class_name === selectedClass && s.section) {
          sectionSet.add(s.section);
        }
      });
    }
    return Array.from(sectionSet).sort();
  }, [studentsWithFees, selectedClass]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let filtered = studentsWithFees || [];

    if (selectedClass) {
      filtered = filtered.filter(s => s.class_name === selectedClass);
    }

    if (selectedSection) {
      filtered = filtered.filter(s => s.section === selectedSection);
    }

    if (selectedFeeStatus) {
      filtered = filtered.filter(s => {
        const feeStatus = s.payment_status || 'PENDING';
        return feeStatus === selectedFeeStatus;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(term) || 
        s.unique_student_id?.toLowerCase().includes(term) ||
        s.roll_number?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [studentsWithFees, selectedClass, selectedSection, selectedFeeStatus, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Student Directory</h2>
        <div className="flex gap-2">
          {onRefresh && (
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors"
              title="Refresh student list"
            >
              <svg className={`h-5 w-5 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Search Student
          </label>
          <input
            type="text"
            placeholder="Name, Student ID, or Roll Number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection(''); // Reset section when class changes
              }}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls} value={cls}>Class {cls}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Sections</option>
              {sections.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Fee Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
              Fee Status
            </label>
            <select
              value={selectedFeeStatus}
              onChange={(e) => setSelectedFeeStatus(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => {
            setSelectedClass('');
            setSelectedSection('');
            setSelectedFeeStatus('');
            setSearchTerm('');
          }}
          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Clear All Filters
        </button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing {filteredStudents.length} of {studentsWithFees?.length || 0} students
      </div>

      {/* Students List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <button
              key={student.student_id}
              onClick={() => onStudentSelect(student)}
              className="w-full text-left p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{student.name}</h3>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                      {student.unique_student_id}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      Class {student.class_name} - {student.section}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Roll: {student.roll_number}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${
                    student.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    student.payment_status === 'PARTIAL' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {student.payment_status || 'PENDING'}
                  </span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-slate-600 dark:text-slate-400">No students found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDirectory;
