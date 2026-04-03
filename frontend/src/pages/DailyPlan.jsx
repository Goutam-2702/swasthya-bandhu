import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, Activity, Weight, CalendarCheck, Utensils, Droplets, Pill, MoonStar, Clock, Volume2, Upload, CheckCircle2, FileText } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function DailyPlan({ token }) {
  const [formData, setFormData] = useState({ illness: '', age: '', weight: '', foodPreference: 'Any' });
  const [getHospitalVitalInfo, setGetHospitalVitalInfo] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [vitalsData, setVitalsData] = useState(null);
  const [fetchingVitals, setFetchingVitals] = useState(false);
  const [vitalsError, setVitalsError] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleVitalCheckbox = (e) => {
    setGetHospitalVitalInfo(e.target.checked);
    if (!e.target.checked) {
      setVitalsData(null);
      setPatientId('');
      setVitalsError('');
    }
  };

  const fetchHospitalVitals = async () => {
    if (!patientId.trim()) {
      setVitalsError('Please enter a valid Patient ID');
      return;
    }
    setFetchingVitals(true);
    setVitalsError('');
    setVitalsData(null);
    try {
      const res = await axios.get(`${API_URL}/vitals/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVitalsData(res.data);
    } catch (err) {
      console.error(err);
      setVitalsError('Failed to fetch hospital vitals. Check ID and try again.');
    }
    setFetchingVitals(false);
  };

  const generatePlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/generate-plan`, { ...formData, getHospitalVitalInfo, hospitalVitals: vitalsData }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlan(res.data);
      setSaved(false);
    } catch (err) {
      console.error(err);
      setError('Failed to generate plan. Please try again.');
    }
    setLoading(false);
  };

  const savePlanToReminders = async () => {
    try {
      await axios.post(`${API_URL}/save-plan`, { plan, foodPreference: formData.foodPreference }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSaved(true);
      alert('✅ Plan successfully added to Voice Reminders and Dashboard!');
    } catch (err) {
      console.error(err);
      alert('❌ Failed to save plan.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-300 flex flex-col">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up w-full">
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors group w-max"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
        </button>

        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 mb-2 shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600 dark:from-teal-400 dark:to-blue-500 tracking-tight">
            AI Recovery Engine
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">Generate a personalized daily plan based on your vitals and prescription.</p>
        </div>

        {!plan && (
          <form onSubmit={generatePlan} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-2xl mx-auto w-full">
            <div className="space-y-6">
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Current Illness / Condition</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Activity className="h-5 w-5 text-slate-400" />
                  </div>
                  <input required type="text" name="illness" value={formData.illness} onChange={handleChange} 
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-800 dark:text-slate-200 shadow-sm font-medium"
                    placeholder="e.g. Post-Covid, Dengue Recovery, Surgery" />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex-1 space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Age</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CalendarCheck className="h-5 w-5 text-slate-400" />
                    </div>
                    <input required type="number" name="age" value={formData.age} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-800 dark:text-slate-200 shadow-sm font-medium"
                      placeholder="Years" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Weight (kg)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Weight className="h-5 w-5 text-slate-400" />
                    </div>
                    <input required type="number" name="weight" value={formData.weight} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-800 dark:text-slate-200 shadow-sm font-medium"
                      placeholder="kg" />
                  </div>
                </div>
              </div>

              {/* NEW FIELDS */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-6">
                
                {/* Food Preference */}
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Diet Preference</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Utensils className="h-5 w-5 text-slate-400" />
                    </div>
                    <select name="foodPreference" value={formData.foodPreference} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-800 dark:text-slate-200 shadow-sm font-medium appearance-none cursor-pointer">
                      <option value="Any">Mixed (Any)</option>
                      <option value="Veg">Vegetarian</option>
                      <option value="Non-Veg">Non-Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                    </select>
                  </div>
                </div>

                {/* Get Vital Info Checkbox */}
                <div className="flex items-center space-x-3 p-4 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-xl">
                  <input
                    type="checkbox"
                    id="vitalCheckbox"
                    checked={getHospitalVitalInfo}
                    onChange={handleVitalCheckbox}
                    className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 dark:focus:ring-teal-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="vitalCheckbox" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    Get Vital Info from hospital
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                    Fetches your updated record from OPD screening
                  </span>
                </div>

                {getHospitalVitalInfo && (
                  <div className="space-y-4 animate-fade-in-up bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                        <input type="text" value={patientId} onChange={(e) => setPatientId(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-800 dark:text-slate-200 shadow-sm font-medium"
                          placeholder="Enter Patient ID" />
                      </div>
                      <button type="button" onClick={fetchHospitalVitals} disabled={fetchingVitals || !patientId.trim()}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                        {fetchingVitals ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Fetch'}
                      </button>
                    </div>

                    {vitalsError && <div className="text-rose-600 text-sm font-medium">{vitalsError}</div>}

                    {vitalsData && (
                      <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-teal-100 dark:border-teal-900 shadow-inner max-h-64 overflow-y-auto">
                        <h4 className="text-sm font-bold text-teal-700 dark:text-teal-400 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Vitals Retrieved Successfully
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          {Object.entries(vitalsData).map(([key, value]) => {
                            if (value === null || value === undefined || key === 'id') return null;
                            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            return (
                              <div key={key} className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 font-medium">
                                <span className="text-slate-500 dark:text-slate-400 block text-xs truncate">{formattedKey}</span>
                                <span className="text-slate-800 dark:text-slate-200 block truncate" title={String(value)}>{String(value)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && <div className="text-rose-600 bg-rose-50 dark:bg-rose-900/30 p-4 rounded-xl text-sm font-medium flex items-center gap-2">{error}</div>}

            <button type="submit" disabled={loading} 
              className="group relative w-full flex justify-center items-center gap-2 py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-lg mt-6"
            >
              {loading ? (
                 <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                 <>Generate Recovery Plan <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" /></>
              )}
            </button>
          </form>
        )}

        {plan && (
           <div className="space-y-6 animate-fade-in-up w-full">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center rounded-2xl">
                          <CalendarCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Smart Daily Plan</h2>
                          <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Utensils className="w-3.5 h-3.5" /> {formData.foodPreference} Diet {getHospitalVitalInfo && <><span className="mx-1">•</span> <FileText className="w-3.5 h-3.5" /> Hospital Vitals Mapped</>}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={savePlanToReminders} 
                          disabled={saved}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold ${saved ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'}`}
                        >
                          {saved ? <><CheckCircle2 className="w-4 h-4" /> Added to System</> : <><Volume2 className="w-4 h-4" /> Sync to Dashboard & Voice</>}
                        </button>
                        <button onClick={() => setPlan(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors active:scale-95">
                          Regenerate
                        </button>
                      </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6 w-full">
                      
                      {/* Meal Plan */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 w-full overflow-hidden">
                          <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                            <Utensils className="w-5 h-5 flex-shrink-0" /> Diet & Meal Plan
                          </h3>
                          <ul className="space-y-4">
                              {plan.mealPlan?.map((m, i) => (
                                  <li key={i} className="flex gap-4 p-3.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                                      <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-1.5 rounded-lg text-xs font-bold h-max whitespace-nowrap shadow-sm border border-blue-200 dark:border-blue-800/50">
                                        {m.time}
                                      </div>
                                      <div className="min-w-0 pr-2 pb-1">
                                          <p className="text-slate-800 dark:text-slate-200 font-bold text-sm mb-1">{m.meal}</p>
                                          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed break-words whitespace-normal">{m.details}</p>
                                      </div>
                                  </li>
                              ))}
                          </ul>
                      </div>

                      {/* Hydration */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 w-full overflow-hidden">
                          <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                            <Droplets className="w-5 h-5 flex-shrink-0" /> Hydration
                          </h3>
                          <div className="mb-4 flex items-center gap-3">
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                               <span className="text-sm font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Daily Goal</span> 
                               <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{plan.hydrationSchedule?.dailyTarget}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {plan.hydrationSchedule?.reminders?.map((r, i) => (
                                  <span key={i} className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-sm">
                                      {r}
                                  </span>
                              ))}
                          </div>
                      </div>

                      {/* Medicine Timing */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 w-full overflow-hidden">
                          <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2">
                            <Pill className="w-5 h-5 flex-shrink-0" /> Medicine Schedule
                          </h3>
                          <ul className="space-y-3">
                              {plan.medicineTiming?.map((m, i) => (
                                  <li key={i} className="flex gap-4 p-3.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 border-l-4 border-l-rose-500 relative overflow-hidden">
                                      <div className="absolute top-0 right-0 p-3 opacity-5">
                                        <Pill className="w-10 h-10" />
                                      </div>
                                      <div className="text-rose-600 dark:text-rose-400 font-bold text-sm whitespace-nowrap mt-0.5">
                                        {m.time}
                                      </div>
                                      <div className="min-w-0 pr-2">
                                          <p className="text-slate-800 dark:text-slate-200 font-bold text-sm mb-1">{m.medicine}</p>
                                          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium break-words leading-relaxed">{m.purpose} • {m.dosage}</p>
                                      </div>
                                  </li>
                              ))}
                          </ul>
                      </div>

                      {/* Sleep & Routine */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 w-full overflow-hidden">
                          <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2">
                            <MoonStar className="w-5 h-5 flex-shrink-0" /> Sleep & Routine
                          </h3>
                          <div className="grid grid-cols-2 gap-3 mb-6">
                              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-sm text-center">
                                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Bedtime</span>
                                <span className="block text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{plan.sleepRecommendations?.bedtime}</span>
                              </div>
                              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-sm text-center">
                                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Wake up</span>
                                <span className="block text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{plan.sleepRecommendations?.wakeupTime}</span>
                              </div>
                          </div>
                          <div className="space-y-3">
                              {plan.dailyRoutine?.map((r, i) => (
                                  <div key={i} className="flex items-start gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm">
                                      <Clock className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                                      <div className="min-w-0">
                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm block mb-0.5">{r.time}</span>
                                        <span className="text-slate-500 dark:text-slate-400 text-xs break-words">{r.activity}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                      
                  </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
