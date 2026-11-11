import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Store, KeyRound, ExternalLink, Globe } from 'lucide-react';
import { INITIAL_ACCOUNTS } from '../services/auth';
import { sounds } from '../utils/audio';

const LOGIN_TRANSLATIONS = {
  es: {
    back: '← Volver',
    tagline: 'Tarjetas de Fidelidad Digitales para tu Celular',
    badge: 'Portal Seguro de Comercios',
    title: 'Iniciar Sesión en tu Negocio',
    subtitle: 'Ingresa tu usuario y contraseña de comerciante',
    emailLabel: 'Correo electrónico',
    passwordLabel: 'Contraseña',
    rememberMe: 'Recordar sesión',
    forgotPassword: '¿Olvidaste tu contraseña?',
    submitBtn: 'Acceder a mi Terminal de Caja',
    securityBadge: 'Alojado en Google Firebase con encriptación SSL',
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
    tagline: 'Digital Loyalty Passes for Smartphone',
    badge: 'Secure Merchant Portal',
    title: 'Sign In to Your Business',
    subtitle: 'Enter your merchant email and password',
    emailLabel: 'Email address',
    passwordLabel: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot your password?',
    submitBtn: 'Sign In to Cashier Terminal',
    securityBadge: 'Hosted on Google Firebase with SSL encryption',
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
    <div className="min-h-screen w-full bg-[#153B2F] sm:bg-[#F0F4F8] flex flex-col justify-between sm:justify-center items-center selection:bg-[#E8F1EC] selection:text-[#1D4E3E]">
      <div className="w-full min-h-screen sm:min-h-0 sm:max-w-md sm:rounded-[32px] sm:clay-card bg-white overflow-y-auto flex flex-col justify-between sm:shadow-2xl">
        {/* Header - Edge-to-edge on mobile with safe area */}
        <div className="w-full pt-[max(env(safe-area-inset-top),2rem)] pb-7 px-6 bg-gradient-to-br from-[#1D4E3E] to-[#153B2F] text-white text-center relative border-b border-white/10 sm:rounded-t-[32px]">
          {!isNative && onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="absolute top-[max(env(safe-area-inset-top),1rem)] left-4 text-xs font-bold text-white/80 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{t.back}</span>
            </button>
          )}

          {/* Language Switcher ES / EN on top right */}
          <div className="absolute top-[max(env(safe-area-inset-top),1rem)] right-4 flex items-center bg-black/25 backdrop-blur-md p-0.5 rounded-xl border border-white/20 text-[10px] font-black">
            <button
              type="button"
              onClick={() => toggleLang('es')}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                lang === 'es' ? 'bg-white text-[#1D4E3E] shadow-xs' : 'text-white/70 hover:text-white'
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => toggleLang('en')}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                lang === 'en' ? 'bg-white text-[#1D4E3E] shadow-xs' : 'text-white/70 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          <div className="w-16 h-16 mx-auto mb-3.5 rounded-2xl bg-white text-[#1D4E3E] flex items-center justify-center text-3xl font-bold shadow-lg overflow-hidden p-1.5 ring-4 ring-white/20">
            {platformLogo ? (
              <img src={platformLogo} alt={platformName} className="w-full h-full object-contain" />
            ) : (
              <span>🌱</span>
            )}
          </div>
          <h2 className="font-heading text-2xl font-black tracking-tight drop-shadow-xs">{platformName}</h2>
          <p className="text-xs text-white/80 font-medium mt-1">{t.tagline}</p>

          <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 clay-badge-dark text-[11px] font-bold text-emerald-200">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>{t.badge}</span>
          </div>
        </div>

        {/* Form Body - Full mobile width */}
        <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
          <div className="text-center mb-5">
            <h3 className="font-heading font-black text-lg text-gray-900">{t.title}</h3>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">{t.subtitle}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold shadow-2xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1.5">{t.emailLabel}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 text-xs clay-input bg-white text-gray-800 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-gray-700 mb-1.5">{t.passwordLabel}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-xs clay-input bg-white text-gray-800 font-semibold"
                />
              </div>
              <div className="flex items-center justify-between mt-2.5 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1D4E3E] focus:ring-[#1D4E3E] accent-[#1D4E3E] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-700">{t.rememberMe}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-[#1D4E3E] hover:underline font-bold cursor-pointer"
                >
                  {t.forgotPassword}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 clay-btn clay-btn-primary text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#1D4E3E] text-white hover:bg-[#153B2F] cursor-pointer"
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

        {/* Security badge */}
        <div className="p-4 sm:p-3.5 pb-[max(env(safe-area-inset-bottom),1.5rem)] sm:pb-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-gray-500 font-semibold sm:rounded-b-[32px]">
          <ShieldCheck size={15} className="text-[#1D4E3E]" />
          <span>{t.securityBadge}</span>
        </div>
      </div>

      {/* Forgot Password Modal (Claymorphic) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm clay-card bg-white p-6 shadow-2xl space-y-4 text-center animate-fade-in">
            <div className="w-13 h-13 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center text-2xl font-bold shadow-sm">
              🔑
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-gray-900">{t.forgotTitle}</h3>
              <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                {t.forgotDesc(platformName)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-gray-700 space-y-2 shadow-inner">
              <div className="font-black text-[#1D4E3E] flex items-center gap-1.5">
                <span>⚡ {lang === 'en' ? 'How to recover immediately?' : '¿Cómo recuperarla de inmediato?'}</span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium">
                {t.forgotStep1}
              </p>
              <p className="text-[11px] text-gray-600 font-medium">
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
              className="w-full py-3 px-4 clay-btn clay-btn-primary text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.forgotBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 clay-btn clay-btn-light text-gray-700 text-xs font-bold cursor-pointer"
            >
              {t.forgotClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
