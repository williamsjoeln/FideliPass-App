import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { INITIAL_ACCOUNTS } from '../services/auth';
import { sounds } from '../utils/audio';

const LOGIN_TRANSLATIONS = {
  es: {
    back: '← Volver',
    tagline: 'Tarjetas de Fidelidad Digitales para tu Celular',
    badge: 'Portal Seguro de Comercios',
    title: 'Iniciar sesión en tu negocio',
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
    forgotBtn: '📱 Solicitar Clave por WhatsApp',
    forgotClose: 'Cerrar'
  },
  en: {
    back: '← Back',
    tagline: 'Digital Loyalty Passes for Smartphones',
    badge: 'Secure Merchant Portal',
    title: 'Sign In to Your Business',
    subtitle: 'Enter your merchant credentials',
    emailLabel: 'Email address',
    passwordLabel: 'Password',
    rememberMe: 'Remember session',
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
    forgotBtn: '📱 Request Password via WhatsApp',
    forgotClose: 'Close'
  }
};

export function LoginScreen({ 
  onLogin, 
  onGuestCustomerView, 
  onBackToLanding,
  platformName = "FideliPass", 
  platformLogo = '/logos/fidelipass-logo.png',
  accounts = INITIAL_ACCOUNTS,
  currentLang,
  onToggleLang 
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
    if (currentLang === 'en' || currentLang === 'es') return currentLang;
    return 'es';
  });

  // Sync state if parent language changes
  React.useEffect(() => {
    if (currentLang && (currentLang === 'en' || currentLang === 'es') && currentLang !== lang) {
      setLang(currentLang);
    }
  }, [currentLang]);

  const toggleLang = (newLang) => {
    setLang(newLang);
    if (onToggleLang) {
      onToggleLang(newLang);
    }
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
  const [showPassword, setShowPassword] = useState(false);
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
      localStorage.setItem('fidelipass_lang', lang);
      if (onToggleLang) {
        onToggleLang(lang);
      }
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
    <div className="fixed inset-0 w-full h-[100dvh] bg-gradient-to-b from-[#F8FAFC] via-[#F0F7FF] to-[#E0F2FE] overflow-hidden flex flex-col justify-between items-center selection:bg-sky-100 selection:text-sky-900 px-4 sm:px-6 overscroll-none select-none">
      {/* Subtle organic cyan/sky background glows strictly clipped inside container */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-sky-200/35 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-5 left-5 grid grid-cols-3 gap-2 opacity-40">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>
          ))}
        </div>
      </div>

      {/* Top Bar with Language Toggle & Back Button - Framed directly below the iPhone notch */}
      <div className="w-full max-w-[400px] flex items-center justify-between pt-[max(env(safe-area-inset-top),2.5rem)] pb-1 px-1 z-10 shrink-0">
        {!isNative && onBackToLanding ? (
          <button
            type="button"
            onClick={onBackToLanding}
            className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{t.back}</span>
          </button>
        ) : (
          <div></div>
        )}

        {/* Clean Language Switcher ES / EN */}
        <div className="flex items-center bg-white/90 backdrop-blur-md p-1 rounded-full border border-slate-200/90 shadow-xs text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => toggleLang('es')}
            className={`px-3 py-0.5 rounded-full transition-all cursor-pointer ${
              lang === 'es' ? 'bg-[#007AFF] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => toggleLang('en')}
            className={`px-3 py-0.5 rounded-full transition-all cursor-pointer ${
              lang === 'en' ? 'bg-[#007AFF] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Main Centered Content - Perfectly Scaled & Centered */}
      <div className="w-full max-w-[400px] flex flex-col items-center z-10 my-auto py-1">
        {/* Floating Brand Header - Compact & Elegant */}
        <div className="flex flex-col items-center text-center mb-2.5 sm:mb-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mb-1 flex items-center justify-center">
            {platformLogo ? (
              <img
                src={platformLogo}
                alt={platformName}
                className="w-full h-full object-contain filter drop-shadow-[0_6px_14px_rgba(2,132,199,0.18)]"
              />
            ) : (
              <span className="text-4xl">💳</span>
            )}
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-none">
            Fideli<span className="text-[#007AFF]">Pass</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 max-w-xs leading-snug">
            {t.tagline}
          </p>

          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50/90 border border-sky-200/80 text-[10px] sm:text-[11px] font-semibold text-sky-700 shadow-2xs">
            <ShieldCheck size={13} className="text-sky-500" />
            <span>{t.badge}</span>
          </div>
        </div>

        {/* Floating White Card - Clean & Edge-to-Edge */}
        <div className="w-full bg-white rounded-[24px] sm:rounded-[28px] p-4.5 sm:p-5 shadow-[0_12px_32px_rgba(2,132,199,0.07)] border border-sky-100/90">
          {/* Card Icon Badge */}
          <div className="w-10 h-10 rounded-full bg-sky-50/90 border border-sky-100 flex items-center justify-center mx-auto mb-1.5 text-sky-500 shadow-inner">
            <Lock size={18} className="stroke-[2.2]" />
          </div>

          <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 text-center">
            {t.title}
          </h2>
          <p className="text-[11px] text-slate-400 font-medium text-center mt-0.5 mb-3">
            {t.subtitle}
          </p>

          {error && (
            <div className="mb-2.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold shadow-xs animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">{t.emailLabel}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-2.5 text-sky-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder=""
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold focus:border-sky-500 focus:ring-3 focus:ring-sky-100 transition-all shadow-2xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">{t.passwordLabel}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-2.5 text-sky-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder=""
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold focus:border-sky-500 focus:ring-3 focus:ring-sky-100 transition-all shadow-2xs outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#007AFF] focus:ring-sky-500 accent-[#007AFF] cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-slate-700">{t.rememberMe}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-[#007AFF] hover:underline font-semibold cursor-pointer transition-colors"
                >
                  {t.forgotPassword}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2.5 py-2.5 sm:py-3 rounded-xl bg-[#007AFF] hover:bg-[#0062E0] text-white text-xs sm:text-sm font-bold shadow-md shadow-sky-500/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] transition-all"
            >
              <span>{t.submitBtn}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts: Strictly hidden on production! Only visible on localhost if toggled */}
          {isLocalDev && (
            <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
              <button
                type="button"
                onClick={() => setShowDevAccounts(!showDevAccounts)}
                className="w-full text-center text-[10px] text-gray-400 font-mono hover:text-gray-600 cursor-pointer flex items-center justify-center gap-1"
              >
                <span>🛠️ {showDevAccounts ? 'Hide' : 'Show'} dev accounts (Localhost only)</span>
              </button>

              {showDevAccounts && (
                <div className="space-y-1.5 mt-2.5 animate-fade-in max-h-48 overflow-y-auto">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className={`w-full p-2 rounded-xl border flex items-center justify-between transition-all ${
                        acc.role === 'admin'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-950 font-semibold'
                          : 'bg-[#FAF7F2] border-[#E8E3DA] text-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0">
                          {acc.role === 'admin' ? '👑' : acc.badge?.includes('Pizza') ? '🍕' : acc.badge?.includes('Helad') ? '🍦' : acc.badge?.includes('Café') ? '☕' : '🏪'}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold leading-tight truncate">{acc.name}</div>
                          <div className="text-[9px] text-gray-500 font-mono truncate">
                            {acc.email}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(acc.email);
                            setPassword(acc.password || '123456');
                          }}
                          className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickLogin(acc)}
                          className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-sky-600 text-white hover:bg-sky-700 cursor-pointer"
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
      </div>

      {/* Security badge at bottom with safe-area padding */}
      <div className="w-full max-w-[400px] pt-1 pb-[max(env(safe-area-inset-bottom),1rem)] flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-medium z-10 text-center shrink-0">
        <ShieldCheck size={13} className="text-slate-400 shrink-0" />
        <span>{t.securityBadge}</span>
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