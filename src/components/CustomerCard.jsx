import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Sparkles, Smartphone, Bell, ChevronRight, Gift, Share2, Info, Volume2, X, Clock, Pause, ShieldCheck, RefreshCw } from 'lucide-react';
import { getBusinessIcon } from '../data/mockData';
import { sounds } from '../utils/audio';
import { generateGoogleWalletPassUrl } from '../services/googleWalletService';
import { downloadAppleWalletPass } from '../services/appleWalletService';
import { syncCustomerToFirestore } from '../services/firestoreSync';
import { getT } from '../utils/translations';

export function CustomerCard({ 
  customer, 
  business, 
  onSimulateVisit, 
  activeNotification, 
  onCloseNotification, 
  latestNotification,
  onResetCustomer
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
    return business?.language === 'en' ? 'en' : 'es';
  });

  const toggleLang = (newLang) => {
    setLang(newLang);
    try { localStorage.setItem('fidelipass_lang', newLang); } catch {}
  };

  const isEn = lang === 'en';
  const t = getT(lang);
  const [showWalletSuccess, setShowWalletSuccess] = useState(false);
  const [walletType, setWalletType] = useState(null);
  const [showWalletInstructions, setShowWalletInstructions] = useState(false);
  const [isGeneratingGoogleWallet, setIsGeneratingGoogleWallet] = useState(false);
  const [isGeneratingAppleWallet, setIsGeneratingAppleWallet] = useState(false);
  const [googleWalletUrl, setGoogleWalletUrl] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [dismissedPromoId, setDismissedPromoId] = useState(null);
  const [notifPermission, setNotifPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const stampsCount = customer.currentStamps;
  const maxStamps = business.maxStamps || 8;
  const isRewardReady = stampsCount >= maxStamps;
  const remaining = Math.max(0, maxStamps - stampsCount);
  const storeIcon = getBusinessIcon(business.iconType);
  const isSimba = business.id === 'store-1792951625504' || business.name?.toLowerCase().includes('simba');
  const isMcRolls = !business.id || business.id === 'mc-rolls' || business.name?.toLowerCase().includes('mc rolls');
  const isPureSoul = business.name?.toLowerCase().includes('pure soul') || business.slug?.includes('pure-soul') || business.id?.includes('pure-soul');
  const isOneStopBarber = business.name?.toLowerCase().includes('barber') || business.slug?.includes('barber') || business.id?.includes('barber') || business.name?.toLowerCase().includes('one stop');
  
  const storeBanner = business.banner || (
    isOneStopBarber
      ? '/onestopbarber-banner.png'
      : (isPureSoul
        ? '/puresoul-banner.png'
        : (isSimba
          ? '/simba-banner.png'
          : (isMcRolls ? '/logos/mcrolls-banner.png' : (business.logo || null))))
  );

  const handleEnableWebPush = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === 'granted') {
          sounds.playPush();
          if (navigator.vibrate) {
            try { navigator.vibrate([200, 100, 200]); } catch {}
          }
          try {
            new Notification(`🔔 ${business.name}`, {
              body: '¡Alertas activadas! Recibirás promociones 2x1 y avisos directamente en tu pantalla.',
              icon: business.logo || undefined
            });
          } catch {}
        }
      } catch (e) {
        console.warn("Notification permission error:", e);
      }
    }
  };

  // Render stamp icons (e.g. Ice cream, coffee, star, etc.)
  const renderStampSlot = (index) => {
    const isStamped = index < stampsCount;
    const isLatest = index === stampsCount - 1;
    const isRewardSlot = index === maxStamps - 1;
    const stampLogoSrc = business.logo || (isOneStopBarber ? '/logos/onestopbarber-logo.png' : (isMcRolls ? '/logos/mcrolls.png' : null));
    const useLogo = (business.stampType !== 'icon' && Boolean(stampLogoSrc)) || isOneStopBarber || isMcRolls;

    return (
      <div
        key={index}
        className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${
          isStamped
            ? 'clay-stamp-active text-[#173E31] ' + (isLatest ? 'animate-stamp' : '')
            : isRewardSlot
              ? 'clay-stamp-slot bg-amber-400/20 border-2 border-dashed border-amber-300/70 text-amber-300 shadow-inner'
              : 'clay-stamp-slot text-white/50 hover:bg-white/10'
        }`}
      >
        {isStamped ? (
          <div className="flex flex-col items-center">
            {useLogo && stampLogoSrc ? (
              <img src={stampLogoSrc} alt={business.name} className="w-8 h-8 object-contain drop-shadow-sm filter contrast-105" />
            ) : (
              <span className="text-2xl drop-shadow-xs">{storeIcon}</span>
            )}
            <span 
              className="text-[9px] font-black uppercase tracking-tighter mt-0.5 truncate max-w-[54px]"
              style={{ color: business.cardBgColor || '#1D4E3E' }}
            >
              {isRewardSlot ? (isEn ? 'FREE!' : '¡GRATIS!') : business.name}
            </span>
          </div>
        ) : isRewardSlot ? (
          <div className="flex flex-col items-center">
            <span className="text-xl drop-shadow-xs animate-bounce">🎁</span>
            <span className="text-[9px] font-black uppercase text-amber-300 tracking-wider mt-0.5">
              {isEn ? 'REWARD' : 'PREMIO'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-bold opacity-70">#{index + 1}</span>
            <div className="w-2 h-2 rounded-full bg-white/20 mt-1 shadow-inner" />
          </div>
        )}
      </div>
    );
  };

  // Auto-sync customer to Firestore whenever displayed so cashier sees them immediately
  useEffect(() => {
    if (customer && customer.id && business && business.id) {
      try {
        syncCustomerToFirestore({
          ...customer,
          businessId: business.id,
          currentStamps: stampsCount || customer.currentStamps || 1
        });
      } catch (e) {
        console.warn("Auto sync customer note:", e);
      }
    }
  }, [customer?.id, customer?.currentStamps, business?.id]);

  const handleAddToWallet = async (type) => {
    // 1. Ensure customer is synced to Firestore with businessId before redirecting
    try {
      if (customer && business) {
        const fullCust = {
          ...customer,
          businessId: business.id,
          currentStamps: stampsCount || customer.currentStamps || 1,
          device: type === 'apple' ? 'Apple Wallet (iPhone)' : 'Google Wallet (Android)',
          deviceType: type
        };
        await syncCustomerToFirestore(fullCust);
      }
    } catch (e) {
      console.warn("Could not sync customer before wallet add:", e);
    }

    if (type === 'apple') {
      try {
        setWalletError(null);
        setIsGeneratingAppleWallet(true);
        try { sounds?.playPush?.(); } catch {}

        // On iOS devices: direct HTTPS request to Cloud Functions endpoint triggers native iOS PassKit sheet
        const isIOS = typeof navigator !== 'undefined' && (
          /iPad|iPhone|iPod/.test(navigator.userAgent) || 
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        );

        if (isIOS) {
          window.location.href = `/api/pass?store=${business.id || 'mc-rolls'}&c=${customer.id || '001'}&phone=${encodeURIComponent(customer.phone || '')}&n=${encodeURIComponent(customer.name || '')}`;
          return;
        }

        await downloadAppleWalletPass({
          business,
          customer: {
            ...customer,
            stamps: stampsCount
          }
        });

        setShowWalletSuccess(true);
        setTimeout(() => setShowWalletSuccess(false), 4000);
      } catch (err) {
        console.error("Error generating Apple Wallet pass:", err);
        setWalletError(err?.message || "No se pudo generar el pase de Apple Wallet.");
      } finally {
        setIsGeneratingAppleWallet(false);
      }
      return;
    }

    if (type === 'google') {
      try {
        setWalletError(null);
        setIsGeneratingGoogleWallet(true);
        try { sounds?.playPush?.(); } catch {}
        const cardUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://fidelipassapp.com'}/?store=${business?.id || 'mc-rolls'}&c=${customer?.id || 'demo'}`;
        const saveUrl = await generateGoogleWalletPassUrl({
          business,
          customer: {
            ...customer,
            stamps: stampsCount
          },
          cardUrl
        });
        setGoogleWalletUrl(saveUrl);
        const win = window.open(saveUrl, '_blank');
        if (!win) {
          window.location.href = saveUrl;
        }
      } catch (err) {
        console.error("Error generating Google Wallet pass:", err);
        setWalletError(err?.message || 'No se pudo conectar con Google Wallet');
      } finally {
        setIsGeneratingGoogleWallet(false);
      }
      return;
    }

    setWalletType(type);
    setShowWalletInstructions(true);
  };

  if (business?.status === 'suspended') {
    return (
      <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-fade-in">
        <div className="w-full clay-card bg-white p-6 sm:p-7 text-center rounded-[32px] border border-amber-200/90 shadow-xl space-y-4 text-left">
          {/* Business logo / header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center p-3 relative shadow-inner mb-3">
              {business.logo ? (
                <img src={business.logo} alt={business.name} className="w-full h-full object-contain grayscale opacity-60" />
              ) : (
                <span className="text-4xl opacity-60">{storeIcon}</span>
              )}
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                <Pause size={14} className="fill-current" />
              </div>
            </div>

            <span className="clay-badge px-3 py-1 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider inline-flex items-center gap-1.5">
              <Clock size={12} />
              <span>Servicio en Pausa Temporal</span>
            </span>

            <h2 className="font-heading font-black text-xl text-gray-900 mt-2">
              {business.name}
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {business.tagline || 'Programa de Fidelidad'}
            </p>
          </div>

          {/* Stamp Protection Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛡️</span>
              <h4 className="text-xs font-black text-gray-900">Tus sellos están 100% seguros</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Hola <span className="font-bold text-gray-900">{customer?.name || 'Cliente'}</span>, tienes{' '}
              <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {stampsCount} de {maxStamps} sellos
              </span>{' '}
              acumulados.
            </p>
            <p className="text-[11px] text-gray-500 leading-normal">
              La tarjeta digital se encuentra pausada temporalmente por el local. Ninguno de tus sellos se perderá. En cuanto el servicio sea reactivado, podrás seguir acumulando sellos para tu premio: <strong className="text-gray-700">{business.rewardTitle}</strong>.
            </p>
          </div>

          <div className="pt-2 text-center text-[11px] font-bold text-gray-400">
            FideliPass • Tarjeta de Fidelidad Digital
          </div>
        </div>
      </div>
    );
  }

  const shouldShowNotification = Boolean(
    activeNotification && (
      !activeNotification.targetCustomerId ||
      activeNotification.targetCustomerId === 'all' ||
      activeNotification.targetCustomerId === customer?.id ||
      activeNotification.targetCustomerPhone === customer?.phone ||
      activeNotification.targetCustomerId === customer?.phone
    )
  );

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      {/* Real-time Push Notification Floating Banner (Claymorphic Bubble) */}
      {shouldShowNotification && (
        <div className="w-full mb-4 p-4 clay-card bg-white/95 backdrop-blur-md flex items-start gap-3.5 text-left animate-bounce relative ring-2 ring-emerald-500/40">
          <div className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md overflow-hidden p-1" style={{ backgroundColor: business.cardBgColor || '#1B474A' }}>
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="w-full h-full object-contain" />
            ) : (
              <Bell size={22} className="text-white animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-tight" style={{ color: business.cardBgColor || '#1B474A' }}>{business.name}</span>
              <span className="text-[10px] font-bold text-gray-400">Ahora • Alerta</span>
            </div>
            <p className="text-xs font-bold text-gray-900 mt-1 leading-snug">{activeNotification.message}</p>
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-700 font-semibold">
              <Volume2 size={13} className="text-emerald-600" />
              <span>Notificación recibida en vivo</span>
            </div>
          </div>
          {onCloseNotification && (
            <button
              onClick={onCloseNotification}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors shadow-2xs"
              title="Cerrar notificación"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* The Loyalty Pass (Claymorphic 3D Loyalty Card for McRolls & Clients) */}
      <div 
        className="w-full clay-card-dark overflow-hidden transition-all duration-300"
        style={{ backgroundColor: business.cardBgColor || '#1B474A' }}
      >
        {/* Pass Header */}
        <div className="p-5 pb-4 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            {business.logo ? (
              <div className="w-13 h-13 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center ring-2 ring-white/30">
                <img
                  src={business.logo}
                  alt={business.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white text-[#173E31] flex items-center justify-center font-bold text-2xl shadow-md">
                {storeIcon}
              </div>
            )}
            <div>
              <h3 className="font-heading font-extrabold text-lg leading-tight tracking-tight drop-shadow-xs">{business.name}</h3>
              <p className="text-xs text-white/80 font-medium">{business.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="clay-badge-dark px-3 py-1 text-[11px] font-black tracking-wider bg-white/20 text-white uppercase backdrop-blur-xs">
              {isEn ? 'VIP CLUB' : 'CLUB VIP'}
            </span>
            <div className="flex items-center bg-black/30 backdrop-blur-md p-0.5 rounded-xl border border-white/20 text-[10px] font-black">
              <button
                type="button"
                onClick={() => toggleLang('es')}
                className={`px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                  lang === 'es' ? 'bg-white text-[#1D4E3E] shadow-xs' : 'text-white/70 hover:text-white'
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => toggleLang('en')}
                className={`px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-white text-[#1D4E3E] shadow-xs' : 'text-white/70 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Store Brand Banner (Horizontal Panoramic Emblem) */}
        {storeBanner && (
          <div 
            className="w-full relative overflow-hidden border-b border-white/10 flex items-center justify-center"
            style={{ backgroundColor: (isSimba || isOneStopBarber) ? '#FFFFFF' : 'transparent' }}
          >
            <img 
              src={storeBanner} 
              alt={business.name} 
              className="w-full h-auto max-h-44 object-cover sm:object-contain object-center drop-shadow-xs" 
            />
          </div>
        )}

        {/* Member Name and Status */}
        <div className="px-5 py-3.5 flex items-center justify-between text-white border-b border-white/10 bg-black/15 backdrop-blur-xs">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-white/60">{isEn ? 'Cardholder' : 'Titular de la Tarjeta'}</div>
            <div className="text-sm font-extrabold drop-shadow-xs">{customer.name}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-white/60">{isEn ? 'Progress' : 'Progreso'}</div>
            <div className="text-sm font-black text-amber-300 drop-shadow-xs">
              {stampsCount} / {maxStamps} {isEn ? 'Stamps' : 'Sellos'}
            </div>
          </div>
        </div>

        {/* Stamp Grid */}
        <div className="p-5">
          <div className={`grid gap-3 ${
            maxStamps <= 4 
              ? 'grid-cols-2' 
              : maxStamps <= 6 
                ? 'grid-cols-3' 
                : (maxStamps === 5 || maxStamps === 10 || maxStamps === 15)
                  ? 'grid-cols-5' 
                  : 'grid-cols-4'
          }`}>
            {Array.from({ length: maxStamps }).map((_, idx) => renderStampSlot(idx))}
          </div>

          {/* Reward Status Banner (Claymorphic Bubble) */}
          <div className="mt-4 p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white text-center shadow-inner">
            {isRewardReady ? (
              <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm animate-pulse">
                <Gift size={20} className="fill-amber-400 text-amber-400" />
                <span>🎉 {isEn ? 'REWARD UNLOCKED!' : '¡PREMIO DESBLOQUEADO!'} {business.rewardTitle}</span>
              </div>
            ) : (
              <p className="text-xs text-white/95 font-medium">
                {isEn ? (
                  <>Only <span className="font-extrabold text-amber-300">{remaining} stamp{remaining > 1 ? 's' : ''} left</span> for your reward:</>
                ) : (
                  <>Te faltan <span className="font-extrabold text-amber-300">{remaining} sellos</span> para tu premio:</>
                )}
                <span className="block font-bold text-white mt-0.5">{business.rewardTitle}</span>
              </p>
            )}
          </div>
        </div>

        {/* QR Code Section for Cashier to Scan (Clay White Pedestal) */}
        <div className="bg-white p-5 pt-4 text-center text-gray-800 rounded-b-[32px] border-t border-slate-100">
          <div className="inline-block p-4 clay-card rounded-3xl">
            <QRCodeSVG
              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://fidelipassapp.com'}/?store=${business.id || 'mc-rolls'}&c=${customer.id}`}
              size={185}
              level="M"
              includeMargin={true}
            />
          </div>
          <div className="mt-2.5 inline-block px-3 py-1 clay-badge bg-slate-50 text-[11px] font-mono font-bold tracking-widest text-gray-600 uppercase">
            ID: {customer.id.toUpperCase()}
          </div>
          <p className="text-xs font-semibold text-gray-500 mt-2">
            {isEn ? 'Show this code at counter to collect your stamps' : 'Muestra este código al cajero para recibir tus sellos'}
          </p>
        </div>
      </div>

      {/* Wallet Addition Success Toast */}
      {showWalletSuccess && (
        <div className="mt-3.5 w-full p-3 clay-btn-primary rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg animate-fade-in">
          <Check size={18} />
          <span>¡Tarjeta lista para guardar en tu pantalla de inicio!</span>
        </div>
      )}

      {/* Google Wallet Direct Link Toast */}
      {googleWalletUrl && (
        <div className="mt-3.5 w-full p-3.5 clay-card bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs flex flex-col items-center justify-center gap-1.5 shadow-md animate-fade-in text-emerald-950">
          <div className="flex items-center gap-2 font-black text-emerald-800">
            <Check size={18} className="text-emerald-600" />
            <span>¡Pase de Google Wallet generado!</span>
          </div>
          <a
            href={googleWalletUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-blue-700 underline font-extrabold hover:text-blue-900 text-center"
          >
            Toca aquí si no se abrió automáticamente tu Google Wallet
          </a>
        </div>
      )}

      {/* Wallet Error Alert */}
      {walletError && (
        <div className="mt-3.5 w-full p-3 clay-card bg-red-50 border border-red-200 rounded-2xl text-xs flex items-center justify-between shadow-sm animate-fade-in text-red-900">
          <div className="flex items-center gap-2">
            <span>⚠️ {walletError}</span>
          </div>
          <button
            onClick={() => setWalletError(null)}
            className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 text-red-800 flex items-center justify-center font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Install as App on Phone Badges (Official Apple & Google Wallet Buttons) */}
      <div className="mt-4 w-full flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={() => handleAddToWallet('apple')}
          disabled={isGeneratingAppleWallet}
          className="w-full sm:flex-1 transition-transform hover:scale-[1.03] active:scale-95 cursor-pointer disabled:opacity-60 flex justify-center"
          title="Añadir a Apple Wallet"
        >
          {isGeneratingAppleWallet ? (
            <div className="h-11 w-full bg-black rounded-xl text-white text-xs font-bold flex items-center justify-center animate-pulse">
              ⏳ Generando pase Apple...
            </div>
          ) : (
            <img 
              src="/logos/add-to-apple-wallet.svg" 
              alt="Add to Apple Wallet" 
              className="h-11 w-auto max-w-full object-contain drop-shadow-md"
            />
          )}
        </button>

        <button
          onClick={() => handleAddToWallet('google')}
          disabled={isGeneratingGoogleWallet}
          className="w-full sm:flex-1 transition-transform hover:scale-[1.03] active:scale-95 cursor-pointer disabled:opacity-60 flex justify-center"
          title="Añadir a Google Wallet"
        >
          {isGeneratingGoogleWallet ? (
            <div className="h-11 w-full bg-[#1F1F1F] rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse">
              ⏳ Conectando Wallet...
            </div>
          ) : (
            <img 
              src="/logos/add-to-google-wallet.svg" 
              alt="Add to Google Wallet" 
              className="h-11 w-auto max-w-full object-contain drop-shadow-md"
            />
          )}
        </button>
      </div>

      {/* Push Notifications Enable Pill (Claymorphic) */}
      {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
        <button
          type="button"
          onClick={handleEnableWebPush}
          className="mt-3.5 px-4 py-2 clay-btn clay-btn-light text-emerald-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer animate-pulse"
        >
          <Bell size={15} className="text-emerald-600" />
          <span>🔔 Activar notificaciones push en este celular</span>
        </button>
      )}

      {/* Latest Promo / Message from Merchant (Auto-expires after 24h & dismissable) */}
      {latestNotification && latestNotification.id !== dismissedPromoId && (!latestNotification.createdAt || (Date.now() - Number(latestNotification.createdAt) < 24 * 60 * 60 * 1000)) && (
        <div className="w-full mt-3.5 p-4 clay-card bg-amber-50/90 text-left relative animate-fade-in shadow-md">
          <button
            type="button"
            onClick={() => setDismissedPromoId(latestNotification.id)}
            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-black cursor-pointer shadow-2xs"
            title="Ocultar aviso"
          >
            ✕
          </button>
          <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold pr-7">
            <Sparkles size={15} className="text-amber-500 fill-amber-400 shrink-0" />
            <span>Aviso del local:</span>
            <span className="text-[10px] text-amber-800/70 font-semibold ml-auto">{latestNotification.sentAt || 'Hoy'}</span>
          </div>
          <p className="text-xs font-bold text-gray-900 mt-1.5 leading-snug pr-4">{latestNotification.message}</p>
        </div>
      )}

      <p className="text-[11px] text-gray-500 font-medium text-center mt-3 flex items-center justify-center gap-1.5">
        <Smartphone size={14} className="text-gray-400" />
        <span>{t.saveAsAppHint}</span>
      </p>

      {/* Switch / Register New Card pill */}
      <div className="mt-4 pt-3.5 border-t border-slate-200/60 w-full flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
          <span>{t.cardholder} <strong className="text-gray-900 font-bold">{customer?.name || (isEn ? 'Member' : 'Cliente')}</strong></span>
          <span>•</span>
          <span>{stampsCount} / {maxStamps} {isEn ? 'stamps' : 'sellos'}</span>
        </div>
        {onResetCustomer && (
          <button
            type="button"
            onClick={onResetCustomer}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-700 hover:text-gray-900 text-xs font-bold transition-all cursor-pointer shadow-2xs border border-slate-200"
          >
            <RefreshCw size={12} className="text-[#FF5E36]" />
            <span>{t.switchCustomer}</span>
          </button>
        )}
      </div>

      {/* Instructions Modal to Add to Home Screen (Claymorphic Modal) */}
      {showWalletInstructions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm clay-card bg-white p-6 shadow-2xl text-left animate-fade-in">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {walletType === 'apple' ? '' : '🤖'}
                </div>
                <div>
                  <h4 className="font-heading font-black text-sm text-gray-900">
                    Instalar en {walletType === 'apple' ? 'tu iPhone' : 'tu Android'}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium">{business.name} • Como App en tu inicio</p>
                </div>
              </div>
              <button
                onClick={() => setShowWalletInstructions(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 hover:text-gray-900 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors shadow-2xs"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full clay-btn-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-xs text-gray-700 font-medium leading-snug">
                  Toca el botón <strong>Compartir</strong> en la barra inferior de tu navegador: 
                  <span className="ml-1 inline-block px-2 py-0.5 bg-slate-100 rounded-lg text-gray-800 font-black border border-slate-200">
                    {walletType === 'apple' ? '⎋ [↑]' : '⋮ (Tres puntos)'}
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full clay-btn-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-xs text-gray-700 font-medium leading-snug">
                  Selecciona la opción <strong>"Agregar a Inicio"</strong> o <strong>"Instalar App"</strong> (ícono <strong>➕</strong>).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full clay-btn-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-xs text-gray-700 font-medium leading-snug">
                  Toca <strong>"Agregar"</strong> arriba a la derecha. ¡Tu tarjeta quedará guardada como una app sin ocupar espacio de memoria!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWalletInstructions(false)}
              className="w-full py-3 clay-btn clay-btn-primary text-white font-extrabold text-xs shadow-md cursor-pointer"
            >
              ¡Entendido, gracias!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
