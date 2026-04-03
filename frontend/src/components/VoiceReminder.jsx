import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, Volume2, Bot, Play, CheckCircle2, Clock, Plus, Edit2, Trash2, Info, Globe2, Activity } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function VoiceReminder({ token }) {
  const [reminders, setReminders] = useState([]);
  const [activeReminder, setActiveReminder] = useState(null);
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState("English");
  const activeReminderRef = useRef(null);

  useEffect(() => {
    activeReminderRef.current = activeReminder;
  }, [activeReminder]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 30000);
    return () => clearInterval(interval);
  }, [token]); 

  const fetchReminders = async () => {
    try {
      const res = await axios.get(`${API_URL}/reminders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReminders(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setMessage('⚠️ Speech Recognition not supported');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;

    const langMap = {
      'English': 'en-US', 'Hindi': 'hi-IN', 'Bengali': 'bn-IN', 'Tamil': 'ta-IN', 'Telugu': 'te-IN',
      'Gujarati': 'gu-IN', 'Marathi': 'mr-IN', 'Kannada': 'kn-IN', 'Urdu': 'ur-IN', 'Malayalam': 'ml-IN',
      'Punjabi': 'pa-IN', 'Odia': 'or-IN', 'Assamese': 'as-IN', 'Maithili': 'mai-IN', 'Santali': 'sat-IN',
      'Kashmiri': 'ks-IN', 'Nepali': 'ne-NP', 'Sindhi': 'sd-IN', 'Konkani': 'gom-IN', 'Dogri': 'doi-IN',
      'Manipuri': 'mni-IN', 'Bodo': 'brx-IN', 'Sanskrit': 'sa-IN',
    };
    recognitionRef.current.lang = langMap[language] || 'en-US';

    recognitionRef.current.onstart = () => setListening(true);

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      handlePatientResponse(transcript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech error:', event.error);
      setListening(false);
    };

    recognitionRef.current.onend = () => setListening(false);

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (listening || activeReminder || isSpeaking) return;

    const checkDueReminders = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;

      const dueReminder = reminders.find(
        (r) => !r.completed && r.time === currentTime
      );

      if (dueReminder) {
        triggerReminder(dueReminder);
      }
    };

    const timer = setInterval(checkDueReminders, 10000);
    return () => clearInterval(timer);
  }, [reminders, listening, activeReminder, isSpeaking]);

  const API_URL_BASE = 'http://localhost:5000/api';

  // ─── Helper: load browser voices async ───────────────────────────────────
  const getBrowserVoices = () => new Promise(resolve => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) return resolve(v);
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
  });

  // ─── Bhashini TTS via backend proxy ──────────────────────────────────────
  const bhashiniSpeakText = async (text, lang, gender = 'female') => {
    const res = await fetch(`${API_URL_BASE}/bhashini/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ text, language: lang, gender })
    });
    if (!res.ok) throw new Error(`Bhashini TTS HTTP ${res.status}`);
    const data = await res.json();
    if (!data.audioBase64) throw new Error('No audio returned');
    return data.audioBase64;
  };

  const playBase64Audio = (base64Wav) => {
    return new Promise((resolve, reject) => {
      const binary = atob(base64Wav);
      const bytes  = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Playback error')); };
      audio.play().catch(reject);
    });
  };

  const speakText = async (text) => {
    return new Promise(async (resolve) => {
      setIsSpeaking(true);

      // ⚠️ SAFEGUARD: always resolve after 16s max
      const safeguard = setTimeout(() => {
        console.warn('[VoiceReminder] TTS safeguard');
        setIsSpeaking(false);
        resolve();
      }, 16000);
      const finish = () => { clearTimeout(safeguard); setIsSpeaking(false); resolve(); };

      // 1️⃣ /api/tts/speak — Bhashini → Google TTS (all Indian languages, NO key needed!)
      try {
        const res = await fetch(`${API_URL_BASE}/tts/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ text, language, gender: 'female' })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.audioBase64) throw new Error('No audio');
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); finish(); };
        audio.onerror = () => { URL.revokeObjectURL(url); finish(); };
        await audio.play();
        return;
      } catch (err) {
        console.warn('[VoiceReminder] Backend TTS failed:', err.message, '– Browser TTS');
      }

      // 2️⃣ Browser TTS Fallback (async voice loading)
      try {
        window.speechSynthesis.cancel();
        const voices = await getBrowserVoices();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.88;
        const langCodes = { 'Hindi': 'hi', 'Bengali': 'bn', 'Tamil': 'ta', 'Telugu': 'te', 'Gujarati': 'gu', 'English': 'en', 'Marathi': 'mr', 'Kannada': 'kn' };
        const code = langCodes[language] || 'en';
        const targetVoice = voices.find(v => v.lang.toLowerCase().startsWith(code))
                         || voices.find(v => v.lang.includes('en-IN'))
                         || voices.find(v => v.lang.startsWith('en'));
        if (targetVoice) utterance.voice = targetVoice;
        utterance.onend   = finish;
        utterance.onerror = finish;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[VoiceReminder] Browser TTS error:', err.message);
        finish();
      }
    });
  };

  const generateAIResponse = async (prompt) => {
    try {
      const response = await axios.post(`${API_URL}/voice`, {
        speechText: prompt,
        language
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.text.trim();
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const triggerReminder = async (reminder) => {
    setActiveReminder(reminder);
    setMessage(`🎤 Triggering reminder: ${reminder.text}`);

    let aiPrompt = `You are a caring medical AI voice assistant. The user's task to complete right now is: "${reminder.text}". Ask them clearly and politely if they have done it yet. Keep it incredibly short (1 sentence max). Do not include any emojis, only plain spoken text.`;
    let spokenText = await generateAIResponse(aiPrompt);
    
    if (!spokenText) {
      spokenText = `Hello! It is time to ${reminder.text}. Have you taken it? Please say Yes or No.`;
    }

    await speakText(spokenText);

    if (recognitionRef.current && !listening) {
      try {
        const langMap = {
          'English': 'en-US', 'Hindi': 'hi-IN', 'Bengali': 'bn-IN', 'Tamil': 'ta-IN', 'Telugu': 'te-IN',
          'Gujarati': 'gu-IN', 'Marathi': 'mr-IN', 'Kannada': 'kn-IN', 'Urdu': 'ur-IN', 'Malayalam': 'ml-IN',
          'Punjabi': 'pa-IN', 'Odia': 'or-IN', 'Assamese': 'as-IN', 'Maithili': 'mai-IN', 'Santali': 'sat-IN',
          'Kashmiri': 'ks-IN', 'Nepali': 'ne-NP', 'Sindhi': 'sd-IN', 'Konkani': 'gom-IN', 'Dogri': 'doi-IN',
          'Manipuri': 'mni-IN', 'Bodo': 'brx-IN', 'Sanskrit': 'sa-IN',
        };
        recognitionRef.current.lang = langMap[language] || 'en-US';
        recognitionRef.current.start();
      } catch (err) {
        console.error('Microphone start error:', err);
        setMessage('❌ Could not start microphone');
      }
    }
  };

  const handlePatientResponse = async (transcript) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {}
    }
    setListening(false);
    window.speechSynthesis.cancel();

    const currentReminder = activeReminderRef.current;
    if (!currentReminder) return;

    const saidYes = [
      'yes', 'yeah', 'yep', 'sure', 'okay', 'ok', 'done', 'taken', 'did',
      'haan', 'ha', 'ho gaya', 'ji', 'theek hai', // Hindi
      'hyan', 'korchi', 'korechi', 'hoegeche',    // Bengali
      'thai gayu',                                // Gujarati
      'aam', 'sari', 'ama',                       // Tamil
      'avunu', 'sare', 'chesanu',                 // Telugu
      'ho', 'pila', 'खाल्ला', 'thik',             // Marathi/Odia
      'ହଁ', 'ଆଜ୍ଞା',                               // Odia
      'athe', 'umm',                              // Malayalam
    ].some(
      (word) => transcript.includes(word)
    );

    let aiPrompt = saidYes
      ? `You are a caring medical assistant. The patient confirmed they completed their task: "${currentReminder.text}" (they said "${transcript}"). Thank them warmly. Keep it incredibly short (1 sentence max). No emojis.`
      : `You are a caring medical assistant. The patient has NOT completed their task: "${currentReminder.text}" (they said "${transcript}"). Politely acknowledge this and state you will softly remind them again in 5 minutes. Keep it incredibly short (1 sentence max). No emojis.`;

    let spokenText = await generateAIResponse(aiPrompt);
    if (!spokenText) {
      spokenText = saidYes ? 'Thank you! Great job.' : 'Okay. I will remind you again in 5 minutes.';
    }

    if (saidYes) {
      await speakText(spokenText);

      try {
        await axios.post(
          `${API_URL}/reminders/${currentReminder.id}/complete`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        await axios.post(
          `${API_URL}/voice-logs`,
          {
            reminderId: currentReminder.id,
            response: 'yes',
            message: transcript
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setReminders((prev) =>
          prev.map((r) =>
            r.id === currentReminder.id ? { ...r, completed: 1 } : r
          )
        );

        setMessage(`✅ Reminder marked complete!`);
      } catch (err) {
        console.error('Error marking complete:', err);
        setMessage('❌ Error updating reminder');
      }

      setActiveReminder(null);
    } else {
      await speakText(spokenText);

      try {
        await axios.post(
          `${API_URL}/voice-logs`,
          {
            reminderId: currentReminder.id,
            response: 'no',
            message: transcript
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const [hours, mins] = currentReminder.time.split(':').map(Number);
        const newDate = new Date();
        newDate.setHours(hours, mins + 5);
        const newTime = `${newDate.getHours().toString().padStart(2, '0')}:${newDate
          .getMinutes()
          .toString()
          .padStart(2, '0')}`;

        setReminders((prev) =>
          prev.map((r) =>
            r.id === currentReminder.id ? { ...r, time: newTime } : r
          )
        );

        setMessage(`⏰ Reminder postponed to ${newTime}`);
      } catch (err) {
        console.error('Error postponing reminder:', err);
        setMessage('❌ Error updating reminder');
      }

      setActiveReminder(null);
    }
  };

  const manuallyTrigger = (reminder) => {
    triggerReminder(reminder);
  };

  const addNewReminder = async () => {
    const time = prompt('Enter time (HH:MM) e.g., 09:30:');
    const text = prompt('Enter reminder text e.g., take medicine:');

    if (time && text) {
      try {
        await axios.post(
          `${API_URL}/reminders`,
          { time, text, type: 'medicine' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchReminders();
        setMessage('✅ Reminder added!');
      } catch (err) {
        setMessage('❌ Error adding reminder');
      }
    }
  };

  const editReminder = async (reminder) => {
    const time = prompt('Enter new time (HH:MM):', reminder.time);
    const text = prompt('Enter new reminder text:', reminder.text);

    if (time && text) {
      try {
        await axios.put(
          `${API_URL}/reminders/${reminder.id}`,
          { time, text },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchReminders();
        setMessage('✅ Reminder updated!');
      } catch (err) {
        setMessage('❌ Error updating reminder');
      }
    }
  };

  const deleteReminder = async (id) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await axios.delete(`${API_URL}/reminders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        await fetchReminders();
        setMessage('✅ Reminder deleted!');
      } catch (err) {
        setMessage('❌ Error deleting reminder');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3"></div>
        <div className="text-slate-500 dark:text-slate-400 font-medium">Loading AI voice reminders...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 overflow-hidden font-sans relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none -translate-y-10 translate-x-10"></div>
      
      <div className="p-6 md:p-8 relative z-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Voice Assistant</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">AI-driven interactive alerts</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Globe2 className="w-4 h-4" />
            </div>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer shadow-sm"
            >
              {[
                'English','Hindi','Bengali','Tamil','Telugu','Gujarati','Marathi','Kannada','Urdu',
                'Malayalam','Punjabi','Odia','Assamese','Maithili','Santali','Kashmiri','Nepali',
                'Sindhi','Konkani','Dogri','Manipuri','Bodo','Sanskrit'
              ].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Global Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-center gap-2 font-semibold shadow-sm animate-fade-in-up ${message.includes('✅') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' : message.includes('❌') ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'}`}>
            {message}
          </div>
        )}

        {/* AI Status Area */}
        <div className="mb-8">
          {listening ? (
            <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-400 dark:border-rose-500/50 rounded-2xl text-center flex flex-col items-center justify-center">
              <Mic className="w-8 h-8 text-rose-500 animate-pulse mb-3" />
              <p className="font-bold text-rose-600 dark:text-rose-400 text-lg">Listening for response...</p>
            </div>
          ) : isSpeaking ? (
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-400 dark:border-indigo-500/50 rounded-2xl text-center flex flex-col items-center justify-center">
              <Volume2 className="w-8 h-8 text-indigo-500 animate-bounce mb-3" />
              <p className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">AI is speaking...</p>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center shadow-inner">
               <Bot className="w-6 h-6 text-slate-400 mb-2" />
               <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Ready! Waiting for scheduled alarms.</p>
            </div>
          )}
        </div>

        {/* Reminders List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> Today's Reminders
            </h3>
            <button
              onClick={addNewReminder}
              className="flex items-center gap-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {reminders.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 font-medium border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No reminders scheduled yet.
              </div>
            ) : (
              reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${reminder.completed ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm'}`}
                >
                  <div className="flex-1">
                    <div className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm mb-1">{reminder.time}</div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 mb-2">{reminder.text}</div>
                    {reminder.completed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 text-xs font-bold">
                        <Activity className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </div>

                  {!reminder.completed && !listening && !activeReminder && (
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => manuallyTrigger(reminder)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-400 py-2 px-3 rounded-lg text-sm font-bold transition-colors"
                      >
                        <Play className="w-4 h-4" /> Demo
                      </button>
                      <button
                        onClick={() => editReminder(reminder)}
                        className="flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="flex items-center justify-center p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800/80">
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> How it works:
          </p>
          <ul className="space-y-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 list-disc list-inside ml-1">
            <li>AI will speak reminders at scheduled times using Speech Synthesis.</li>
            <li>Respond with "Yes", "Done", etc. to confirm.</li>
            <li>Respond with "No" to snooze for 5 minutes.</li>
            <li>Ensure Microphone permissions are allowed.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
