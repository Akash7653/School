import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Sun, Moon, BookOpen } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';

const StudentLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success('Student login successful!');
      navigate('/student/dashboard');
    } catch (error) {
      const msg = (await import('../../utils/formatApiError')).default(error);
      toast.error(msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="relative hidden md:block">
        <img
          src="https://images.unsplash.com/photo-1589872880544-76e896b0592c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwYW5kJTIwcm9ib3RpY3N8ZW58MHx8fDE3NjgyMjQzMzB8MA&ixlib=rb-4.1.0&q=85"
          alt="Student Dashboard"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/90 to-red-900/80"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white p-12">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold font-['Playfair_Display'] mb-2">Student Portal</h1>
            <p className="text-lg text-orange-100">Your Gateway to Learning Excellence</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <GraduationCap className="h-12 w-12 text-orange-600 dark:text-orange-400" />
              <h2 className="text-2xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white ml-3">Student Login</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="student@sadhana.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your student password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In as Student'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/auth/login')}
                className="text-slate-600 dark:text-slate-400"
              >
                ← Back to All Logins
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentLoginPage;
