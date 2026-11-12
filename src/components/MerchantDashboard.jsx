import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Home, Users, QrCode, Bell, MoreHorizontal, ArrowLeft, 
  Search, Plus, Check, Undo2, DollarSign, Sparkles, Send, 
  ChevronRight, Award, Clock, Smartphone, Phone, Mail, 
  Printer, TrendingUp, AlertTriangle, ShieldCheck, Edit3, X,
  Camera, Upload, Trash2, Image as ImageIcon, Palette, Lock, LogOut, Share2, MapPin, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';
import { getBusinessIcon } from '../data/mockData';
import { processImageFile, generateSeamlessHorizontalBanner } from '../utils/imageHelper';
import { CARD_COLOR_PRESETS } from './SuperAdminDashboard';

export function MerchantDashboard({ 
  currentUser,
  business, 
  customers, 
  onAddStamp, 
  onUndoStamp, 
  onClaimReward, 
  onOpenScanner,
  onSendPushNotification,
  onClearNotifications,
  notifications,
  onOpenCounterSign,
  onUpdateBusiness,
  onChangePassword,
  selectedCustomerId,
  onSelectCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  platformName = "FideliPass",
  platformLogo = '/logos/fidelipass-logo.png',
  onLogout,
  appLang,
  setAppLang
}) {
  const [activeTab, setActiveTab] = useState('hoy'); // 'hoy' | 'clientes' | 'push' | 'mas'
  
  const [localLang, setLocalLang] = useState(() => {
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
    return appLang || (business?.language === 'en' ? 'en' : 'es');
  });

  // Keep in sync with appLang and localStorage
  useEffect(() => {
    if (appLang && (appLang === 'en' || appLang === 'es') && appLang !== localLang) {
      setLocalLang(appLang);
    }
  }, [appLang]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fidelipass_lang');
      if (saved && (saved === 'en' || saved === 'es')) {
        setLocalLang(saved);
        if (setAppLang) setAppLang(saved);
      }
    } catch {}
  }, []);

  const isNative = typeof window !== 'undefined' && Boolean(
    window.Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    (window.location.hostname === 'localhost' && window.Capacitor) ||
    new URLSearchParams(window.location.search).get('app') === 'true'
  );

  const lang = appLang || localLang;

  const toggleLang = (newLang) => {
    if (setAppLang) setAppLang(newLang);
    setLocalLang(newLang);
    try { localStorage.setItem('fidelipass_lang', newLang); } catch {}
  };

  const isEn = lang === 'en';
  
  const isSuperAdmin = currentUser?.role === 'admin' || currentUser?.email === 'admin@fidelipass.com';

  const storeIcon = getBusinessIcon(business.iconType);

  // Edit customer state
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustEmail, setEditCustEmail] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Manage customer selection cleanly so cashier sees 'Hoy' dashboard on login, and opens card on scan or click
  const [internalSelectedId, setInternalSelectedId] = useState(null);

  useEffect(() => {
    if (selectedCustomerId) {
      setInternalSelectedId(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const selectedCustomer = internalSelectedId 
    ? (customers.find(c => c.id.toLowerCase() === String(internalSelectedId).toLowerCase()) || null) 
    : null;

  const handleSelectCustomer = (id) => {
    setInternalSelectedId(id);
    if (onSelectCustomer) {
      onSelectCustomer(id);
    }
  };

  const [customerFilter, setCustomerFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Push Notification state
  const [pushMessage, setPushMessage] = useState(`🎉 ¡Hoy promoción especial en ${business.name}! Acércate por tu sello.`);
  const [pushTarget, setPushTarget] = useState('all');
  const [selectedIndividualCustomerId, setSelectedIndividualCustomerId] = useState(customers[0]?.id || '');
  const [pushSentSuccess, setPushSentSuccess] = useState(false);

  // Daily Metrics (Reset every day at 00:00 automatically)
  const todayDateKey = new Date().toISOString().slice(0, 10);
  const { todayRevenue, todayStampsCount } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let stampsCount = 0;
    let revenueSum = 0;

    customers.forEach(cust => {
      (cust.history || []).forEach(item => {
        const itemTime = item.createdAt || (item.id && item.id.startsWith('h-') ? Number(item.id.replace('h-', '')) : null);
        if (itemTime && itemTime >= startOfToday) {
          if (item.type === 'stamp') {
            stampsCount++;
            revenueSum += Number(item.amount) || 4.50;
          } else if (item.type === 'spend') {
            revenueSum += Number(item.amount) || 0;
          }
        }
      });
    });

    return {
      todayRevenue: revenueSum,
      todayStampsCount: stampsCount
    };
  }, [customers, todayDateKey]);

  // Spend modal
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');

  // Add customer modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Business config state
  const [editBusinessName, setEditBusinessName] = useState(business.name);
  const [editTagline, setEditTagline] = useState(business.tagline);
  const [editMaxStamps, setEditMaxStamps] = useState(business.maxStamps);
  const [editRewardTitle, setEditRewardTitle] = useState(business.rewardTitle);
  const [editLogo, setEditLogo] = useState(business.logo || '');
  const [editBanner, setEditBanner] = useState(business.banner || '');
  const [editCardBgColor, setEditCardBgColor] = useState(business.cardBgColor || '#1B474A');
  const [editStampType, setEditStampType] = useState(business.stampType || 'logo');
  const [editIconType, setEditIconType] = useState(business.iconType || 'icecream');
  const [editEnableGeofence, setEditEnableGeofence] = useState(business.enableGeofence !== false);
  const [editLatitude, setEditLatitude] = useState(business.latitude !== undefined ? business.latitude : -2.1911889);
  const [editLongitude, setEditLongitude] = useState(business.longitude !== undefined ? business.longitude : -79.9449926);
  const [editProximityMessage, setEditProximityMessage] = useState(business.proximityMessage || `🍦 ¡Estás cerca de ${business.name}! Pasa por tu helado favorito y suma sellos hoy.`);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationSuccessNotice, setLocationSuccessNotice] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState('');
  const merchantFileInputRef = useRef(null);
  const merchantBannerFileInputRef = useRef(null);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    setEditLogo(business.logo || '');
    setEditBanner(business.banner || '');
    setEditBusinessName(business.name);
    setEditTagline(business.tagline);
    setEditMaxStamps(business.maxStamps);
    setEditRewardTitle(business.rewardTitle);
    setEditCardBgColor(business.cardBgColor || '#1B474A');
    setEditStampType(business.stampType || 'logo');
    setEditIconType(business.iconType || 'icecream');
    setEditEnableGeofence(business.enableGeofence !== false);
    setEditLatitude(business.latitude !== undefined ? business.latitude : -2.1911889);
    setEditLongitude(business.longitude !== undefined ? business.longitude : -79.9449926);
    setEditProximityMessage(business.proximityMessage || `🍦 ¡Estás cerca de ${business.name}! Pasa por tu helado favorito y suma sellos hoy.`);
  }, [business]);

  const handleMerchantLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoUploading(true);
      setLogoUploadError('');
      const dataUrl = await processImageFile(file, 400, 400);
      setEditLogo(dataUrl);

      // Automatically generate full-width seamless horizontal banner
      try {
        const { bannerDataUrl } = await generateSeamlessHorizontalBanner(dataUrl, editCardBgColor);
        if (bannerDataUrl) {
          setEditBanner(bannerDataUrl);
        }
      } catch (genErr) {
        console.warn("Could not auto-generate banner from merchant logo:", genErr);
      }
    } catch (err) {
      setLogoUploadError(err.message || 'Error al procesar la imagen');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleMerchantBannerFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBannerUploading(true);
      setBannerUploadError('');
      // Formato panorámico para strip en Apple Wallet (1125x432) y heroImage en Google Wallet
      const dataUrl = await processImageFile(file, 1125, 432);
      setEditBanner(dataUrl);
    } catch (err) {
      setBannerUploadError(err.message || 'Error al procesar el banner');
    } finally {
      setBannerUploading(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.phone.includes(searchQuery);
    if (!matchesSearch) return false;
    if (customerFilter === 'Todos') return true;
    return c.status === customerFilter;
  });

  const handleGiveStamp = (cust) => {
    sounds.playStamp();
    onAddStamp(cust.id);
    
    // Check if reward unlocked
    if (cust.currentStamps + 1 >= business.maxStamps) {
      sounds.playReward();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleUndo = (cust) => {
    sounds.playUndo();
    onUndoStamp(cust.id);
  };

  const handleSendPush = (e) => {
    e.preventDefault();
    if (!pushMessage.trim()) return;

    sounds.playPush();
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = `Hoy, ${timeFormatted}`;

    let targetDescription = `Todos los clientes (${customers.length})`;
    let targetCustomerId = null;
    let targetCustomerPhone = null;
    let recipientsCount = customers.length || 1;

    if (pushTarget === 'individual') {
      const targetCust = customers.find(c => c.id === selectedIndividualCustomerId) || customers[0];
      targetDescription = `Solo a ${targetCust?.name || 'Cliente'} (${targetCust?.phone || ''})`;
      targetCustomerId = targetCust?.id;
      targetCustomerPhone = targetCust?.phone;
      recipientsCount = 1;
    } else if (pushTarget === 'inactive') {
      targetDescription = 'Clientes inactivos (+10 días)';
    } else if (pushTarget === 'almost_reward') {
      targetDescription = 'Clientes cerca de premio';
    }

    onSendPushNotification({
      id: "notif-" + Date.now(),
      message: pushMessage.trim(),
      target: targetDescription,
      targetCustomerId,
      targetCustomerPhone,
      sentAt: dateFormatted,
      time: dateFormatted,
      recipientsCount,
      reach: recipientsCount,
      openedCount: 0,
      createdAt: Date.now()
    });

    setPushSentSuccess(true);
    setTimeout(() => setPushSentSuccess(false), 5000);
  };

  const handleCaptureCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización GPS.");
      return;
    }
    setIsCapturingLocation(true);
    setLocationSuccessNotice('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsCapturingLocation(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(7));
        const lng = parseFloat(pos.coords.longitude.toFixed(7));
        setEditLatitude(lat);
        setEditLongitude(lng);
        setLocationSuccessNotice(`📍 ¡Ubicación capturada con éxito! (${lat}, ${lng})`);
        setTimeout(() => setLocationSuccessNotice(''), 5000);
      },
      (err) => {
        setIsCapturingLocation(false);
        alert("No se pudo obtener la ubicación GPS: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    const stampsNum = Math.max(2, Math.min(30, Number(editMaxStamps) || 12));
    onUpdateBusiness({
      ...business,
      name: editBusinessName.trim() || business.name,
      tagline: editTagline.trim() || business.tagline,
      maxStamps: stampsNum,
      rewardTitle: editRewardTitle.trim() || business.rewardTitle,
      logo: isSuperAdmin ? (editLogo || null) : (business.logo || null),
      banner: isSuperAdmin ? (editBanner || null) : (business.banner || null),
      cardBgColor: isSuperAdmin ? (editCardBgColor || '#1B474A') : (business.cardBgColor || '#1B474A'),
      accentColor: isSuperAdmin ? (editCardBgColor || '#1B474A') : (business.cardBgColor || '#1B474A'),
      stampType: editStampType,
      iconType: editIconType,
      enableGeofence: editEnableGeofence,
      latitude: Number(editLatitude),
      longitude: Number(editLongitude),
      proximityMessage: editProximityMessage.trim()
    });
    sounds.playStamp();
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    const expectedCurrent = String(currentUser?.password || business?.ownerPassword || '123').trim();
    if (currentPassword.trim() !== expectedCurrent) {
      setPasswordError('❌ La contraseña actual no es correcta.');
      sounds.playUndo();
      return;
    }

    if (newPassword.trim().length < 4) {
      setPasswordError('❌ La nueva contraseña debe tener al menos 4 caracteres.');
      sounds.playUndo();
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordError('❌ Las nuevas contraseñas no coinciden.');
      sounds.playUndo();
      return;
    }

    if (onChangePassword) {
      onChangePassword(newPassword.trim());
    }

    sounds.playStamp();
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (isEn) {
      if (h >= 5 && h < 12) return 'Good morning';
      if (h >= 12 && h < 19) return 'Good afternoon';
      return 'Good evening';
    }
    if (h >= 5 && h < 12) return 'Buenos días';
    if (h >= 12 && h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  if (business?.status === 'suspended') {
    const handleContactAdmin = () => {
      const msg = encodeURIComponent(
        `👋 Hola Administrador de FideliPass,\n\nSoy el dueño de *${business.name}* (${business.ownerEmail}).\n` +
        `Deseo consultar sobre el estado de mi suscripción para reactivar la terminal de caja y las tarjetas de mis clientes.\n\n` +
        `¡Quedo atento a los datos de pago!`
      );
      window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    };

    return (
      <div className="w-full max-w-md lg:max-w-xl mx-auto clay-card bg-white min-h-[520px] flex flex-col overflow-hidden text-left shadow-2xl border border-amber-200 animate-fade-in">
        {/* Header */}
        <header className="px-5 py-4 bg-amber-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">
              ⏸️
            </div>
            <div>
              <h2 className="font-heading font-black text-sm lg:text-base leading-tight">Acceso a Caja Pausado</h2>
              <p className="text-[10px] lg:text-xs text-amber-100 font-bold">{business.name}</p>
            </div>
          </div>
          <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
            Suspendido
          </span>
        </header>

        {/* Content */}
        <div className="p-6 lg:p-8 flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
            <Lock size={36} />
          </div>

          <div className="max-w-md">
            <h3 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
              Terminal Temporalmente Inhabilitada
            </h3>
            <p className="text-xs lg:text-sm text-gray-600 mt-2 font-medium leading-relaxed">
              La suscripción mensual de este local (<strong className="text-gray-900">{business.name}</strong>) no se encuentra al día. Las funciones de escanear y entregar sellos están en pausa preventiva.
            </p>
          </div>

          {/* Data Protection Guarantee */}
          <div className="w-full max-w-md p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-gray-900">
              <span>🛡️</span>
              <span>Tus clientes y sellos están 100% seguros</span>
            </div>
            <p className="text-[11px] lg:text-xs text-gray-600 leading-normal">
              Ningún cliente ni sello ha sido eliminado. Toda tu información se mantiene respaldada en la nube y se restaurará al instante una vez confirmado tu pago mensual.
            </p>
          </div>

          {/* Action buttons */}
          <div className="w-full max-w-md pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleContactAdmin}
              className="flex-1 clay-btn bg-[#007AFF] hover:bg-[#0062E0] text-white py-3 px-4 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>📲 Contactar para Reactivar</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="clay-btn clay-btn-light py-3 px-4 text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <LogOut size={14} />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${isNative ? 'fixed inset-0 h-[100dvh] max-h-[100dvh]' : 'min-h-screen sm:min-h-[750px]'} sm:max-w-md lg:max-w-4xl xl:max-w-5xl mx-auto bg-slate-50 sm:clay-card sm:rounded-[32px] flex flex-col overflow-hidden text-left z-30`}>
      {/* Top App Header with safe area for iPhone Dynamic Island / Android status bar */}
      <header className="px-4 py-3 sm:px-6 lg:px-8 lg:py-4 pt-[max(env(safe-area-inset-top),0.85rem)] bg-white border-b border-slate-100 flex items-center justify-between shrink-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-2xl bg-white text-gray-900 flex items-center justify-center font-black text-sm lg:text-base shadow-xs border border-gray-100 overflow-hidden p-1">
            {platformLogo ? (
              <img src={platformLogo} alt={platformName} className="w-full h-full object-contain rounded-xl" />
            ) : (
              <span>🌱</span>
            )}
          </div>
          <div>
            <h1 className="font-heading font-black text-base lg:text-xl text-[#007AFF] leading-tight">{platformName}</h1>
            <p className="text-[10px] lg:text-xs text-gray-500 font-bold">{isEn ? 'cashier terminal' : 'terminal de caja'} • {business.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher ES / EN */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[10px] font-black">
            <button
              type="button"
              onClick={() => toggleLang('es')}
              className={`px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                lang === 'es' ? 'bg-[#007AFF] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => toggleLang('en')}
              className={`px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                lang === 'en' ? 'bg-[#007AFF] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              EN
            </button>
          </div>

          {/* Logout Button directly in Header */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="clay-btn bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-95"
              title={isEn ? "Log Out" : "Cerrar Sesión"}
            >
              <LogOut size={13} />
              <span>{isEn ? "Salir" : "Salir"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Tab Content - Scrolls strictly behind header and nav */}
      <div className="flex-1 p-4 sm:p-5 pb-32 lg:p-8 lg:pb-36 overflow-y-auto overscroll-contain">
        {/* ================= TAB 1: HOY (DASHBOARD) ================= */}
        {activeTab === 'hoy' && !selectedCustomer && (
          <div className="space-y-4 lg:space-y-6 animate-fade-in">
            {/* Greeting */}
            <div>
              <h2 className="font-heading text-xl lg:text-3xl font-black text-slate-900">{greeting}, {business.name}.</h2>
              <p className="text-xs lg:text-sm text-slate-500 font-semibold mt-0.5">
                {isEn ? 'Touch control panel for your store.' : 'Panel de control táctil de tu local.'}
              </p>
            </div>

            {/* Custom Brand Banner (Claymorphic) */}
            <div className="p-4 lg:p-6 clay-card bg-white flex items-start gap-3.5 lg:gap-4.5">
              <div 
                onClick={() => setActiveTab('mas')}
                className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-slate-50 border border-slate-200 text-[#007AFF] flex items-center justify-center shrink-0 overflow-hidden cursor-pointer p-1 relative group shadow-sm"
                title={isEn ? "Configure store logo" : "Configurar logo del negocio"}
              >
                {business.logo ? (
                  <img src={business.logo} alt={business.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl lg:text-3xl">{storeIcon}</span>
                )}
                <div className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                  <Camera size={16} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs lg:text-base font-black text-gray-900">
                  {isEn ? `${business.name} Pass Active` : `Tarjeta de ${business.name} activa`}
                </h3>
                <p className="text-[11px] lg:text-sm text-gray-500 font-medium mt-0.5 leading-snug">
                  {isEn ? 'Rule: Every ' : 'Regla: Cada '}
                  <span className="font-extrabold text-[#007AFF]">
                    {business.maxStamps} {isEn ? 'stamps' : 'sellos'}
                  </span>
                  {isEn ? ' unlocks ' : ' se premia con '}
                  <span className="font-extrabold text-[#007AFF]">{business.rewardTitle}</span>.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setActiveTab('mas')}
                    className="clay-btn clay-btn-primary px-3 py-1.5 lg:px-4 lg:py-2 text-white text-[11px] lg:text-xs font-black cursor-pointer shadow-xs"
                  >
                    {isEn ? 'Customize Pass' : 'Ajustar tarjeta'}
                  </button>
                  <button
                    onClick={onOpenCounterSign}
                    className="clay-btn clay-btn-light px-3 py-1.5 lg:px-4 lg:py-2 text-gray-700 text-[11px] lg:text-xs font-black cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Printer size={13} />
                    <span>{isEn ? 'Print Poster' : 'Imprimir cartel'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fidelipassapp.com';
                      const cleanSlug = business?.slug || (business?.name ? business.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : null) || business?.id;
                      const link = `${origin}/${cleanSlug}`;
                      navigator.clipboard.writeText(link);
                      alert(
                        isEn
                          ? `✅ Link copied to clipboard!\n\n${link}\n\nPaste it in your TikTok, Instagram bio, website or WhatsApp to let guests register and download their pass.`
                          : `✅ ¡Enlace copiado al portapapeles!\n\n${link}\n\nPégalo en tu bio de TikTok, Instagram, tu web o pásalo por WhatsApp para que tus clientes se registren y descarguen su tarjeta.`
                      );
                    }}
                    className="clay-btn clay-btn-light px-3 py-1.5 lg:px-4 lg:py-2 text-sky-800 text-[11px] lg:text-xs font-black cursor-pointer flex items-center gap-1 shadow-xs hover:bg-sky-50 border border-sky-200"
                    title={isEn ? "Copy registration link" : "Copiar enlace para bio de TikTok, Instagram o WhatsApp"}
                  >
                    <Share2 size={13} className="text-[#007AFF]" />
                    <span>{isEn ? '🔗 Registration Link' : '🔗 Enlace de Registro'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Row (Claymorphic 3D Cards) */}
            <div className="grid grid-cols-2 gap-3.5 lg:gap-6">
              <div className="p-4 lg:p-6 clay-card bg-white">
                <div className="text-[11px] lg:text-xs uppercase font-black text-gray-400 tracking-wider">
                  {isEn ? "Today's Revenue" : "Ingresos hoy"}
                </div>
                <div className="text-2xl lg:text-4xl font-black font-heading text-gray-900 mt-1 lg:mt-2">
                  ${todayRevenue.toFixed(2)}
                </div>
                <div className="text-[10px] lg:text-xs text-[#007AFF] font-extrabold mt-1 flex items-center gap-1">
                  <TrendingUp size={13} /> {isEn ? "Today's sales" : "Ventas de hoy"}
                </div>
              </div>

              <div className="p-4 lg:p-6 clay-card bg-white">
                <div className="text-[11px] lg:text-xs uppercase font-black text-gray-400 tracking-wider">
                  {isEn ? "Stamps Today" : "Sellos hoy"}
                </div>
                <div className="text-2xl lg:text-4xl font-black font-heading text-[#007AFF] mt-1 lg:mt-2">
                  {todayStampsCount}
                </div>
                <div className="text-[10px] lg:text-xs text-gray-500 font-bold mt-1">
                  {isEn
                    ? `Awarded today • ${customers.length} ${customers.length === 1 ? 'member' : 'members'}`
                    : `Otorgados hoy • ${customers.length} ${customers.length === 1 ? 'cliente' : 'clientes'}`}
                </div>
              </div>
            </div>

            {/* "LO QUE ESTÁ PASANDO AHORA" - Natural full page flow */}
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] uppercase font-black text-gray-400 tracking-wider">
                  {isEn ? "What's happening now" : "Lo que está pasando ahora"}
                </span>
                {customers.length > 0 && (
                  <span className="text-[10px] text-gray-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                    {isEn ? `${customers.length} events` : `${customers.length} novedades`}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {customers.length > 0 ? (
                  customers.map((c) => {
                    const initials = (c.name || (isEn ? 'Member' : 'Cliente'))
                      .split(' ')
                      .map(p => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    const isReward = c.currentStamps >= business.maxStamps;

                    return (
                      <div key={c.id} className="p-4 clay-card bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shadow-xs ${
                              isReward ? 'bg-amber-100 text-amber-900' : 'bg-[#F0F7FF] text-[#007AFF]'
                            }`}>
                              {initials}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-gray-900">
                                {isReward 
                                  ? (isEn ? `🎉 Reward ready: ${c.name}` : `🎉 Premio listo: ${c.name}`) 
                                  : (isEn ? `Stamp given to ${c.name}` : `Sello entregado a ${c.name}`)}
                              </h4>
                              <p className="text-[10px] text-gray-400 font-medium">
                                {c.lastVisit || (isEn ? 'Today' : 'Hoy')} • {isEn ? `Stamp #${c.currentStamps} of ${business.maxStamps}` : `Sello #${c.currentStamps} de ${business.maxStamps}`}
                              </p>
                            </div>
                          </div>
                          <span className={`clay-badge px-2.5 py-0.5 text-[10px] font-black ${
                            isReward ? 'bg-amber-100 text-amber-900' : 'bg-sky-50 text-sky-800'
                          }`}>
                            {isReward ? (isEn ? 'Reward ready' : 'Premio listo') : (isEn ? '+1 Stamp' : '+1 Sello')}
                          </span>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-[11px] text-gray-500 font-semibold">
                            {isReward 
                              ? (isEn ? 'Waiting for redemption at counter' : 'Esperando canje en mostrador')
                              : (isEn 
                                  ? `Needs ${Math.max(0, business.maxStamps - c.currentStamps)} more stamps for reward`
                                  : `Le faltan ${Math.max(0, business.maxStamps - c.currentStamps)} sellos para su premio`)}
                          </span>
                          <button
                            onClick={() => handleSelectCustomer(c.id)}
                            className={`clay-btn text-xs font-black flex items-center gap-1 cursor-pointer px-2 py-1 ${
                              isReward ? 'text-[#FF5E36]' : 'text-[#007AFF]'
                            }`}
                          >
                            <span>{isReward ? (isEn ? 'Redeem reward' : 'Canjear premio') : (isEn ? 'View pass' : 'Ver tarjeta')}</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 clay-card bg-white text-center">
                    <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#007AFF] mx-auto flex items-center justify-center font-black text-base mb-2 shadow-xs">
                      🌱
                    </div>
                    <h4 className="text-xs font-black text-gray-800">
                      {isEn ? 'Ready to get started today' : 'Todo listo para comenzar hoy'}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium mt-1">
                      {isEn
                        ? 'Scan your guests digital pass to start giving stamps.'
                        : 'Escanea la tarjeta de tus clientes para comenzar a otorgar sellos.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Micro SaaS Pitch reminder */}
            <div className="p-3.5 clay-card bg-sky-50/90 text-[11px] text-slate-900 font-medium">
              ✨ <span className="font-black">{isEn ? `Official Terminal for ${business.name}:` : `Terminal Oficial para ${business.name}:`}</span> {isEn ? 'Includes digital passes for Apple Wallet and Google Wallet with real-time stamps and push notifications.' : 'Incluye tarjetas digitales para Apple Wallet y Google Wallet con sellos y notificaciones en vivo.'}
            </div>
          </div>
        )}

        {/* ================= TAB 2: CLIENTES ================= */}
        {activeTab === 'clientes' && !selectedCustomer && (
          <div className="space-y-4 animate-fade-in">
            {/* Header with Title and Add Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-black text-slate-900">{isEn ? 'Members' : 'Clientes'}</h2>
                <p className="text-xs text-slate-500 font-semibold">
                  {isEn ? 'Find any guest or spot who is dropping off.' : 'Encuentra a quien sea o detecta quién se está enfriando.'}
                </p>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="clay-btn clay-btn-primary px-3.5 py-2 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus size={15} />
                <span>{isEn ? 'Add Member' : 'Agregar cliente'}</span>
              </button>
            </div>

            {/* Filter Chips (Claymorphic) */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {(isEn 
                ? ['All', 'Active', 'Regular', 'New', 'At Risk', 'Inactive'] 
                : ['Todos', 'Activo', 'Asiduo', 'Recién activado', 'Viene menos', 'Inactivo']
              ).map((filter, filterIdx) => {
                const esEquiv = ['Todos', 'Activo', 'Asiduo', 'Recién activado', 'Viene menos', 'Inactivo'][filterIdx];
                const isSelected = customerFilter === esEquiv || customerFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setCustomerFilter(esEquiv)}
                    className={`clay-btn px-3.5 py-1.5 font-black whitespace-nowrap transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'clay-btn-primary text-white shadow-xs'
                        : 'clay-btn-light text-gray-700'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={17} className="absolute left-4 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? "Search by name or email..." : "Busca por nombre o email..."}
                className="w-full pl-11 pr-4 py-2.5 text-xs clay-input text-gray-800 placeholder-gray-400 font-semibold"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 font-extrabold px-1">
              <span>{filteredCustomers.length} {filteredCustomers.length === 1 ? (isEn ? 'member' : 'cliente') : (isEn ? 'members' : 'clientes')}</span>
            </div>

            {/* Customer List Items (Natural full page flow) */}
            <div className="space-y-2.5">
              {filteredCustomers.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => handleSelectCustomer(cust.id)}
                  className="p-4 clay-card bg-white cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                      {cust.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-gray-900 truncate">{cust.name}</h4>
                        <span className="clay-badge text-[9px] px-2 py-0.5 font-black bg-slate-100 text-gray-700 shrink-0">
                          {cust.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 truncate font-medium">{cust.email}</p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                        {isEn ? 'Digital pass' : 'Tarjeta digital'} • {cust.currentStamps} {isEn ? 'stamps' : 'sellos'} • {isEn ? 'Last visit' : 'Última vez'} {cust.lastVisit}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2 flex items-center gap-2">
                    <div>
                      <div className="text-xs font-black text-[#007AFF]">
                        ${cust.totalSpent ? cust.totalSpent.toFixed(2) : '0.00'}
                      </div>
                      <ChevronRight size={16} className="text-gray-400 ml-auto mt-0.5" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCustomer(cust);
                        setEditCustName(cust.name);
                        setEditCustEmail(cust.email || '');
                        setEditCustPhone(cust.phone || '');
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-gray-500 hover:text-sky-700 transition-colors shadow-2xs cursor-pointer"
                      title="Editar datos del cliente"
                    >
                      <Edit3 size={14} />
                    </button>
                    {onDeleteCustomer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`¿Estás seguro de eliminar a ${cust.name}? Esta acción no se puede deshacer.`)) {
                            onDeleteCustomer(cust.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors shadow-2xs cursor-pointer"
                        title="Eliminar este cliente"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= CUSTOMER DETAIL VIEW ================= */}
        {selectedCustomer && (
          <div className="space-y-4 animate-fade-in">
            {/* Back link */}
            <button
              onClick={() => handleSelectCustomer(null)}
              className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-black text-gray-700 flex items-center gap-1.5 shadow-xs cursor-pointer max-w-full"
            >
              <ArrowLeft size={14} className="shrink-0" />
              <span className="truncate">{isEn ? 'Members' : 'Clientes'} / {selectedCustomer.name}</span>
            </button>

            {/* Profile Header Card (Claymorphic) - Anti-overlap responsive design */}
            <div className="p-4 sm:p-5 clay-card bg-white w-full max-w-full overflow-hidden">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center font-black text-base shrink-0 shadow-sm">
                  {selectedCustomer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-gray-900 truncate">{selectedCustomer.name}</h3>
                    <span className="clay-badge px-2 py-0.5 text-[10px] font-black bg-sky-100 text-slate-900 shrink-0">
                      {selectedCustomer.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{selectedCustomer.email}</p>
                  {selectedCustomer.phone && (
                    <p className="text-xs text-gray-500 font-medium truncate">{selectedCustomer.phone}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons Row - Perfectly fitted, never overlaps */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPushTarget('individual');
                    setSelectedIndividualCustomerId(selectedCustomer.id);
                    setPushMessage(
                      isEn
                        ? `👋 Hello ${selectedCustomer.name.split(' ')[0]}! We look forward to seeing you today at ${business.name} to earn your next stamp.`
                        : `👋 ¡Hola ${selectedCustomer.name.split(' ')[0]}! Te esperamos hoy en ${business.name} para sumar tu próximo sello.`
                    );
                    handleSelectCustomer(null);
                    setActiveTab('push');
                  }}
                  className="flex-1 clay-btn clay-btn-orange py-2 px-3 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                  title={isEn ? "Send personal push notification" : "Enviar notificación push personal"}
                >
                  <Bell size={13} className="shrink-0" />
                  <span>{isEn ? 'Push' : 'Push'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingCustomer(selectedCustomer);
                    setEditCustName(selectedCustomer.name);
                    setEditCustEmail(selectedCustomer.email || '');
                    setEditCustPhone(selectedCustomer.phone || '');
                  }}
                  className="flex-1 clay-btn clay-btn-light py-2 px-3 text-slate-800 text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all border border-slate-200"
                  title={isEn ? "Edit profile" : "Editar datos"}
                >
                  <Edit3 size={13} className="text-sky-700 shrink-0" />
                  <span>{isEn ? 'Editar' : 'Editar'}</span>
                </button>

                {onDeleteCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      const confirmMsg = isEn 
                        ? `Are you sure you want to delete ${selectedCustomer.name}? This action cannot be undone.`
                        : `¿Estás seguro de eliminar a ${selectedCustomer.name}? Esta acción no se puede deshacer.`;
                      if (window.confirm(confirmMsg)) {
                        onDeleteCustomer(selectedCustomer.id);
                        handleSelectCustomer(null);
                      }
                    }}
                    className="clay-btn clay-btn-light p-2.5 text-red-600 hover:text-red-800 text-xs font-black flex items-center justify-center shrink-0 shadow-xs border border-red-200 active:scale-95 transition-all"
                    title={isEn ? "Delete member" : "Eliminar cliente"}
                  >
                    <Trash2 size={14} className="shrink-0" />
                  </button>
                )}
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-gray-600 font-medium">
                {isEn 
                  ? `Member since ${selectedCustomer.joinedDate} • Last visit: `
                  : `Miembro desde el ${selectedCustomer.joinedDate} • Última visita: `}
                <span className="font-bold text-gray-900">{selectedCustomer.lastVisit}</span>
              </div>
            </div>

            {/* Wallets Section */}
            <div>
              <div className="text-[11px] uppercase font-black text-gray-400 tracking-wider mb-2 px-1">
                {isEn ? `${selectedCustomer.name.split(' ')[0]}'s Digital Pass` : `Tarjeta digital de ${selectedCustomer.name.split(' ')[0]}`}
              </div>

              <div className="p-5 clay-card bg-white space-y-4">
                {/* Wallet Pass Item */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center text-lg shadow-sm">
                      {storeIcon}
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-900">
                        {isEn ? `${business.name} Stamp Card` : `Tarjeta de sellos ${business.name}`}
                      </div>
                      <div className="text-[10px] text-sky-700 font-bold">
                        ● {isEn ? `On ${selectedCustomer.device}` : `En ${selectedCustomer.device}`}
                      </div>
                    </div>
                  </div>
                  <span className="clay-badge px-2.5 py-1 text-[11px] font-black text-gray-700 bg-slate-50">
                    {isEn ? 'Welcome Bonus' : 'Bono de regalo'}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-black text-gray-900">
                      {isEn ? 'Stamps earned:' : 'Sellos ganados:'} {selectedCustomer.currentStamps} / {business.maxStamps}
                    </span>
                    <span className="text-gray-500 font-bold">
                      {Math.max(0, business.maxStamps - selectedCustomer.currentStamps) === 0 ? (
                        <span className="text-[#007AFF] font-black">{isEn ? 'Reward ready!' : '¡Premio listo!'}</span>
                      ) : (
                        isEn ? `${business.maxStamps - selectedCustomer.currentStamps} stamps left` : `Faltan ${business.maxStamps - selectedCustomer.currentStamps} sellos`
                      )}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#24634f] to-[#173e31] transition-all duration-500 rounded-full shadow-sm"
                      style={{
                        width: `${Math.min(100, (selectedCustomer.currentStamps / business.maxStamps) * 100)}%`
                      }}
                    />
                  </div>
                </div>

                {/* Stamp circles preview (Claymorphic) */}
                <div className="grid grid-cols-8 gap-1.5 sm:gap-2 py-1 min-w-0">
                  {Array.from({ length: business.maxStamps }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square min-w-0 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        i < selectedCustomer.currentStamps
                          ? 'clay-btn-primary text-white shadow-xs'
                          : 'clay-inset bg-slate-100 text-gray-400'
                      }`}
                    >
                      {i < selectedCustomer.currentStamps ? storeIcon : i + 1}
                    </div>
                  ))}
                </div>

                {/* ACTION BUTTONS (Tactile Claymorphic Buttons) */}
                <div className="space-y-2.5 pt-2">
                  {/* Give Stamp Button */}
                  <button
                    onClick={() => handleGiveStamp(selectedCustomer)}
                    className="w-full py-3.5 px-4 clay-btn clay-btn-primary text-white text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Plus size={18} />
                    <span>{isEn ? `Give a stamp to ${selectedCustomer.name.split(' ')[0]}` : `Dar un sello a ${selectedCustomer.name.split(' ')[0]}`}</span>
                  </button>

                  {/* Claim Reward Button (if applicable) */}
                  {selectedCustomer.currentStamps >= business.maxStamps && (
                    <button
                      onClick={() => {
                        sounds.playReward();
                        onClaimReward(selectedCustomer.id);
                        alert(
                          isEn
                            ? `🎉 Reward redeemed for ${selectedCustomer.name}! Awarded: ${business.rewardTitle}`
                            : `🎉 ¡Premio canjeado para ${selectedCustomer.name}! Se le entregó: ${business.rewardTitle}`
                        );
                      }}
                      className="w-full py-3 px-4 clay-btn clay-btn-orange text-white text-xs font-black flex items-center justify-center gap-2 shadow-md cursor-pointer animate-pulse"
                    >
                      <Award size={18} />
                      <span>{isEn ? `Redeem ${business.rewardTitle} (Reset stamps)` : `Canjear ${business.rewardTitle} (Reiniciar sellos)`}</span>
                    </button>
                  )}

                  {/* Register Spend Button */}
                  <button
                    onClick={() => setShowSpendModal(true)}
                    className="w-full py-3 px-4 clay-btn clay-btn-light text-gray-800 text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <DollarSign size={16} />
                    <span>{isEn ? 'Record purchase amount' : 'Registrar monto de gasto'}</span>
                  </button>

                  {/* UNDO LAST STAMP BUTTON */}
                  <button
                    onClick={() => handleUndo(selectedCustomer)}
                    disabled={selectedCustomer.currentStamps <= 1}
                    className="w-full py-2.5 px-4 clay-btn bg-orange-50 text-[#FF5E36] border border-orange-200 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                    title={selectedCustomer.currentStamps <= 1 ? (isEn ? "The 1st stamp is the welcome gift upon registration" : "El 1er sello es el regalo de bienvenida por registro") : (isEn ? "Undo the last stamp" : "Deshacer el último sello")}
                  >
                    <Undo2 size={15} />
                    <span>{isEn ? '↺ Undo last stamp' : '↺ Deshacer último sello'} {selectedCustomer.currentStamps <= 1 ? (isEn ? '(1st stamp protected)' : '(1er sello protegido)') : ''}</span>
                  </button>

                  {/* Share Card to Customer via WhatsApp / Copy Link */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fidelipassapp.com';
                        const cardLink = `${origin}/?store=${business.id}&c=${selectedCustomer.id}`;
                        const phone = (selectedCustomer.phone || '').replace(/[^0-9]/g, '');
                        const msg = encodeURIComponent(
                          isEn
                            ? `👋 Hello ${selectedCustomer.name.split(' ')[0]}!\n\nHere is your Official Digital Pass for *${business.name}*:\n👉 ${cardLink}\n\nOpen it on your phone and tap *"Add to Apple Wallet"* (iPhone) or *"Save to Google Wallet"* (Android) to track your stamps and get VIP perks. ✨`
                            : `👋 ¡Hola ${selectedCustomer.name.split(' ')[0]}!\n\n` +
                              `Aquí tienes tu Tarjeta Digital Oficial de *${business.name}*:\n` +
                              `👉 ${cardLink}\n\n` +
                              `Ábrela en tu celular y pulsa *"Añadir a Apple Wallet"* (iPhone) o *"Guardar en Google Wallet"* (Android) para ver tus sellos y recibir novedades exclusivas. ✨`
                        );
                        window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`, '_blank');
                      }}
                      className="clay-btn bg-[#007AFF] hover:bg-[#0062E0] text-white py-2.5 px-3 text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>💬 WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fidelipassapp.com';
                        const cardLink = `${origin}/?store=${business.id}&c=${selectedCustomer.id}`;
                        navigator.clipboard.writeText(cardLink);
                        alert(
                          isEn
                            ? `✅ ${selectedCustomer.name}'s pass link copied!\n\n${cardLink}\n\nYou can paste it in any chat.`
                            : `✅ ¡Enlace de la tarjeta de ${selectedCustomer.name} copiado!\n\n${cardLink}\n\nPuedes pegarlo en cualquier chat.`
                        );
                      }}
                      className="clay-btn clay-btn-light py-2.5 px-3 text-gray-700 hover:text-gray-900 text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer border border-slate-200"
                    >
                      <Share2 size={13} className="text-gray-500" />
                      <span>{isEn ? 'Copy Pass Link' : 'Copiar Enlace'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PUSH NOTIFICATIONS (Video 2) ================= */}
        {activeTab === 'push' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div>
              <h2 className="font-heading text-xl font-black text-slate-900">
                {isEn ? 'Send Push Notification' : 'Dile algo a tus clientes'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                {isEn 
                  ? 'Send a direct push notification to the lock screen of registered members.' 
                  : 'Envía una notificación push directa a la pantalla del celular de tus clientes registrados.'}
              </p>
            </div>

            {pushSentSuccess && (
              <div className="p-3.5 clay-card bg-sky-50 text-xs font-black text-slate-900 flex items-start gap-2.5 animate-fade-in shadow-sm">
                <Check size={18} className="text-[#007AFF] shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-black">
                    {isEn ? 'Push notification sent in real-time!' : '¡Notificación Push enviada en tiempo real!'}
                  </strong>
                  <span className="text-[11px] text-sky-700 font-medium">
                    {isEn 
                      ? 'Broadcasted via Firebase. All members with their pass saved will receive the alert with sound and vibration.' 
                      : 'Se transmitió a Firebase. Todos los clientes con su tarjeta abierta o guardada recibirán la alerta con sonido y vibración.'}
                  </span>
                </div>
              </div>
            )}

            {/* Compose Notification Card */}
            <div className="p-5 clay-card bg-white shadow-xl space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">
                  {isEn ? 'Recipients' : 'Destinatarios'}
                </label>
                <select
                  value={pushTarget}
                  onChange={(e) => setPushTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs clay-input text-gray-800 font-bold"
                >
                  <option value="all">
                    {isEn ? `📢 All members (${customers.length} registered)` : `📢 Todos tus clientes (${customers.length} registrados)`}
                  </option>
                  <option value="individual">
                    {isEn ? '👤 Specific individual member (Select)' : '👤 Un solo cliente en específico (Seleccionar)'}
                  </option>
                  <option value="almost_reward">
                    {isEn ? '🎁 Members close to reward' : '🎁 Clientes cerca de premio'}
                  </option>
                  <option value="inactive">
                    {isEn ? '⏳ Inactive members (over 10 days)' : '⏳ Clientes que no vienen hace más de 10 días'}
                  </option>
                </select>
              </div>

              {pushTarget === 'individual' && (
                <div className="p-3.5 bg-sky-50/80 rounded-2xl border border-sky-200/80 space-y-2 animate-fade-in shadow-inner">
                  <label className="block text-[11px] font-black text-slate-950">
                    {isEn ? 'Select member:' : 'Selecciona al cliente:'}
                  </label>
                  <select
                    value={selectedIndividualCustomerId}
                    onChange={(e) => setSelectedIndividualCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-sky-300 font-bold text-gray-800 shadow-2xs"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || (isEn ? 'Member' : 'Cliente')} — {c.phone || c.id} ({c.currentStamps || 0} {isEn ? 'stamps' : 'sellos'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">
                  {isEn ? 'Lock-screen message' : 'Mensaje en pantalla bloqueada'}
                </label>
                <textarea
                  rows={3}
                  value={pushMessage}
                  onChange={(e) => setPushMessage(e.target.value)}
                  placeholder={isEn ? "E.g.: 2-for-1 on all specials until 5 PM today!" : "Ej: ¡Hoy 2x1 en helados hasta las 5pm!"}
                  className="w-full p-3.5 text-xs clay-input text-gray-800 font-semibold"
                />
              </div>

              {/* Quick Preset Ideas */}
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                  {isEn ? 'Quick Templates (1 Click)' : 'Plantillas Rápidas (1 Clic)'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {(isEn
                    ? [
                        "🍦 2-for-1 specials today before 5 PM!",
                        "⭐ Visit today and get DOUBLE stamps!",
                        "🎉 New seasonal special available today!"
                      ]
                    : [
                        "🍦 ¡2x1 hoy antes de las 5 PM!",
                        "⭐ ¡Ven hoy y te damos DOBLE sello!",
                        "🎉 ¡Nuevo sabor de temporada disponible hoy!"
                      ]
                  ).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPushMessage(preset)}
                      className="clay-btn clay-btn-light px-3 py-1.5 text-gray-700 hover:text-gray-900 text-[11px] font-bold cursor-pointer shadow-xs"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendPush}
                className="w-full py-3.5 clay-btn clay-btn-orange text-white text-xs font-black shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Send size={15} />
                <span>
                  {pushTarget === 'individual' 
                    ? (isEn 
                        ? `Send Push Notification to ${(customers.find(c => c.id === selectedIndividualCustomerId) || customers[0])?.name || 'Member'}`
                        : `Enviar Notificación Push a ${(customers.find(c => c.id === selectedIndividualCustomerId) || customers[0])?.name || 'Cliente'}`)
                    : (isEn 
                        ? `Send Push Notification to ${customers.length} members`
                        : `Enviar Notificación Push a ${customers.length} clientes`)
                  }
                </span>
              </button>

              <p className="text-[10px] text-gray-400 font-medium text-center leading-tight">
                {isEn 
                  ? '⚡ Cloud sync via Firestore: Alerts ring immediately on member phones.' 
                  : '⚡ Sincronización en la nube vía Firestore: La alerta suena al instante en los teléfonos de tus clientes.'}
              </p>
            </div>

            {/* Sent Notifications History */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-[11px] uppercase font-black text-gray-400 tracking-wider">
                  {isEn ? `Notification History (${notifications.length})` : `Historial de notificaciones (${notifications.length})`}
                </div>
                {notifications.length > 0 && onClearNotifications && (
                  <button
                    type="button"
                    onClick={onClearNotifications}
                    className="clay-btn clay-btn-light px-2.5 py-1 text-[10px] text-gray-500 hover:text-red-600 font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    title={isEn ? "Clear sent alerts to keep history clean" : "Borrar las alertas enviadas para dejar el historial limpio"}
                  >
                    <Trash2 size={12} />
                    <span>{isEn ? 'Clear history' : 'Limpiar historial'}</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-6 clay-card bg-white text-center shadow-sm">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-2 font-black">
                    🔔
                  </div>
                  <p className="text-xs font-bold text-gray-700">{isEn ? 'Clean history' : 'Historial limpio'}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {isEn 
                      ? 'No active notifications. Alerts are purged every 24 hours automatically.' 
                      : 'No hay notificaciones activas. Las alertas se depuran cada 24 horas automáticamente.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-4 clay-card bg-white text-xs shadow-md">
                      <div className="flex justify-between items-center text-gray-400 text-[10px] mb-1.5">
                        <span className="font-bold text-gray-500">{n.sentAt || n.time || (isEn ? 'Recent' : 'Reciente')}</span>
                        <span className="font-black text-sky-800 bg-sky-50 px-2.5 py-0.5 clay-badge border border-sky-200">
                          {isEn 
                            ? `Delivered to ${n.recipientsCount || n.reach || customers.length || 1}` 
                            : `Entregado a ${n.recipientsCount || n.reach || customers.length || 1}`}
                        </span>
                      </div>
                      <p className="font-bold text-gray-800">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[10px] text-gray-400 font-medium text-center mt-2.5">
                {isEn 
                  ? '💡 Automatically cleared every 24h so you start each day with a fresh log.' 
                  : '💡 Se limpian automáticamente cada 24h para que comiences cada día con un historial fresco.'}
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 4: MÁS / CONFIGURACIÓN ================= */}
        {activeTab === 'mas' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div>
              <h2 className="font-heading text-xl font-black text-slate-900">
                {isEn ? 'Pass Settings & Rules' : 'Configuración de tu Tarjeta'}
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                {isEn ? `Customize loyalty program rules for ${business.name}.` : `Personaliza las reglas del programa para ${business.name}.`}
              </p>
            </div>

            {configSaved && (
              <div className="p-3.5 clay-card bg-sky-50 text-xs font-black text-slate-900 flex items-center gap-2 shadow-sm animate-fade-in">
                <Check size={18} className="text-[#007AFF]" />
                <span>{isEn ? 'Settings saved successfully!' : '¡Configuración guardada correctamente!'}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="p-5 clay-card bg-white space-y-4 shadow-xl">
              {/* Logo Upload Section */}
              <div className="p-4 clay-card bg-slate-50">
                <label className="block text-xs font-black text-gray-700 mb-2.5">
                  {isEn ? 'Store Logo / Photo' : 'Foto / Logo del Local'}
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center overflow-hidden shrink-0 p-1.5 ring-2 ring-slate-100">
                    {editLogo ? (
                      <img src={editLogo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-3xl">{storeIcon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <input
                      type="file"
                      ref={merchantFileInputRef}
                      onChange={handleMerchantLogoFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => merchantFileInputRef.current?.click()}
                        disabled={logoUploading}
                        className="clay-btn clay-btn-primary px-3.5 py-2 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Camera size={14} />
                        <span>
                          {logoUploading 
                            ? (isEn ? 'Uploading...' : 'Cargando imagen...') 
                            : editLogo 
                              ? (isEn ? 'Change Photo' : 'Cambiar Foto') 
                              : (isEn ? 'Upload Logo' : 'Subir Foto de Logo')}
                        </span>
                      </button>
                      {editLogo && (
                        <button
                          type="button"
                          onClick={() => setEditLogo('')}
                          className="clay-btn clay-btn-light px-3 py-2 text-gray-700 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Trash2 size={13} />
                          <span>{isEn ? 'Remove photo' : 'Quitar foto'}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 font-semibold">
                      {isEn 
                        ? 'Formats: PNG, JPG, WebP or SVG. Displayed on digital passes and signs.' 
                        : 'Formatos: PNG, JPG, WebP o SVG. Se mostrará en tus tarjetas de fidelidad y carteles.'}
                    </p>
                  </div>
                </div>
                {logoUploadError && (
                  <p className="text-xs text-red-600 mt-2 font-bold">⚠️ {logoUploadError}</p>
                )}
              </div>

              {/* Banner / Portada Upload Section (Apple Wallet & Google Wallet) */}
              <div className="p-4 clay-card bg-slate-50">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="block text-xs font-black text-gray-700 flex items-center gap-1.5">
                    <span>{isEn ? 'Cover Banner Photo (Apple Wallet & Google Wallet)' : 'Foto de Portada / Banner (Apple Wallet & Google Wallet)'}</span>
                    {!isSuperAdmin && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black">
                        <Lock size={10} />
                        {isEn ? 'Managed' : 'Protegido'}
                      </span>
                    )}
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                    Apple & Google
                  </span>
                </div>
                
                {editBanner ? (
                  <div className="relative w-full h-28 sm:h-36 rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 mb-3 group">
                    <img 
                      src={editBanner} 
                      alt="Banner de la tarjeta" 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[11px] font-bold text-white drop-shadow">
                        {isEn ? 'Digital pass preview' : 'Vista previa en tarjeta digital'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center gap-1 mb-3 text-slate-400">
                    <ImageIcon size={24} className="opacity-60" />
                    <span className="text-xs font-bold text-slate-500">
                      {isEn ? 'No custom cover photo' : 'Sin foto de portada personalizada'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isEn ? 'Default theme will be used' : 'Se usará el diseño predeterminado'}
                    </span>
                  </div>
                )}

                {isSuperAdmin ? (
                  <div className="space-y-2">
                    <div className="mb-2 p-2 rounded-lg bg-sky-50 border border-sky-200 text-slate-900 text-[11px] font-bold flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-sky-700" />
                      <span>{isEn ? 'SuperAdmin Mode: Banner editing unlocked' : 'Modo SuperAdmin: Edición de banner habilitada'}</span>
                    </div>
                    <input
                      type="file"
                      ref={merchantBannerFileInputRef}
                      onChange={handleMerchantBannerFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => merchantBannerFileInputRef.current?.click()}
                        disabled={bannerUploading}
                        className="clay-btn clay-btn-primary px-3.5 py-2 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Camera size={14} />
                        <span>
                          {bannerUploading 
                            ? (isEn ? 'Processing...' : 'Procesando banner...') 
                            : editBanner 
                              ? (isEn ? 'Change Cover Photo' : 'Cambiar Foto de Portada') 
                              : (isEn ? 'Upload Cover Photo' : 'Subir Foto de Portada')}
                        </span>
                      </button>
                      {editBanner && (
                        <button
                          type="button"
                          onClick={() => setEditBanner('')}
                          className="clay-btn clay-btn-light px-3 py-2 text-gray-700 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Trash2 size={13} />
                          <span>{isEn ? 'Remove banner' : 'Quitar banner'}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 font-semibold">
                      {isEn 
                        ? 'Recommended size: 1125 × 432 px (landscape). Shown when guests open their pass in Apple Wallet and Google Wallet.' 
                        : 'Medida recomendada: 1125 × 432 px (panorámico). Es la imagen principal que verán tus clientes al abrir su tarjeta en Apple Wallet y Google Wallet.'}
                    </p>
                    {bannerUploadError && (
                      <p className="text-xs text-red-600 font-bold">⚠️ {bannerUploadError}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-900 shrink-0 mt-0.5">
                      <Lock size={16} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-xs font-black text-amber-950">
                        {isEn ? 'Cover Banner Managed by Support' : 'Banner de Portada Gestionado por el Administrador'}
                      </p>
                      <p className="text-[11px] text-amber-900/90 font-medium leading-relaxed">
                        {isEn 
                          ? 'To guarantee optimal resolution and avoid visual distortions in Apple Wallet and Google Wallet, banner updates are calibrated by your account manager.' 
                          : 'Para garantizar que el banner tenga las medidas panorámicas óptimas (1125 × 432 px) y no se distorsione en Apple Wallet o Google Wallet, el diseño es gestionado por el Administrador.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const msg = encodeURIComponent(`Hola Williams / FideliPass, soy de *${business?.name || 'mi local'}*. Deseo solicitar la actualización del banner panorámico de mi tarjeta digital.`);
                          window.open(`https://api.whatsapp.com/send?phone=593992407645&text=${msg}`, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#007AFF] hover:bg-[#0062E0] text-white text-[11px] font-black shadow-xs cursor-pointer transition-colors"
                      >
                        <ExternalLink size={13} />
                        <span>{isEn ? 'Request Banner Change via WhatsApp' : 'Solicitar cambio de Banner por WhatsApp'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Color Customizer */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black text-gray-900 flex items-center gap-1.5">
                      <span>{isEn ? 'Digital Pass Color' : 'Color de tu Tarjeta Digital'}</span>
                      {!isSuperAdmin && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-black">
                          <Lock size={10} />
                          {isEn ? 'Managed' : 'Protegido'}
                        </span>
                      )}
                    </label>
                    <p className="text-[11px] text-gray-500 font-semibold">
                      {isEn ? 'Official brand card color' : 'Color oficial de tu tarjeta digital'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-7 h-7 rounded-xl shadow-sm border-2 border-white ring-1 ring-slate-200 inline-block"
                      style={{ backgroundColor: editCardBgColor }}
                    />
                    <span className="font-mono text-xs font-black text-gray-800 uppercase">{editCardBgColor}</span>
                  </div>
                </div>

                {isSuperAdmin ? (
                  <>
                    <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-slate-900 text-[11px] font-bold flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-sky-700" />
                      <span>{isEn ? 'SuperAdmin Mode: Card color editing unlocked' : 'Modo SuperAdmin: Edición de color habilitada'}</span>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {CARD_COLOR_PRESETS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setEditCardBgColor(c.hex)}
                          className={`w-8 h-8 rounded-xl cursor-pointer transition-transform flex items-center justify-center shadow-xs ${
                            editCardBgColor.toLowerCase() === c.hex.toLowerCase()
                              ? 'scale-110 ring-2 ring-offset-2 ring-slate-900'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={`${c.name} (${c.hex})`}
                        >
                          {editCardBgColor.toLowerCase() === c.hex.toLowerCase() && (
                            <Check size={16} className="text-white drop-shadow-xs" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Custom Color Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <label className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-2xs">
                        <Palette size={13} className="text-[#007AFF]" />
                        <span>{isEn ? 'Pick another color:' : 'Elegir otro color:'}</span>
                        <input
                          type="color"
                          value={editCardBgColor}
                          onChange={(e) => setEditCardBgColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </label>
                      <input
                        type="text"
                        value={editCardBgColor}
                        onChange={(e) => setEditCardBgColor(e.target.value)}
                        placeholder="#1B474A"
                        className="w-24 px-2 py-1 text-xs clay-input font-mono font-bold text-gray-800 uppercase"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-100/90 border border-slate-200 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-200 text-slate-700 shrink-0 mt-0.5">
                      <Lock size={16} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-xs font-black text-slate-900">
                        {isEn ? 'Card Color Managed by Support' : 'Color de Tarjeta Gestionado por el Administrador'}
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        {isEn
                          ? 'Colors are calibrated to maintain maximum contrast and readability on locked screens.'
                          : 'La paleta de color se calibra cuidadosamente para asegurar el contraste adecuado y la legibilidad de tus sellos en pantalla.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const msg = encodeURIComponent(`Hola Williams / FideliPass, soy de *${business?.name || 'mi local'}*. Deseo cambiar el color de mi tarjeta digital.`);
                          window.open(`https://api.whatsapp.com/send?phone=593992407645&text=${msg}`, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-black shadow-xs cursor-pointer transition-colors"
                      >
                        <ExternalLink size={13} />
                        <span>{isEn ? 'Request Color Change via WhatsApp' : 'Solicitar cambio de Color por WhatsApp'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Stamp Style Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-black text-gray-900">
                  {isEn ? 'Stamp Icon Style (Sticker earned by members)' : 'Diseño del Sello (Sticker que ganan los clientes)'}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStampType('logo')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      editStampType === 'logo'
                        ? 'bg-white border-[#007AFF] ring-2 ring-[#007AFF]/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-gray-900">
                      <span>{isEn ? '🖼️ Store Logo' : '🖼️ Logo de tu Negocio'}</span>
                      {editStampType === 'logo' && <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-full font-bold">{isEn ? 'Active' : 'Activo'}</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                      {isEn 
                        ? 'Each stamp displays your official brand logo on the member pass.' 
                        : 'Cada sello muestra tu logo oficial en la tarjeta del cliente.'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStampType('icon')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      editStampType === 'icon'
                        ? 'bg-white border-[#007AFF] ring-2 ring-[#007AFF]/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-gray-900">
                      <span>{isEn ? '✨ Icon / Emoji' : '✨ Ícono / Emoji'}</span>
                      {editStampType === 'icon' && <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-full font-bold">{isEn ? 'Active' : 'Activo'}</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                      {isEn 
                        ? 'Displays a category emoji instead of the photo logo.' 
                        : 'Muestra un emoji de tu rubro en vez de la foto.'}
                    </p>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    {editStampType === 'logo' 
                      ? (isEn ? 'Secondary fallback icon (if no photo):' : 'Ícono secundario (si no hay foto):') 
                      : (isEn ? 'Select stamp emoji:' : 'Selecciona el emoji de tu sello:')}
                  </label>
                  <select
                    value={editIconType}
                    onChange={(e) => setEditIconType(e.target.value)}
                    className="w-full px-3 py-2 text-xs clay-input text-gray-800 font-bold"
                  >
                    <option value="icecream">{isEn ? '🍦 Ice Cream' : '🍦 Helado'}</option>
                    <option value="burger">{isEn ? '🍔 Burger' : '🍔 Hamburguesa'}</option>
                    <option value="pizza">{isEn ? '🍕 Pizza' : '🍕 Pizza'}</option>
                    <option value="coffee">{isEn ? '☕ Coffee' : '☕ Café'}</option>
                    <option value="star">{isEn ? '⭐ VIP Star' : '⭐ Estrella VIP'}</option>
                    <option value="barber">{isEn ? '✂️ Barber / Salon' : '✂️ Barbería / Salón'}</option>
                    <option value="car">{isEn ? '🚗 Car Wash' : '🚗 Lavadora de Autos'}</option>
                    <option value="gift">{isEn ? '🎁 Surprise Gift' : '🎁 Regalo Sorpresa'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">
                  {isEn ? 'Business / Store Name' : 'Nombre del Comercio / Local'}
                </label>
                <input
                  type="text"
                  value={editBusinessName}
                  onChange={(e) => setEditBusinessName(e.target.value)}
                  placeholder={isEn ? "E.g.: MC Rolls, Bella Pizza, etc." : "Ej: MC Rolls, Pizzería Bella, etc."}
                  className="w-full px-4 py-2.5 text-xs clay-input text-gray-900 font-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">
                  {isEn ? 'Tagline or Short Description' : 'Eslogan o Descripción'}
                </label>
                <input
                  type="text"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  placeholder={isEn ? "E.g.: Artisanal Ice Cream & Rolls" : "Ej: Heladería Artesanal & Rolls"}
                  className="w-full px-4 py-2.5 text-xs clay-input text-gray-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>{isEn ? 'Stamps target for reward' : 'Meta de sellos para el premio'}</span>
                  <span className="text-[10px] text-gray-400 font-bold">
                    {isEn ? 'Enter any number' : 'Escribe cualquier número'}
                  </span>
                </label>
                
                {/* Number Input with Stepper (+ / -) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMaxStamps(prev => Math.max(2, Number(prev) - 1))}
                    className="w-11 h-10 clay-btn clay-btn-light text-gray-800 font-black text-xl cursor-pointer shadow-xs"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="2"
                    max="30"
                    value={editMaxStamps}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setEditMaxStamps(isNaN(val) ? '' : val);
                    }}
                    className="flex-1 text-center py-2.5 clay-input text-base font-black text-[#007AFF]"
                  />
                  <button
                    type="button"
                    onClick={() => setEditMaxStamps(prev => Math.min(30, (Number(prev) || 0) + 1))}
                    className="w-11 h-10 clay-btn clay-btn-light text-gray-800 font-black text-xl cursor-pointer shadow-xs"
                  >
                    +
                  </button>
                </div>

                {/* Quick Presets Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] text-gray-400 font-bold">{isEn ? 'Quick presets:' : 'Atajos rápidos:'}</span>
                  {[5, 6, 8, 9, 10, 12].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEditMaxStamps(num)}
                      className={`clay-btn px-2.5 py-1 text-[10px] font-black cursor-pointer ${
                        Number(editMaxStamps) === num
                          ? 'clay-btn-primary text-white shadow-xs'
                          : 'clay-btn-light text-gray-700'
                      }`}
                    >
                      {num} {isEn ? 'stamps' : 'sellos'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">
                  {isEn ? 'Reward upon completing pass' : 'Premio al completar la tarjeta'}
                </label>
                <input
                  type="text"
                  value={editRewardTitle}
                  onChange={(e) => setEditRewardTitle(e.target.value)}
                  placeholder={isEn ? "E.g.: 1 Free Artisanal Ice Cream" : "Ej: 1 Helado Artesanal Gratis"}
                  className="w-full px-4 py-2.5 text-xs clay-input text-gray-900 font-black"
                />
              </div>

              {/* Sound Selector */}
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2 flex items-center justify-between">
                  <span>{isEn ? 'Stamp sound effect' : 'Efecto de sonido al sellar'}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{isEn ? 'Tap to preview' : 'Toca para probar'}</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'crystal', label: isEn ? '🔔 Crystal Ding' : '🔔 Cristal Ding', desc: isEn ? 'Apple Pay style' : 'Estilo Apple Pay' },
                    { id: 'coin', label: isEn ? '🪙 Coin Chime' : '🪙 Moneda', desc: isEn ? 'Cash style' : 'Estilo Cash Chime' },
                    { id: 'pop', label: isEn ? '🫧 Bubble Pop' : '🫧 Burbuja Pop', desc: isEn ? 'Soft & modern' : 'Suave y moderno' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        sounds.setTheme(s.id);
                        sounds.playStamp(s.id);
                      }}
                      className="p-2.5 text-center clay-card bg-slate-50 hover:bg-white text-gray-800 cursor-pointer shadow-xs group"
                    >
                      <div className="font-black text-xs group-hover:text-[#007AFF]">{s.label}</div>
                      <div className="text-[9px] text-gray-400 font-semibold mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Geofencing & Location-based Proximity Push Notifications */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#007AFF] flex items-center justify-center font-black shadow-2xs shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900">
                        {isEn ? 'GPS Proximity Notification (Geofencing)' : 'Notificación por Proximidad GPS (Geofencing)'}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-semibold">
                        {isEn 
                          ? 'Customer phone lights up with your notification within 300 ft of your shop.' 
                          : 'El iPhone del cliente se enciende con tu mensaje cuando camina a 100m de tu local.'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editEnableGeofence}
                      onChange={(e) => setEditEnableGeofence(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#007AFF]"></div>
                  </label>
                </div>

                {editEnableGeofence && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/80 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-sky-50/80 p-3 rounded-xl border border-sky-200">
                      <div className="text-left">
                        <p className="text-[11px] font-black text-[#007AFF]">
                          {isEn ? 'Are you currently at the store?' : '¿Estás ahora mismo en el local?'}
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {isEn ? 'Tap to capture exact GPS coordinates in 1 second.' : 'Presiona para capturar las coordenadas GPS exactas en 1 segundo.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCaptureCurrentLocation}
                        disabled={isCapturingLocation}
                        className="clay-btn clay-btn-primary px-3.5 py-2 text-white text-xs font-black flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                      >
                        <MapPin size={13} />
                        <span>
                          {isCapturingLocation 
                            ? (isEn ? 'Getting GPS...' : 'Obteniendo GPS...') 
                            : (isEn ? '📍 Capture Location' : '📍 Capturar Ubicación')}
                        </span>
                      </button>
                    </div>

                    {locationSuccessNotice && (
                      <p className="text-xs text-sky-800 font-bold animate-fade-in bg-white p-2 rounded-lg border border-sky-300">
                        {locationSuccessNotice}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {isEn ? 'GPS Latitude' : 'Latitud GPS'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={editLatitude}
                          onChange={(e) => setEditLatitude(e.target.value)}
                          placeholder="-2.1911889"
                          className="w-full px-3 py-2 text-xs clay-input font-mono font-bold text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {isEn ? 'GPS Longitude' : 'Longitud GPS'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={editLongitude}
                          onChange={(e) => setEditLongitude(e.target.value)}
                          placeholder="-79.9449926"
                          className="w-full px-3 py-2 text-xs clay-input font-mono font-bold text-gray-800"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-gray-700">
                          {isEn ? 'Lock-screen message (when within 300 ft)' : 'Mensaje en la pantalla de bloqueo (al estar a 100m)'}
                        </label>
                        <a
                          href={`https://www.google.com/maps?q=${editLatitude},${editLongitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[#0071E3] font-bold hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={10} />
                          <span>{isEn ? 'View on Google Maps' : 'Ver en Google Maps'}</span>
                        </a>
                      </div>
                      <input
                        type="text"
                        value={editProximityMessage}
                        onChange={(e) => setEditProximityMessage(e.target.value)}
                        placeholder={isEn ? `🍦 You're near ${business.name}! Stop by for your favorite treats and earn stamps.` : `🍦 ¡Estás cerca de ${business.name}! Pasa por tu producto favorito y suma sellos hoy.`}
                        className="w-full px-3 py-2 text-xs clay-input font-bold text-gray-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 clay-btn clay-btn-primary text-white text-xs font-black shadow-md cursor-pointer"
              >
                {isEn ? 'Save Changes' : 'Guardar Cambios'}
              </button>
            </form>

            {/* Change Password Card */}
            <div className="p-5 clay-card bg-white space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#007AFF] flex items-center justify-center font-black text-sm shadow-2xs">
                  🔒
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900">
                    {isEn ? 'Security & Cashier Password' : 'Seguridad y Cambio de Contraseña'}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-semibold">
                    {isEn ? 'Update cashier access password' : 'Actualiza la clave con la que ingresas a la caja'}
                  </p>
                </div>
              </div>

              {passwordSuccess && (
                <div className="p-3 clay-card bg-sky-50 text-xs text-slate-900 font-bold flex items-center gap-2">
                  <Check size={16} className="text-[#007AFF]" />
                  <span>{isEn ? 'Password updated successfully!' : '¡Contraseña actualizada con éxito!'}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {isEn ? 'Current password *' : 'Contraseña actual *'}
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={isEn ? "Your current password" : "Tu clave actual"}
                    className="w-full px-3.5 py-2.5 text-xs clay-input font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      {isEn ? 'New password *' : 'Nueva clave *'}
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={isEn ? "Min 4 characters" : "Mínimo 4 caracteres"}
                      className="w-full px-3.5 py-2.5 text-xs clay-input font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      {isEn ? 'Confirm password *' : 'Confirmar clave *'}
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isEn ? "Repeat new password" : "Repite la nueva clave"}
                      className="w-full px-3.5 py-2.5 text-xs clay-input font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 clay-btn clay-btn-dark text-white text-xs font-black shadow-md cursor-pointer"
                >
                  {isEn ? 'Update Password' : 'Actualizar Contraseña'}
                </button>
              </form>
            </div>

            {/* Print Counter Sign Shortcut */}
            <div className="p-5 clay-card bg-white flex items-center justify-between shadow-xl">
              <div>
                <h4 className="text-xs font-black text-gray-900">
                  {isEn ? 'Counter Sign with QR Poster' : 'Cartel de Mostrador con QR'}
                </h4>
                <p className="text-[11px] text-gray-500 font-semibold">
                  {isEn ? 'Printable QR display stand poster for your checkout counter' : 'Imprime el afiche para colocar en la caja registradora'}
                </p>
              </div>
              <button
                onClick={onOpenCounterSign}
                className="clay-btn clay-btn-orange px-3.5 py-2 text-white text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Printer size={15} />
                <span>{isEn ? 'View Poster' : 'Ver Cartel'}</span>
              </button>
            </div>

            {/* Logout Option */}
            {onLogout && (
              <div className="p-5 clay-card bg-red-50/50 border border-red-200/60 flex items-center justify-between shadow-xl">
                <div>
                  <h4 className="text-xs font-black text-red-950">
                    {isEn ? 'Close Cashier Session' : 'Cerrar Sesión de Caja'}
                  </h4>
                  <p className="text-[11px] text-red-700/80 font-semibold">
                    {isEn ? `Log out of ${business.name}` : `Salir de la cuenta de ${business.name}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="clay-btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <LogOut size={14} />
                  <span>{isEn ? 'Log Out' : 'Cerrar Sesión'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= BOTTOM NAVIGATION BAR (Claymorphic Navigation) ================= */}
      <nav className={`${isNative ? 'fixed' : 'fixed sm:absolute'} bottom-0 left-0 right-0 bg-white border-t border-slate-200/90 px-4 py-2 sm:py-2.5 pb-[max(env(safe-area-inset-bottom),0.85rem)] flex items-center justify-around z-50 shadow-[0_-4px_25px_rgba(15,23,42,0.08)]`}>
        {/* Tab 1: Hoy */}
        <button
          onClick={() => {
            handleSelectCustomer(null);
            setActiveTab('hoy');
          }}
          className={`flex flex-col items-center py-1.5 px-3 lg:px-5 lg:py-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'hoy' && !selectedCustomer 
              ? 'bg-sky-50 text-[#007AFF] font-black' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Home size={20} />
          <span className="text-[10px] lg:text-xs font-bold mt-0.5">{isEn ? 'Today' : 'Hoy'}</span>
        </button>

        {/* Tab 2: Clientes */}
        <button
          onClick={() => {
            handleSelectCustomer(null);
            setActiveTab('clientes');
          }}
          className={`flex flex-col items-center py-1.5 px-3 lg:px-5 lg:py-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'clientes' || selectedCustomer 
              ? 'bg-sky-50 text-[#007AFF] font-black' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Users size={20} />
          <span className="text-[10px] lg:text-xs font-bold mt-0.5">{isEn ? 'Members' : 'Clientes'}</span>
        </button>

        {/* Tab 3: Central Round Orange Button - ESCANEAR */}
        <div className="relative -top-4 lg:-top-5">
          <button
            onClick={onOpenScanner}
            className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-tr from-[#FF5E36] to-[#FF8466] text-white flex flex-col items-center justify-center shadow-lg shadow-orange-500/30 cursor-pointer active:scale-95 transition-all"
          >
            <QrCode size={26} />
            <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-tighter mt-0.5">{isEn ? 'Scan' : 'Escanear'}</span>
          </button>
        </div>

        {/* Tab 4: Push */}
        <button
          onClick={() => {
            handleSelectCustomer(null);
            setActiveTab('push');
          }}
          className={`flex flex-col items-center py-1.5 px-3 lg:px-5 lg:py-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'push' 
              ? 'bg-sky-50 text-[#007AFF] font-black' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Bell size={20} />
          <span className="text-[10px] lg:text-xs font-bold mt-0.5">Push</span>
        </button>

        {/* Tab 5: Más */}
        <button
          onClick={() => {
            handleSelectCustomer(null);
            setActiveTab('mas');
          }}
          className={`flex flex-col items-center py-1.5 px-3 lg:px-5 lg:py-2 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'mas' 
              ? 'bg-sky-50 text-[#007AFF] font-black' 
              : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] lg:text-xs font-bold mt-0.5">{isEn ? 'Settings' : 'Más'}</span>
        </button>
      </nav>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm clay-card bg-white p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#007AFF] flex items-center justify-center shadow-2xs">
                  <Edit3 size={15} />
                </div>
                <h3 className="font-heading font-black text-gray-900 text-sm">
                  {isEn ? 'Edit Member Details' : 'Editar Datos del Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-500 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateCustomer && editingCustomer) {
                  onUpdateCustomer({
                    ...editingCustomer,
                    name: editCustName.trim() || editingCustomer.name,
                    email: editCustEmail.trim() || editingCustomer.email,
                    phone: editCustPhone.trim() || editingCustomer.phone
                  });
                }
                setEditingCustomer(null);
                sounds.playStamp();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1">
                  {isEn ? 'Full Name *' : 'Nombre Completo *'}
                </label>
                <input
                  type="text"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  placeholder={isEn ? "E.g. Williams Navarrete" : "Ej. Williams Navarrete"}
                  className="w-full px-3.5 py-2.5 text-xs clay-input text-gray-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1">
                  {isEn ? 'Email Address' : 'Correo Electrónico'}
                </label>
                <input
                  type="email"
                  value={editCustEmail}
                  onChange={(e) => setEditCustEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="w-full px-3.5 py-2.5 text-xs clay-input text-gray-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-700 mb-1">
                  {isEn ? 'Phone / WhatsApp' : 'Teléfono / WhatsApp'}
                </label>
                <input
                  type="text"
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  placeholder="+1 617 000 0000"
                  className="w-full px-3.5 py-2.5 text-xs clay-input text-gray-800 font-semibold"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 py-2.5 clay-btn clay-btn-light text-gray-600 text-xs font-bold cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Cancelar'}
                </button>
                {onDeleteCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      const confirmMsg = isEn 
                        ? `Are you sure you want to delete ${editingCustomer.name}? This action cannot be undone.`
                        : `¿Estás seguro de eliminar a ${editingCustomer.name}? Esta acción no se puede deshacer.`;
                      if (window.confirm(confirmMsg)) {
                        onDeleteCustomer(editingCustomer.id);
                        setEditingCustomer(null);
                        if (selectedCustomer?.id === editingCustomer.id) {
                          handleSelectCustomer(null);
                        }
                      }
                    }}
                    className="px-3 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 cursor-pointer shadow-2xs"
                    title={isEn ? "Delete member" : "Eliminar este cliente"}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 clay-btn clay-btn-primary text-white text-xs font-black shadow-sm cursor-pointer"
                >
                  {isEn ? 'Save Changes' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spend Modal */}
      {showSpendModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xs clay-card bg-white p-5 shadow-2xl">
            <h4 className="font-heading font-black text-sm text-gray-900 mb-1">
              {isEn ? `Record Spend for ${selectedCustomer.name}` : `Registrar Gasto de ${selectedCustomer.name}`}
            </h4>
            <p className="text-xs text-gray-500 font-medium mb-3">
              {isEn ? 'Current purchase amount:' : 'Monto de la compra actual:'}
            </p>
            <div className="relative mb-4">
              <span className="absolute left-3.5 top-2.5 text-gray-400 font-black">$</span>
              <input
                type="number"
                step="0.50"
                value={spendAmount}
                onChange={(e) => setSpendAmount(e.target.value)}
                placeholder="4.50"
                className="w-full pl-8 pr-3 py-2.5 clay-input text-sm font-black text-gray-900"
              />
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowSpendModal(false)}
                className="flex-1 py-2.5 clay-btn clay-btn-light text-gray-700 text-xs font-bold cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                onClick={() => {
                  if (spendAmount) {
                    selectedCustomer.totalSpent = (selectedCustomer.totalSpent || 0) + Number(spendAmount);
                    setSpendAmount('');
                  }
                  setShowSpendModal(false);
                }}
                className="flex-1 py-2.5 clay-btn clay-btn-primary text-white text-xs font-black cursor-pointer"
              >
                {isEn ? 'Save' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-xs clay-card bg-white p-5 shadow-2xl">
            <h4 className="font-heading font-black text-sm text-gray-900 mb-1">
              {isEn ? 'Add New Member' : 'Agregar Nuevo Cliente'}
            </h4>
            <div className="space-y-3 my-3.5">
              <input
                type="text"
                placeholder={isEn ? "Full name" : "Nombre completo"}
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs clay-input font-semibold"
              />
              <input
                type="tel"
                placeholder={isEn ? "Phone / WhatsApp" : "Teléfono / WhatsApp"}
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs clay-input font-semibold"
              />
              <input
                type="email"
                placeholder={isEn ? "Email address" : "Correo electrónico"}
                value={newCustEmail}
                onChange={(e) => setNewCustEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs clay-input font-semibold"
              />
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="flex-1 py-2.5 clay-btn clay-btn-light text-gray-700 text-xs font-bold cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                onClick={() => {
                  if (newCustName.trim()) {
                    customers.push({
                      id: "cust-" + Date.now().toString().slice(-4),
                      name: newCustName.trim(),
                      phone: newCustPhone || "+1 617 000 0000",
                      email: newCustEmail || `${newCustName.toLowerCase().replace(/\s+/g, '')}@example.com`,
                      status: isEn ? "Newly active" : "Recién activado",
                      device: isEn ? "Phone (Digital Pass)" : "Celular (App Digital)",
                      currentStamps: 1,
                      totalSpent: 4.00,
                      joinedDate: isEn ? "Today" : "Hoy",
                      lastVisit: isEn ? "Just now" : "Ahora",
                      history: []
                    });
                    setNewCustName('');
                    setNewCustPhone('');
                    setNewCustEmail('');
                    setShowAddCustomerModal(false);
                  }
                }}
                className="flex-1 py-2.5 clay-btn clay-btn-primary text-white text-xs font-black cursor-pointer"
              >
                {isEn ? 'Create Member' : 'Crear Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
