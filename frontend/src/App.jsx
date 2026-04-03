import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Moon, Sun, LogOut, HeartPulse } from 'lucide-react';
import Login from './pages/Login';
import DailyCheckin from './pages/DailyCheckin';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import VoiceCompanion from './pages/VoiceCompanion';
import HospitalDashboard from './pages/HospitalDashboard';
import HospitalIndex from './pages/hospital/HospitalIndex';
import NewbornVaccination from './pages/hospital/NewbornVaccination';
import OpdToIpd from './pages/hospital/OpdToIpd';
import PostRecovery from './pages/hospital/PostRecovery';
import DailyPlan from './pages/DailyPlan';
import './index.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    setToken(null);
    setUserId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans text-slate-800 dark:text-slate-100 flex flex-col">
        
        {/* Modern Health App Navigation Bar */}
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.href = '/'}>
              <div className="bg-gradient-to-tr from-teal-400 to-blue-500 p-2 rounded-xl shadow-md">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-blue-600 dark:from-teal-400 dark:to-blue-400 tracking-tight hidden sm:block">
                Swasthya Bandhu
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="p-2.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              {token && (
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-stretch">
          <Routes>
            {!token ? (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login setToken={setToken} setUserId={setUserId} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            ) : (
              <>
                <Route path="/checkin" element={<DailyCheckin token={token} />} />
                <Route path="/dashboard" element={<Dashboard token={token} />} />
                <Route path="/voice" element={<VoiceCompanion />} />
                <Route path="/hospital" element={<HospitalIndex token={token} />} />
                <Route path="/hospital/screening" element={<HospitalDashboard token={token} />} />
                <Route path="/hospital/newborn" element={<NewbornVaccination token={token} />} />
                <Route path="/hospital/ipd" element={<OpdToIpd token={token} />} />
                <Route path="/hospital/recovery" element={<PostRecovery token={token} />} />
                <Route path="/plan" element={<DailyPlan token={token} />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

