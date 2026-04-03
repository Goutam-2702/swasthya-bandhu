import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Phone, LogOut, Activity, Droplets, Moon, Pill, BellPlus, CalendarDays, ScrollText, AlertTriangle, User, TrendingUp, TrendingDown, Minus, Search, X, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function HospitalDashboard({ token }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReminder, setNewReminder] = useState({ text: '', time: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [searchError, setSearchError] = useState('');
  const [criticalPatients, setCriticalPatients] = useState([]);
  const [symptomsMap, setSymptomsMap] = useState({});
  const navigate = useNavigate();

  const fetchPatients = useCallback(() => {
    if (activeSearch) {
      fetch(`http://localhost:5000/api/hospital/search/${activeSearch}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(async (res) => {
         const data = await res.json();
         if (!res.ok) throw new Error(data.error || "Patient not found");
         setPatients([data]);
         setSearchError('');
         setLoading(false);
      })
      .catch(err => {
         console.error("Error fetching hospital data:", err);
         setPatients([]);
         setSearchError(err.message);
         setLoading(false);
      });
      return;
    }
    fetch('http://localhost:5000/api/hospital', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatients(data);
        } else {
          setPatients([]);
          console.error("Expected array but received:", data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching hospital data:", err);
        setLoading(false);
      });
  }, [activeSearch, token]);

  useEffect(() => {
    fetchPatients();
    // Auto Refresh to catch live voice AI responses
    const interval = setInterval(fetchPatients, 3000);
    return () => clearInterval(interval);
  }, [fetchPatients]);

  // Fetch high-risk patients from Supabase
  useEffect(() => {
    fetch('http://localhost:5000/api/hospital/critical', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (data.patients) setCriticalPatients(data.patients); })
      .catch(() => {});
  }, [token]);

  // Fetch AI symptom summaries – poll every 5 sec so it auto-updates
  useEffect(() => {
    const fetchSymptoms = () => {
      fetch('http://localhost:5000/api/hospital/symptoms', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => { if (typeof data === 'object') setSymptomsMap(data); })
        .catch(() => {});
    };
    fetchSymptoms();
    const interval = setInterval(fetchSymptoms, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setActiveSearch(searchQuery.trim());
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setLoading(true);
  };

  const handleAddReminder = async (e, patientId) => {
    e.preventDefault();
    if (patientId !== 1) return alert("Demo: You can only add reminders to interactive Patient 1 (Rahul).");
    
    await fetch('http://localhost:5000/api/reminders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newReminder)
    });
    
    setNewReminder({ text: '', time: '' });
    fetchPatients();
  };

  const handleAutomatedCall = async (patientName) => {
    try {
      const phoneNumber = prompt(`Enter phone number for ${patientName} (e.g. +1234567890):`);
      if (!phoneNumber) return;
      
      const res = await fetch('http://localhost:5000/api/call-patient', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ toPhoneNumber: phoneNumber, patientName })
      });
      const data = await res.json();
      if (data.success || data.message) {
        alert('Automated call initiated successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to initiate call');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-slate-500 dark:text-slate-400 font-medium">Loading Hospital System...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 dark:from-blue-400 dark:to-blue-600 tracking-tight flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              Hospital Admin Portal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-semibold">Patients After Screening to OPD</p>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 font-medium">
              <Activity className="w-4 h-4 text-emerald-500" /> Monitoring active post-discharge patients (Live Sync)
            </p>
          </div>
          
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
            
            {/* Dropdown Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative group flex items-center">
              <div className="absolute left-3 text-slate-400 group-hover:text-blue-500 transition-colors pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="number" 
                min="1"
                placeholder="Search patient ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/30 outline-none text-sm font-medium text-slate-800 dark:text-slate-200 w-64 md:w-56 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
              />
              {activeSearch && (
                <button type="button" onClick={clearSearch} className="absolute right-10 text-slate-400 hover:text-rose-500 transition-colors bg-white dark:bg-slate-900 p-0.5 rounded-full">
                   <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button type="submit" className="absolute right-3 text-slate-400 group-hover:text-blue-500 transition-colors border-l border-slate-200 dark:border-slate-700 pl-2" title="Search">
                <Search className="w-4 h-4" />
              </button>
            </form>

            <button 
              onClick={() => navigate('/hospital')} 
              className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-colors active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

          </div>
        </div>

        {/* Error Handling */}
        {searchError && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 p-4 rounded-2xl flex items-center justify-center gap-2 font-medium">
            <AlertTriangle className="w-5 h-5" />
            {searchError}
          </div>
        )}

        {/* ── Critical Patients Block ───────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-200 dark:border-rose-800/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              Critical Patients:
            </h2>
            <span className="text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full">
              {criticalPatients.length} High Risk · Supabase Live
            </span>
          </div>
          {criticalPatients.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm italic">Loading critical patients from dataset...</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {criticalPatients.map(p => (
                <div key={p.id}
                  className="flex flex-col items-center bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50 rounded-2xl px-4 py-3 min-w-[110px] shadow-sm hover:shadow-rose-500/10 hover:border-rose-400 transition-all cursor-pointer"
                  onClick={() => setSearchQuery(String(p.id))}
                  title={`Click to search Patient ID ${p.id}`}
                >
                  <div className="w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center mb-1">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">ID: {p.id}</div>
                  {p.overall_risk_score && (
                    <div className="text-xs text-rose-500/70 dark:text-rose-400/60 font-medium">Score: {p.overall_risk_score}</div>
                  )}
                  {p.systolic_bp && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">BP: {p.systolic_bp}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {patients.map(patient => {
            const isCritical = patient.condition === "Critical";
            const latestCheckin = patient.checkins.length > 0 ? patient.checkins[0] : null; // slice returning multiple 

            // Risk Level Calculation for 7-Day Summary
            let riskLevel = "Good";
            let riskColor = "text-emerald-500";
            let trendIcon = <TrendingUp className="w-4 h-4" />;
            
            if (patient.sevenDaySummary) {
              const { avgWater, medAdherence, avgSleep } = patient.sevenDaySummary;
              if (medAdherence < 50 || avgWater < 4 || avgSleep < 4) {
                riskLevel = "Critical";
                riskColor = "text-rose-500";
                trendIcon = <TrendingDown className="w-4 h-4 cursor-pointer" />;
              } else if (medAdherence < 80 || avgWater < 6 || avgSleep < 6) {
                riskLevel = "Moderate";
                riskColor = "text-amber-500";
                trendIcon = <Minus className="w-4 h-4" />;
              }
            }

            return (
              <div key={patient.id} className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 flex flex-col ${isCritical ? 'border-2 border-rose-500 shadow-rose-500/20 shadow-xl' : 'border border-slate-200 dark:border-slate-800 hover:shadow-md'}`}>
                
                {/* Card Header */}
                <div className={`p-6 flex justify-between items-center ${isCritical ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'}`}>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <User className={`w-5 h-5 ${isCritical ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    {patient.name}
                  </h3>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${isCritical ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-600'}`}>
                    <CalendarDays className="w-3.5 h-3.5" /> Day {patient.daysPostDischarge}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col space-y-6">
                  
                  {/* Status */}
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Current Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-rose-500 animate-pulse' : (patient.condition === 'Stable' ? 'bg-emerald-500' : 'bg-amber-500')}`}></div>
                      <span className={`text-2xl font-extrabold ${isCritical ? 'text-rose-500' : (patient.condition === 'Stable' ? 'text-emerald-500' : 'text-amber-500')}`}>
                        {patient.condition}
                      </span>
                    </div>
                  </div>


                  {/* 7-DAY SUMMARY - NEW */}
                  {patient.sevenDaySummary && (
                    <div className="bg-slate-100/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                       <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-slate-700/50 pb-2">
                         <span className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                           <Activity className="w-4 h-4" /> 7-Day Overview
                         </span>
                         <span className={`text-xs font-bold flex items-center gap-1 ${riskColor} bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-slate-800`}>
                           {trendIcon} {riskLevel} Risk
                         </span>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-200 dark:divide-slate-700">
                         <div>
                           <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Water</div>
                           <div className="text-lg font-extrabold text-blue-500 flex items-center justify-center gap-0.5"><Droplets className="w-3 h-3" /> {patient.sevenDaySummary.avgWater}</div>
                         </div>
                         <div>
                           <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Meds</div>
                           <div className={`text-lg font-extrabold ${patient.sevenDaySummary.medAdherence >= 80 ? 'text-emerald-500' : 'text-rose-500'} flex items-center justify-center gap-0.5`}><Pill className="w-3 h-3" /> {patient.sevenDaySummary.medAdherence}%</div>
                         </div>
                         <div>
                           <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Sleep</div>
                           <div className="text-lg font-extrabold text-purple-500 flex items-center justify-center gap-0.5"><Moon className="w-3 h-3" /> {patient.sevenDaySummary.avgSleep}h</div>
                         </div>
                       </div>
                    </div>
                  )}

                  {/* NEW SYMPTOMS - always visible between 7-Day and Clinical Vitals */}
                  <div className={`p-4 rounded-2xl border shadow-sm transition-colors ${
                    symptomsMap[String(patient.id)]
                      ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/50'
                      : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'
                  }`}>
                    <span className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" /> New Symptoms:
                    </span>
                    {symptomsMap[String(patient.id)] ? (
                      <>
                        <p className="text-base font-extrabold text-rose-700 dark:text-rose-300 mt-1 leading-snug">
                          {symptomsMap[String(patient.id)].summary}
                        </p>
                        <p className="text-xs font-medium mt-1.5 text-rose-500 dark:text-rose-400">
                          {symptomsMap[String(patient.id)].feelsBetter ? '✅ Patient feels better than yesterday' : '⚠️ Patient does not feel better'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-500 italic mt-1">None reported</p>
                    )}
                  </div>

                  {/* SUPABASE CLINICAL DATA TABLE */}
                  {patient.clinicalData && (
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <ScrollText className="w-4 h-4 text-blue-500" /> Complete Clinical Vitals
                      </h4>
                      <div className="h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                            <tr>
                              <th className="py-2 border-b border-slate-200 dark:border-slate-800">Vital Sign / Metric</th>
                              <th className="py-2 border-b border-slate-200 dark:border-slate-800 text-right">Registered Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(patient.clinicalData)
                              .filter(([key]) => !['id', 'updated_at', 'health_camp_name', 'patient_id'].includes(key))
                              .map(([key, value]) => (
                                <tr key={key} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                  <td className="py-2.5 font-medium capitalize truncate max-w-[120px]" title={key.replace(/_/g, ' ')}>
                                    {key.replace(/_/g, ' ')}
                                  </td>
                                  <td className="py-2.5 text-right font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {value || '-'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => handleAutomatedCall(patient.name)}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5 animate-pulse" /> Initiate AI Phone Call
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
