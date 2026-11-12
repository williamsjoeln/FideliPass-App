import React, { useState } from 'react';
import { Sparkles, ArrowRight, Smartphone, ShieldCheck, Heart } from 'lucide-react';
import { getBusinessIcon } from '../data/mockData';
import { getT } from '../utils/translations';

export function CustomerRegistration({ business, onRegisterSuccess }) {
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
    return business?.language === 'en' ? 'en' : 'es';
  });

  const toggleLang = (newLang) => {
    setLang(newLang);
    try { localStorage.setItem('fidelipass_lang', newLang); } catch {}
  };

  const isEn = lang === 'en';
  const t = getT(lang);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [countryCode, setCountryCode] = useState(() => isEn ? '+1' : '+593');
  const storeIcon = getBusinessIcon(business.iconType);

  const isMcRolls = !business.id || business.id === 'mc-rolls' || business.name?.toLowerCase().includes('mc rolls');
  const isOneStopBarber = business.name?.toLowerCase().includes('barber') || business.slug?.includes('barber') || business.id?.includes('barber') || business.name?.toLowerCase().includes('one stop');
  const isPureSoul = business.name?.toLowerCase().includes('pure soul') || business.slug?.includes('pure-soul') || business.id?.includes('pure-soul');
  const isSimba = business.id === 'store-1792951625504' || business.name?.toLowerCase().includes('simba');

  const storeBanner = business.banner || (
    isOneStopBarber
      ? '/onestopbarber-banner.png'
      : (isPureSoul
        ? '/puresoul-banner.png'
        : (isSimba
          ? '/simba-banner.png'
          : (isMcRolls ? '/logos/mcrolls-banner.png' : (business.logo || null))))
  );

  const effectiveLogo = business.logo || (isOneStopBarber ? '/logos/onestopbarber-logo.png' : (isMcRolls ? '/logos/mcrolls.png' : null));

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.replace(/<[^>]*>?/gm, '').trim().slice(0, 60);
    if (!cleanName) return;

    const cleanEmail = email.replace(/<[^>]*>?/gm, '').trim().slice(0, 80);
    const cleanPhone = phone.replace(/[^\d\s\-+()]/g, '').trim().slice(0, 25);

    const newCustomer = {
      id: "cust-" + Math.floor(1000 + Math.random() * 9000),
      businessId: business?.id || 'mc-rolls',
      name: cleanName,
      email: cleanEmail || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@fidelipass.com`,
      phone: cleanPhone ? `${countryCode} ${cleanPhone}` : `${countryCode} 99 000 0000`,
      birthday: birthday || null,
      status: "Recién activado",
      device: "Celular (App Digital)",
      deviceType: "mobile",
      currentStamps: 1, // Bonus 1st stamp on registration!
      totalSpent: 0.00,
      rewardsClaimed: 0,
      joinedDate: "Hoy",
      lastVisit: "Ahora mismo",
      history: [
        { id: "h0", type: "stamp", date: "Ahora", note: "🎉 Sello de bienvenida de regalo" }
      ]
    };

    onRegisterSuccess(newCustomer);
  };

  if (business?.status === 'suspended') {
    return (
      <div className="w-full max-w-sm mx-auto clay-card bg-white p-7 text-center rounded-[28px] border border-amber-200 shadow-xl space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl border border-amber-200">
          ⏸️
        </div>
        <h3 className="font-heading font-black text-lg text-slate-800">Servicio en Pausa</h3>
        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
          El registro de nuevas tarjetas para <strong className="text-slate-800">{business.name}</strong> se encuentra temporalmente en pausa. Vuelve a consultar pronto.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto clay-card bg-white overflow-hidden text-left rounded-[28px]">
      {/* Horizontal Brand Banner */}
      {storeBanner && (
        <div 
          className="w-full relative overflow-hidden border-b border-gray-100 flex items-center justify-center p-2 rounded-t-[28px] bg-white"
        >
          <img 
            src={storeBanner} 
            alt={business.name} 
            className="w-full h-auto max-h-40 object-contain object-center drop-shadow-sm" 
          />
        </div>
      )}

      {/* Top Banner - Claymorphic Header */}
      <div 
        className={`p-6 text-center relative overflow-hidden border-b border-white/20 text-white ${!storeBanner ? 'rounded-t-[28px]' : ''}`}
        style={{
          background: business.cardBgColor 
            ? `linear-gradient(145deg, ${business.cardBgColor}, ${business.accentColor || '#1D4E3E'})`
            : 'linear-gradient(145deg, #1D4E3E, #2A6E58)'
        }}
      >
        {/* Language Switcher ES / EN */}
        <div className="absolute top-4 right-4 z-20 flex items-center bg-black/30 backdrop-blur-md p-0.5 rounded-xl border border-white/20 text-[10px] font-black">
          <button
            type="button"
            onClick={() => toggleLang('es')}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              lang === 'es' ? 'bg-white text-[#007AFF] shadow-xs' : 'text-white/70 hover:text-white'
            }`}
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => toggleLang('en')}
            className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
              lang === 'en' ? 'bg-white text-[#007AFF] shadow-xs' : 'text-white/70 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
        
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center ring-4 ring-white/25">
          {effectiveLogo ? (
            <img src={effectiveLogo} alt={business.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-3xl text-[#1D4E3E]">{storeIcon}</span>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 clay-badge-dark text-xs font-black tracking-wide mb-2 text-white/95 uppercase backdrop-blur-xs">
          <Sparkles size={13} className="text-amber-300 fill-amber-300" />
          <span>{isEn ? 'Official VIP Club' : 'Club de Fidelidad Oficial'}</span>
        </div>
        
        <h2 className="font-heading text-2xl font-black tracking-tight text-white drop-shadow-xs">{business.name}</h2>
        <p className="text-xs text-white/80 font-medium mt-0.5">{business.tagline}</p>
        
        <div className="mt-3.5 p-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 text-xs text-white font-bold flex items-center justify-center gap-2 shadow-inner">
          <span className="text-base">🎁</span>
          <span>{isEn ? 'Join today & receive your ' : '¡Regístrate hoy y recibe tu '} <span className="text-amber-300 font-black underline">{isEn ? '1st Free Stamp Gift' : '1er sello de regalo'}</span>!</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 bg-white">
        <div className="text-center mb-5">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full clay-btn-primary text-white text-xs font-black mb-1.5 shadow-sm">
            ✦
          </span>
          <h3 className="font-heading text-lg font-black text-gray-900">{isEn ? 'Get your pass in 1 step' : 'Crea tu tarjeta en 1 paso'}</h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {isEn ? 'Save your digital loyalty card directly to your phone — no download needed.' : 'Guarda tu tarjeta digital directo en tu celular sin descargar nada.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1.5">{t.fullName} *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.fullNamePlaceholder}
              className="w-full px-4 py-3 text-sm clay-input text-gray-900 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1.5">{t.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="w-full px-4 py-3 text-sm clay-input text-gray-900 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-gray-700 mb-1.5">{t.mobilePhone} *</label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="px-2.5 py-3 text-xs clay-input text-gray-700 font-bold"
              >
                {isEn ? (
                  <>
                    <option value="+1">🇺🇸 +1 (USA)</option>
                    <option value="+593">🇪🇨 +593</option>
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+57">🇨🇴 +57</option>
                  </>
                ) : (
                  <>
                    <option value="+593">🇪🇨 +593</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+51">🇵🇪 +51</option>
                    <option value="+52">🇲🇽 +52</option>
                  </>
                )}
              </select>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={isEn ? "(555) 123-4567" : "099 123 4567"}
                className="flex-1 px-4 py-3 text-sm clay-input text-gray-900 font-semibold"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold text-gray-700">{t.birthday} 🎂</label>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {isEn ? '1 Stamp Gift!' : '¡1 Sello de Regalo!'}
              </span>
            </div>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-4 py-2.5 text-sm clay-input bg-white text-gray-900 font-semibold"
            />
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              {t.birthdayHint}
            </p>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 px-4 clay-btn clay-btn-primary text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>{t.getCardBtn}</span>
            <ArrowRight size={17} className="group-hover:translate-x-1.5 transition-transform" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span>{t.privacyNotice}</span>
        </div>

        {/* Demo preview button for owner demonstrations */}
        <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200 text-center">
          <button
            type="button"
            onClick={() => {
              if (onRegisterSuccess) {
                onRegisterSuccess({
                  id: `demo-${business?.id || 'demo'}`,
                  businessId: business?.id || 'demo',
                  name: `${business?.name || 'Client'} VIP`,
                  email: `demo@${business?.id || 'fidelipass'}.com`,
                  phone: isEn ? '+1 (555) 240-7645' : '+593 99 240 7645',
                  status: 'Activo',
                  device: 'Apple Wallet (iPhone)',
                  deviceType: 'apple',
                  currentStamps: 2,
                  totalSpent: 9.50,
                  rewardsClaimed: 0,
                  joinedDate: isEn ? 'Today' : 'Hoy',
                  lastVisit: isEn ? 'Just now' : 'Recién',
                  history: [
                    { id: 'h2', type: 'stamp', date: isEn ? 'Today' : 'Hoy', note: isEn ? '✨ Stamp #2' : '✨ Sello #2 de ejemplo' },
                    { id: 'h1', type: 'stamp', date: isEn ? 'Today' : 'Hoy', note: isEn ? '🎉 Welcome stamp gift' : '🎉 Sello de bienvenida' }
                  ]
                });
              }
            }}
            className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 inline-flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span>{isEn ? '👁️ View interactive demo card with stamps' : '👁️ Ver tarjeta de demostración con sellos'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
