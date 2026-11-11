import React, { useState, useMemo } from 'react';
import { 
  Lock, ArrowRight, ChevronRight, QrCode, Smartphone, 
  Award, TrendingUp, Users, ShieldCheck, CheckCircle2, 
  Store, Zap, Volume2, Sparkles, Plus, Minus, Coffee, 
  HelpCircle, Palette, RefreshCw, Check, X, Star, Gift,
  Layers, Clock, BarChart3, ScanLine, Globe
} from 'lucide-react';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { InteractiveParticles } from './InteractiveParticles';
import { landingTranslations } from '../utils/landingTranslations';

export function LandingPage({
  platformName = "FideliPass",
  platformLogo = "/logos/fidelipass-logo.png",
  onOpenLogin,
  onTryCustomerDemo,
  onOpenCalculator
}) {
  // Language State: 'es' or 'en'
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

  const t = landingTranslations[lang] || landingTranslations.es;

  // Dynamic themes matching active language
  const cardThemes = useMemo(() => [
    { 
      id: 'mint', 
      name: t.theme_mcrolls_name, 
      bg: 'from-[#173E31] to-[#0D241C]', 
      accent: '#10B981', 
      ring: 'ring-emerald-500', 
      business: t.theme_mcrolls_biz, 
      category: t.theme_mcrolls_cat, 
      prize: t.theme_mcrolls_prize, 
      logo: '/logos/mcrolls.png', 
      emoji: '🍦' 
    },
    { 
      id: 'crochet', 
      name: t.theme_crochet_name, 
      bg: 'from-[#831843] to-[#500724]', 
      accent: '#F472B6', 
      ring: 'ring-pink-500', 
      business: t.theme_crochet_biz, 
      category: t.theme_crochet_cat, 
      prize: t.theme_crochet_prize, 
      logo: null, 
      emoji: '🧶' 
    },
    { 
      id: 'coffee', 
      name: t.theme_coffee_name, 
      bg: 'from-[#3E2723] to-[#1B0F0B]', 
      accent: '#D97706', 
      ring: 'ring-amber-600', 
      business: t.theme_coffee_biz, 
      category: t.theme_coffee_cat, 
      prize: t.theme_coffee_prize, 
      logo: null, 
      emoji: '☕' 
    },
    { 
      id: 'barber', 
      name: t.theme_barber_name, 
      bg: 'from-[#0F172A] to-[#020617]', 
      accent: '#38BDF8', 
      ring: 'ring-sky-500', 
      business: t.theme_barber_biz, 
      category: t.theme_barber_cat, 
      prize: t.theme_barber_prize, 
      logo: null, 
      emoji: '💈' 
    }
  ], [t]);

  const [selectedThemeId, setSelectedThemeId] = useState('mint');
  const selectedTheme = cardThemes.find(th => th.id === selectedThemeId) || cardThemes[0];

  const [maxSlots, setMaxSlots] = useState(8);
  const [stamps, setStamps] = useState(5);
  const [calcCustomers, setCalcCustomers] = useState(300);
  const [calcTicket, setCalcTicket] = useState(5.00);
  const [openFaq, setOpenFaq] = useState(0);

  const extraVisits = Math.round(calcCustomers * 0.40 * 1.5);
  const extraRevenue = Math.round(extraVisits * calcTicket);

  const handleAddStamp = () => {
    sounds.playStamp(stamps >= (maxSlots - 1) ? 'crystal' : 'pop');
    if (stamps >= (maxSlots - 1)) {
      setStamps(maxSlots);
      try {
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch {}
    } else {
      setStamps(prev => Math.min(maxSlots, prev + 1));
    }
  };

  const handleResetStamp = () => {
    sounds.playUndo();
    setStamps(1);
  };

  const contactWhatsappUrl = lang === 'en'
    ? "https://api.whatsapp.com/send?phone=593992407645&text=Hello%20FideliPass,%20I%20would%20like%20to%20start%20a%2014-day%20free%20trial%20for%20my%20business"
    : "https://api.whatsapp.com/send?phone=593992407645&text=Hola%20FideliPass,%20deseo%20activar%20mi%20tarjeta%20digital%20para%20mi%20negocio";

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-[-apple-system,BlinkMacSystemFont,'Plus_Jakarta_Sans','SF_Pro_Display','Helvetica_Neue',sans-serif] selection:bg-[#1D4E3E] selection:text-white overflow-x-hidden antialiased relative">
      
      {/* ================= RED DE MOLÉCULAS INTERACTIVAS FIJA EN TODA LA PÁGINA (STAMPCARD.IO EFFECT) ================= */}
      <InteractiveParticles 
        color="rgba(29, 78, 62, 0.45)" 
        accentColor="rgba(16, 185, 129, 0.75)" 
        maxDistance={130} 
        mouseRadius={170} 
      />

      {/* ================= 1. APPLE LIGHT NAVBAR (44px) ================= */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-[20px] saturate-[180%] border-b border-[#D2D2D7]/60 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between text-[13px] font-medium text-[#1D1D1F]/80">
          
          {/* Brand Logo with 3D touch */}
          <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-white text-gray-900 flex items-center justify-center shadow-xs border border-gray-200/90 overflow-hidden p-1">
              {platformLogo ? (
                <img src={platformLogo} alt={platformName} className="w-full h-full object-contain" />
              ) : (
                <span>🌱</span>
              )}
            </div>
            <span className="font-extrabold text-[#1D1D1F] text-base tracking-tight">{platformName}</span>
            <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#1D4E3E]">
              Pro
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] text-[#424245]">
            <a href="#experiencia" className="hover:text-[#0071E3] transition-colors font-medium">{t.nav_designer}</a>
            <a href="#como-funciona" className="hover:text-[#0071E3] transition-colors font-medium">{t.nav_how}</a>
            <a href="#mcrolls" className="hover:text-[#0071E3] transition-colors font-medium">{t.nav_case}</a>
            <a href="#comparativa" className="hover:text-[#0071E3] transition-colors font-medium">{t.nav_compare}</a>
            <a href="#calculadora" className="hover:text-[#0071E3] transition-colors font-medium">{t.nav_roi}</a>
          </nav>

          {/* Action CTAs + Language Selector */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher ES / EN Pill */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 shadow-inner text-[11px] font-black">
              <button
                type="button"
                onClick={() => toggleLang('es')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  lang === 'es' ? 'bg-[#1D4E3E] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Cambiar a Español"
              >
                <span>ES</span>
              </button>
              <button
                type="button"
                onClick={() => toggleLang('en')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  lang === 'en' ? 'bg-[#1D4E3E] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Switch to English"
              >
                <span>EN</span>
              </button>
            </div>

            <button
              onClick={onOpenLogin}
              className="clay-btn clay-btn-primary px-3 sm:px-4 py-1.5 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Lock size={12} />
              <span>{t.nav_login}</span>
            </button>
          </div>

        </div>
      </header>

      {/* ================= RIBBON ANNOUNCEMENT ================= */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-[#E5E5EA] py-2 px-4 text-center text-[12px] text-[#6E6E73] relative z-10">
        <span className="font-medium">{t.ribbon_text} </span>
        <a 
          href="#mcrolls"
          className="text-[#0071E3] hover:underline font-semibold inline-flex items-center cursor-pointer ml-1"
        >
          <span>{t.ribbon_link}</span>
          <ChevronRight size={12} />
        </a>
      </div>

      {/* ================= 2. HERO PRINCIPAL: LIMPIO + IPHONE 3D AL LADO ================= */}
      <section id="experiencia" className="pt-10 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 relative z-10">
        
        {/* Glow de fondo Apple muy suave */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-gradient-to-tr from-emerald-100/40 via-teal-50/30 to-blue-50/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-[1140px] mx-auto">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* COLUMNA IZQUIERDA: PITCH LIMPIO + PERSONALIZADOR EN VIVO */}
            <div className="lg:col-span-6 text-center lg:text-left space-y-6">
              
              {/* Badge 3D inflado */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md clay-card text-[#1D4E3E] text-xs font-extrabold shadow-sm border border-emerald-100/80">
                <Sparkles size={14} className="text-[#FF5E36] animate-pulse" />
                <span>{t.hero_badge}</span>
              </div>

              {/* Título de Impacto Apple */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1D1D1F] tracking-[-0.035em] leading-[1.08]">
                {t.hero_title_1}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1D4E3E] via-[#24634f] to-[#0071E3]">
                  {t.hero_title_2}
                </span>
              </h1>

              {/* Párrafo descriptivo */}
              <p className="text-base sm:text-lg text-[#6E6E73] font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.hero_desc}
              </p>

              {/* SELECTOR DE ESTILOS EN VIVO */}
              <div className="bg-white/85 backdrop-blur-md clay-card p-4 rounded-2xl border border-gray-200/80 text-left space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                    <Palette size={14} className="text-[#1D4E3E]" />
                    <span>{t.hero_customize}</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">{t.hero_tap_business}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {cardThemes.map((theme) => {
                    const isSelected = selectedTheme.id === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedThemeId(theme.id)}
                        className={`p-2 rounded-xl text-left transition-all border flex items-center gap-2 cursor-pointer ${
                          isSelected 
                            ? 'border-[#1D4E3E] bg-emerald-50/80 shadow-sm ring-1 ring-[#1D4E3E]' 
                            : 'border-gray-200 hover:border-gray-300 bg-white/70'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${theme.bg} shadow-inner shrink-0 flex items-center justify-center text-xs text-white font-bold`}>
                          {theme.emoji || '🍦'}
                        </div>
                        <div className="truncate">
                          <p className="text-[11px] font-bold text-gray-900 truncate">{theme.business}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selector de número de sellos */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                  <span className="font-bold text-gray-600 text-[11px]">{t.hero_stamps_goal}</span>
                  <div className="flex items-center gap-1.5">
                    {[6, 8, 10].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => {
                          setMaxSlots(count);
                          setStamps(Math.min(count - 1, stamps));
                        }}
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                          maxSlots === count
                            ? 'bg-[#1D4E3E] text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {count} {t.hero_stamps_unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botones de acción táctiles 3D */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href={contactWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="clay-btn clay-btn-primary px-7 py-4 text-sm font-extrabold text-white shadow-lg w-full sm:w-auto flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>{t.hero_cta_whatsapp}</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </a>

                <button
                  onClick={onOpenLogin}
                  className="clay-btn clay-btn-white px-6 py-4 text-sm font-extrabold text-[#1D4E3E] w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer border border-gray-200"
                >
                  <Lock size={15} />
                  <span>{t.hero_cta_cashier}</span>
                </button>
              </div>

              {/* Billeteras Digitales Oficiales & Compatibilidad */}
              <div className="pt-2 flex flex-col items-center lg:items-start gap-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                  {t.hero_wallet_title}
                </span>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  {/* Apple Wallet Badge Oficial */}
                  <div className="transition-transform hover:scale-[1.04] cursor-default drop-shadow-sm select-none">
                    <img 
                      src="/logos/add-to-apple-wallet.svg" 
                      alt="Add to Apple Wallet" 
                      className="h-10 w-auto"
                    />
                  </div>

                  {/* Google Wallet Badge Oficial */}
                  <div className="transition-transform hover:scale-[1.04] cursor-default drop-shadow-sm select-none">
                    <img 
                      src="/logos/add-to-google-wallet.svg" 
                      alt="Add to Google Wallet" 
                      className="h-10 w-auto"
                    />
                  </div>

                  {/* Acceso Web Universal */}
                  <div className="h-10 bg-white/95 backdrop-blur-md text-emerald-900 px-3.5 rounded-full flex items-center gap-1.5 border border-slate-200/80 shadow-sm text-xs font-black select-none">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>+ Web PWA</span>
                  </div>
                </div>
              </div>

              {/* Sellos de confianza */}
              <div className="pt-1 flex items-center justify-center lg:justify-start gap-6 text-xs text-[#86868B] font-semibold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>{t.hero_trust_1}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>{t.hero_trust_2}</span>
                </div>
              </div>

            </div>

            {/* COLUMNA DERECHA: EL IPHONE 3D INTERACTIVO */}
            <div className="lg:col-span-6 flex justify-center relative">
              
              {/* Resplandor decorativo con color dinámico */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-200/40 via-teal-100/30 to-blue-200/30 rounded-[48px] blur-2xl transform rotate-3 scale-95 -z-10" />

              {/* Contenedor del Celular */}
              <div className="relative w-full max-w-[340px] sm:max-w-[360px] transition-transform duration-500 hover:scale-[1.02]">
                
                {/* Chasis de iPhone Blanco/Plata Estilo Apple */}
                <div className="bg-[#1C1C1E] p-3 sm:p-3.5 rounded-[46px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35),0_10px_25px_-5px_rgba(29,78,62,0.2)] border-[3px] border-[#8E8E93]/30 ring-1 ring-white/60">
                  
                  {/* Dynamic Island Apple */}
                  <div className="w-24 h-4 bg-black rounded-full mx-auto mb-2.5 flex items-center justify-center shadow-inner">
                    <div className="w-2 h-2 rounded-full bg-[#1C1C1E] mr-2"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0a192f] border border-blue-900/40"></div>
                  </div>

                  {/* Pantalla del Teléfono (Tarjeta Digital Dinámica) */}
                  <div className="bg-[#FAF9F6] rounded-[34px] p-4 text-left overflow-hidden border border-gray-200 shadow-inner">
                    
                    {/* Header de la Tarjeta con Gradiente del Tema Seleccionado */}
                    <div className={`clay-card-dark bg-gradient-to-br ${selectedTheme.bg} text-white p-4 rounded-2xl relative mb-3 transition-colors duration-300`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-white p-1 shadow flex items-center justify-center">
                            {selectedTheme.logo ? (
                              <img src={selectedTheme.logo} alt={selectedTheme.business} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-base">{selectedTheme.emoji}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm text-white leading-tight">{selectedTheme.business}</h3>
                            <p className="text-[10px] text-white/70 font-semibold">{selectedTheme.category}</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                          {t.phone_vip_pass}
                        </span>
                      </div>

                      {/* Progreso de Sellos */}
                      <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-white/10">
                        <span className="text-white/80 font-medium">{t.phone_progress}</span>
                        <span className="font-black text-amber-300 text-sm">{stamps} / {maxSlots}</span>
                      </div>
                    </div>

                    {/* Grill de Sellos 3D Táctiles */}
                    <div className="bg-white clay-card p-3.5 mb-3 border border-gray-100">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-extrabold text-gray-800">{t.phone_tap_to_stamp}</span>
                        <span className="text-[10px] text-[#1D4E3E] font-bold bg-[#E8F1EC] px-2 py-0.5 rounded-full">
                          {t.phone_interactive}
                        </span>
                      </div>

                      <div className={`grid ${maxSlots === 6 ? 'grid-cols-3' : maxSlots === 10 ? 'grid-cols-5' : 'grid-cols-4'} gap-2`}>
                        {Array.from({ length: maxSlots }).map((_, idx) => {
                          const slot = idx + 1;
                          const isStamped = slot <= stamps;
                          return (
                            <button
                              key={slot}
                              type="button"
                              onClick={handleAddStamp}
                              className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                                isStamped
                                  ? 'clay-btn-primary shadow-md scale-100'
                                  : 'clay-inset bg-gray-50 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              {isStamped ? (
                                <div className="flex flex-col items-center animate-fade-in">
                                  <Award size={15} className="text-amber-300" />
                                  <span className="text-[9px] font-black text-white mt-0.5">#{slot}</span>
                                </div>
                              ) : (
                                <span className="text-xs font-black text-gray-300">{slot}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Controles de prueba rápida */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 text-[10px]">
                        <button
                          type="button"
                          onClick={handleAddStamp}
                          className="font-bold text-[#1D4E3E] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={11} />
                          <span>{t.phone_add_stamp} (+1)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleResetStamp}
                          className="text-gray-400 hover:text-gray-600 font-semibold cursor-pointer"
                        >
                          {t.phone_reset}
                        </button>
                      </div>
                    </div>

                    {/* Recompensa al Completar la Meta */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Sparkles size={16} />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wide">
                          {lang === 'en' ? `Reward at #${maxSlots}th Stamp:` : `Premio al #${maxSlots}vo Sello:`}
                        </p>
                        <p className="text-xs font-black text-gray-900 leading-tight">{selectedTheme.prize}</p>
                      </div>
                    </div>

                    {/* Botones de Wallet oficiales en la pantalla del celular simulado */}
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-center gap-2">
                      <img
                        src="/logos/add-to-apple-wallet.svg"
                        alt="Add to Apple Wallet"
                        className="h-7.5 max-w-[48%] object-contain drop-shadow-xs transition-transform hover:scale-105"
                      />
                      <img
                        src="/logos/add-to-google-wallet.svg"
                        alt="Add to Google Wallet"
                        className="h-7.5 max-w-[48%] object-contain drop-shadow-xs transition-transform hover:scale-105"
                      />
                    </div>

                  </div>

                </div>

                {/* Indicador elegante centrado debajo del celular */}
                <div className="w-full flex justify-center mt-6">
                  <div className="inline-flex items-center gap-2.5 bg-white/95 backdrop-blur-md clay-card py-2.5 px-5 rounded-full shadow-lg border border-emerald-100/90 text-xs transition-transform hover:scale-105">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-[#1D4E3E] flex items-center justify-center shrink-0">
                      <QrCode size={14} />
                    </div>
                    <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap">
                      <strong className="text-[#1D4E3E] font-black">{lang === 'en' ? 'At counter / table:' : 'En mostrador:'}</strong> {lang === 'en' ? 'Scan & register in 5 seconds' : 'Escaneo y registro en 1 segundo'}
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================= 3. CÓMO FUNCIONA: VISUAL, RICO Y EN 3 PASOS DIORAMA ================= */}
      <section id="como-funciona" className="py-20 px-4 sm:px-6 relative z-10 border-y border-[#E5E5EA]/80 bg-white/60 backdrop-blur-md">
        <div className="max-w-[1100px] mx-auto text-center">
          
          <div className="max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-black text-[#1D4E3E] uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
              {t.how_badge}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1D1D1F] tracking-tight">
              {t.how_title}
            </h2>
            <p className="text-sm sm:text-base text-[#6E6E73] max-w-lg mx-auto">
              {t.how_desc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Paso 1: Diorama del mostrador */}
            <div className="clay-card bg-white/90 backdrop-blur-md p-7 rounded-[32px] border border-gray-200/90 text-left space-y-4 hover:shadow-2xl transition-all duration-300 relative group">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1D4E3E] to-[#153B2F] text-white flex items-center justify-center font-black text-sm shadow-md">
                  1
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {t.step1_badge}
                </span>
              </div>

              {/* Visual Card Graphic */}
              <div className="h-36 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/80 p-4 flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                <div className="w-16 h-16 rounded-2xl bg-white clay-card p-2 shadow-md flex items-center justify-center text-[#1D4E3E] ring-4 ring-emerald-100">
                  <QrCode size={34} />
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#1D4E3E]">
                  <ScanLine size={12} className="animate-pulse" />
                  <span>{t.step1_hint}</span>
                </div>
              </div>

              <h3 className="font-black text-xl text-[#1D1D1F]">{t.step1_title}</h3>
              <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                {t.step1_desc}
              </p>
            </div>

            {/* Paso 2: Diorama del escaneo y sello */}
            <div className="clay-card bg-white/90 backdrop-blur-md p-7 rounded-[32px] border border-gray-200/90 text-left space-y-4 hover:shadow-2xl transition-all duration-300 relative group">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0071E3] to-[#005bb5] text-white flex items-center justify-center font-black text-sm shadow-md">
                  2
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {t.step2_badge}
                </span>
              </div>

              {/* Visual Card Graphic */}
              <div className="h-36 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/80 p-4 flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-white clay-card flex items-center justify-center text-blue-600 shadow-sm font-black text-xs">
                    +1
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1D4E3E] to-[#153B2F] text-white flex items-center justify-center shadow-md">
                    <Award size={24} className="text-amber-300" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white clay-card flex items-center justify-center text-emerald-600 shadow-sm font-black text-xs">
                    ✓
                  </div>
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#0071E3]">
                  <Volume2 size={12} />
                  <span>{t.step2_hint}</span>
                </div>
              </div>

              <h3 className="font-black text-xl text-[#1D1D1F]">{t.step2_title}</h3>
              <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                {t.step2_desc}
              </p>
            </div>

            {/* Paso 3: Diorama del premio y canje */}
            <div className="clay-card bg-white/90 backdrop-blur-md p-7 rounded-[32px] border border-gray-200/90 text-left space-y-4 hover:shadow-2xl transition-all duration-300 relative group">
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                  3
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {t.step3_badge}
                </span>
              </div>

              {/* Visual Card Graphic */}
              <div className="h-36 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/80 p-4 flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md flex items-center justify-center text-3xl animate-bounce duration-1000">
                  🎁
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-amber-800">
                  <Sparkles size={12} />
                  <span>{t.step3_hint}</span>
                </div>
              </div>

              <h3 className="font-black text-xl text-[#1D1D1F]">{t.step3_title}</h3>
              <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
                {t.step3_desc}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ================= 4. CASO DE ÉXITO VISUAL: HELADERÍA MC ROLLS (BEFORE & AFTER) ================= */}
      <section id="mcrolls" className="py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-[1100px] mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-black text-[#1D4E3E] uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
              {t.mc_badge}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1D1D1F] tracking-tight">
              {t.mc_title}
            </h2>
            <p className="text-sm sm:text-base text-[#6E6E73]">
              {t.mc_desc}
            </p>
          </div>

          {/* Comparativa Visual de Impacto (Antes vs. Después) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            
            {/* Antes: El Pasado del Cartón */}
            <div className="clay-card bg-red-50/40 backdrop-blur-md p-8 rounded-[32px] border border-red-200/80 text-left space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-red-600 uppercase tracking-wider bg-red-100 px-3 py-1 rounded-full">
                  {t.mc_before_badge}
                </span>
                <span className="text-2xl">🗑️</span>
              </div>
              <h3 className="text-2xl font-black text-[#1D1D1F]">{t.mc_before_title}</h3>
              
              <ul className="space-y-3 text-xs sm:text-sm text-gray-700 font-medium">
                <li className="flex items-center gap-2.5">
                  <X size={16} className="text-red-500 shrink-0" />
                  <span>{t.mc_before_1}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <X size={16} className="text-red-500 shrink-0" />
                  <span>{t.mc_before_2}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <X size={16} className="text-red-500 shrink-0" />
                  <span>{t.mc_before_3}</span>
                </li>
              </ul>

              <div className="p-3.5 rounded-2xl bg-white/80 border border-red-200 text-xs font-bold text-red-700 flex items-center justify-between">
                <span>{t.mc_before_res_label}</span>
                <span className="font-black text-sm">{t.mc_before_res}</span>
              </div>
            </div>

            {/* Después: El Presente con FideliPass */}
            <div className="clay-card bg-emerald-50/50 backdrop-blur-md p-8 rounded-[32px] border border-emerald-300 text-left space-y-5 relative shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-700 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">
                  {t.mc_after_badge}
                </span>
                <span className="text-2xl">🍦</span>
              </div>
              <h3 className="text-2xl font-black text-[#1D1D1F]">{t.mc_after_title}</h3>

              <ul className="space-y-3 text-xs sm:text-sm text-gray-800 font-semibold">
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>{t.mc_after_1}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>{t.mc_after_2}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>{t.mc_after_3}</span>
                </li>
              </ul>

              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#173E31] to-[#153B2F] text-white text-xs font-bold flex items-center justify-between shadow-md">
                <span>{t.mc_after_res_label}</span>
                <span className="font-black text-sm text-emerald-300">{t.mc_after_res}</span>
              </div>
            </div>

          </div>

          {/* Testimonial Banner Limpio */}
          <div className="p-7 sm:p-9 rounded-[32px] bg-white/90 backdrop-blur-md clay-card border border-emerald-200 flex flex-col sm:flex-row items-center gap-7 text-left shadow-lg">
            <div className="w-20 h-20 rounded-3xl bg-white clay-card p-2.5 shadow-md shrink-0 flex items-center justify-center ring-4 ring-emerald-50">
              <img src="/logos/mcrolls.png" alt="MC Rolls" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
                <span className="text-xs font-extrabold text-gray-500 ml-2">{lang === 'en' ? 'Verified Partner Case' : 'Caso de éxito real'}</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-[#1D1D1F] italic leading-relaxed">
                {t.mc_quote}
              </p>
              <p className="text-xs text-[#1D4E3E] font-black uppercase tracking-wider">
                {t.mc_author}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ================= 5. TABLA COMPARATIVA PREMIUM: FIDELIPASS VS APPS GLOBALES VS CARTÓN ================= */}
      <section id="comparativa" className="py-20 px-4 sm:px-6 relative z-10 border-y border-[#E5E5EA]/80 bg-white/60 backdrop-blur-md">
        <div className="max-w-[1000px] mx-auto text-center">
          
          <div className="max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-black text-[#0071E3] uppercase tracking-widest bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-2xs">
              {t.comp_badge}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1D1D1F] tracking-tight">
              {t.comp_title}
            </h2>
            <p className="text-sm sm:text-base text-[#6E6E73] max-w-lg mx-auto">
              {t.comp_desc}
            </p>
          </div>

          <div className="clay-card bg-white/95 backdrop-blur-md rounded-[32px] border border-gray-200 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/80 bg-gray-50/80 text-xs font-black text-gray-600 uppercase tracking-wider">
                    <th className="p-4 sm:p-5">{t.th_feature}</th>
                    <th className="p-4 sm:p-5 text-gray-400">{t.th_paper}</th>
                    <th className="p-4 sm:p-5 text-gray-500">{t.th_apps}</th>
                    <th className="p-4 sm:p-5 text-[#1D4E3E] bg-emerald-50/80 font-black flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span>{t.th_fidelipass}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs sm:text-sm divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-gray-800">{t.row1_title}</td>
                    <td className="p-4 sm:p-5 text-red-500 font-semibold">{t.row1_paper}</td>
                    <td className="p-4 sm:p-5 text-emerald-600 font-semibold">{t.row1_apps}</td>
                    <td className="p-4 sm:p-5 bg-emerald-50/40 text-emerald-700 font-black">{t.row1_fidelipass}</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-gray-800">{t.row2_title}</td>
                    <td className="p-4 sm:p-5 text-gray-400">{t.row2_paper}</td>
                    <td className="p-4 sm:p-5 text-amber-600 font-semibold">{t.row2_apps}</td>
                    <td className="p-4 sm:p-5 bg-emerald-50/40 text-emerald-700 font-black">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <span>{t.row2_fidelipass_1}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <span>{t.row2_fidelipass_2}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-gray-800">{t.row3_title}</td>
                    <td className="p-4 sm:p-5 text-gray-400">{t.row3_paper}</td>
                    <td className="p-4 sm:p-5 text-gray-500">{t.row3_apps}</td>
                    <td className="p-4 sm:p-5 bg-emerald-50/40 text-emerald-700 font-black">
                      {t.row3_fidelipass}
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-gray-800">{t.row4_title}</td>
                    <td className="p-4 sm:p-5 text-gray-500">{t.row4_paper}</td>
                    <td className="p-4 sm:p-5 text-red-500 font-semibold">{t.row4_apps}</td>
                    <td className="p-4 sm:p-5 bg-emerald-50/40 text-emerald-700 font-black">{t.row4_fidelipass}</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-gray-800">{t.row5_title}</td>
                    <td className="p-4 sm:p-5 text-gray-400">{t.row5_paper}</td>
                    <td className="p-4 sm:p-5 text-gray-400">{t.row5_apps}</td>
                    <td className="p-4 sm:p-5 bg-emerald-50/40 text-emerald-700 font-black">{t.row5_fidelipass}</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-gray-800">{t.row6_title}</td>
                    <td className="p-4 sm:p-5 text-gray-400">{t.row6_paper}</td>
                    <td className="p-4 sm:p-5 text-gray-400">{t.row6_apps}</td>
                    <td className="p-4 sm:p-5 bg-emerald-50/40 text-emerald-700 font-black">{t.row6_fidelipass}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* ================= 6. CALCULADORA DE GANANCIAS (ROI WIDGET) ================= */}
      <section id="calculadora" className="py-20 px-4 sm:px-6 relative z-10">
        <div className="max-w-[850px] mx-auto text-center">
          
          <div className="space-y-3 mb-10">
            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
              {t.calc_badge}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1D1D1F] tracking-tight">
              {t.calc_title}
            </h2>
            <p className="text-sm sm:text-base text-[#6E6E73] max-w-lg mx-auto">
              {t.calc_desc}
            </p>
          </div>

          <div className="clay-card bg-white/95 backdrop-blur-md p-8 sm:p-11 rounded-[36px] border border-gray-200/90 text-left space-y-8 shadow-2xl">
            
            {/* Slider 1: Clientes al mes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-gray-700 uppercase tracking-wide">
                  {t.calc_label_customers}
                </label>
                <span className="text-xl font-black text-[#1D4E3E]">{calcCustomers} {t.calc_unit_customers}</span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={calcCustomers}
                onChange={(e) => setCalcCustomers(Number(e.target.value))}
                className="w-full accent-[#1D4E3E] cursor-pointer h-2.5 bg-gray-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-1">
                <span>50 {t.calc_unit_customers}</span>
                <span>2,000 {t.calc_unit_customers}</span>
              </div>
            </div>

            {/* Slider 2: Consumo Promedio */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-gray-700 uppercase tracking-wide">
                  {t.calc_label_ticket}
                </label>
                <span className="text-xl font-black text-[#1D4E3E]">${calcTicket.toFixed(2)} USD</span>
              </div>
              <input
                type="range"
                min="2.00"
                max="30.00"
                step="0.50"
                value={calcTicket}
                onChange={(e) => setCalcTicket(Number(e.target.value))}
                className="w-full accent-[#1D4E3E] cursor-pointer h-2.5 bg-gray-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-1">
                <span>$2.00</span>
                <span>$30.00</span>
              </div>
            </div>

            {/* Resultado Proyectado */}
            <div className="p-7 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 clay-card border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left shadow-sm">
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wide">{t.calc_est_extra}</p>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1D4E3E] leading-tight">
                  +${extraRevenue.toLocaleString()} <span className="text-lg font-bold text-gray-600">{t.calc_per_month}</span>
                </p>
                <p className="text-xs text-gray-600 font-medium mt-1">{t.calc_basis}</p>
              </div>

              <a
                href={contactWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="clay-btn clay-btn-primary px-7 py-4 text-xs sm:text-sm font-extrabold text-white shadow-lg cursor-pointer shrink-0 text-center"
              >
                {t.calc_cta}
              </a>
            </div>

          </div>

        </div>
      </section>

      {/* ================= 7. PREGUNTAS FRECUENTES ================= */}
      <section className="py-20 px-4 sm:px-6 relative z-10 border-t border-[#E5E5EA]/80 bg-white/60 backdrop-blur-md">
        <div className="max-w-[780px] mx-auto">
          
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-2xs">
              {t.faq_badge}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1D1D1F]">{t.faq_title}</h2>
          </div>

          <div className="space-y-4">
            {t.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="clay-card bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/80 overflow-hidden transition-all text-left shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full p-5 text-left font-extrabold text-sm sm:text-base text-[#1D1D1F] flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className={`w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 text-xs font-black transition-transform ${isOpen ? 'rotate-180 bg-[#1D4E3E] text-white' : 'text-gray-400'}`}>
                      ↓
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-[#6E6E73] leading-relaxed border-t border-gray-100 pt-3 animate-fade-in font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ================= 8. LLAMADO A LA ACCIÓN FINAL ================= */}
      <section className="py-20 px-4 sm:px-6 relative z-10 text-center">
        <div className="max-w-[720px] mx-auto space-y-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white/90 backdrop-blur-md clay-card p-3 shadow-md flex items-center justify-center">
            {platformLogo ? (
              <img src={platformLogo} alt={platformName} className="w-full h-full object-contain" />
            ) : (
              <Sparkles size={28} className="text-[#1D4E3E]" />
            )}
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#1D1D1F] tracking-tight">
            {t.final_title}
          </h2>

          <p className="text-base text-[#6E6E73] max-w-lg mx-auto">
            {t.final_desc}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={contactWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="clay-btn clay-btn-primary px-8 py-4 text-sm font-extrabold text-white shadow-lg w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Sparkles size={16} />
              <span>{t.final_cta_whatsapp}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <button
              onClick={onOpenLogin}
              className="clay-btn clay-btn-white px-7 py-4 text-sm font-extrabold text-[#1D1D1F] w-full sm:w-auto cursor-pointer border border-gray-300 flex items-center justify-center gap-2"
            >
              <Lock size={15} />
              <span>{t.final_cta_cashier}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= 9. FOOTER LIMPIO ESTILO APPLE ================= */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-[#D2D2D7]/80 text-[#86868B] text-[12px] py-12 px-4 sm:px-6 relative z-10">
        <div className="max-w-[1040px] mx-auto space-y-6">
          
          <div className="text-[11px] leading-relaxed border-b border-[#D2D2D7]/60 pb-6 text-left">
            <p>{t.foot_1}</p>
            <p>{t.foot_2}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1D1D1F]">{platformName}</span>
              <span>•</span>
              <span>{t.foot_rights} © {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <button onClick={onOpenLogin} className="hover:text-[#1D1D1F] underline cursor-pointer">{t.foot_merchant_portal}</button>
              <a href="#experiencia" className="hover:text-[#1D1D1F] underline cursor-pointer">{t.foot_sim}</a>
              <a 
                href={contactWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#1D1D1F] underline cursor-pointer"
              >
                {t.foot_contact}
              </a>
            </div>
          </div>

        </div>
      </footer>

      {/* ================= BOTÓN FLOTANTE EN LA ESQUINA (ES / EN) ================= */}
      <aside aria-label="Language selector" className="fixed bottom-5 right-5 z-50">
        <div className="clay-card bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200/90 shadow-2xl flex items-center gap-1 text-xs font-black">
          <span className="text-gray-400 pl-1.5 pr-0.5 text-[11px]">🌐</span>
          <button
            type="button"
            onClick={() => toggleLang('es')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              lang === 'es' ? 'bg-[#1D4E3E] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Cambiar a Español"
          >
            <span>ES</span>
          </button>
          <button
            type="button"
            onClick={() => toggleLang('en')}
            className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
              lang === 'en' ? 'bg-[#1D4E3E] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Switch to English"
          >
            <span>EN</span>
          </button>
        </div>
      </aside>

    </div>
  );
}
