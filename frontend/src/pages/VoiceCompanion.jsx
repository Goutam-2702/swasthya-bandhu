import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Volume2, Bot, Play, CheckCircle2, Clock, Globe2, Activity, Sparkles, RefreshCw } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

// ─── Play base64 audio (MP3 or WAV) ──────────────────────────────────────────
function playBase64Audio(base64Data, mimeType = 'audio/mpeg') {
  return new Promise((resolve, reject) => {
    try {
      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Audio playback error')); };
      audio.play().catch(reject);
    } catch (e) { reject(e); }
  });
}

// ─── Load browser speech voices (async in Chrome) ────────────────────────────
function getVoices() {
  return new Promise(resolve => {
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) return resolve(v);
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1200);
  });
}

// ─── Record mic audio → base64 ───────────────────────────────────────────────
function recordAudio(durationMs = 5000) {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        const chunks = [];
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunks, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        };
        recorder.start();
        setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, durationMs);
      })
      .catch(reject);
  });
}

// ─── Language maps ────────────────────────────────────────────────────────────
const LANG_REC_MAP = {
  'English': 'en-US', 'Hindi': 'hi-IN', 'Bengali': 'bn-IN', 'Tamil': 'ta-IN', 'Telugu': 'te-IN',
  'Gujarati': 'gu-IN', 'Marathi': 'mr-IN', 'Kannada': 'kn-IN', 'Urdu': 'ur-IN', 'Malayalam': 'ml-IN',
  'Punjabi': 'pa-IN', 'Odia': 'or-IN', 'Assamese': 'as-IN', 'Maithili': 'mai-IN', 'Santali': 'sat-IN',
  'Kashmiri': 'ks-IN', 'Nepali': 'ne-NP', 'Sindhi': 'sd-IN', 'Konkani': 'gom-IN', 'Dogri': 'doi-IN',
  'Manipuri': 'mni-IN', 'Bodo': 'brx-IN', 'Sanskrit': 'sa-IN',
};
const LANG_VOICE_CODES = {
  'English': 'en', 'Hindi': 'hi', 'Bengali': 'bn', 'Tamil': 'ta', 'Telugu': 'te',
  'Gujarati': 'gu', 'Marathi': 'mr', 'Kannada': 'kn', 'Urdu': 'ur', 'Malayalam': 'ml',
  'Punjabi': 'pa', 'Odia': 'or', 'Assamese': 'as', 'Maithili': 'mai', 'Santali': 'sat',
  'Kashmiri': 'ks', 'Nepali': 'ne', 'Sindhi': 'sd', 'Konkani': 'gom', 'Dogri': 'doi',
  'Manipuri': 'mni', 'Bodo': 'brx', 'Sanskrit': 'sa',
};
const POSITIVE_WORDS = [
  'yes','yeah','yep','done','already','ok','okay','sure','taken','completed','have','did','eaten','drank',
  'हाँ','हां','हो गया','जी','लिया','पी लिया','खा लिया', // Hindi
  'হ্যাঁ','করেছি','খেয়েছি', // Bengali
  'ஆம்','செய்தேன்','சாப்பிട്ടேன்','சரி', // Tamil
  'అవును','చేశాను','తిన్నాను','తాగాను','సరే', // Telugu
  'हो','हाय','पिला','खाल्ला','ठीक', // Marathi
  'ಹೌದು','ಮಾಡಿದೆ','ಸರಿ', // Kannada
  'హଁ','ହଁ','ଠିକ୍','ଆଜ୍ଞା', // Odia
  'അതെ','ശരി','ഉണ്ട്', // Malayalam
  'ਹਾਂ','ਹਾਂਜੀ','ਥੀਕ', // Punjabi
  'হয়','ঠিক', // Assamese
];
const FALLBACK_ASKS = {
  'Hindi':   (t) => `क्या आपने "${t}" कर लिया? हाँ या ना बोलें।`,
  'Bengali': (t) => `আপনি কি "${t}" করেছেন? হ্যাঁ বা না বলুন।`,
  'Tamil':   (t) => `"${t}" முடித்தீர்களா? ஆம் இல்லை சொல்லுங்கள்.`,
  'Telugu':  (t) => `"${t}" చేశారా? అవునా కాదా చెప్పండి.`,
  'Gujarati':(t) => `"${t}" પૂર્ણ કર્યું? હા કે ના.`,
  'Marathi': (t) => `"${t}" केले का? हो किंवा नाही.`,
  'Kannada': (t) => `"${t}" ಮಾಡಿದ್ದೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ.`,
  'Malayalam': (t) => `"${t}" ചെയ്തോ? അതേ അല്ലെങ്കിൽ ഇല്ല എന്ന് പറയുക.`,
  'Odia': (t) => `ଆପଣ "${t}" କରିଛନ୍ତି କି? ହଁ କିମ୍ବା ନାଁ କୁହନ୍ତୁ।`,
  'Punjabi': (t) => `ਕੀ ਤੁਸੀਂ "${t}" ਕਰ ਲਿਆ ਹੈ? ਹਾਂ ਜਾਂ ਨਾ ਕਹੋ।`,
};
const FALLBACK_THANKS = {
  'Hindi':'धन्यवाद! बहुत अच्छा।','Bengali':'ধন্যবাদ! খুব ভালো।','Tamil':'நன்றி!','Telugu':'ధన్యవాదాలు!',
  'Gujarati':'આભાર!','Marathi':'धन्यवाद!','Kannada':'ಧನ್ಯವಾದ!',
};
const FALLBACK_SNOOZE = {
  'Hindi':'ठीक है, 5 मिनट में याद दिलाऊंगा।','Bengali':'৫ মিনিটে মনে করিয়ে দেব।','Tamil':'5 நிமிடத்தில் நினைவூட்டுகிறேன்.',
  'Telugu':'5 నిమిషాల్లో గుర్తు చేస్తాను।','Gujarati':'5 મિનિટમાં ફરી યાદ કરાવીશ.','Marathi':'5 मिनिटांत आठवण करून देतो.',
  'Kannada':'5 ನಿಮಿಷದಲ್ಲಿ ಮತ್ತೆ ನೆನಪಿಸುತ್ತೇನೆ.',
};

export default function VoiceCompanion() {
  const [reminders, setReminders]           = useState([]);
  const [activeReminder, setActiveReminder] = useState(null);
  const [listening, setListening]           = useState(false);
  const [isSpeaking, setIsSpeaking]         = useState(false);
  const [subtitle, setSubtitle]             = useState('');
  const [logs, setLogs]                     = useState([]);
  const [language, setLanguage]             = useState('English');
  const [gender, setGender]                 = useState('female');

  const activeReminderRef  = useRef(null);
  const recognitionRef     = useRef(null);
  const isProcessingRef    = useRef(false);

  const addLog = useCallback((msg) => {
    console.log(msg);
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-12));
  }, []);

  useEffect(() => { activeReminderRef.current = activeReminder; }, [activeReminder]);

  // ── Load reminders ──────────────────────────────────────────────────────────
  const loadReminders = useCallback(() => {
    addLog('Fetching reminders...');
    const token = localStorage.getItem('token');
    if (!token) { addLog('⚠️ No token — please login'); return; }
    fetch(`${API_URL}/reminders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error('Server rejected'); return r.json(); })
      .then(data => { if (Array.isArray(data)) { setReminders(data); addLog(`✅ ${data.length} reminders loaded`); } })
      .catch(err => addLog(`❌ ${err.message}`));
  }, [addLog]);

  useEffect(() => { loadReminders(); }, []);

  // ── Load Demo Reminders (one-click for demos) ─────────────────────────────
  const loadDemoReminders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { addLog('⚠️ No token'); return; }
    addLog('🎬 Seeding demo reminders based on current time...');
    try {
      const res = await fetch(`${API_URL}/demo/seed-reminders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✅ ${data.seeded} demo reminders loaded! First alarm in ~1 minute.`);
        loadReminders();
      } else {
        addLog(`❌ ${data.error}`);
      }
    } catch (err) {
      addLog(`❌ Demo seed failed: ${err.message}`);
    }
  }, [addLog, loadReminders]);

  // ── Setup SpeechRecognition ─────────────────────────────────────────────────
  const makeRecognition = useCallback((lang) => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return null;
    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = LANG_REC_MAP[lang] || 'en-US';
    return rec;
  }, []);

  useEffect(() => { recognitionRef.current = makeRecognition(language); }, [language, makeRecognition]);

  // ── Auto-trigger alarms every 5s (±30s window so we never miss a minute) ──
  useEffect(() => {
    const timer = setInterval(() => {
      if (listening || isSpeaking || activeReminderRef.current || isProcessingRef.current) return;
      const now = new Date();
      const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const due = reminders.find(r => {
        if (r.completed) return false;
        const [h, m] = r.time.split(':').map(Number);
        const reminderSecs = h * 3600 + m * 60;
        // Trigger if within 30-second window of the alarm time
        return Math.abs(nowSecs - reminderSecs) <= 30;
      });
      if (due) { addLog(`⏰ Auto-triggered: ${due.text}`); triggerReminder(due); }
    }, 5000);
    return () => clearInterval(timer);
  }, [reminders, listening, isSpeaking]);

  // ────────────────────────────────────────────────────────────────────────────
  // speakText: /api/tts/speak (Bhashini → Google TTS) → Browser TTS → silent
  //
  //  /api/tts/speak is the SMART UNIFIED route on the backend:
  //    1. Tries Bhashini if API keys are set in .env
  //    2. Auto-falls back to Google Translate TTS (NO KEY REQUIRED!)
  //       → This gives real Hindi/Telugu/Tamil/Bengali audio without Bhashini keys!
  //    3. Returns base64 audio (MP3 or WAV)
  // ────────────────────────────────────────────────────────────────────────────
  const speakText = useCallback(async (text) => {
    return new Promise(async (resolve) => {
      setIsSpeaking(true);
      setSubtitle(text);
      addLog(`🔊 "${text.slice(0, 60)}"`);

      const finish = () => { setIsSpeaking(false); setSubtitle(''); resolve(); };
      const safeguard = setTimeout(() => {
        addLog('⚠️ TTS took too long — forcing continue');
        finish();
      }, 16000);
      const safeFinish = () => { clearTimeout(safeguard); finish(); };

      // 1️⃣ Backend TTS: /api/tts/speak → Bhashini → Google TTS (all Indian languages!)
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/tts/speak`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ text, language, gender })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.audioBase64) throw new Error('No audio');
        const engineLabel = data.engine === 'bhashini' ? '🇮🇳 Bhashini' : '💬 Google TTS';
        addLog(`${engineLabel} playing...`);
        await playBase64Audio(data.audioBase64, data.mimeType || 'audio/mpeg');
        addLog('✅ Audio done');
        safeFinish();
        return;
      } catch (err) {
        addLog(`⚠️ Backend TTS: ${err.message} — Browser TTS`);
      }

      // 2️⃣ Browser TTS (English works always; Indian needs voice pack installed on Windows)
      try {
        window.speechSynthesis.cancel();
        const voices = await getVoices();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.88;
        const code = LANG_VOICE_CODES[language] || 'en';
        const voice = voices.find(v => v.lang.toLowerCase().startsWith(code))
                   || voices.find(v => v.lang.includes('en-IN'))
                   || voices.find(v => v.lang.startsWith('en'));
        if (voice) { utterance.voice = voice; addLog(`🌐 Browser TTS: ${voice.name}`); }
        utterance.onend   = () => { addLog('✅ Browser TTS done'); safeFinish(); };
        utterance.onerror = (e) => { addLog(`⚠️ Browser TTS err: ${e.error}`); safeFinish(); };
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        addLog('❌ All TTS failed — continuing flow');
        safeFinish();
      }
    });
  }, [language, gender, addLog]);

  // ────────────────────────────────────────────────────────────────────────────
  // listenForResponse — always returns a transcript (or '' on timeout/error)
  // Order: Browser SpeechRecognition → Bhashini ASR → '' (timeout)
  // ────────────────────────────────────────────────────────────────────────────
  const listenForResponse = useCallback(() => {
    return new Promise((resolve) => {
      setListening(true);
      let resolved = false;
      const done = (transcript) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(autoTimeout);
        setListening(false);
        resolve(transcript);
      };

      // 12s hard timeout — never leaves user stuck
      const autoTimeout = setTimeout(() => {
        addLog('⏱️ No response in 12s — auto-continuing');
        done('');
      }, 12000);

      // Try WebSpeech API first (fast, works offline)
      const rec = makeRecognition(language);
      if (rec) {
        rec.onstart  = () => addLog('🎤 Mic active — speak now (Yes / No)...');
        rec.onresult = (e) => {
          const t = e.results[0][0].transcript.toLowerCase().trim();
          addLog(`🗣️ Heard: "${t}"`);
          done(t);
        };
        rec.onerror = (e) => {
          if (e.error === 'no-speech') {
            addLog('⚠️ No speech — trying Bhashini ASR recording...');
            tryBhashiniASR(done);
          } else {
            addLog(`⚠️ Mic error: ${e.error}`);
            done('');
          }
        };
        rec.onend = () => {
          // If onresult or onerror didn't fire, that's OK — autoTimeout handles it
        };
        try { rec.start(); recognitionRef.current = rec; return; } catch (e) {
          addLog(`⚠️ rec.start(): ${e.message} — Bhashini ASR`);
        }
      }

      // Fallback: Bhashini ASR
      tryBhashiniASR(done);
    });
  }, [language, makeRecognition, addLog]);

  const tryBhashiniASR = async (done) => {
    try {
      addLog('🎙️ Recording 5s for Bhashini ASR...');
      const audioBase64 = await recordAudio(5000);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/bhashini/asr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ audioBase64, language })
      });
      const data = await res.json();
      if (data.transcript) { addLog(`🗣️ Bhashini ASR: "${data.transcript}"`); done(data.transcript.toLowerCase()); }
      else { addLog('⚠️ Bhashini ASR returned no text'); done(''); }
    } catch (err) { addLog(`❌ Bhashini ASR: ${err.message}`); done(''); }
  };

  // ── Gemini AI response ────────────────────────────────────────────────────
  const generateAI = async (prompt) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      addLog('🧠 AI generating...');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ speechText: prompt, language }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
      const data = await res.json();
      return data.text?.trim() || null;
    } catch (err) {
      clearTimeout(timeout);
      addLog(`⚠️ AI (fallback used): ${err.name === 'AbortError' ? 'Timeout' : err.message}`);
      return null;
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // triggerReminder: Speak → Listen → Respond (sequential, never gets stuck)
  // ────────────────────────────────────────────────────────────────────────────
  const triggerReminder = async (reminder) => {
    if (isProcessingRef.current) { addLog('⚠️ Already processing'); return; }
    isProcessingRef.current = true;
    setActiveReminder(reminder);
    addLog(`🔔 Reminder: "${reminder.text}"`);

    try {
      // ── STEP 1: Speak ───────────────────────────────────────────────────────
      const aiAsk = await generateAI(`You are Swasthya Bandhu. Patient task: "${reminder.text}". Ask if done. 1 sentence. No emojis.`);
      const askText = aiAsk || (FALLBACK_ASKS[language]?.(reminder.text)) || `Time to ${reminder.text}. Have you done it? Say Yes or No.`;
      await speakText(askText);

      // ── STEP 2: Listen ──────────────────────────────────────────────────────
      addLog('👂 Listening for Yes/No...');
      const transcript = await listenForResponse();
      addLog(`📝 Response: "${transcript || '(none)'}"`);

      // ── STEP 3: Process ─────────────────────────────────────────────────────
      const saidYes = transcript.length > 0 && POSITIVE_WORDS.some(w => transcript.includes(w));
      addLog(saidYes ? '🟢 YES detected' : (transcript ? '🔴 NO detected' : '⏱️ No response — treating as NO'));

      // Generate AI reply
      const replyPrompt = saidYes
        ? `Patient confirmed they did "${reminder.text}" (said "${transcript}"). Thank warmly. 1 sentence. No emojis.`
        : `Patient didn't do "${reminder.text}" (said "${transcript || 'nothing'}"). Acknowledge, say remind in 5 min. 1 sentence. No emojis.`;
      const aiReply = await generateAI(replyPrompt);
      const replyText = aiReply || (saidYes
        ? (FALLBACK_THANKS[language] || 'Thank you! Great job.')
        : (FALLBACK_SNOOZE[language] || "I'll remind you in 5 minutes."));

      await speakText(replyText);

      const token = localStorage.getItem('token');
      if (saidYes) {
        try {
          await fetch(`${API_URL}/reminders/${reminder.id}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
          await fetch(`${API_URL}/voice-logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ reminderId: reminder.id, response: 'yes', message: transcript })
          });
          setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, completed: true } : r));
          addLog('✅ Marked complete & logged');
        } catch (e) { addLog('❌ Could not save completion'); }
      } else {
        try {
          await fetch(`${API_URL}/voice-logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ reminderId: reminder.id, response: 'no', message: transcript })
          });
        } catch (e) {}
        setReminders(prev => prev.map(r => {
          if (r.id !== reminder.id) return r;
          const [h, m] = r.time.split(':').map(Number);
          const d = new Date(); d.setHours(h, m + 5);
          const newTime = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
          addLog(`⏰ Snoozed to ${newTime}`);
          return { ...r, time: newTime };
        }));
      }
    } catch (err) {
      addLog(`❌ Flow error: ${err.message}`);
    } finally {
      isProcessingRef.current = false;
      setActiveReminder(null);
      setListening(false);
    }
  };

  const speakTodayPlan = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/dashboard/today-plan`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (!d?.plan) { await speakText("You don't have an active recovery plan yet."); return; }
      const meals = (d.plan.mealPlan || []).map(m => `${m.time}: ${m.meal}`).join(', ');
      const water = d.plan.hydrationSchedule?.dailyTarget || '2 litres';
      await speakText(`Good day! Today drink ${water}. Meals: ${meals}. Take medicine on time.`);
    } catch (err) { addLog(`❌ Plan: ${err.message}`); }
  };

  const unlockAudio = () => {
    addLog('🔓 Unlocking audio...');
    try { const c = new (window.AudioContext || window.webkitAudioContext)(); c.resume(); } catch(e) {}
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(''); window.speechSynthesis.speak(u);
    addLog('✅ Audio unlocked — you can now speak/listen');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans flex justify-center items-start pt-10">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage:"radial-gradient(circle, #fff 1px, transparent 1px)",backgroundSize:"20px 20px"}}/>
          <div className="inline-flex w-16 h-16 bg-white/20 rounded-full mb-4 items-center justify-center backdrop-blur-sm border border-white/30 shadow-lg relative z-10">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight relative z-10">Bedside Companion</h2>
          <p className="text-blue-100 mt-1 font-medium opacity-90 relative z-10">
            Bhashini · Google TTS · Every Indian Language
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs text-white font-bold relative z-10">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            Google TTS Always Active (No Keys Needed)
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={unlockAudio}
              className="flex items-center justify-center gap-2 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-xl border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 transition-colors text-sm">
              <Volume2 className="w-4 h-4" /> Unlock Audio
            </button>
            <button onClick={speakTodayPlan} disabled={isSpeaking}
              className="flex items-center justify-center gap-2 py-3 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold rounded-xl border border-orange-200 dark:border-orange-700 hover:bg-orange-100 transition-colors disabled:opacity-50 text-sm">
              <Sparkles className="w-4 h-4" /> Speak Plan
            </button>

            {/* Load Demo — seeds 5 time-relative reminders, first fires in ~1 min */}
            <button onClick={loadDemoReminders} disabled={isSpeaking}
              className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md shadow-purple-500/20 transition-all disabled:opacity-50 text-sm active:scale-95">
              <Play className="w-4 h-4" /> Load Demo
            </button>

            {/* Language selector */}
            <div className="relative">
              <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <select value={language} onChange={e => setLanguage(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer">
                {[
                  'English','Hindi','Bengali','Tamil','Telugu','Gujarati','Marathi','Kannada','Urdu',
                  'Malayalam','Punjabi','Odia','Assamese','Maithili','Santali','Kashmiri','Nepali',
                  'Sindhi','Konkani','Dogri','Manipuri','Bodo','Sanskrit'
                ].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Demo hint banner */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/50 rounded-xl p-3 flex items-start gap-2">
            <span className="text-amber-500 text-lg mt-0.5">🎬</span>
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Demo Mode</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                Click <strong>Load Demo</strong> → Click <strong>Unlock Audio</strong> → Wait 1 minute for the first alarm to auto-fire! Or manually press <strong>Demo</strong> on any reminder card.
              </p>
            </div>
          </div>

          {/* Gender & TTS Info */}
          <div className="flex gap-3 items-center">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1"><RefreshCw className="w-3 h-3"/>Voice</p>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 text-xs font-bold">
                {[['female','♀ Female'],['male','♂ Male']].map(([v,l]) => (
                  <button key={v} onClick={() => setGender(v)}
                    className={`px-4 py-2 transition-colors ${gender===v ? 'bg-pink-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}>{l}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">🎤 TTS Chain (auto)</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                🇮🇳 Bhashini → 💬 Google TTS → 🌐 Browser
              </p>
              <p className="text-xs text-emerald-500/80 dark:text-emerald-400/60 mt-0.5 italic">
                Google TTS works for all languages without any API key!
              </p>
            </div>
          </div>

          {/* Status */}
          {isSpeaking ? (
            <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-400 rounded-2xl text-center animate-pulse">
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-lg mb-3">
                <Volume2 className="w-6 h-6 animate-bounce"/>Speaking...
              </div>
              {subtitle && <p className="text-base font-medium text-slate-700 dark:text-slate-200 italic border-t border-blue-200 dark:border-blue-800 pt-3">"{subtitle}"</p>}
            </div>
          ) : listening ? (
            <div className="p-6 bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-400 rounded-2xl text-center">
              <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-lg mb-2">
                <Mic className="w-6 h-6 animate-pulse"/>Listening...
              </div>
              <p className="text-sm font-semibold text-rose-600/80 dark:text-rose-400/80">
                Say: <span className="font-bold">Yes / हाँ / ஆம் / అవును / হ্যাঁ</span>
              </p>
              <p className="text-xs text-rose-400 mt-1 opacity-70">Auto-continues in 12 seconds</p>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
              <Bot className="w-6 h-6 text-slate-400 mx-auto mb-2"/>
              <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">Resting · Auto-wakes at alarm time</p>
              <p className="text-xs text-slate-400 mt-1">Lang: <strong className="text-indigo-500">{language}</strong> · Voice: <strong className="text-pink-500">{gender}</strong></p>
            </div>
          )}

          {/* Schedule */}
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-indigo-500"/>Today's Schedule
            </h3>
            <div className="space-y-2.5">
              {reminders.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No reminders loaded. Login or add from Dashboard.</p>
                </div>
              ) : reminders.map(r => (
                <div key={r.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${r.completed ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50' : activeReminder?.id === r.id ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700 shadow-md' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                  <div className="flex-1">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mb-0.5">{r.time}</div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 text-sm">{r.text}</div>
                    {r.completed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold"><CheckCircle2 className="w-3 h-3"/>Done</span>
                    ) : activeReminder?.id === r.id ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold"><Mic className="w-3 h-3 animate-pulse"/>Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold"><Activity className="w-3 h-3"/>Pending</span>
                    )}
                  </div>
                  {!r.completed && !listening && !isSpeaking && activeReminder?.id !== r.id && (
                    <button onClick={() => triggerReminder(r)}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-indigo-200">
                      <Play className="w-4 h-4"/>Demo
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Console */}
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="bg-slate-800 dark:bg-slate-950 px-4 py-2.5 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"/>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"/>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"/>
              <span className="ml-2 font-mono">Voice Engine Log</span>
            </div>
            <div className="h-44 bg-slate-900 dark:bg-black p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-emerald-400/90 space-y-0.5">
              {logs.map((log, i) => <div key={i}>{log}</div>)}
              {logs.length === 0 && <span className="opacity-40">Awaiting activity...</span>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
