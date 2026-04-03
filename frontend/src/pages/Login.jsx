import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, HeartPulse, Fingerprint, UserPlus, FastForward, Building2, Calendar, Users, Languages, MapPin } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Login({ setToken, setUserId }) {
  const [role, setRole] = useState('patient'); // 'patient' or 'hospital'
  const [activeTab, setActiveTab] = useState('abha'); // 'abha' or 'email'
  
  // Forms State
  const [abhaId, setAbhaId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  
  // Patient Profile Extended Fields
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Not specified');
  const [hospital, setHospital] = useState('');
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoBypass = () => {
    const demoUserId = 'demo-test-user-uuid';
    const fakeToken = `token_demo`;
    setToken(fakeToken);
    setUserId(demoUserId);
    localStorage.setItem('token', fakeToken);
    localStorage.setItem('userId', demoUserId);
    navigate(role === 'hospital' ? '/hospital' : '/dashboard');
  };

  const handleAbhaLogin = async (e) => {
    e.preventDefault();
    if (!abhaId) return alert('Please enter ABHA ID');
    
    setLoading(true);
    try {
      // Mock validation: any string > 5 chars is valid
      if (abhaId.length < 5) {
        alert("Invalid ABHA ID. Must be at least 5 characters.");
        setLoading(false);
        return;
      }
      
      // Check if user exists in Supabase
      let { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('abha_id', abhaId)
        .limit(1);
        
      if (error) throw error;
      
      let user = users && users.length > 0 ? users[0] : null;
      
      // If not, create new user automatically
      if (!user) {
        const payload = { abha_id: abhaId, name: `ABHA_Patient_${abhaId.slice(-4)}` };
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([payload])
          .select()
          .single();
          
        if (insertError) throw insertError;
        user = newUser;
      }
      
      // Securely store session for mock ABHA auth
      const fakeToken = `token_${user.id}`;
      setToken(fakeToken);
      setUserId(user.id);
      localStorage.setItem('token', fakeToken);
      localStorage.setItem('userId', user.id);
      
      navigate('/dashboard');
      
    } catch (err) {
      console.error(err);
      alert('Error handling ABHA login. Check console.');
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert('Please enter email and password');
    setLoading(true);
    
    try {
      if (isSignUp) {
        // 1. Sign up with Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
        if (authErr) throw authErr;
        
        // 2. Create user record in our users table
        if (authData.user) {
           await supabase.from('users').insert([{ 
             id: authData.user.id, 
             email: email, 
             name: name || 'New User',
             age: role === 'patient' ? age : null,
             gender: role === 'patient' ? gender : null,
             preferred_language: role === 'patient' ? preferredLanguage : null,
             hospital: role === 'patient' ? hospital : null
           }]);
        }
        alert('Signup successful! Please log in.');
        setIsSignUp(false);
      } else {
        // Login with Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
        if (authErr) throw authErr;
        
        // Ensure user exists in our profile table
        if (authData.user) {
           let { data: userRec } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
           if (!userRec) {
               await supabase.from('users').insert([{ id: authData.user.id, email: email, name: 'User' }]);
           }
        }

        setToken(authData.session.access_token);
        setUserId(authData.user.id);
        localStorage.setItem('token', authData.session.access_token);
        localStorage.setItem('userId', authData.user.id);
        
        navigate(role === 'hospital' ? '/hospital' : '/dashboard');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Authentication error');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-500/10 dark:bg-teal-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 z-10">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/40 mb-6 text-teal-600 dark:text-teal-400">
            <HeartPulse className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Swasthya Bandhu</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">AI-powered Patient Recovery</p>
        </div>
        
        {/* Role Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-6">
          <button 
            type="button"
            onClick={() => { setRole('patient'); setActiveTab('abha'); }}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${role === 'patient' ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Patient
          </button>
          <button 
            type="button"
            onClick={() => { setRole('hospital'); setActiveTab('email'); }}
            className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${role === 'hospital' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Building2 className="w-4 h-4" /> Hospital Admin
          </button>
        </div>

        {/* Login Method Tabs - Only show if Patient */}
        {role === 'patient' && (
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8">
            <button 
              type="button"
              onClick={() => setActiveTab('abha')}
              className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'abha' ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Fingerprint className="w-4 h-4" /> ABHA ID
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'email' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Mail className="w-4 h-4" /> Email
            </button>
          </div>
        )}

        {role === 'patient' && activeTab === 'abha' ? (
          <form onSubmit={handleAbhaLogin} className="space-y-6 animate-fade-in-up">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">India Healthcare ID (ABHA)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ShieldCheck className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="xx-xxxx-xxxx-xxxx" 
                  value={abhaId} 
                  onChange={(e) => setAbhaId(e.target.value)} 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-slate-800 dark:text-slate-200 font-medium"
                />
              </div>
              <p className="text-xs text-slate-400 ml-1 mt-1">Mock validation: Any 5+ chars works</p>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 py-4 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 bg-gradient-to-r from-teal-500 to-emerald-600 shadow-teal-500/25"
            >
              {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <>Secure Login <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-5 animate-fade-in-up">
             {isSignUp && (
               <div className="space-y-4">
                 <div className="space-y-1.5">
                   <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <UserPlus className="h-5 w-5 text-slate-400" />
                     </div>
                     <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200 font-medium"/>
                   </div>
                 </div>

                 {role === 'patient' && (
                   <>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                         <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Age</label>
                         <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <Calendar className="h-4 w-4 text-slate-400" />
                           </div>
                           <input type="number" placeholder="25" value={age} onChange={(e) => setAge(e.target.value)} className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200 font-medium"/>
                         </div>
                       </div>
                       <div className="space-y-1.5">
                         <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Gender</label>
                         <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                             <Users className="h-4 w-4 text-slate-400" />
                           </div>
                           <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full pl-9 pr-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200 font-medium appearance-none">
                             <option value="Not specified">Select...</option>
                             <option value="Male">Male</option>
                             <option value="Female">Female</option>
                             <option value="Other">Other</option>
                             <option value="Prefer not to say">Prefer not to say</option>
                           </select>
                         </div>
                       </div>
                     </div>

                     <div className="space-y-1.5">
                       <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Preferred Language</label>
                       <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <Languages className="h-5 w-5 text-slate-400" />
                         </div>
                         <select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200 font-medium appearance-none">
                           <option value="English">English</option>
                           <option value="Hindi">Hindi (हिन्दी)</option>
                           <option value="Assamese">Assamese (অসমীয়া)</option>
                           <option value="Bengali">Bengali (বাংলা)</option>
                           <option value="Bodo">Bodo (बड़ो)</option>
                           <option value="Dogri">Dogri (डोगरी)</option>
                           <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                           <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                           <option value="Kashmiri">Kashmiri (कॉशुर)</option>
                           <option value="Konkani">Konkani (कोंकणी)</option>
                           <option value="Maithili">Maithili (मैथिली)</option>
                           <option value="Malayalam">Malayalam (മലയാളം)</option>
                           <option value="Manipuri">Manipuri (ꯃꯤꯇꯩꯂꯣꯟ)</option>
                           <option value="Marathi">Marathi (मराठी)</option>
                           <option value="Nepali">Nepali (नेपाली)</option>
                           <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                           <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                           <option value="Sanskrit">Sanskrit (संस्कृतम्)</option>
                           <option value="Santali">Santali (ᱥᱟᱱᱛᱟᱲᱤ)</option>
                           <option value="Sindhi">Sindhi (سنڌي)</option>
                           <option value="Tamil">Tamil (தமிழ்)</option>
                           <option value="Telugu">Telugu (తెలుగు)</option>
                           <option value="Urdu">Urdu (اُردُو)</option>
                         </select>
                       </div>
                     </div>

                     <div className="space-y-1.5">
                       <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Partner Hospital</label>
                       <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <Building2 className="h-5 w-5 text-slate-400" />
                         </div>
                         <select value={hospital} onChange={(e) => setHospital(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200 font-medium appearance-none">
                           <option value="">Select a hospital...</option>
                           <option value="City Health Care (SME)">City Health Care (SME)</option>
                           <option value="Sunrise Medical Clinic">Sunrise Medical Clinic</option>
                           <option value="LifeLine Hospital">LifeLine Hospital</option>
                         </select>
                       </div>
                     </div>
                   </>
                 )}
               </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input type="email" placeholder="patient@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200 font-medium"/>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 dark:text-slate-200 font-medium"/>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 py-4 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25"
            >
              {loading ? <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> : <>{isSignUp ? 'Sign Up' : 'Sign In'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
            </button>
            
            <div className="text-center mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="ml-1 text-blue-600 dark:text-blue-400 hover:underline">
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </form>
        )}
        
        {/* DEMO BYPASS BUTTON */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <button 
            type="button"
            onClick={handleDemoBypass}
            className="w-full flex justify-center items-center gap-2 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all active:scale-95"
          >
            <FastForward className="w-5 h-5" /> Continue without login
          </button>
        </div>

      </div>
    </div>
  );
}
