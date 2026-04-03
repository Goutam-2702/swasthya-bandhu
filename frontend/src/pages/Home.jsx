import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, User } from 'lucide-react';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <div className="text-center max-w-3xl mb-12 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-teal-500 to-blue-600 dark:from-teal-400 dark:to-blue-500 mb-6 drop-shadow-sm">
          Your Recovery,<br/>Guided by AI.
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
          Swasthya Bandhu is your AI-powered companion designed to accelerate healing, monitor vitals, and ensure peace of mind.
        </p>
      </div>
      
      <div className="flex justify-center mb-12 w-full max-w-2xl">
        <button 
          onClick={() => navigate('/login')} 
          className="group relative flex items-center justify-center gap-3 px-12 py-5 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full shadow-lg shadow-teal-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300 text-white font-extrabold text-xl overflow-hidden"
        >
          {/* Hover glow */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-teal-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3">
            <User className="w-6 h-6 animate-pulse" />
            <span className="tracking-wide">LOGIN</span>
          </div>
        </button>
      </div>

      {/* Background Decorative Blobs */}
      <div className="fixed top-20 -left-20 w-72 h-72 bg-teal-400/20 dark:bg-teal-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob pointer-events-none"></div>
      <div className="fixed top-40 -right-20 w-72 h-72 bg-blue-400/20 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
    </div>
  );
}

export default Home;