import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Droplets, Pill, MoonStar, Activity, Sparkles, Utensils, Calendar, PlusCircle, AlertCircle, PlayCircle, LogOut, Mic } from 'lucide-react';

export default function Dashboard({ token }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [dailyLog, setDailyLog] = useState(null);
  const [todayPlan, setTodayPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextMedTime] = useState(() => Math.floor(Math.random() * 7) + 1);
  const [demoWater] = useState(() => Math.floor(Math.random() * 9) + 1);
  const [demoSleep] = useState(() => Math.floor(Math.random() * 13) + 1);
  const navigate = useNavigate();

  useEffect(() => {
    // Basic auth check
    const userId = localStorage.getItem('userId');
    if (!token || !userId) {
      handleLogout();
      return;
    }
    
    fetchDashboardData(userId);
    fetchTodayPlan();
  }, [token]);

  const fetchTodayPlan = async () => {
    try {
      // Pull dynamic AI plan from the SQLite Node Server
      const res = await fetch('http://localhost:5000/api/dashboard/today-plan', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTodayPlan(data);
    } catch (err) {
      console.error('Error fetching dynamic plan:', err);
    }
  };

  const fetchDashboardData = async (userId) => {
    setLoading(true);
    try {
      // 1. Fetch User
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError && userError.code !== 'PGRST116') console.error('Error fetching user', userError);
      setUser(userData || { name: 'Patient' });

      // 2. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') console.error('Error profile', profileError);
      setProfile(profileData || { food_preference: 'Veg', age: 25, gender: 'Not specified' });

      // 3. Fetch Today's Log
      const today = new Date().toISOString().split('T')[0];
      const { data: logData, error: logError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (logError && logError.code !== 'PGRST116') {
        console.warn('No daily logs for today or error fetching.', logError);
      }
      setDailyLog(logData || { water: 0, medicine_taken: false, sleep_hours: 0, symptoms: 'None reported' });

    } catch (err) {
      console.error('Data fetch error:', err);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-slate-500 font-medium">Loading your health dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <div className="z-10">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-blue-600 dark:from-teal-400 dark:to-blue-500 tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-teal-500" />
              Welcome, {user?.name || 'Patient'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Your personalized AI recovery dashboard.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
            <button 
              onClick={() => navigate('/plan')}
              className="flex items-center gap-2 px-5 py-3 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 rounded-xl font-bold transition-all shadow-sm active:scale-95"
            >
              <Sparkles className="w-5 h-5" /> Generate AI Plan
            </button>

            {/* Voice Companion Button */}
            <button
              onClick={() => navigate('/voice')}
              className="relative flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 overflow-hidden group"
            >
              {/* Animated pulse ring */}
              <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-30 blur transition-opacity duration-300 pointer-events-none" />
              <div className="relative flex items-center gap-2">
                <div className="relative">
                  <Mic className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse border border-white" />
                </div>
                Voice Companion
              </div>
            </button>

          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-blue-500 opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
             <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-sm font-semibold text-slate-500">Water Intake</h3>
              <div className="p-2 rounded-xl bg-blue-500/10"><Droplets className="w-5 h-5 text-blue-500" /></div>
            </div>
            <div className="relative z-10">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{demoWater}</span>
              <span className="text-sm font-medium text-slate-500 ml-1">Glasses</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-500 opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
             <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-sm font-semibold text-slate-500 w-32 leading-snug">Next Medicine To Be Taken In</h3>
              <div className="p-2 rounded-xl bg-emerald-500/10 shrink-0"><Pill className="w-5 h-5 text-emerald-500" /></div>
            </div>
            <div className="relative z-10">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{nextMedTime}</span>
              <span className="text-sm font-medium text-slate-500 ml-1">Hours</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-purple-500 opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"></div>
             <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-sm font-semibold text-slate-500">Sleep Hours</h3>
              <div className="p-2 rounded-xl bg-purple-500/10"><MoonStar className="w-5 h-5 text-purple-500" /></div>
            </div>
            <div className="relative z-10">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{demoSleep}</span>
              <span className="text-sm font-medium text-slate-500 ml-1">Hours</span>
            </div>
          </div>
        </div>

        {/* AI Diet Plan & User Info */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <Utensils className="w-6 h-6 text-orange-500" /> Diet recommendations
                </h3>
                 <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {profile?.food_preference || 'Flexible'}
                 </span>
              </div>
              
              {todayPlan && todayPlan.plan && todayPlan.plan.mealPlan ? (
                <div className="space-y-6">
                  {/* Meal Plan */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {todayPlan.plan.mealPlan.map((meal, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative group text-center flex flex-col items-center justify-center min-h-[140px]">
                         <span className="text-orange-600 dark:text-orange-400 font-bold mb-2 text-sm z-10">{meal.time}</span>
                         <p className="font-extrabold text-slate-800 dark:text-slate-100">{meal.meal}</p>
                         <p className="text-xs text-slate-500 mt-1">{meal.details}</p>
                      </div>
                    ))}
                  </div>

                  {/* Hydration Goal */}
                  {todayPlan.plan.hydrationSchedule && (
                    <div className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                      <div className="bg-emerald-100 dark:bg-emerald-800/50 p-3 rounded-xl shrink-0">
                        <Droplets className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Hydration Daily Goal</p>
                        <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{todayPlan.plan.hydrationSchedule.dailyTarget}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl w-full">
                  <p className="text-slate-500 text-sm font-medium">No diet plan synced yet. Generate a plan to see it here!</p>
                </div>
              )}
            </div>

            {/* Checkin / Status Prompt */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-dashed border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-between">
               <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                     <Calendar className="w-5 h-5 text-indigo-500" /> Daily Health Check-in
                  </h3>
                  <p className="text-sm text-slate-500">Record your symptoms, water intake, and meds for the day.</p>
               </div>
               <button onClick={() => navigate('/checkin')} className="flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all active:scale-95">
                 Update <PlayCircle className="w-5 h-5" />
               </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-teal-500 to-blue-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
               <h3 className="text-xl font-bold flex items-center gap-2 mb-6 relative z-10"><AlertCircle className="w-6 h-6 text-yellow-300" /> Profile Details</h3>
               <ul className="space-y-4 relative z-10 font-medium">
                  <li className="flex justify-between bg-white/10 p-3 rounded-xl border border-white/10">
                     <span className="text-teal-100 opacity-90">Name</span>
                     <span className="font-bold">{user?.name}</span>
                  </li>
                  <li className="flex justify-between bg-white/10 p-3 rounded-xl border border-white/10">
                     <span className="text-teal-100 opacity-90">ABHA ID</span>
                     <span className="font-bold">{user?.abha_id || 'Not linked'}</span>
                  </li>
                  <li className="flex justify-between bg-white/10 p-3 rounded-xl border border-white/10">
                     <span className="text-teal-100 opacity-90">Age / Gender</span>
                     <span className="font-bold">{profile?.age || '-'} / {profile?.gender || '-'}</span>
                  </li>
               </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}