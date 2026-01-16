import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Award, Users, Building2, GraduationCap, Trophy, ArrowRight, Sun, Moon,
  Microscope, Palette, Music, Calculator, Globe, Clock, Shield, Star, Heart,
  ChevronRight, Play, CheckCircle, TrendingUp, Target, Zap, Coffee, Wifi,
  Bus, Utensils, Stethoscope, Camera, Plane, TreePine, Waves, Mountain,
  Mail, Phone
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import ChatBot from '../components/ChatBot';

const LandingPage = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('academics');

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Enhanced Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="relative">
              <GraduationCap className="h-10 w-10 text-slate-900 dark:text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></div>
            </div>
            <div>
              <span className="text-xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white">Sadhana Memorial School</span>
              <p className="text-xs text-slate-600 dark:text-slate-400">Est. 1985 • Excellence in Education</p>
            </div>
          </motion.div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => document.getElementById('programs').scrollIntoView({ behavior: 'smooth' })}>
              Programs
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById('admissions').scrollIntoView({ behavior: 'smooth' })}>
              Admissions
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById('campus').scrollIntoView({ behavior: 'smooth' })}>
              Campus
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle-button"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/auth/login')}
              data-testid="login-nav-button"
            >
              Login
            </Button>
            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900"
              onClick={() => navigate('/auth/register')}
              data-testid="register-nav-button"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1759299615947-bc798076b479?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzY2hvb2wlMjBjYW1wdXMlMjBhcmNoaXRlY3R1cmUlMjBzdHVkZW50c3xlbnwwfHx8fDE3NjgyMjQzMzB8MA&ixlib=rb-4.1.0&q=85"
            alt="School Campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-emerald-900/60"></div>
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        <motion.div 
          className="container mx-auto relative z-10"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div 
            className="flex items-center gap-2 mb-6"
            variants={fadeUp}
          >
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-400 font-semibold">Ranked #1 School in Region</span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white font-['Playfair_Display'] max-w-4xl mb-6 leading-tight"
            variants={fadeUp}
            data-testid="hero-title"
          >
            Excellence in Education, 
            <span className="text-emerald-400"> Tradition in Values</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-slate-200 max-w-3xl mb-8 leading-relaxed"
            variants={fadeUp}
          >
            Empowering young minds since 1985. Join Sadhana Memorial School for a transformative educational journey that shapes future leaders, innovators, and global citizens. Where tradition meets innovation.
          </motion.p>
          
          <motion.div 
            className="flex flex-wrap gap-4 mb-12"
            variants={fadeUp}
          >
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 text-lg"
              onClick={() => navigate('/auth/register')}
              data-testid="hero-cta-button"
            >
              Apply Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
              onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })}
              data-testid="learn-more-button"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Virtual Tour
            </Button>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
            variants={fadeUp}
          >
            {[
              { number: '2000+', label: 'Students' },
              { number: '100+', label: 'Faculty' },
              { number: '40', label: 'Years of Excellence' },
              { number: '95%', label: 'Success Rate' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-sm text-slate-300">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Quick Stats Bar */}
      <section className="py-8 px-6 bg-emerald-500 text-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 text-center">
            {[
              { icon: Trophy, label: '50+ Awards' },
              { icon: Globe, label: '15 Countries' },
              { icon: Shield, label: 'CBSE Affiliated' },
              { icon: Users, label: '1:20 Ratio' },
              { icon: Target, label: '100% Results' },
              { icon: Zap, label: 'Innovation Hub' }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <item.icon className="h-8 w-8" />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced About Section */}
      <section id="about" className="py-24 px-6 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <motion.div 
            className="grid lg:grid-cols-2 gap-16 items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div>
              <motion.div 
                className="flex items-center gap-2 mb-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Heart className="h-6 w-6 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Our Legacy</span>
              </motion.div>
              
              <h2 className="text-4xl sm:text-5xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white mb-6">
                Building Tomorrow's
                <span className="text-emerald-500"> Leaders Today</span>
              </h2>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Sadhana Memorial School has been a beacon of quality education for over four decades. Founded in 1985 by visionary educator Late Smt. Sadhana Devi, our institution stands as a testament to her dream of providing world-class education rooted in Indian values while embracing global perspectives.
              </p>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                We combine traditional values with modern teaching methodologies to create an environment where students thrive academically, socially, and personally. Our holistic approach ensures that every child discovers their unique potential and develops into a confident, compassionate, and capable individual.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                {[
                  { icon: Users, label: '2000+ Students', desc: 'From diverse backgrounds', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' },
                  { icon: GraduationCap, label: '100+ Faculty', desc: 'Highly qualified educators', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300' },
                  { icon: Trophy, label: '50+ Awards', desc: 'Academic & sports excellence', color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300' },
                  { icon: Building2, label: '15 Acre Campus', desc: 'State-of-the-art facilities', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    data-testid={`stat-${index}`}
                  >
                    <div className={`p-3 rounded-lg ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{item.label}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="bg-slate-900 hover:bg-slate-800 text-white"
                onClick={() => document.getElementById('programs').scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Programs <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img
                  src="https://images.unsplash.com/photo-1589872880544-76e896b0592c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjBzdHVkeWluZyUyMGxpYnJhcnklMjBoYXBweXxlbnwwfHx8fDE3NjgyMjQzMzN8MA&ixlib=rb-4.1.0&q=85"
                  alt="Students Learning"
                  className="w-full h-64 object-cover rounded-xl shadow-lg"
                />
                <img
                  src="https://images.unsplash.com/photo-1758685733926-00cba008215b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwxfHx0ZWFjaGVyJTIwaGVscGluZyUyMHN0dWRlbnQlMjBjbGFzc3Jvb218ZW58MHx8fHwxNzY4MjI0MzM1fDA&ixlib=rb-4.1.0&q=85"
                  alt="Teacher with Student"
                  className="w-full h-64 object-cover rounded-xl shadow-lg mt-8"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-emerald-500 text-white p-6 rounded-xl shadow-xl">
                <div className="text-3xl font-bold">40+</div>
                <div className="text-sm">Years of Excellence</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white mb-4">
              Academic Programs
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Comprehensive educational programs designed to nurture every aspect of your child's development
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-2 inline-flex gap-2">
              {['academics', 'sports', 'arts', 'technology'].map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? 'default' : 'ghost'}
                  className={`px-6 py-3 capitalize ${activeTab === tab ? 'bg-emerald-500 text-white' : 'text-slate-600 dark:text-slate-400'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid md:grid-cols-3 gap-8">
            {activeTab === 'academics' && [
              {
                icon: BookOpen,
                title: 'Primary School (Class 1-5)',
                description: 'Foundation building with focus on literacy, numeracy, and basic sciences',
                features: ['Activity-based learning', 'Language development', 'Mathematical thinking', 'Environmental awareness']
              },
              {
                icon: GraduationCap,
                title: 'Middle School (Class 6-8)',
                description: 'Transition to abstract thinking and specialized subject knowledge',
                features: ['Subject specialization', 'Laboratory work', 'Project-based learning', 'Critical thinking']
              },
              {
                icon: Award,
                title: 'Senior School (Class 9-10)',
                description: 'Board exam preparation with career guidance and counseling',
                features: ['Board exam focus', 'Career counseling', 'Competitive exam prep', 'Leadership development']
              }
            ].map((program, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="bg-emerald-100 dark:bg-emerald-900 p-4 rounded-xl inline-block mb-6">
                  <program.icon className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{program.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{program.description}</p>
                <ul className="space-y-2">
                  {program.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {activeTab === 'sports' && [
              {
                icon: Trophy,
                title: 'Cricket Academy',
                description: 'Professional cricket training with international coaches',
                features: ['International coaches', 'Pitch perfect grounds', 'Tournaments', 'Fitness training']
              },
              {
                icon: Target,
                title: 'Basketball Program',
                description: 'Indoor courts with professional training equipment',
                features: ['Indoor courts', 'Professional coaching', 'Inter-school matches', 'Physical fitness']
              },
              {
                icon: Zap,
                title: 'Athletics & Track',
                description: 'Olympic-standard track and field facilities',
                features: ['400m track', 'Long jump pit', 'Training equipment', 'Sports medicine']
              }
            ].map((program, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="bg-orange-100 dark:bg-orange-900 p-4 rounded-xl inline-block mb-6">
                  <program.icon className="h-8 w-8 text-orange-600 dark:text-orange-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{program.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{program.description}</p>
                <ul className="space-y-2">
                  {program.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-orange-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {activeTab === 'arts' && [
              {
                icon: Palette,
                title: 'Fine Arts Studio',
                description: 'Creative expression through various art forms',
                features: ['Painting & drawing', 'Sculpture', 'Art history', 'Exhibitions']
              },
              {
                icon: Music,
                title: 'Music Academy',
                description: 'Vocal and instrumental music training',
                features: ['Vocal training', 'Instrumental classes', 'Music theory', 'Performances']
              },
              {
                icon: Camera,
                title: 'Dance & Drama',
                description: 'Classical and contemporary performing arts',
                features: ['Classical dance', 'Contemporary', 'Theater', 'Annual productions']
              }
            ].map((program, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-xl inline-block mb-6">
                  <program.icon className="h-8 w-8 text-purple-600 dark:text-purple-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{program.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{program.description}</p>
                <ul className="space-y-2">
                  {program.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-purple-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {activeTab === 'technology' && [
              {
                icon: Microscope,
                title: 'Science Labs',
                description: 'Modern laboratories for hands-on learning',
                features: ['Physics lab', 'Chemistry lab', 'Biology lab', 'Research projects']
              },
              {
                icon: Calculator,
                title: 'Computer Center',
                description: 'State-of-the-art computing facilities',
                features: ['Programming', 'AI & ML', 'Web development', 'Robotics']
              },
              {
                icon: Globe,
                title: 'Digital Learning',
                description: 'Technology-integrated classroom experience',
                features: ['Smart boards', 'E-learning', 'Virtual labs', 'Online resources']
              }
            ].map((program, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-xl inline-block mb-6">
                  <program.icon className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{program.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">{program.description}</p>
                <ul className="space-y-2">
                  {program.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Campus Facilities */}
      <section id="campus" className="py-24 px-6 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white mb-4">
              World-Class Campus Facilities
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Spread across 15 acres, our campus provides an ideal environment for learning and growth
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BookOpen,
                title: 'Digital Library',
                description: '50,000+ books and digital resources with 24/7 access',
                features: ['E-books', 'Research databases', 'Study rooms', 'Digital catalog'],
                color: 'bg-emerald-500'
              },
              {
                icon: Microscope,
                title: 'Science Laboratories',
                description: 'Modern labs equipped with latest equipment',
                features: ['Physics lab', 'Chemistry lab', 'Biology lab', 'Computer lab'],
                color: 'bg-blue-500'
              },
              {
                icon: Trophy,
                title: 'Sports Complex',
                description: 'Olympic-standard sports facilities',
                features: ['Cricket ground', 'Basketball courts', 'Swimming pool', 'Gymnasium'],
                color: 'bg-orange-500'
              },
              {
                icon: Utensils,
                title: 'Dining Hall',
                description: 'Nutritious meals in hygienic environment',
                features: ['Nutritionist designed', 'Vegetarian options', 'Hygiene certified', 'Dining halls'],
                color: 'bg-purple-500'
              },
              {
                icon: Bus,
                title: 'Transportation',
                description: 'Safe and reliable bus service',
                features: ['GPS tracking', 'Experienced drivers', 'Multiple routes', 'Safety measures'],
                color: 'bg-yellow-600'
              },
              {
                icon: Stethoscope,
                title: 'Medical Center',
                description: '24/7 medical care and wellness support',
                features: ['Qualified nurses', 'Emergency care', 'Health checkups', 'Counseling'],
                color: 'bg-red-500'
              },
              {
                icon: Wifi,
                title: 'Smart Campus',
                description: 'Fully WiFi-enabled with smart classrooms',
                features: ['High-speed WiFi', 'Smart boards', 'Learning management', 'Parent portal'],
                color: 'bg-indigo-500'
              },
              {
                icon: Shield,
                title: 'Security',
                description: 'Advanced security systems for student safety',
                features: ['CCTV surveillance', 'Access control', 'Security personnel', 'Emergency response'],
                color: 'bg-slate-700'
              }
            ].map((facility, index) => (
              <motion.div
                key={index}
                className="group relative overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800 p-8 shadow-lg hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                data-testid={`facility-${index}`}
              >
                <div className={`inline-flex p-4 rounded-xl ${facility.color} mb-6`}>
                  <facility.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{facility.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{facility.description}</p>
                <ul className="space-y-1">
                  {facility.features.slice(0, 2).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Admissions Section */}
      <section id="admissions" className="py-24 px-6 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white mb-4">
              Admissions Open 2025-26
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Join our community of learners and embark on a journey of excellence
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Admission Process</h3>
              <div className="space-y-4">
                {[
                  { step: '1', title: 'Application Form', desc: 'Fill out online application form with required details' },
                  { step: '2', title: 'Document Submission', desc: 'Submit necessary documents and previous academic records' },
                  { step: '3', title: 'Assessment', desc: 'Appear for entrance assessment and personal interview' },
                  { step: '4', title: 'Selection', desc: 'Merit list announcement and offer of admission' },
                  { step: '5', title: 'Fee Payment', desc: 'Complete admission formalities and fee payment' }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Quick Facts</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Application Deadline</span>
                    <span className="font-semibold text-slate-900 dark:text-white">March 31, 2025</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Entrance Test Date</span>
                    <span className="font-semibold text-slate-900 dark:text-white">April 15, 2025</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Academic Session</span>
                    <span className="font-semibold text-slate-900 dark:text-white">June 2025 - March 2026</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400">Age Criteria</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Class 1: 5+ years</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-slate-600 dark:text-slate-400">Seats Available</span>
                    <span className="font-semibold text-slate-900 dark:text-white">Limited</span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white mt-6"
                  onClick={() => navigate('/auth/register')}
                >
                  Apply Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white mb-4">
              What Parents Say
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Hear from our community about their experience at Sadhana Memorial School
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Rajesh Kumar',
                role: 'Parent of Class 8 Student',
                content: 'Sadhana Memorial School has transformed my child\'s personality. The holistic approach to education and individual attention has helped her excel in both academics and extracurricular activities.',
                rating: 5
              },
              {
                name: 'Priya Sharma',
                role: 'Parent of Class 5 Student',
                content: 'The school\'s focus on values along with modern education is exactly what we were looking for. My son loves going to school every day, which speaks volumes about the environment.',
                rating: 5
              },
              {
                name: 'Amit Patel',
                role: 'Parent of Class 10 Student',
                content: 'Excellent faculty, great infrastructure, and outstanding results! My daughter scored 95% in board exams thanks to the dedicated teachers and comprehensive preparation.',
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold font-['Playfair_Display'] mb-4">
              Our Achievements
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Excellence recognized through awards and accolades
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '100%', label: 'Board Results', desc: 'Consistent 100% pass rate' },
              { number: '500+', label: 'University Placements', desc: 'Students in top universities' },
              { number: '50+', label: 'National Awards', desc: 'Excellence in education' },
              { number: '200+', label: 'Sports Medals', desc: 'Champions in various sports' },
              { number: '1000+', label: 'Alumni Network', desc: 'Global leaders network' },
              { number: '25', label: 'Research Papers', desc: 'Student publications' },
              { number: '15', label: 'International Tie-ups', desc: 'Global collaborations' },
              { number: '30+', label: 'Clubs & Activities', desc: 'Holistic development' }
            ].map((achievement, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl font-bold mb-2">{achievement.number}</div>
                <div className="text-lg font-semibold mb-1">{achievement.label}</div>
                <div className="text-sm text-white/80">{achievement.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Faculty Section */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white mb-4">
              Meet Our Faculty
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Experienced educators dedicated to nurturing young minds
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                name: 'Gorla Lakshmin Devi',
                role: 'Principal',
                qualification: 'M.Ed, Ph.D. Education',
                experience: '25+ years',
                specialization: 'Educational Leadership'
              },
              {
                name: 'Gorla Rajulu',
                role: 'Vice Principal',
                qualification: 'M.Sc. Physics, M.Ed.',
                experience: '20+ years',
                specialization: 'Science Education'
              },
              {
                name: 'Gorla Ramana',
                role: 'Academic Coordinator',
                qualification: 'M.A. English, B.Ed.',
                experience: '18+ years',
                specialization: 'Language Arts'
              }
            ].map((faculty, index) => (
              <motion.div
                key={index}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl p-8 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  {faculty.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{faculty.name}</h3>
                <p className="text-emerald-500 font-semibold mb-2">{faculty.role}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{faculty.qualification}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{faculty.experience} experience</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{faculty.specialization}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => document.getElementById('admissions').scrollIntoView({ behavior: 'smooth' })}
            >
              Join Our Team <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Student Life Section */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white mb-4">
              Student Life at Sadhana
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              A vibrant community where learning extends beyond classrooms
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Student Council',
                description: 'Leadership opportunities through student governance',
                features: ['Leadership training', 'Event management', 'Community service', 'Decision making']
              },
              {
                icon: Trophy,
                title: 'House System',
                description: 'Fostering teamwork and healthy competition',
                features: ['4 houses', 'Inter-house competitions', 'Points system', 'Annual championships']
              },
              {
                icon: Heart,
                title: 'Community Service',
                description: 'Developing empathy and social responsibility',
                features: ['NGO partnerships', 'Rural outreach', 'Environmental projects', 'Social awareness']
              },
              {
                icon: Globe,
                title: 'International Exchange',
                description: 'Global exposure through exchange programs',
                features: ['Student exchanges', 'Cultural immersion', 'Language programs', 'Global partnerships']
              },
              {
                icon: Target,
                title: 'Career Guidance',
                description: 'Comprehensive career counseling and planning',
                features: ['Aptitude testing', 'Career workshops', 'University visits', 'Alumni mentoring']
              },
              {
                icon: Shield,
                title: 'Wellness Program',
                description: 'Holistic development through wellness activities',
                features: ['Yoga & meditation', 'Counseling services', 'Health checkups', 'Stress management']
              }
            ].map((activity, index) => (
              <motion.div
                key={index}
                className="bg-white dark:bg-slate-900 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-xl inline-block mb-6">
                  <activity.icon className="h-8 w-8 text-purple-600 dark:text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{activity.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{activity.description}</p>
                <ul className="space-y-1">
                  {activity.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <CheckCircle className="h-3 w-3 text-purple-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* News & Events Section */}
      <section className="py-24 px-6 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold font-['Playfair_Display'] text-slate-900 dark:text-white mb-4">
              Latest News & Events
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Stay updated with what's happening at Sadhana Memorial School
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                type: 'News',
                title: 'Sadhana Memorial Wins National Excellence Award',
                date: 'December 15, 2024',
                content: 'Our school has been recognized for outstanding contribution to education at the National School Excellence Awards 2024.',
                image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f0f9ff"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23333" font-family="Arial" font-size="18"%3EAnnual Sports Meet%3C/text%3E%3C/svg%3E'
              },
              {
                type: 'Event',
                title: 'Annual Sports Meet 2024',
                date: 'December 20-22, 2024',
                content: 'Join us for three days of sportsmanship, competition, and celebration at our annual sports meet.',
                image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23ff6b35"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23fff" font-family="Arial" font-size="16"%3EAnnual Sports Meet%3C/text%3E%3C/svg%3E'
              },
              {
                type: 'Achievement',
                title: 'Students Win Robotics Competition',
                date: 'December 10, 2024',
                content: 'Our robotics team secured first place in the Inter-School Robotics Championship.',
                image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%234285f4"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23fff" font-family="Arial" font-size="16"%3ERobotics Competition%3C/text%3E%3C/svg%3E'
              },
              {
                type: 'Event',
                title: 'Science Exhibition 2024',
                date: 'January 5-7, 2025',
                content: 'Annual science exhibition showcasing innovative projects and experiments by our students.',
                image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%2300bcd4"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23fff" font-family="Arial" font-size="16"%3EScience Exhibition%3C/text%3E%3C/svg%3E'
              },
              {
                type: 'News',
                title: 'New Computer Lab Inaugurated',
                date: 'December 1, 2024',
                content: 'State-of-the-art computer lab with latest technology inaugurated by the Education Minister.',
                image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%232196f3"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23fff" font-family="Arial" font-size="16"%3EComputer Lab%3C/text%3E%3C/svg%3E'
              },
              {
                type: 'Event',
                title: 'Cultural Fest - SADHANA 2025',
                date: 'January 15-17, 2025',
                content: 'Three-day cultural festival celebrating art, music, dance, and drama performances.',
                image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23e91e63"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23fff" font-family="Arial" font-size="16"%3ECultural Fest%3C/text%3E%3C/svg%3E'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                className="bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="relative h-48">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.type === 'News' ? 'bg-blue-500 text-white' :
                      item.type === 'Event' ? 'bg-emerald-500 text-white' :
                      'bg-orange-500 text-white'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{item.date}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Alumni Section */}
      <section className="py-24 px-6 bg-gradient-to-br from-slate-900 to-emerald-900 text-white">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold font-['Playfair_Display'] mb-4">
              Our Distinguished Alumni
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Leaders making a difference across the globe
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Dr. Rohan Mehta',
                batch: '2005',
                profession: 'Cardiac Surgeon',
                location: 'Johns Hopkins Hospital, USA',
                achievement: 'Pioneer in minimally invasive heart surgery'
              },
              {
                name: 'Anita Desai',
                batch: '2008',
                profession: 'IAS Officer',
                location: 'Government of India',
                achievement: 'Youngest IAS officer from her batch'
              },
              {
                name: 'Vikram Singh',
                batch: '2010',
                profession: 'Tech Entrepreneur',
                location: 'Silicon Valley, USA',
                achievement: 'Founded unicorn startup in AI sector'
              },
              {
                name: 'Priya Nair',
                batch: '2012',
                profession: 'Olympic Athlete',
                location: 'Indian National Team',
                achievement: 'Bronze medalist in Asian Games'
              }
            ].map((alumni, index) => (
              <motion.div
                key={index}
                className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-16 h-16 bg-emerald-400 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
                  {alumni.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="text-lg font-bold mb-1">{alumni.name}</h3>
                <p className="text-sm text-white/80 mb-1">Batch of {alumni.batch}</p>
                <p className="text-emerald-300 font-semibold mb-2">{alumni.profession}</p>
                <p className="text-xs text-white/70 mb-2">{alumni.location}</p>
                <p className="text-xs text-white/60 italic">"{alumni.achievement}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-6 bg-emerald-500 text-white">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold font-['Playfair_Display'] mb-6">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Join thousands of students who have found their path to success at Sadhana Memorial School
            </p>
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <Button
                size="lg"
                className="bg-white text-emerald-600 hover:bg-slate-100 px-8 py-4 text-lg"
                onClick={() => navigate('/auth/register')}
              >
                Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                onClick={() => document.getElementById('campus').scrollIntoView({ behavior: 'smooth' })}
              >
                Schedule Visit
              </Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-lg">Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">100%</div>
                <div className="text-lg">Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">40+</div>
                <div className="text-lg">Years Legacy</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-slate-900 text-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="h-8 w-8 text-emerald-500" />
                <div>
                  <h3 className="text-xl font-bold font-['Playfair_Display']">Sadhana Memorial</h3>
                  <p className="text-sm text-slate-400">Excellence Since 1985</p>
                </div>
              </div>
              <p className="text-slate-400 mb-4">
                Providing world-class education with Indian values for over four decades.
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Globe className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Mail className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><Button variant="ghost" className="text-slate-400 hover:text-white justify-start">About Us</Button></li>
                <li><Button variant="ghost" className="text-slate-400 hover:text-white justify-start">Academics</Button></li>
                <li><Button variant="ghost" className="text-slate-400 hover:text-white justify-start">Admissions</Button></li>
                <li><Button variant="ghost" className="text-slate-400 hover:text-white justify-start">Facilities</Button></li>
                <li><Button variant="ghost" className="text-slate-400 hover:text-white justify-start">Contact</Button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Programs</h4>
              <ul className="space-y-3">
                <li><Button variant="ghost" className="text-slate-400 hover:text-white justify-start">Primary School</Button></li>
                <li><Button variant="ghost" className="text-slate-400 hover:text-white justify-start">Middle School</Button></li>
                <li><Button variant="ghost" className="text-slate-400 hover:text-white justify-start">Senior School</Button></li>
                <li><Button variant="ghost" className="text-slate-400 hover:text-white justify-start">Sports Academy</Button></li>
                <li><Button variant="ghost" className="text-slate-400 hover:text-white justify-start">Arts & Culture</Button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-slate-400">123 Education Road, New Delhi - 110001</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-emerald-500" />
                  <span className="text-slate-400">+91 11 2345 6789</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-emerald-500" />
                  <span className="text-slate-400">info@sadhanamemorial.edu</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-emerald-500" />
                  <span className="text-slate-400">Mon - Sat: 8:00 AM - 4:00 PM</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-400 text-sm">
                &copy; 2025 Sadhana Memorial School. All rights reserved. | CBSE Affiliated | ISO 9001:2015 Certified
              </p>
              <div className="flex gap-6 text-sm text-slate-400">
                <Button variant="ghost" className="text-slate-400 hover:text-white">Privacy Policy</Button>
                <Button variant="ghost" className="text-slate-400 hover:text-white">Terms of Use</Button>
                <Button variant="ghost" className="text-slate-400 hover:text-white">Sitemap</Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* ChatBot */}
      <ChatBot />
    </div>
  );
};

export default LandingPage;
