import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Store, KeyRound, ExternalLink, Globe } from 'lucide-react';
import { INITIAL_ACCOUNTS } from '../services/auth';
import { sounds } from '../utils/audio';

const LOGIN_TRANSLATIONS = {
  es: {
    back: '← Volver',
    tagline: 'Tarjetas de Fidelidad Digitales para Celulares',
    badge: 'Portal Oficial de Comercios',
    title: 'Iniciar Sesión en tu Negocio',
    subtitle: 'Ingresa con tu correo de comerciante o cajero',
    emailLabel: 'Correo electrónico',
    passwordLabel: 'Contraseña',
    rememberMe: 'Recordar sesión en este celular',
    forgotPassword: '¿Olvidaste tu contraseña?',
    submitBtn: 'Acceder a mi Terminal de Caja',
    securityBadge: 'Conexión Segura SSL • Google Firebase Cloud',
    errEmail: 'Por favor ingresa tu correo electrónico.',
    errPass: 'Por favor ingresa tu contraseña.',
    errLockout: (sec) => `🔒 Demasiados intentos fallidos. Por seguridad, espera ${sec} segundos antes de volver a intentar.`,
    errMaxAttempts: '🔒 Has superado el límite de 5 intentos. Por seguridad, espera 30 segundos.',
    errWrongCreds: (rem) => `❌ Credenciales incorrectas. Te quedan ${rem} intentos.`,
    forgotTitle: '¿Olvidaste tu contraseña?',
    forgotDesc: (name) => `Por seguridad del comercio, las contraseñas son administradas por la central de ${name}.`,
    forgotStep1: '1. El Administrador General puede ver tu clave o cambiarla en 1 segundo desde su panel de control.',
    forgotStep2: '2. O puedes tocar el botón de abajo para enviar un mensaje directo de WhatsApp al soporte.',
    forgotBtn: '📲 Solicitar Clave por WhatsApp',
    forgotClose: 'Cerrar'
  },
  en: {
    back: '← Back',
    tagline: 'Digital Loyalty Passes for Smartphones',
    badge: 'Official Merchant Portal',
    title: 'Sign In to Your Business',
    subtitle: 'Enter your merchant or cashier credentials',
    emailLabel: 'Email address',
    passwordLabel: 'Password',
    rememberMe: 'Remember session on this device',
    forgotPassword: 'Forgot your password?',
    submitBtn: 'Sign In to Cashier Terminal',
    securityBadge: 'Secure SSL Connection • Google Firebase Cloud',
    errEmail: 'Please enter your email address.',
    errPass: 'Please enter your password.',
    errLockout: (sec) => `🔒 Too many failed attempts. For security, please wait ${sec} seconds before trying again.`,
    errMaxAttempts: '🔒 You have exceeded 5 attempts. For security, please wait 30 seconds.',
    errWrongCreds: (rem) => `❌ Incorrect credentials. You have ${rem} attempts remaining.`,
    forgotTitle: 'Forgot your password?',
    forgotDesc: (name) => `For business security, credentials are managed by the ${name} admin portal.`,
    forgotStep1: '1. The General Administrator can view or reset your password in 1 second from the control panel.',
    forgotStep2: '2. Or tap below to message support directly.',
    forgotBtn: '📲 Request Password via WhatsApp',
    forgotClose: 'Close'
  }
};

export function LoginScreen({ 
  onLogin, 
  onGuestCustomerView, 
  onBackToLanding,
  platformName = "FideliPass", 
  platformLogo = '/logos/fidelipass-logo.png',
  accounts = INITIAL_ACCOUNTS 
}) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang === 'en' || urlLang === 'es') return urlLang;
        if (urlParams.get('en') === 'true') return 'en';
        const saved = localStorage.getItem('fidelipass_lang');
        if (saved === 'en' || saved === 'es') return saved;
      } catch {}
    }
    return 'es';
  });

  const toggleLang = (newLang) => {
    setLang(newLang);
    try {
      localStorage.setItem('fidelipass_lang', newLang);
    } catch {}
  };

  const t = LOGIN_TRANSLATIONS[lang] || LOGIN_TRANSLATIONS.es;

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('fidelipass_remembered_email') || '';
    } catch {
      return '';
    }
  });
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      const saved = localStorage.getItem('fidelipass_remember_me');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  // Native mobile app detection
  const isNative = typeof window !== 'undefined' && Boolean(
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.location.hostname === 'localhost' && window.Capacitor)
  );

  // Only available on desktop localhost during development - NEVER on mobile or public production
  const isLocalDev = !isNative && typeof window !== 'undefined' && (
    (window.location.hostname === 'localhost' && window.location.port !== '') || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.')
  ) && window.location.protocol !== 'capacitor:' && window.location.protocol !== 'ionic:';
  const [showDevAccounts, setShowDevAccounts] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      const saved = sessionStorage.getItem('fidelipass_auth_failures');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [lockoutUntil, setLockoutUntil] = useState(() => {
    try {
      const saved = sessionStorage.getItem('fidelipass_lockout_until');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const recordFailedAttempt = () => {
    const nextCount = failedAttempts + 1;
    setFailedAttempts(nextCount);
    try {
      sessionStorage.setItem('fidelipass_auth_failures', String(nextCount));
    } catch {}

    if (nextCount >= 5) {
      const lockTime = Date.now() + 30000;
      setLockoutUntil(lockTime);
      try {
        sessionStorage.setItem('fidelipass_lockout_until', String(lockTime));
      } catch {}
      setError(t.errMaxAttempts);
    } else {
      setError(t.errWrongCreds(5 - nextCount));
    }
    sounds.playUndo();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (Date.now() < lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setError(t.errLockout(remainingSeconds));
      sounds.playUndo();
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError(t.errEmail);
      sounds.playUndo();
      return;
    }

    if (!password) {
      setError(t.errPass);
      sounds.playUndo();
      return;
    }

    // Exact email matching (case-insensitive)
    const matched = accounts.find(a => a.email && a.email.toLowerCase().trim() === trimmedEmail);

    if (!matched) {
      recordFailedAttempt();
      return;
    }

    // Strict Single Password Validation
    const expectedPassword = String(matched.password || (matched.role === 'admin' ? 'williamsadmin' : '123')).trim();
    const providedPassword = String(password).trim();

    if (providedPassword !== expectedPassword) {
      recordFailedAttempt();
      return;
    }

    // Success! Reset attempts and enter ONLY their assigned store
    try {
      localStorage.setItem('fidelipass_remember_me', String(rememberMe));
      if (rememberMe) {
        localStorage.setItem('fidelipass_remembered_email', trimmedEmail);
      } else {
        localStorage.removeItem('fidelipass_remembered_email');
      }
      sessionStorage.removeItem('fidelipass_auth_failures');
      sessionStorage.removeItem('fidelipass_lockout_until');
    } catch {}

    setFailedAttempts(0);
    setLockoutUntil(0);
    sounds.playStamp();
    onLogin(matched, rememberMe);
  };

  const handleQuickLogin = (account) => {
    setEmail(account.email);
    setPassword(account.password || '123456');
    try {
      localStorage.setItem('fidelipass_remember_me', String(rememberMe));
      if (rememberMe) {
        localStorage.setItem('fidelipass_remembered_email', account.email);
      }
    } catch {}
    sounds.playStamp();
    onLogin(account, rememberMe);
  };

  return (
    <div className="min-h-screen w-full bg-[#0C4A6E] sm:bg-[#F0F7FF] flex flex-col justify-center items-center selection:bg-sky-100 selection:text-sky-900">
      <div className="w-full min-h-screen sm:min-h-0 sm:max-w-md sm:rounded-[36px] bg-white overflow-hidden flex flex-col justify-between sm:shadow-[0_25px_60px_-15px_rgba(2,132,199,0.3)] border-0 sm:border sm:border-sky-100">
        
        {/* Top Header - Premium FideliPass Celestial & Royal Blue Gradient */}
        <div className="w-full pt-[max(env(safe-area-inset-top),2.2rem)] pb-8 px-6 bg-gradient-to-br from-[#0284C7] via-[#0284C7] to-[#1D4ED8] text-white text-center relative overflow-hidden sm:rounded-t-[36px]">
          {/* Subtle background glow circle */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-cyan-300/20 blur-xl pointer-events-none"></div>

          {!isNative && onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="absolute top-[max(env(safe-area-inset-top),1rem)] left-4 text-xs font-bold text-white/80 hover:text-white flex items-center gap-1 cursor-pointer transition-colors z-10"
            >
              <span>{t.back}</span>
            </button>
          )}

          {/* Language Switcher ES / EN on top right */}
          <div className="absolute top-[max(env(safe-area-inset-top),1rem)] right-4 flex items-center bg-black/20 backdrop-blur-md p-0.5 rounded-xl border border-white/25 text-[10px] font-black z-10">
            <button
              type="button"
              onClick={() => toggleLang('es')}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                lang === 'es' ? 'bg-white text-sky-700 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => toggleLang('en')}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                lang === 'en' ? 'bg-white text-sky-700 shadow-sm' : 'text-white/80 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Grand FideliPass Emblem */}
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto mb-3 rounded-3xl bg-white flex items-center justify-center shadow-[0_12px_28px_rgba(0,0,0,0.18)] p-2.5 ring-4 ring-white/30 backdrop-blur-md">
              {platformLogo ? (
                <img src={platformLogo} alt={platformName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-3xl">💳</span>
              )}
            </div>
            
            <h2 className="font-heading text-3xl font-black tracking-tight text-white drop-shadow-sm">{platformName}</h2>
            <p className="text-xs text-sky-100 font-semibold mt-1 max-w-xs mx-auto leading-relaxed">{t.tagline}</p>

            <div className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[11px] font-bold text-white shadow-xs">
              <ShieldCheck size={14} className="text-cyan-300" />
              <span>{t.badge}</span>
            </div>
          </div>
        </div>

        {/* Form Body - Perfectly Balanced, No Empty Voids! */}
        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center max-w-sm sm:max-w-none mx-auto w-full">
          <div className="text-center mb-6">
            <h3 className="font-heading font-black text-xl text-slate-900">{t.title}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">{t.subtitle}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold shadow-xs animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">{t.emailLabel}</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-3.5 text-sky-600" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@negocio.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3.5 text-xs rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all shadow-inner outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">{t.passwordLabel}</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-3.5 text-sky-600" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 text-xs rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition-all shadow-inner outline-none"
                />
              </div>
              <div className="flex items-center justify-between mt-3 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 accent-sky-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700">{t.rememberMe}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-sky-600 hover:text-sky-700 hover:underline font-extrabold cursor-pointer transition-colors"
                >
                  {t.forgotPassword}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-3 py-4 rounded-2xl bg-gradient-to-r from-[#0284C7] via-[#2563EB] to-[#1D4ED8] hover:from-[#0369A1] hover:to-[#1E40AF] text-white text-xs font-black shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
            >
              <span>{t.submitBtn}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts: Strictly hidden on production! Only visible on localhost if toggled */}
          {isLocalDev && (
            <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
              <button
                type="button"
                onClick={() => setShowDevAccounts(!showDevAccounts)}
                className="w-full text-center text-[10px] text-gray-400 font-mono hover:text-gray-600 cursor-pointer flex items-center justify-center gap-1"
              >
                <span>🛠️ {showDevAccounts ? 'Hide' : 'Show'} dev accounts (Localhost only)</span>
              </button>

              {showDevAccounts && (
                <div className="space-y-1.5 mt-3 animate-fade-in">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        acc.role === 'admin'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-950 font-semibold'
                          : 'bg-[#FAF7F2] border-[#E8E3DA] text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">
                          {acc.role === 'admin' ? '👑' : acc.badge?.includes('Pizza') ? '🍕' : acc.badge?.includes('Helad') ? '🍦' : acc.badge?.includes('Café') ? '☕' : '🏪'}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight truncate">{acc.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono truncate">
                            {acc.email} • <span className="font-bold text-gray-700 bg-black/5 px-1 rounded">clave: {acc.password || '123456'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(acc.email);
                            setPassword(acc.password || '123456');
                          }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickLogin(acc)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-sky-600 text-white hover:bg-sky-700 cursor-pointer"
                        >
                          Login
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security badge at bottom with safe-area padding */}
        <div className="p-4 sm:p-3.5 pb-[max(env(safe-area-inset-bottom),1.6rem)] sm:pb-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-semibold sm:rounded-b-[36px]">
          <ShieldCheck size={15} className="text-sky-600" />
          <span>{t.securityBadge}</span>
        </div>
      </div>

      {/* Forgot Password Modal (Sky Blue Modern) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-center animate-fade-in border border-sky-100">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-800 mx-auto flex items-center justify-center text-2xl font-bold shadow-xs">
              🔑
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-slate-900">{t.forgotTitle}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                {t.forgotDesc(platformName)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 space-y-2">
              <div className="font-black text-sky-700 flex items-center gap-1.5">
                <span>⚡ {lang === 'en' ? 'How to recover immediately?' : '¿Cómo recuperarla de inmediato?'}</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                {t.forgotStep1}
              </p>
              <p className="text-[11px] text-slate-600 font-medium">
                {t.forgotStep2}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const msg = encodeURIComponent(
                  lang === 'en'
                    ? `Hello FideliPass support, I am a business owner and need to recover my cashier access password. My email is: ${email || ''}`
                    : `Hola soporte de FideliPass, soy dueño de un local y necesito recuperar mi contraseña de acceso a la caja. Mi correo es: ${email || ''}`
                );
                window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <span>{t.forgotBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors"
            >
              {t.forgotClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
