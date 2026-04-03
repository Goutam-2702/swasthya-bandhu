import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Baby, ArrowLeft, Phone, Calendar, CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react';

const VACCINE_SCHEDULE = [
  { name: 'BCG', dose: '1st Dose', ageWeeks: 0, disease: 'Tuberculosis', status: 'given' },
  { name: 'Hepatitis B', dose: '1st Dose', ageWeeks: 0, disease: 'Hepatitis B', status: 'given' },
  { name: 'OPV', dose: '1st Dose', ageWeeks: 0, disease: 'Polio', status: 'given' },
  { name: 'Pentavalent', dose: '1st Dose', ageWeeks: 6, disease: 'DPT + Hib + HepB', status: 'due' },
  { name: 'OPV', dose: '2nd Dose', ageWeeks: 6, disease: 'Polio', status: 'due' },
  { name: 'Rotavirus', dose: '1st Dose', ageWeeks: 6, disease: 'Rotavirus Diarrhea', status: 'due' },
  { name: 'Pentavalent', dose: '2nd Dose', ageWeeks: 10, disease: 'DPT + Hib + HepB', status: 'upcoming' },
  { name: 'OPV', dose: '3rd Dose', ageWeeks: 14, disease: 'Polio', status: 'upcoming' },
  { name: 'Measles-Rubella', dose: '1st Dose', ageWeeks: 36, disease: 'Measles & Rubella', status: 'upcoming' },
  { name: 'DPT Booster', dose: 'Booster', ageWeeks: 72, disease: 'Diphtheria, Pertussis, Tetanus', status: 'upcoming' },
];

const DEMO_BABIES = [
  { id: 'NB001', name: 'Baby Sharma', mother: 'Priya Sharma', dob: 'Today', ward: 'Maternity Ward 3, Bed 7', nextVaccine: 'Pentavalent 1st (Due in 42 days)', phone: '+91 98765 43210', status: 'active' },
  { id: 'NB002', name: 'Baby Verma', mother: 'Sunita Verma', dob: '3 days ago', ward: 'Maternity Ward 1, Bed 2', nextVaccine: 'BCG & Hep-B (Due Now)', phone: '+91 99887 76655', status: 'due' },
];

export default function NewbornVaccination({ token }) {
  const navigate = useNavigate();
  const [calling, setCalling] = useState(null);

  const initiateCall = async (baby) => {
    setCalling(baby.id);
    const phone = prompt(`Confirm phone number for ${baby.mother} (${baby.name}):\n\nEnter number (e.g. +91XXXXXXXXXX):`, baby.phone);
    if (!phone) { setCalling(null); return; }
    try {
      const res = await fetch('http://localhost:5000/api/call-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toPhoneNumber: phone, patientName: `${baby.mother} (${baby.name})`, callType: 'vaccination-reminder' }),
      });
      const data = await res.json();
      alert(data.success ? `✅ Call initiated to ${baby.mother}!` : `❌ ${data.error || 'Call failed'}`);
    } catch { alert('❌ Call failed — check backend connection'); }
    finally { setCalling(null); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-br from-pink-500 to-rose-600 p-8 rounded-3xl text-white shadow-xl shadow-pink-500/20 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-2xl border border-white/30">
                <Baby className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Newborn Vaccination Agent</h1>
            </div>
            <p className="text-pink-100 font-medium">AI-powered vaccine schedule tracker · Twilio reminder calls</p>
          </div>
          <button onClick={() => navigate('/hospital')}
            className="relative z-10 flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl font-bold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Portal
          </button>
        </div>

        {/* Demo babies */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Baby className="w-5 h-5 text-pink-500" /> Newborn Records
          </h2>
          {DEMO_BABIES.map(baby => (
            <div key={baby.id} className={`bg-white dark:bg-slate-900 rounded-2xl border-2 p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-start justify-between ${baby.status === 'due' ? 'border-rose-300 dark:border-rose-600' : 'border-slate-200 dark:border-slate-800'}`}>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-full"><Baby className="w-5 h-5 text-pink-500" /></div>
                  <div>
                    <div className="font-extrabold text-slate-800 dark:text-slate-100 text-lg">{baby.name}</div>
                    <div className="text-sm text-slate-500">Mother: {baby.mother} · Born {baby.dob}</div>
                  </div>
                  {baby.status === 'due' && <span className="ml-auto text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full animate-pulse">⚠️ Vaccine Due</span>}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                    <div className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase mb-1">Ward / Bed</div>
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{baby.ward}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                    <div className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase mb-1"><Calendar className="w-3 h-3 inline mr-1" />Next Vaccine</div>
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{baby.nextVaccine}</div>
                  </div>
                </div>
              </div>
              <button onClick={() => initiateCall(baby)} disabled={calling === baby.id}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-pink-500/25 transition-all active:scale-95 disabled:opacity-60">
                <Phone className="w-5 h-5 animate-pulse" /> {calling === baby.id ? 'Calling...' : 'Send Reminder Call'}
              </button>
            </div>
          ))}
        </div>

        {/* Vaccine Schedule Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-500" />
            <h2 className="font-bold text-slate-700 dark:text-slate-200">National Immunization Schedule (NIS)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-3 text-left">Vaccine</th>
                  <th className="px-6 py-3 text-left">Dose</th>
                  <th className="px-6 py-3 text-left">Age</th>
                  <th className="px-6 py-3 text-left">Disease Protected</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {VACCINE_SCHEDULE.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 font-bold text-slate-800 dark:text-slate-100">{v.name}</td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{v.dose}</td>
                    <td className="px-6 py-3 text-slate-600 dark:text-slate-300">{v.ageWeeks === 0 ? 'At Birth' : `${v.ageWeeks} weeks`}</td>
                    <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{v.disease}</td>
                    <td className="px-6 py-3">
                      {v.status === 'given' && <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Given</span>}
                      {v.status === 'due' && <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-2 py-1 rounded-full animate-pulse"><AlertCircle className="w-3 h-3" /> Due Now</span>}
                      {v.status === 'upcoming' && <span className="inline-flex items-center gap-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Upcoming</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
