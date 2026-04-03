import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Droplets, Moon, CheckCircle2, Activity, Volume2, CalendarCheck, Sparkles } from 'lucide-react';

export default function DailyCheckin({ token }) {
  const [form, setForm] = useState({ water: 0, sleep: 0, medicineTaken: false, painLevel: 0 });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [advice, setAdvice] = useState([]);
  
  // New State variables for AI Summariser Workflow
  const [feelsBetter, setFeelsBetter] = useState(null); // true/false
  const [hasNewSymptoms, setHasNewSymptoms] = useState(null); // true/false
  const [rawSymptoms, setRawSymptoms] = useState('');
  const [patientId, setPatientId] = useState('');
  const [showPatientIdInput, setShowPatientIdInput] = useState(false);

  const navigate = useNavigate();

  // Voice AI: Web Speech API
  const speakAdvice = (textLines) => {
    if (!('speechSynthesis' in window)) {
      console.warn("Browser doesn't support speech synthesis");
      return;
    }
    window.speechSynthesis.cancel(); // Clear queue
    const fullText = "Check in complete. Here are your AI recovery instructions: " + textLines.join(". ");
    const msg = new SpeechSynthesisUtterance(fullText);
    msg.rate = 0.9; // Slightly slower for clarity
    window.speechSynthesis.speak(msg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Submit normal checkin – map to backend field names
      const res = await fetch('http://localhost:5000/api/checkin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          water_intake: form.water,
          sleep_hours: form.sleep,
          medicine_taken: form.medicineTaken,
          symptoms: `Pain level ${form.painLevel}/10`,
          mood: 'ok'
        })
      });
      const data = await res.json();
      
      // 2. Submit AI Symptoms Summarization if they entered text and patient ID
      if (hasNewSymptoms && rawSymptoms.trim() !== '' && showPatientIdInput && patientId.trim() !== '') {
        try {
          await fetch('http://localhost:5000/api/checkin/new-symptoms', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
              patientId: patientId.trim(),
              rawSymptoms: rawSymptoms.trim(),
              feelsBetter: feelsBetter === true
            })
          });
        } catch(summaryErr) {
          console.error("Failed to summarize symptoms", summaryErr);
        }
      }

      setAdvice(data.advice || []);
      setSubmitted(true);
      
      if (data.advice) {
        speakAdvice(data.advice);
      }
      
    } catch (err) {
      alert("Error submitting check-in. Make sure the backend is running!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans transition-colors duration-300 flex justify-center items-start pt-10">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in-up relative">
        
        {/* Header pattern */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/10 dark:to-blue-500/10 pointer-events-none"></div>

        <div className="p-8 relative z-10">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-6 group w-max"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </button>

          {!submitted ? (
            <>
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 mb-4 text-teal-600 dark:text-teal-400">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Daily Check-in</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Log your daily vitals to get personalized AI insights.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Water Intake */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 transition-colors">
                  <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    <Droplets className="w-5 h-5 text-blue-500" /> Water Intake (Liters)
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="0" max="6" step="0.5"
                      value={form.water} 
                      onChange={(e) => setForm({...form, water: parseFloat(e.target.value)})} 
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                    />
                    <div className="min-w-[4rem] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                      {form.water}L
                    </div>
                  </div>
                </div>

                {/* Sleep */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 transition-colors">
                  <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    <Moon className="w-5 h-5 text-purple-500" /> Sleep Duration (Hours)
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="0" max="14" step="0.5"
                      value={form.sleep} 
                      onChange={(e) => setForm({...form, sleep: parseFloat(e.target.value)})} 
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" 
                    />
                    <div className="min-w-[4rem] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                      {form.sleep}h
                    </div>
                  </div>
                </div>
                
                {/* Pain Level */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 transition-colors">
                  <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    <Activity className="w-5 h-5 text-rose-500" /> Pain Level (0-10)
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" min="0" max="10" step="1"
                      value={form.painLevel} 
                      onChange={(e) => setForm({...form, painLevel: parseInt(e.target.value)})} 
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500" 
                    />
                    <div className="min-w-[4rem] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                      {form.painLevel}
                    </div>
                  </div>
                </div>

                {/* Medicine */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 hover:border-teal-500/30 transition-colors cursor-pointer" onClick={() => setForm({...form, medicineTaken: !form.medicineTaken})}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${form.medicineTaken ? 'bg-teal-500 border-teal-500' : 'border-slate-300 dark:border-slate-600'}`}>
                        {form.medicineTaken && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Took Prescribed Medicine</span>
                    </div>
                  </div>
                </div>

                {/* AI Workflow additions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-6">
                  {/* Feels better? */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 transition-colors">
                    <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-4">
                      Do you feel better than yesterday?
                    </label>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setFeelsBetter(true)} className={`flex-1 py-3 rounded-xl font-bold transition-all border ${feelsBetter === true ? 'bg-teal-500 text-white border-teal-500 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-500/50'}`}>Yes</button>
                      <button type="button" onClick={() => setFeelsBetter(false)} className={`flex-1 py-3 rounded-xl font-bold transition-all border ${feelsBetter === false ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-500/50'}`}>No</button>
                    </div>
                  </div>

                  {/* New symptoms? */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/50 transition-colors">
                     <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 mb-4">
                        Did you face any new symptoms?
                     </label>
                     <div className="flex gap-4">
                        <button type="button" onClick={() => { setHasNewSymptoms(true); }} className={`flex-1 py-3 rounded-xl font-bold transition-all border ${hasNewSymptoms === true ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-500/50'}`}>Yes</button>
                        <button type="button" onClick={() => { setHasNewSymptoms(false); setShowPatientIdInput(false); }} className={`flex-1 py-3 rounded-xl font-bold transition-all border ${hasNewSymptoms === false ? 'bg-slate-500 text-white border-slate-500 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-500/50'}`}>No</button>
                     </div>

                     {/* AI Text Input drop-down */}
                     {hasNewSymptoms && (
                        <div className="mt-5 space-y-4 animate-fade-in-up">
                           <div>
                              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block mb-2">If any, please convey (Press Enter to continue):</label>
                              <textarea 
                                rows="3" 
                                value={rawSymptoms} 
                                onChange={(e) => setRawSymptoms(e.target.value)} 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) { 
                                    e.preventDefault(); 
                                    setShowPatientIdInput(true); 
                                  } 
                                }}
                                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-200 shadow-sm font-medium resize-none"
                                placeholder="Describe what you experienced..."
                              ></textarea>
                           </div>

                           {/* Patient ID drop-down upon Enter */}
                           {showPatientIdInput && (
                              <div className="animate-fade-in-up bg-indigo-50 dark:bg-indigo-900/10 p-4 border border-indigo-100 dark:border-indigo-800/50 rounded-xl">
                                <label className="text-sm font-bold text-indigo-700 dark:text-indigo-400 block mb-2">Please provide your Patient ID to file this:</label>
                                <input 
                                  required 
                                  type="text" 
                                  value={patientId} 
                                  onChange={(e) => setPatientId(e.target.value)}
                                  placeholder="e.g. 2"
                                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-200 font-bold" 
                                />
                                <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-2 font-medium">Your reported symptoms will be immediately brought to your doctor's attention.</p>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 mt-4 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-teal-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Submit Check-in <Sparkles className="w-5 h-5" /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="py-6 animate-fade-in-up">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Check-in Complete!</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Your AI recovery instructions are ready.</p>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Recommendations
                </h4>
                <button 
                  onClick={() => speakAdvice(advice)} 
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <Volume2 className="w-4 h-4" /> Replay
                </button>
              </div>
              
              <div className="space-y-3 mb-8">
                {advice.map((tip, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 border-l-4 border-l-amber-500 shadow-sm flex items-start gap-3 transition-all hover:translate-x-1">
                    <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => { window.speechSynthesis.cancel(); navigate('/dashboard'); }} 
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition-all active:scale-[0.98]"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}