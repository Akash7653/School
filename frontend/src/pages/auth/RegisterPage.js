import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Shield, Users, BookOpen, ChevronRight, Mail } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <span className="font-semibold text-slate-900 dark:text-white">Sadhana Memorial School</span>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="rounded-full text-slate-700 dark:text-slate-200"
            >
              Sadhana Portal
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {/* HERO CARD */}
          <div className="bg-gradient-to-r from-white/60 via-white to-white/70 dark:bg-slate-900 rounded-3xl shadow-2xl p-10 mb-8 relative overflow-hidden">
            <div className="text-center max-w-3xl mx-auto">
              <Shield className="h-20 w-20 mx-auto mb-4 text-indigo-900 dark:text-white" />
              <h1 className="text-4xl md:text-5xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white mb-2">Join Sadhana Memorial School</h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-3">Start Your Educational Journey With Us</p>

            </div>
          </div>

          {/* CREATE ACCOUNT */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white mb-8 text-center">Create Account</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {/* Admin Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-lg transition-transform transform hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-md bg-purple-50 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Admin</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage school operations, staff & fees</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/auth/admin-register')}
                  className="w-full rounded-full py-2 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 shadow-sm"
                >
                  Continue as Admin <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Faculty Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-lg transition-transform transform hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-md bg-blue-50 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Faculty</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Join as a teacher, view and manage classes and students</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/auth/faculty-register')}
                  className="w-full rounded-full py-2 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-sm"
                >
                  Continue as Faculty <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Student Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-lg transition-transform transform hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-md bg-amber-50 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Student</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Access your grades, attendance & timetable</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/auth/student-register')}
                  className="w-full rounded-full py-2 bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2 shadow-sm"
                >
                  Continue as Student <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Parent Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-lg transition-transform transform hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-md bg-emerald-50 flex items-center justify-center">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Parent</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Monitor your child's performance, pay fees</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/auth/parent-register')}
                  className="w-full rounded-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm"
                >
                  Continue as Parent <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-6 text-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Already have an account?</h3>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth/login')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Sign In <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow p-6 text-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Back to Home</h3>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Back to Home <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};

export default RegisterPage;
