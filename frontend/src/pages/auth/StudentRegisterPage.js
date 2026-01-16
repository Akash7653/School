import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Sun, Moon, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import api from '../../utils/api';

const StudentRegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Current step (1: Auth | 2: Personal | 3: Academic | 4: Parent | 5: Confirmation)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Basic auth form
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: ''
  });
  
  // Personal details form
  const [personalData, setPersonalData] = useState({
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    aadhaarId: '',
    studentPhoto: null,
    address: ''
  });
  
  // Academic details form
  const [academicData, setAcademicData] = useState({
    admissionNumber: '',
    className: '',
    section: '',
    academicYear: '2025-2026',
    previousSchool: '',
    previousClass: ''
  });
  
  // Parent details form
  const [parentData, setParentData] = useState({
    fatherName: '',
    motherName: '',
    guardianName: '',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    parentAddress: '',
    parentPinCode: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Step 1: Validate and register auth data
  const handleAuthValidation = async () => {
    if (!authData.name || !authData.email) {
      toast.error('Please fill in Name and Email');
      return false;
    }

    if (authData.password !== authData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (authData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }

    // Register the user now (will be inactive until admin approves)
    setLoading(true);
    try {
      const res = await register({
        email: authData.email,
        password: authData.password,
        name: authData.name,
        phone: authData.phone,
        role: 'STUDENT'
      });

      console.log('Registration response:', res);

      // Extract user_id from response
      let extractedUserId = null;
      
      if (res && res.user_id) {
        extractedUserId = res.user_id;
        console.log('Found user_id:', extractedUserId);
      } else if (res && res.email) {
        extractedUserId = res.email.split('@')[0];
        console.log('Using email prefix as user_id:', extractedUserId);
      } else if (res && res._id) {
        extractedUserId = res._id;
        console.log('Found _id:', extractedUserId);
      }

      if (extractedUserId) {
        setUserId(extractedUserId);
        if (res.message && res.message.includes('pending')) {
          toast.success('Registration submitted! Admin approval required. Continue with your details.');
        } else {
          toast.success('Basic registration complete! Continue with your details.');
        }
        return true;
      } else {
        toast.error('Failed to extract user ID from registration');
        console.error('Registration response:', res);
        return false;
      }
    } catch (error) {
      const msg = (await import('../../utils/formatApiError')).default(error);
      toast.error(msg || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Step 2-5: Validate and move to next step
  const handleNextStep = async () => {
    // Validate current step data
    if (currentStep === 1) {
      const isValid = await handleAuthValidation();
      if (!isValid) {
        return;
      }
    } else if (currentStep === 2) {
      if (!personalData.dateOfBirth || !personalData.gender || !personalData.address) {
        toast.error('Please fill in all mandatory fields');
        return;
      }
    } else if (currentStep === 3) {
      if (!academicData.className || !academicData.section || !academicData.admissionNumber) {
        toast.error('Please fill in all mandatory academic fields');
        return;
      }
      // Check valid class (1-10)
      const classNum = parseInt(academicData.className);
      if (isNaN(classNum) || classNum < 1 || classNum > 10) {
        toast.error('Class must be between 1 and 10');
        return;
      }
      // Check valid section
      if (!['A', 'B', 'C'].includes(academicData.section)) {
        toast.error('Section must be A, B, or C');
        return;
      }
    } else if (currentStep === 4) {
      if (!parentData.fatherName && !parentData.motherName && !parentData.guardianName) {
        toast.error('Please provide at least one parent/guardian name');
        return;
      }
      if (!parentData.parentPhone || !parentData.parentEmail) {
        toast.error('Parent phone and email are required');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Final submission (Step 5) - Only submit student details, auth already done at step 1
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate that user completed Step 1 (auth registration) first
    if (!userId) {
      toast.error('Please complete Step 1 (Login Details) first');
      setLoading(false);
      return;
    }

    try {
      // Submit only student details (auth already registered in step 1)
      const response = await api.post('/auth/register-student', {
        user_id: userId,
        name: authData.name,
        email: authData.email,
        class_name: academicData.className,
        section: academicData.section,
        roll_number: '1',
        admission_number: academicData.admissionNumber,
        academic_year: academicData.academicYear,
        date_of_birth: personalData.dateOfBirth,
        gender: personalData.gender,
        blood_group: personalData.bloodGroup,
        aadhaar_id: personalData.aadhaarId,
        address: personalData.address,
        previous_school: academicData.previousSchool,
        previous_class: academicData.previousClass,
        student_photo_url: personalData.studentPhotoUrl || '',
        parent_ids: []
      });

      if (response.data && response.data.student_id) {
        toast.success(`Registration complete! Your Student ID: ${response.data.student_id}`);
        setTimeout(() => navigate('/auth/login'), 1500);
      } else {
        toast.success('Registration completed successfully!');
        setTimeout(() => navigate('/auth/login'), 1500);
      }
    } catch (error) {
      const msg = (await import('../../utils/formatApiError')).default(error);
      toast.error(msg || 'Failed to complete registration. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, label: 'Login Details' },
    { number: 2, label: 'Personal Info' },
    { number: 3, label: 'Academic Info' },
    { number: 4, label: 'Parent Details' },
    { number: 5, label: 'Confirmation' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Left Side - Progress & Image */}
          <div className="relative hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1589872880544-76e896b0592c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwYW5kJTIwcm9ib3RpY3N8ZW58MHx8fDE3NjgyMjQzMzB8MA&ixlib=rb-4.1.0&q=85"
              alt="Student Registration"
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-900/90 to-red-900/80 rounded-xl"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
              <div className="text-center mb-8">
                <GraduationCap className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4" />
                <h1 className="text-2xl md:text-3xl font-bold font-['Playfair_Display'] mb-2">Student Registration</h1>
                <p className="text-lg md:text-xl text-orange-100">Sadhana Memorial School</p>
              </div>
              
              {/* Progress Steps */}
              <div className="w-full space-y-3">
                {steps.map((step) => (
                  <div key={step.number} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                        step.number <= currentStep
                          ? 'bg-orange-400 text-slate-900'
                          : 'bg-slate-400/30 text-white'
                      }`}
                    >
                      {step.number}
                    </div>
                    <span
                      className={`text-sm ${
                        step.number <= currentStep ? 'text-orange-100 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex items-center justify-center">
            <motion.div
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={currentStep}
            >
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-center mb-6">
                  <GraduationCap className="h-10 w-10 md:h-12 md:w-12 text-orange-600 dark:text-orange-400 mr-3" />
                  <h2 className="text-xl md:text-2xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white">
                    Step {currentStep} of 5
                  </h2>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (currentStep === 5) {
                    handleFinalSubmit(e);
                  } else {
                    handleNextStep();
                  }
                }} className="space-y-4 md:space-y-6">
                  
                  {/* STEP 1: Login Details */}
                  {currentStep === 1 && (
                    <>
                      <div>
                        <Label htmlFor="name" className="text-sm md:text-base">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your full name"
                          value={authData.name}
                          onChange={(e) => setAuthData({...authData, name: e.target.value})}
                          className="text-sm md:text-base"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="text-sm md:text-base">Email Address *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="student@sadhana.edu"
                            value={authData.email}
                            onChange={(e) => setAuthData({...authData, email: e.target.value})}
                            className="pl-10 text-sm md:text-base"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-sm md:text-base">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={authData.phone}
                          onChange={(e) => setAuthData({...authData, phone: e.target.value})}
                          className="text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <Label htmlFor="password" className="text-sm md:text-base">Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a strong password"
                            value={authData.password}
                            onChange={(e) => setAuthData({...authData, password: e.target.value})}
                            className="pl-10 pr-10 text-sm md:text-base"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword" className="text-sm md:text-base">Confirm Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                          <Input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            value={authData.confirmPassword}
                            onChange={(e) => setAuthData({...authData, confirmPassword: e.target.value})}
                            className="pl-10 text-sm md:text-base"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* STEP 2: Personal Details */}
                  {currentStep === 2 && (
                    <>
                      <div>
                        <Label htmlFor="dob" className="text-sm md:text-base">Date of Birth *</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={personalData.dateOfBirth}
                          onChange={(e) => setPersonalData({...personalData, dateOfBirth: e.target.value})}
                          className="text-sm md:text-base"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="gender" className="text-sm md:text-base">Gender *</Label>
                        <select
                          id="gender"
                          value={personalData.gender}
                          onChange={(e) => setPersonalData({...personalData, gender: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:text-white text-sm md:text-base"
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="bloodGroup" className="text-sm md:text-base">Blood Group</Label>
                        <select
                          id="bloodGroup"
                          value={personalData.bloodGroup}
                          onChange={(e) => setPersonalData({...personalData, bloodGroup: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:text-white text-sm md:text-base"
                        >
                          <option value="">Select Blood Group</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="aadhaar" className="text-sm md:text-base">Aadhaar / Govt ID (Optional)</Label>
                        <Input
                          id="aadhaar"
                          type="text"
                          placeholder="1234 5678 9012"
                          value={personalData.aadhaarId}
                          onChange={(e) => setPersonalData({...personalData, aadhaarId: e.target.value})}
                          className="text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <Label htmlFor="address" className="text-sm md:text-base">Address *</Label>
                        <textarea
                          id="address"
                          placeholder="Full residential address"
                          value={personalData.address}
                          onChange={(e) => setPersonalData({...personalData, address: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:text-white text-sm md:text-base"
                          rows="3"
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* STEP 3: Academic Details */}
                  {currentStep === 3 && (
                    <>
                      <div>
                        <Label htmlFor="admissionNumber" className="text-sm md:text-base">Admission Number *</Label>
                        <Input
                          id="admissionNumber"
                          type="text"
                          placeholder="Admission number"
                          value={academicData.admissionNumber}
                          onChange={(e) => setAcademicData({...academicData, admissionNumber: e.target.value})}
                          className="text-sm md:text-base"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="className" className="text-sm md:text-base">Class (1-10) *</Label>
                        <select
                          id="className"
                          value={academicData.className}
                          onChange={(e) => setAcademicData({...academicData, className: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:text-white text-sm md:text-base"
                          required
                        >
                          <option value="">Select Class</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="section" className="text-sm md:text-base">Section (A/B/C) *</Label>
                        <select
                          id="section"
                          value={academicData.section}
                          onChange={(e) => setAcademicData({...academicData, section: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:text-white text-sm md:text-base"
                          required
                        >
                          <option value="">Select Section</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="academicYear" className="text-sm md:text-base">Academic Year</Label>
                        <Input
                          id="academicYear"
                          type="text"
                          value={academicData.academicYear}
                          onChange={(e) => setAcademicData({...academicData, academicYear: e.target.value})}
                          className="text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <Label htmlFor="previousSchool" className="text-sm md:text-base">Previous School (Optional)</Label>
                        <Input
                          id="previousSchool"
                          type="text"
                          placeholder="Previous school name"
                          value={academicData.previousSchool}
                          onChange={(e) => setAcademicData({...academicData, previousSchool: e.target.value})}
                          className="text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <Label htmlFor="previousClass" className="text-sm md:text-base">Previous Class (Optional)</Label>
                        <select
                          id="previousClass"
                          value={academicData.previousClass}
                          onChange={(e) => setAcademicData({...academicData, previousClass: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:text-white text-sm md:text-base"
                        >
                          <option value="">Select Previous Class</option>
                          <option value="UKG">UKG</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* STEP 4: Parent Details */}
                  {currentStep === 4 && (
                    <>
                      <div>
                        <Label htmlFor="fatherName" className="text-sm md:text-base">Father Name</Label>
                        <Input
                          id="fatherName"
                          type="text"
                          placeholder="Father's full name"
                          value={parentData.fatherName}
                          onChange={(e) => setParentData({...parentData, fatherName: e.target.value})}
                          className="text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <Label htmlFor="motherName" className="text-sm md:text-base">Mother Name</Label>
                        <Input
                          id="motherName"
                          type="text"
                          placeholder="Mother's full name"
                          value={parentData.motherName}
                          onChange={(e) => setParentData({...parentData, motherName: e.target.value})}
                          className="text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <Label htmlFor="guardianName" className="text-sm md:text-base">Guardian Name (if applicable)</Label>
                        <Input
                          id="guardianName"
                          type="text"
                          placeholder="Guardian's full name"
                          value={parentData.guardianName}
                          onChange={(e) => setParentData({...parentData, guardianName: e.target.value})}
                          className="text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <Label htmlFor="parentPhone" className="text-sm md:text-base">Parent Phone *</Label>
                        <Input
                          id="parentPhone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={parentData.parentPhone}
                          onChange={(e) => setParentData({...parentData, parentPhone: e.target.value})}
                          className="text-sm md:text-base"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="parentEmail" className="text-sm md:text-base">Parent Email *</Label>
                        <Input
                          id="parentEmail"
                          type="email"
                          placeholder="parent@email.com"
                          value={parentData.parentEmail}
                          onChange={(e) => setParentData({...parentData, parentEmail: e.target.value})}
                          className="text-sm md:text-base"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="parentOccupation" className="text-sm md:text-base">Parent Occupation</Label>
                        <Input
                          id="parentOccupation"
                          type="text"
                          placeholder="Occupation"
                          value={parentData.parentOccupation}
                          onChange={(e) => setParentData({...parentData, parentOccupation: e.target.value})}
                          className="text-sm md:text-base"
                        />
                      </div>

                      <div>
                        <Label htmlFor="parentAddress" className="text-sm md:text-base">Parent Address</Label>
                        <textarea
                          id="parentAddress"
                          placeholder="Full residential address"
                          value={parentData.parentAddress}
                          onChange={(e) => setParentData({...parentData, parentAddress: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-800 dark:text-white text-sm md:text-base"
                          rows="2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="parentPin" className="text-sm md:text-base">PIN Code</Label>
                        <Input
                          id="parentPin"
                          type="text"
                          placeholder="PIN code"
                          value={parentData.parentPinCode}
                          onChange={(e) => setParentData({...parentData, parentPinCode: e.target.value})}
                          className="text-sm md:text-base"
                        />
                      </div>
                    </>
                  )}

                  {/* STEP 5: Confirmation */}
                  {currentStep === 5 && (
                    <div className="space-y-4">
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Registration Summary</h3>
                        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                          <p><strong>Name:</strong> {authData.name}</p>
                          <p><strong>Email:</strong> {authData.email}</p>
                          <p><strong>Class:</strong> {academicData.className} - {academicData.section}</p>
                          <p><strong>Admission:</strong> {academicData.admissionNumber}</p>
                          <p><strong>Parent:</strong> {parentData.fatherName || parentData.motherName || parentData.guardianName}</p>
                          <p><strong>Parent Email:</strong> {parentData.parentEmail}</p>
                        </div>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-slate-700 dark:text-slate-300">
                        <p>✓ Your Student ID will be auto-generated after registration</p>
                        <p>✓ Fee structure will be automatically linked to your class and section</p>
                        <p>✓ A parent account can be created using your Student ID</p>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-3 pt-4">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 text-sm md:text-base"
                        onClick={handlePrevStep}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                    )}
                    <Button
                      type="submit"
                      className={`flex-1 ${currentStep < 5 ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white text-sm md:text-base`}
                      disabled={loading}
                    >
                      {loading ? (
                        'Processing...'
                      ) : currentStep === 5 ? (
                        'Complete Registration'
                      ) : (
                        <>
                          Next <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <div className="mt-4 md:mt-6 text-center">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link to="/auth/login" className="text-slate-900 dark:text-white hover:text-slate-700 font-medium">
                      Sign in here
                    </Link>
                  </p>

                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-4 text-center">
                    <Link to="/auth/register" className="text-slate-900 dark:text-white hover:text-slate-700 font-medium">
                      ← Back to Register
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegisterPage;
