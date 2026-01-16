import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Shield, Mail, Lock, Eye, EyeOff, Sun, Moon, GraduationCap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';

const AdminRegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        role: 'ADMIN'
      });

      if (res && res.message) {
        toast.success(res.message);
      } else {
        toast.success('Admin registration successful! Logged in.');
      }

      navigate('/auth/login');
    } catch (error) {
      const msg = (await import('../../utils/formatApiError')).default(error);
      toast.error(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Left Side - Image */}
          <div className="relative hidden lg:block">
            <img
              src="https://images.unsplash.com/photo-1758685733926-00cba008215b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwYW5kJTIwcm9ib3RpY3N8ZW58MHx8fDE3NjgyMjQzMzB8MA&ixlib=rb-4.1.0&q=85"
              alt="Admin Registration"
              className="w-full h-full object-cover rounded-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 to-slate-900/70 rounded-xl"></div>
            <div className="absolute inset-0 flex items-center justify-center text-white p-8">
              <div className="text-center">
                <Shield className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4" />
                <h1 className="text-2xl md:text-3xl font-bold font-['Playfair_Display'] mb-2">Admin Registration</h1>
                <p className="text-lg md:text-xl text-slate-200">Sadhana Memorial School</p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex items-center justify-center">
            <motion.div
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 md:p-8">
                <div className="flex items-center justify-center mb-6">
                  <Shield className="h-10 w-10 md:h-12 md:w-12 text-slate-900 dark:text-white mr-3" />
                  <h2 className="text-xl md:text-2xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white">Admin Registration</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm md:text-base">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="text-sm md:text-base"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm md:text-base">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                      <Input
                        id="email"
                        type="text"
                        placeholder="admin@sadhana.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="pl-10 text-sm md:text-base"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm md:text-base">Phone Number</Label>
                    <div className="relative">
                      <Input
                        id="phone"
                        type="text"
                        placeholder="+91 11 2345 6789"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="text-sm md:text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm md:text-base">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
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
                    <Label htmlFor="confirmPassword" className="text-sm md:text-base">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 md:h-5 md:w-5 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        className="pl-10 text-sm md:text-base"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 md:py-3 text-sm md:text-base"
                    disabled={loading}
                  >
                    {loading ? 'Registering...' : 'Register as Admin'}
                  </Button>
                </form>

                <div className="mt-4 md:mt-6 text-center space-y-2 md:space-y-4">
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link to="/auth/login" className="text-slate-900 dark:text-white hover:text-slate-700 font-medium">
                      Sign in here
                    </Link>
                  </p>
                  
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/auth/register')}
                    className="text-slate-600 dark:text-slate-400 text-xs md:text-sm py-1 md:py-2"
                  >
                    ← Back to Register
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
