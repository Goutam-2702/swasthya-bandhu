import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Baby, BedDouble, HeartPulse, ArrowRight, Building2, Activity, LogOut } from 'lucide-react';

const SECTIONS = [
  {
    id: 'screening',
    route: '/hospital/screening',
    icon: Stethoscope,
    iconBg: 'from-blue-500 to-cyan-500',
    cardBorder: 'hover:border-blue-400 dark:hover:border-blue-500',
    glow: 'group-hover:shadow-blue-500/20',
    badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    title: 'Patients After Screening to OPD',
    description: 'Monitor post-screening patients, view critical risk cases from the dataset, and initiate AI follow-up calls.',
    stat: 'Supabase Live Sync',
    statColor: 'text-emerald-500',
  },
  {
    id: 'newborn',
    route: '/hospital/newborn',
    icon: Baby,
    iconBg: 'from-pink-500 to-rose-500',
    cardBorder: 'hover:border-pink-400 dark:hover:border-pink-500',
    glow: 'group-hover:shadow-pink-500/20',
    badge: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    title: 'Newborn Vaccination',
    description: 'Track newborn vaccination schedules, manage upcoming doses, and send reminder calls via AI voice agent.',
    stat: 'Vaccination Agent',
    statColor: 'text-pink-500',
  },
  {
    id: 'ipd',
    route: '/hospital/ipd',
    icon: BedDouble,
    iconBg: 'from-amber-500 to-orange-500',
    cardBorder: 'hover:border-amber-400 dark:hover:border-amber-500',
    glow: 'group-hover:shadow-amber-500/20',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    title: 'Admitted Patients (OPD to IPD)',
    description: 'View and manage patients admitted from OPD to IPD, check bed status, and coordinate care with AI calls.',
    stat: 'Admission Tracker',
    statColor: 'text-amber-500',
  },
  {
    id: 'recovery',
    route: '/hospital/recovery',
    icon: HeartPulse,
    iconBg: 'from-emerald-500 to-teal-500',
    cardBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    glow: 'group-hover:shadow-emerald-500/20',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    title: 'Post Recovery Patients',
    description: 'Monitor discharged patients in their post-recovery phase with daily health check-ins and AI voice reminders.',
    stat: 'Recovery Monitor',
    statColor: 'text-emerald-500',
  },
];

export default function HospitalIndex({ token }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in-up">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/25">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">
                  Hospital Admin Portal
                </h1>
                <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium mt-0.5">
                  <Activity className="w-4 h-4 text-emerald-500" /> Swasthya Bandhu · AI-Powered Care Coordination
                </p>
              </div>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xl">
              Select a care workflow below. Each portal is powered by real-time data and an AI voice agent that can initiate Twilio calls for patient engagement.
            </p>
          </div>
        </div>

        {/* 4 Portal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {SECTIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => navigate(s.route)}
                className={`group text-left bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 ${s.cardBorder} p-8 shadow-sm hover:shadow-xl ${s.glow} transition-all duration-300 active:scale-[0.98] relative overflow-hidden`}
              >
                {/* Background number */}
                <span className="absolute -bottom-4 -right-2 text-[120px] font-black text-slate-100 dark:text-slate-800/60 leading-none select-none pointer-events-none transition-transform duration-300 group-hover:scale-110">
                  {i + 1}
                </span>

                <div className="relative z-10 flex flex-col h-full gap-5">
                  {/* Icon */}
                  <div className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${s.iconBg} items-center justify-center shadow-lg mb-1`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-2 leading-tight">
                      {s.title}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${s.badge}`}>
                      {s.stat}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                      Open <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer use-case strip */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white flex flex-wrap gap-6 justify-around items-center">
          {['Screening to OPD', 'OPD to IPD', 'Recovery Protocol', 'Newborn Vaccination Agent'].map(uc => (
            <div key={uc} className="flex items-center gap-2 text-sm font-semibold opacity-90">
              <span className="w-2 h-2 bg-white rounded-full opacity-70" />
              {uc}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
