import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, ArrowLeft, Phone, Activity, Droplets, Moon, Pill, User, CalendarDays, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const DEMO_RECOVERY_PATIENTS = [
  {
    id: 'PR001',
    name: 'TestRecovery001',
    daysPostDischarge: 4,
    condition: 'Recovering',
    conditionColor: 'text-teal-500',
    riskLevel: 'Moderate',
    riskColor: 'text-amber-500',
    trendIcon: 'minus',
    sevenDaySummary: { avgWater: 6, medAdherence: 78, avgSleep: 6.5 },
    vitals: { bp: '128/82 mmHg', pulse: '74 bpm', weight: '68 kg' },
    discharge: 'Post-Cardiac Surgery Recovery',
    phone: '+91 98765 11111',
  },
  {
    id: 'PR002',
    name: 'TestRecovery002',
    daysPostDischarge: 8,
    condition: 'Stable',
    conditionColor: 'text-emerald-500',
    riskLevel: 'Low',
    riskColor: 'text-emerald-500',
    trendIcon: 'up',
    sevenDaySummary: { avgWater: 8, medAdherence: 95, avgSleep: 7.5 },
    vitals: { bp: '120/78 mmHg', pulse: '70 bpm', weight: '72 kg' },
    discharge: 'Post-Appendectomy Recovery',
    phone: '+91 98765 22222',
  },
];

const TrendIcon = ({ type }) => {
  if (type === 'up') return <TrendingUp className="w-3 h-3 text-emerald-500" />;
  if (type === 'down') return <TrendingDown className="w-3 h-3 text-rose-500" />;
  return <Minus className="w-3 h-3 text-amber-500" />;
};

export default function PostRecovery({ token }) {
  const navigate = useNavigate();
  const [calling, setCalling] = useState(null);

  const initiateCall = async (patient) => {
    setCalling(patient.id);
    const phone = prompt(`Phone number for ${patient.name}:`, patient.phone);
    if (!phone) { setCalling(null); return; }
    try {
      const res = await fetch('http://localhost:5000/api/call-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toPhoneNumber: phone, patientName: patient.name, callType: 'recovery-followup' }),
      });
      const data = await res.json();
      alert(data.success ? `✅ AI recovery follow-up call initiated!` : `❌ ${data.error || 'Call failed'}`);
    } catch { alert('❌ Call failed — check backend connection'); }
    finally { setCalling(null); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/25">
                <HeartPulse className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 tracking-tight">
                Hospital Admin Portal
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold ml-1">Post Recovery Patients</p>
            <p className="text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <Activity className="w-4 h-4 text-emerald-500" /> Monitoring post-discharge recovery (Live Sync)
            </p>
          </div>
          <button onClick={() => navigate('/hospital')}
            className="relative z-10 flex items-center gap-2 px-6 py-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold transition-colors active:scale-95">
            <ArrowLeft className="w-5 h-5" /> Back to Portal
          </button>
        </div>

        {/* Patient cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DEMO_RECOVERY_PATIENTS.map(patient => {
            const isCritical = patient.condition === 'Critical';
            return (
              <div key={patient.id} className={`bg-white dark:bg-slate-900 rounded-3xl border-2 shadow-sm overflow-hidden flex flex-col ${isCritical ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}>
                {/* Card header */}
                <div className={`flex items-center justify-between px-6 py-4 ${isCritical ? 'bg-rose-500' : 'bg-gradient-to-r from-teal-500 to-emerald-600'}`}>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-white" />
                    <span className="font-extrabold text-white text-lg">{patient.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
                    <CalendarDays className="w-4 h-4 text-white" />
                    <span className="text-white font-bold text-sm">Day {patient.daysPostDischarge}</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col space-y-4">
                  {/* Status */}
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Status</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <span className={`text-2xl font-extrabold ${patient.conditionColor}`}>{patient.condition}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{patient.discharge}</p>
                  </div>

                  {/* 7-Day Overview */}
                  <div className="bg-slate-100/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-3 border-b border-slate-200 dark:border-slate-700/50 pb-2">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> 7-Day Overview
                      </span>
                      <span className={`text-xs font-bold flex items-center gap-1 ${patient.riskColor} bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-slate-800`}>
                        <TrendIcon type={patient.trendIcon} /> {patient.riskLevel} Risk
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-200 dark:divide-slate-700">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Water</div>
                        <div className="text-lg font-extrabold text-blue-500 flex items-center justify-center gap-0.5">
                          <Droplets className="w-3 h-3" /> {patient.sevenDaySummary.avgWater}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Meds</div>
                        <div className={`text-lg font-extrabold ${patient.sevenDaySummary.medAdherence >= 80 ? 'text-emerald-500' : 'text-rose-500'} flex items-center justify-center gap-0.5`}>
                          <Pill className="w-3 h-3" /> {patient.sevenDaySummary.medAdherence}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Sleep</div>
                        <div className="text-lg font-extrabold text-purple-500 flex items-center justify-center gap-0.5">
                          <Moon className="w-3 h-3" /> {patient.sevenDaySummary.avgSleep}h
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick vitals */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'BP', val: patient.vitals.bp, color: 'text-rose-500' },
                      { label: 'Pulse', val: patient.vitals.pulse, color: 'text-red-500' },
                      { label: 'Weight', val: patient.vitals.weight, color: 'text-teal-500' },
                    ].map(v => (
                      <div key={v.label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-center">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{v.label}</div>
                        <div className={`font-extrabold text-xs ${v.color}`}>{v.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Call button */}
                  <button onClick={() => initiateCall(patient)} disabled={calling === patient.id}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 mt-auto">
                    <Phone className="w-5 h-5 animate-pulse" /> {calling === patient.id ? 'Initiating Call...' : 'Initiate AI Phone Call'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
