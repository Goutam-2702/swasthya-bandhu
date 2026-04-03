import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, ArrowLeft, Phone, Search, X, User, CalendarDays, Activity, CheckCircle2, Clock } from 'lucide-react';

const DEMO_PATIENTS = [
  {
    id: 'IPD001',
    name: 'TestPatient001',
    age: 45,
    gender: 'Male',
    admittedDate: new Date().toLocaleDateString('en-IN'),
    ward: 'General Ward',
    bed: 'Bed 12',
    doctor: 'Dr. Mehta (Internal Medicine)',
    diagnosis: 'Hypertension · Type 2 Diabetes',
    status: 'Admitted',
    statusColor: 'text-amber-500',
    statusBg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50',
    condition: 'Stable',
    conditionColor: 'text-emerald-500',
    daysSince: 1,
    vitals: { bp: '142/88 mmHg', pulse: '78 bpm', spo2: '98%', temp: '98.6°F' },
    phone: '+91 98765 00001',
  },
  {
    id: 'IPD002',
    name: 'TestPatient002',
    age: 62,
    gender: 'Female',
    admittedDate: new Date(Date.now() - 2 * 86400000).toLocaleDateString('en-IN'),
    ward: 'ICU',
    bed: 'ICU Bed 3',
    doctor: 'Dr. Kapoor (Cardiology)',
    diagnosis: 'Acute Myocardial Infarction',
    status: 'Admitted',
    statusColor: 'text-rose-500',
    statusBg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/50',
    condition: 'Critical',
    conditionColor: 'text-rose-500',
    daysSince: 3,
    vitals: { bp: '160/95 mmHg', pulse: '92 bpm', spo2: '96%', temp: '99.1°F' },
    phone: '+91 98765 00002',
  },
];

export default function OpdToIpd({ token }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPatients, setFilteredPatients] = useState(DEMO_PATIENTS);
  const [calling, setCalling] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) { setFilteredPatients(DEMO_PATIENTS); return; }
    const q = searchQuery.toLowerCase();
    setFilteredPatients(DEMO_PATIENTS.filter(p =>
      p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    ));
  };

  const clearSearch = () => { setSearchQuery(''); setFilteredPatients(DEMO_PATIENTS); };

  const initiateCall = async (patient) => {
    setCalling(patient.id);
    const phone = prompt(`Phone number for ${patient.name}:`, patient.phone);
    if (!phone) { setCalling(null); return; }
    try {
      const res = await fetch('http://localhost:5000/api/call-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toPhoneNumber: phone, patientName: patient.name, callType: 'ipd-followup' }),
      });
      const data = await res.json();
      alert(data.success ? `✅ AI call initiated to ${patient.name}!` : `❌ ${data.error || 'Call failed'}`);
    } catch { alert('❌ Call failed — check backend connection'); }
    finally { setCalling(null); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/25">
                <BedDouble className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-500 tracking-tight">
                Admitted Patients (OPD to IPD)
              </h1>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-medium">
              <Activity className="w-4 h-4 text-amber-500" /> Managing active IPD admissions
            </p>
          </div>
          <div className="relative z-10 flex gap-3">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="relative flex items-center group">
              <label className="absolute left-3 text-xs font-bold text-slate-400 pointer-events-none whitespace-nowrap">Patient No.:</label>
              <input
                type="text"
                placeholder="ID or Name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-24 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 w-56 outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              {searchQuery && (
                <button type="button" onClick={clearSearch} className="absolute right-8 text-slate-400 hover:text-rose-500"><X className="w-3.5 h-3.5" /></button>
              )}
              <button type="submit" className="absolute right-3 text-slate-400 hover:text-amber-500"><Search className="w-4 h-4" /></button>
            </form>
            <button onClick={() => navigate('/hospital')}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl font-bold transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </div>

        {/* Patient cards */}
        <div className="space-y-6">
          {filteredPatients.length === 0 && (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500 font-medium">No patients found for "{searchQuery}"</div>
          )}
          {filteredPatients.map(patient => (
            <div key={patient.id} className={`bg-white dark:bg-slate-900 rounded-3xl border-2 ${patient.statusBg} shadow-sm overflow-hidden`}>
              {/* Card header */}
              <div className={`px-6 py-4 flex items-center justify-between border-b ${patient.condition === 'Critical' ? 'bg-rose-500 border-rose-600' : 'bg-amber-500 border-amber-600'}`}>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-white" />
                  <span className="font-extrabold text-white text-lg">{patient.name}</span>
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">{patient.id}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <CalendarDays className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">Day {patient.daysSince}</span>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Status row */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400 mb-1">Status</div>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${patient.statusColor}`}>
                      <CheckCircle2 className="w-4 h-4" /> {patient.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400 mb-1">Condition</div>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${patient.conditionColor}`}>
                      <span className={`w-2 h-2 rounded-full ${patient.condition === 'Critical' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                      {patient.condition}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400 mb-1">Ward / Bed</div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{patient.ward} · {patient.bed}</span>
                  </div>
                  <div>
                    <div className="text-xs uppercase font-bold text-slate-400 mb-1">Admitted On</div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{patient.admittedDate}</span>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Age / Gender', val: `${patient.age} / ${patient.gender}` },
                    { label: 'Doctor', val: patient.doctor },
                    { label: 'Diagnosis', val: patient.diagnosis },
                    { label: 'BP', val: patient.vitals.bp },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{item.label}</div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.val}</div>
                    </div>
                  ))}
                </div>

                {/* Vitals row */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'BP', val: patient.vitals.bp, color: 'text-rose-500' },
                    { label: 'Pulse', val: patient.vitals.pulse, color: 'text-red-500' },
                    { label: 'SpO2', val: patient.vitals.spo2, color: 'text-blue-500' },
                    { label: 'Temp', val: patient.vitals.temp, color: 'text-amber-500' },
                  ].map(v => (
                    <div key={v.label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{v.label}</div>
                      <div className={`font-extrabold text-sm ${v.color}`}>{v.val}</div>
                    </div>
                  ))}
                </div>

                <button onClick={() => initiateCall(patient)} disabled={calling === patient.id}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60">
                  <Phone className="w-5 h-5 animate-pulse" /> {calling === patient.id ? 'Initiating AI Call...' : 'Initiate AI Phone Call'}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
