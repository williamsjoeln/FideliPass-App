import React, { useState, useRef } from 'react';
import { 
  Store, Plus, TrendingUp, Users, DollarSign, Award, 
  ExternalLink, LogOut, CheckCircle, Shield, Printer, 
  Calendar, CalendarCheck, Phone, Mail, Sparkles, X, ChevronRight, AlertCircle,
  Camera, Upload, Trash2, Image as ImageIcon,
  Key, Lock, Eye, EyeOff, Palette, Check, Pause, Play
} from 'lucide-react';
import { processImageFile, generateSeamlessHorizontalBanner } from '../utils/imageHelper';

export const CARD_COLOR_PRESETS = [
  { name: 'Teal Esmeralda', hex: '#1B474A' },
  { name: 'Azul Marino', hex: '#0F4C81' },
  { name: 'Celeste Océano', hex: '#0284C7' },
  { name: 'Negro Carbón', hex: '#18181B' },
  { name: 'Rojo Borgoña', hex: '#881337' },
  { name: 'Púrpura Violeta', hex: '#581C87' },
  { name: 'Café Moka', hex: '#4A2E18' },
  { name: 'Naranja Cálido', hex: '#C2410C' },
  { name: 'Verde Bosque', hex: '#14532D' }
];

const SPANISH_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatDateSpanish(date) {
  if (!date || isNaN(date.getTime())) date = new Date();
  const d = date.getDate();
  const m = SPANISH_MONTHS[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

function parseSpanishDate(str) {
  if (!str) return null;
  const monthsMap = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
    jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11
  };
  const parts = String(str).toLowerCase().trim().split(/[\s-]+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const mKey = parts[1].substring(0, 3);
    const month = monthsMap[mKey] !== undefined ? monthsMap[mKey] : (parseInt(parts[1], 10) - 1);
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day, 23, 59, 59);
    }
  }
  const parsed = Date.parse(str);
  return isNaN(parsed) ? null : new Date(parsed);
}

export function SuperAdminDashboard({ 
  stores, 
  accounts = [],
  onAddStore, 
  onUpdateStore,
  onDeleteStore,
  onAddAccount,
  onDeleteAccount,
  onChangeStorePassword,
  onChangeAdminPassword,
  onSelectStoreAsCashier, 
  onOpenCounterSignForStore, 
  onLogout,
  platformName = "FideliPass",
  platformLogo = '/logos/fidelipass-logo.png',
  onUpdatePlatformSettings
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLogoStore, setEditingLogoStore] = useState(null);
  const [selectedLogoData, setSelectedLogoData] = useState('');
  const [logoUploadLoading, setLogoUploadLoading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');
  const fileInputRef = useRef(null);
  const newStoreFileInputRef = useRef(null);
  const [newLogo, setNewLogo] = useState(null);
  const [newBanner, setNewBanner] = useState(null);

  // Platform Logo and Brand state
  const [showPlatformLogoModal, setShowPlatformLogoModal] = useState(false);
  const [selectedPlatformLogoData, setSelectedPlatformLogoData] = useState(platformLogo || '');
  const [editPlatformNameState, setEditPlatformNameState] = useState(platformName);
  const [platformLogoLoading, setPlatformLogoLoading] = useState(false);
  const [platformLogoUploadError, setPlatformLogoUploadError] = useState('');
  const platformLogoFileInputRef = useRef(null);

  // Admin password change state
  const [showChangeAdminPassModal, setShowChangeAdminPassModal] = useState(false);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminPassError, setAdminPassError] = useState('');
  const [adminPassSuccess, setAdminPassSuccess] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Store suspension confirmation state
  const [suspensionTargetStore, setSuspensionTargetStore] = useState(null);

  // Multi-branch / Cashier accounts management state
  const [branchesStore, setBranchesStore] = useState(null);
  const [branchName, setBranchName] = useState('');
  const [branchEmail, setBranchEmail] = useState('');
  const [branchPassword, setBranchPassword] = useState('123456');
  const [branchError, setBranchError] = useState('');
  const [branchSuccess, setBranchSuccess] = useState('');

  const handleCreateBranchAccount = (e) => {
    e.preventDefault();
    setBranchError('');
    setBranchSuccess('');

    if (!branchesStore) return;
    if (!branchName.trim()) {
      setBranchError('Ingresa el nombre de la sucursal o cajero (ej. Sucursal Urdesa).');
      return;
    }
    if (!branchEmail.trim() || !branchEmail.includes('@')) {
      setBranchError('Ingresa un correo electrónico válido para este acceso.');
      return;
    }
    if (!branchPassword.trim() || branchPassword.trim().length < 4) {
      setBranchError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    // Check if email already exists
    const exists = accounts.some(a => a.email && a.email.toLowerCase().trim() === branchEmail.toLowerCase().trim());
    if (exists) {
      setBranchError('Este correo ya está registrado en otra cuenta. Usa uno diferente.');
      return;
    }

    const newAccount = {
      id: "acc-" + Date.now(),
      name: branchName.trim(),
      email: branchEmail.toLowerCase().trim(),
      password: branchPassword.trim(),
      role: 'merchant',
      businessId: branchesStore.id,
      badge: branchesStore.category || 'Sucursal'
    };

    if (onAddAccount) {
      onAddAccount(newAccount);
      setBranchSuccess(`¡Acceso creado con éxito para ${branchName.trim()}!`);
      setBranchName('');
      setBranchEmail('');
      setBranchPassword('123456');
      setTimeout(() => setBranchSuccess(''), 2500);
    }
  };

  const handleChangeAdminPasswordSubmit = (e) => {
    e.preventDefault();
    setAdminPassError('');
    if (!adminNewPassword.trim() || adminNewPassword.trim().length < 4) {
      setAdminPassError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (adminNewPassword.trim() !== adminConfirmPassword.trim()) {
      setAdminPassError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (onChangeAdminPassword) {
      onChangeAdminPassword(adminNewPassword.trim());
      setAdminPassSuccess(true);
      setTimeout(() => {
        setShowChangeAdminPassModal(false);
        setAdminPassSuccess(false);
        setAdminNewPassword('');
        setAdminConfirmPassword('');
      }, 1800);
    }
  };

  const handleOpenLogoModal = (store) => {
    setEditingLogoStore(store);
    setSelectedLogoData(store.logo || '');
    setLogoUploadError('');
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoUploadLoading(true);
      setLogoUploadError('');
      const dataUrl = await processImageFile(file, 400, 400);
      setSelectedLogoData(dataUrl);
    } catch (err) {
      setLogoUploadError(err.message || 'Error al procesar la imagen');
    } finally {
      setLogoUploadLoading(false);
    }
  };

  const handleNewStoreLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLogoUploadLoading(true);
      setLogoUploadError('');
      const dataUrl = await processImageFile(file, 400, 400);
      setNewLogo(dataUrl);

      // Automatically generate full-width seamless horizontal banner (Apple & FideliPass standard)
      const { bannerDataUrl } = await generateSeamlessHorizontalBanner(dataUrl, newCardBgColor);
      if (bannerDataUrl) {
        setNewBanner(bannerDataUrl);
      }
    } catch (err) {
      setLogoUploadError(err.message || 'Error al procesar la imagen');
    } finally {
      setLogoUploadLoading(false);
    }
  };

  const handleSaveLogo = async () => {
    if (!editingLogoStore) return;
    let updatedBanner = editingLogoStore.banner;
    if (selectedLogoData) {
      try {
        const { bannerDataUrl } = await generateSeamlessHorizontalBanner(selectedLogoData, editingLogoStore.cardBgColor);
        if (bannerDataUrl) updatedBanner = bannerDataUrl;
      } catch (e) {
        console.warn("Could not generate banner on logo update:", e);
      }
    }
    if (onUpdateStore) {
      onUpdateStore({
        ...editingLogoStore,
        logo: selectedLogoData || null,
        banner: updatedBanner || null,
        stampType: 'logo'
      });
    }
    setEditingLogoStore(null);
    setSelectedLogoData('');
  };

  const handlePlatformLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPlatformLogoLoading(true);
      setPlatformLogoUploadError('');
      const dataUrl = await processImageFile(file, 400, 400);
      setSelectedPlatformLogoData(dataUrl);
    } catch (err) {
      setPlatformLogoUploadError(err.message || 'Error al procesar la imagen');
    } finally {
      setPlatformLogoLoading(false);
    }
  };

  const handleSavePlatformSettings = () => {
    if (onUpdatePlatformSettings) {
      onUpdatePlatformSettings({
        name: editPlatformNameState.trim() || platformName,
        logo: selectedPlatformLogoData || null
      });
    }
    setShowPlatformLogoModal(false);
  };

  const handlePromptChangePassword = (store) => {
    const newPass = prompt(`Ingresa la nueva contraseña para ${store.name} (${store.ownerEmail}):`, store.ownerPassword || '123456');
    if (newPass && newPass.trim() && newPass.trim().length >= 4) {
      if (onChangeStorePassword) {
        onChangeStorePassword(store.id, newPass.trim());
      }
      alert(`✅ Contraseña actualizada para ${store.name}: ${newPass.trim()}`);
    }
  };

  const handleSendWhatsAppCredentials = (store) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fidelipassapp.com';
    const phone = (store.ownerPhone || '').replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `👋 Hola ${store.ownerName}, aquí tienes tus datos de acceso a la caja de ${store.name} en FideliPass:\n\n` +
      `🌐 Enlace de acceso: ${origin}\n` +
      `✉️ Correo: ${store.ownerEmail}\n` +
      `🔑 Contraseña: ${store.ownerPassword || '123456'}\n\n` +
      `¡Guarda este mensaje! Si necesitas cambiar tu clave o tienes dudas, puedes avisarnos aquí.`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${msg}`, '_blank');
  };
  
  // Subscription and Date Management State
  const [editingDatesStore, setEditingDatesStore] = useState(null);
  const [customJoinedDate, setCustomJoinedDate] = useState('');
  const [customPaidUntil, setCustomPaidUntil] = useState('');
  const [customMonthlyFee, setCustomMonthlyFee] = useState('');
  const [dateUpdateSuccess, setDateUpdateSuccess] = useState('');

  // New Store Form State
  const [newName, setNewName] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newCategory, setNewCategory] = useState('Comida Rápida');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('123456');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newMonthlyFee, setNewMonthlyFee] = useState(50.00);
  const [newMaxStamps, setNewMaxStamps] = useState(6);
  const [newRewardTitle, setNewRewardTitle] = useState('1 Producto Gratis');
  const [newIconType, setNewIconType] = useState('icecream');
  const [newCardBgColor, setNewCardBgColor] = useState('#1B474A');
  const [newStampType, setNewStampType] = useState('logo');
  const [newLanguage, setNewLanguage] = useState('es');
  const [newJoinedDate, setNewJoinedDate] = useState(() => formatDateSpanish(new Date()));
  const [newPaidUntil, setNewPaidUntil] = useState(() => formatDateSpanish(new Date(Date.now() + 30 * 86400000)));

  const handleExtendMonth = (store) => {
    const currentPaidDate = parseSpanishDate(store.paidUntil) || new Date();
    const baseDate = currentPaidDate < new Date() ? new Date() : currentPaidDate;
    const newDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const formatted = formatDateSpanish(newDate);

    if (onUpdateStore) {
      onUpdateStore({
        ...store,
        paidUntil: formatted,
        status: 'active'
      });
      alert(`✅ ¡Suscripción de ${store.name} renovada con éxito por 1 mes hasta el ${formatted}!`);
    }
  };

  const handleSaveDates = (e) => {
    e.preventDefault();
    if (!editingDatesStore) return;
    if (onUpdateStore) {
      const parsedFee = parseFloat(customMonthlyFee);
      onUpdateStore({
        ...editingDatesStore,
        monthlyFee: !isNaN(parsedFee) && parsedFee >= 0 ? parsedFee : (editingDatesStore.monthlyFee || 15.00),
        joinedDate: customJoinedDate.trim() || editingDatesStore.joinedDate || '18 Oct 2026',
        paidUntil: customPaidUntil.trim() || editingDatesStore.paidUntil || '18 Nov 2026'
      });
      setDateUpdateSuccess(`¡Facturación y fechas de ${editingDatesStore.name} actualizadas con éxito!`);
      setTimeout(() => {
        setDateUpdateSuccess('');
        setEditingDatesStore(null);
      }, 1200);
    }
  };

  // Edit Store Design & Color State
  const [editingDesignStore, setEditingDesignStore] = useState(null);
  const [designCardBgColor, setDesignCardBgColor] = useState('#1B474A');
  const [designStampType, setDesignStampType] = useState('logo');
  const [designIconType, setDesignIconType] = useState('icecream');

  const handleOpenDesignModal = (store) => {
    setEditingDesignStore(store);
    setDesignCardBgColor(store.cardBgColor || '#1B474A');
    setDesignStampType(store.stampType || (store.logo ? 'logo' : 'icon'));
    setDesignIconType(store.iconType || 'icecream');
  };

  const handleSaveDesign = () => {
    if (!editingDesignStore) return;
    if (onUpdateStore) {
      onUpdateStore({
        ...editingDesignStore,
        cardBgColor: designCardBgColor,
        accentColor: designCardBgColor,
        stampType: designStampType,
        iconType: designIconType
      });
    }
    setEditingDesignStore(null);
  };

  const handleConfirmToggleSuspend = () => {
    if (!suspensionTargetStore) return;
    const isSuspended = suspensionTargetStore.status === 'suspended';
    const nextStatus = isSuspended ? 'active' : 'suspended';
    if (onUpdateStore) {
      onUpdateStore({
        ...suspensionTargetStore,
        status: nextStatus,
        suspendedAt: nextStatus === 'suspended' ? Date.now() : null
      });
    }
    setSuspensionTargetStore(null);
  };

  const visibleStores = stores.filter(s => s.id !== 'pizzeria-bella' && s.id !== 'cafe-roble' && s.id !== 'willstore');
  const activeStores = visibleStores.filter(s => s.status !== 'suspended');
  const suspendedStores = visibleStores.filter(s => s.status === 'suspended');
  const totalMRR = activeStores.reduce((acc, s) => acc + (Number(s.monthlyFee) || 15.00), 0);
  const standardPlanFee = 15.00;
  const projected20Stores = 20 * standardPlanFee;

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let finalBanner = newBanner;
    if (!finalBanner && newLogo) {
      try {
        const gen = await generateSeamlessHorizontalBanner(newLogo, newCardBgColor);
        finalBanner = gen.bannerDataUrl;
      } catch {}
    }

    const slug = newName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const newStore = {
      id: "store-" + Date.now(),
      slug: slug,
      name: newName.trim(),
      tagline: newTagline.trim() || 'Programa de Fidelidad Oficial',
      category: newCategory,
      ownerName: newOwnerName.trim() || 'Propietario',
      ownerEmail: newOwnerEmail.trim() || `${slug}@fidelipass.com`,
      ownerPassword: newOwnerPassword.trim() || '123456',
      ownerPhone: newOwnerPhone.trim() || '+593 99 000 0000',
      status: 'active',
      plan: 'Plan Oficial FideliPass',
      monthlyFee: Number(newMonthlyFee || 50.00),
      paidUntil: newPaidUntil.trim() || formatDateSpanish(new Date(Date.now() + 30 * 86400000)),
      joinedDate: newJoinedDate.trim() || formatDateSpanish(new Date()),
      maxStamps: Number(newMaxStamps) || 6,
      rewardTitle: newRewardTitle.trim() || '1 Premio Gratis',
      logo: newLogo || null,
      banner: finalBanner || null,
      cardBgColor: newCardBgColor || '#1B474A',
      accentColor: newCardBgColor || '#1B474A',
      stampType: 'logo', // Always 100% official store logo stickers
      iconType: newIconType,
      language: newLanguage || 'es',
      activeCustomersCount: 1,
      totalStampsAwarded: 1
    };

    onAddStore(newStore);
    setShowAddModal(false);
    
    // Reset form
    setNewName('');
    setNewTagline('');
    setNewOwnerName('');
    setNewOwnerEmail('');
    setNewOwnerPassword('123456');
    setNewOwnerPhone('');
    setNewMonthlyFee(50.00);
    setNewLogo(null);
    setNewBanner(null);
    setNewCardBgColor('#1B474A');
    setNewStampType('logo');
    setNewLanguage('es');
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 flex flex-col font-sans overflow-x-hidden selection:bg-sky-100 selection:text-sky-900 text-left">
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3.5 sm:px-6 lg:px-10 lg:py-5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand Info Row */}
          <div className="flex items-center justify-between md:justify-start gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  setEditPlatformNameState(platformName);
                  setSelectedPlatformLogoData(platformLogo || '');
                  setShowPlatformLogoModal(true);
                  setPlatformLogoUploadError('');
                }}
                title="Haz clic para subir o cambiar el logo de FideliPass"
                className="w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-2xl bg-white text-gray-900 flex items-center justify-center font-bold text-lg shadow-sm border border-gray-200/90 cursor-pointer hover:scale-105 transition-all overflow-hidden relative group p-1.5 shrink-0 ring-2 ring-gray-100"
              >
                {platformLogo ? (
                  <img src={platformLogo} alt={platformName} className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <span>👑</span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl text-white">
                  <Camera size={16} />
                </div>
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-heading font-black text-xl sm:text-2xl lg:text-3xl text-[#1D4E3E] leading-tight">
                    {platformName}
                  </h1>
                  <span className="clay-badge-dark px-2.5 py-0.5 text-[10px] lg:text-xs font-black bg-amber-100 text-amber-900 uppercase shrink-0">
                    Super-Admin
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs lg:text-sm text-gray-500 font-mono font-bold mt-0.5">
                  fidelipassapp.com • Admin General
                </p>
              </div>
            </div>

            {/* Mobile Logout quick button */}
            <button
              onClick={onLogout}
              className="md:hidden clay-btn clay-btn-light p-2.5 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 lg:gap-3">
            <button
              onClick={() => {
                setEditPlatformNameState(platformName);
                setSelectedPlatformLogoData(platformLogo || '');
                setShowPlatformLogoModal(true);
                setPlatformLogoUploadError('');
              }}
              className="clay-btn clay-btn-light px-3.5 py-2 lg:px-4 lg:py-2.5 text-emerald-950 text-xs lg:text-sm font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              title="Subir o cambiar el logo oficial de FideliPass"
            >
              <Camera size={15} className="text-emerald-700 shrink-0" />
              <span className="truncate">🖼️ Logo FideliPass</span>
            </button>

            <button
              onClick={() => {
                setShowChangeAdminPassModal(true);
                setAdminPassError('');
                setAdminPassSuccess(false);
                setAdminNewPassword('');
                setAdminConfirmPassword('');
              }}
              className="clay-btn clay-btn-light px-3.5 py-2 lg:px-4 lg:py-2.5 text-amber-950 text-xs lg:text-sm font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              title="Cambiar contraseña de Administrador General"
            >
              <Key size={15} className="text-amber-700 shrink-0" />
              <span className="truncate">🔑 Mi Clave</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="col-span-2 sm:col-span-1 clay-btn clay-btn-primary px-4 py-2 lg:px-5 lg:py-2.5 text-white text-xs lg:text-sm font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={17} className="shrink-0" />
              <span>+ Afiliar Nuevo Local</span>
            </button>

            <button
              onClick={onLogout}
              className="hidden md:flex clay-btn clay-btn-light px-3.5 py-2 lg:px-4 lg:py-2.5 text-gray-700 text-xs lg:text-sm font-bold items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={15} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard */}
      <main className="max-w-[1440px] w-full mx-auto px-4 py-5 sm:p-6 lg:p-8 xl:p-10 space-y-6 sm:space-y-8">
        {/* Metric Cards Banner (Claymorphic 3D Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5 lg:gap-6">
          {/* Card 1: Active Stores */}
          <div className="p-4 sm:p-5 lg:p-6 xl:p-7 clay-card bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] lg:text-xs uppercase font-black text-gray-400 tracking-wider">Locales</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shadow-xs">
                <Store size={19} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-heading font-black text-gray-900 mt-2 lg:mt-3">
              {activeStores.length} <span className="text-xs sm:text-sm lg:text-base font-bold text-gray-500">activos</span>
            </div>
            <p className="text-[11px] sm:text-xs lg:text-sm font-extrabold mt-1">
              {suspendedStores.length > 0 ? (
                <span className="text-amber-700">⚠️ {suspendedStores.length} suspendido por pago</span>
              ) : (
                <span className="text-emerald-700">100% al día</span>
              )}
            </p>
          </div>

          {/* Card 2: Current MRR */}
          <div className="p-4 sm:p-5 lg:p-6 xl:p-7 clay-card bg-emerald-50/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] lg:text-xs uppercase font-black text-[#1D4E3E] tracking-wider">Ingreso Mensual</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11 rounded-2xl bg-[#1D4E3E] text-white flex items-center justify-center shadow-xs">
                <DollarSign size={19} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-heading font-black text-[#1D4E3E] mt-2 lg:mt-3">
              ${totalMRR.toFixed(2)} <span className="text-xs sm:text-sm lg:text-base font-bold text-[#1D4E3E]/70">/mes</span>
            </div>
            <p className="text-[11px] sm:text-xs lg:text-sm text-emerald-900 font-extrabold mt-1">Suscripciones activas recurrentes</p>
          </div>

          {/* Card 3: Target 20 Stores */}
          <div className="p-4 sm:p-5 lg:p-6 xl:p-7 clay-card bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] lg:text-xs uppercase font-black text-gray-400 tracking-wider">Meta 20 Locales</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center shadow-xs">
                <TrendingUp size={19} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-heading font-black text-gray-900 mt-2 lg:mt-3">
              ${projected20Stores.toFixed(2)} <span className="text-xs sm:text-sm lg:text-base font-bold text-gray-500">/mes</span>
            </div>
            <p className="text-[11px] sm:text-xs lg:text-sm text-gray-500 font-bold mt-1">Ingreso pasivo meta</p>
          </div>

          {/* Card 4: Total Customers in Wallets */}
          <div className="p-4 sm:p-5 lg:p-6 xl:p-7 clay-card bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] lg:text-xs uppercase font-black text-gray-400 tracking-wider">En Wallets</span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11 rounded-2xl bg-blue-50 text-blue-800 flex items-center justify-center shadow-xs">
                <Users size={19} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-heading font-black text-gray-900 mt-2 lg:mt-3">
              {visibleStores.reduce((acc, s) => acc + (s.activeCustomersCount || 0), 0)} <span className="text-xs sm:text-sm lg:text-base font-bold text-gray-500">clientes</span>
            </div>
            <p className="text-[11px] sm:text-xs lg:text-sm text-blue-700 font-extrabold mt-1">Tarjetas guardadas</p>
          </div>
        </div>

        {/* Stores Directory List (Claymorphic) */}
        <div className="clay-card bg-white overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 lg:p-6 lg:px-8 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading font-black text-base sm:text-lg lg:text-2xl text-gray-900">Locales Afiliados a FideliPass</h2>
              <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-0.5">
                Cada comercio tiene su propio acceso, sus propios clientes y su propia tarjeta personalizada.
              </p>
            </div>
            <div className="clay-badge px-3.5 py-1.5 flex items-center gap-2 text-xs lg:text-sm font-black text-emerald-800 bg-emerald-50">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Todos alojados en fidelipassapp.com (Firebase)</span>
            </div>
          </div>

          {/* Stores Table / Cards */}
          <div className="divide-y divide-slate-200/80">
            {visibleStores.map((store) => {
              const paidDateObj = parseSpanishDate(store.paidUntil);
              const now = new Date();
              const diffDays = paidDateObj ? Math.ceil((paidDateObj - now) / 86400000) : 30;
              const isExpired = paidDateObj && diffDays < 0;
              const isNearExp = paidDateObj && diffDays >= 0 && diffDays <= 3;

              return (
                <div key={store.id} className="p-5 sm:p-6 lg:p-7 hover:bg-slate-50/60 transition-colors space-y-4">
                  {/* Top Row: Store Profile (Left) + Subscription Info (Right) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Store Profile */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                      <div 
                        onClick={() => handleOpenLogoModal(store)}
                        className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl flex items-center justify-center text-3xl font-bold shadow-md shrink-0 border border-slate-200 overflow-hidden bg-white relative group cursor-pointer ring-2 ring-slate-100"
                        title="Clic para cambiar foto del logo"
                      >
                        {store.logo ? (
                          <img src={store.logo} alt={store.name} className="w-full h-full object-contain p-1.5" />
                        ) : (
                          <span>{store.iconType === 'pizza' ? '🍕' : store.iconType === 'coffee' ? '☕' : store.iconType === 'burger' ? '🍔' : '🏪'}</span>
                        )}
                        <div className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl lg:rounded-3xl text-[10px] font-bold">
                          <Camera size={18} />
                          <span>Foto</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                          <h3 className="font-heading font-black text-lg sm:text-xl lg:text-2xl text-gray-900 leading-tight">{store.name}</h3>
                          <span 
                            className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full shadow-2xs border border-white/80 inline-block shrink-0 ring-1 ring-slate-200" 
                            style={{ backgroundColor: store.cardBgColor || '#1B474A' }}
                            title={`Color de tarjeta: ${store.cardBgColor || '#1B474A'}`}
                          />
                          <span className="clay-badge px-2.5 py-0.5 text-xs font-black bg-emerald-100 text-emerald-900">
                            {store.category}
                          </span>
                          {store.status === 'suspended' ? (
                            <span className="clay-badge px-2.5 py-0.5 text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs animate-pulse">
                              <Pause size={11} className="fill-amber-700" />
                              <span>SUSPENDIDO POR PAGO</span>
                            </span>
                          ) : isExpired ? (
                            <span className="clay-badge px-2.5 py-0.5 text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-xs" title="El mes finalizó. La terminal sigue activa.">
                              <AlertCircle size={12} className="text-amber-700" />
                              <span>⚠️ Pago Pendiente (Venció el {store.paidUntil})</span>
                            </span>
                          ) : isNearExp ? (
                            <span className="clay-badge px-2.5 py-0.5 text-xs font-black bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shadow-2xs">
                              <span>⏳ Vence en {diffDays === 0 ? 'hoy' : diffDays + 'd'} ({store.paidUntil})</span>
                            </span>
                          ) : (
                            <span className="clay-badge px-2.5 py-0.5 text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                              <span>Al día hasta {store.paidUntil || 'Fin de mes'}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 font-semibold mt-1">{store.tagline}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mt-2.5">
                          <span className="font-bold">👤 {store.ownerName}</span>
                          <span>•</span>
                          <span className="font-mono font-bold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs">✉️ {store.ownerEmail}</span>
                          <span>•</span>
                          <span className="clay-badge font-mono text-emerald-900 bg-emerald-50 px-2.5 py-0.5 font-black text-xs">
                            🔑 Clave: {store.ownerPassword || '123456'}
                          </span>
                          <span>•</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 text-xs">
                            🏢 {accounts.filter(a => a.businessId === store.id).length || 1} {accounts.filter(a => a.businessId === store.id).length === 1 ? 'sucursal' : 'sucursales'}
                          </span>
                          <span>•</span>
                          <span className="font-bold">📱 {store.activeCustomersCount || 1} clientes</span>
                          <span>•</span>
                          <span className="font-black text-amber-800">🎁 {store.maxStamps} sellos = {store.rewardTitle}</span>
                        </div>
                      </div>
                    </div>

                    {/* Subscription & Billing Mini-Card (Right Side) */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between bg-slate-50 md:bg-transparent p-3 md:p-0 rounded-2xl border border-slate-200/80 md:border-0 shrink-0 gap-2">
                      <div 
                        onClick={() => {
                          setEditingDatesStore(store);
                          setCustomJoinedDate(store.joinedDate || '18 Oct 2026');
                          setCustomPaidUntil(store.paidUntil || '18 Nov 2026');
                          setCustomMonthlyFee(store.monthlyFee !== undefined ? store.monthlyFee : 15.00);
                        }}
                        className="text-left md:text-right cursor-pointer group"
                        title="Clic para editar tarifa mensual y fechas"
                      >
                        <span className="text-base sm:text-lg font-black text-emerald-700 block leading-tight group-hover:underline">
                          {store.monthlyFee ? `$${Number(store.monthlyFee).toFixed(2)} / mes` : '$15.00 / mes'}
                        </span>
                        <div className="flex items-center gap-2 md:block text-[11px] text-gray-500 font-semibold mt-0.5">
                          <span>🗓️ Inicio: <strong className="text-gray-700">{store.joinedDate || '18 Oct 2026'}</strong></span>
                          <span className="hidden md:inline"> • </span>
                          <span>💳 Vence: <strong className={isExpired ? "text-amber-800 font-black" : "text-emerald-700 font-black"}>{store.paidUntil || 'Fin de mes'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          onClick={() => handleExtendMonth(store)}
                          title={`Renovar 1 mes adicional a ${store.name} (+30 días)`}
                          className="clay-btn px-3 py-1.5 text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                        >
                          <CalendarCheck size={14} className="text-emerald-600" />
                          <span>+1 Mes</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingDatesStore(store);
                            setCustomJoinedDate(store.joinedDate || '18 Oct 2026');
                            setCustomPaidUntil(store.paidUntil || '18 Nov 2026');
                            setCustomMonthlyFee(store.monthlyFee !== undefined ? store.monthlyFee : 15.00);
                          }}
                          title={`Ver o editar tarifa mensual, fechas de inicio y vencimiento de ${store.name}`}
                          className="clay-btn px-2.5 py-1.5 text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
                        >
                          <Calendar size={13} className="text-slate-600" />
                          <span>Fechas / $</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Action Toolbar (Full width) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    {/* Primary Operations (Left) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onSelectStoreAsCashier(store)}
                        className="clay-btn clay-btn-primary px-4 py-2 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <Store size={15} />
                        <span>Entrar a su Caja</span>
                      </button>

                      <button
                        onClick={() => {
                          setBranchesStore(store);
                          setBranchName('');
                          setBranchEmail('');
                          setBranchPassword('123456');
                          setBranchError('');
                          setBranchSuccess('');
                        }}
                        title={`Gestionar sucursales y accesos de caja para ${store.name}`}
                        className="clay-btn clay-btn-light px-3 py-2 text-blue-900 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-blue-50"
                      >
                        <Users size={14} className="text-blue-600" />
                        <span>Sucursales ({accounts.filter(a => a.businessId === store.id).length || 1})</span>
                      </button>

                      <button
                        onClick={() => setSuspensionTargetStore(store)}
                        title={store.status === 'suspended' ? `Reactivar servicio de ${store.name}` : `Suspender por falta de pago a ${store.name}`}
                        className={`clay-btn px-3 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all ${
                          store.status === 'suspended'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {store.status === 'suspended' ? (
                          <>
                            <Play size={13} className="fill-current text-white" />
                            <span>Reactivar</span>
                          </>
                        ) : (
                          <>
                            <Pause size={13} className="fill-current text-amber-700" />
                            <span>Suspender</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Secondary Customization & Tools (Right) */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDesignModal(store)}
                        title="Cambiar color de tarjeta y diseño del sello"
                        className="clay-btn clay-btn-light px-2.5 py-1.5 text-violet-900 text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs hover:bg-violet-50"
                      >
                        <Palette size={13} className="text-violet-600" />
                        <span>Color</span>
                      </button>

                      <button
                        onClick={() => handleOpenLogoModal(store)}
                        title="Subir o cambiar foto del logo"
                        className="clay-btn clay-btn-light px-2.5 py-1.5 text-indigo-900 text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Camera size={13} className="text-indigo-600" />
                        <span>Logo</span>
                      </button>

                      <button
                        onClick={() => handlePromptChangePassword(store)}
                        title="Cambiar contraseña de este local"
                        className="clay-btn clay-btn-light px-2.5 py-1.5 text-emerald-900 text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Key size={13} className="text-emerald-700" />
                        <span>Clave</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsAppCredentials(store)}
                        title="Enviar datos de acceso por WhatsApp al dueño"
                        className="clay-btn bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-black flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => onOpenCounterSignForStore(store)}
                        title="Imprimir Cartel de Mostrador para este local"
                        className="clay-btn clay-btn-light p-2 text-gray-700 cursor-pointer flex items-center justify-center shadow-2xs"
                      >
                        <Printer size={15} />
                      </button>

                      {onDeleteStore && (
                        <button
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar el local "${store.name}" y su usuario de acceso?`)) {
                              onDeleteStore(store.id);
                            }
                          }}
                          title="Eliminar este local"
                          className="clay-btn bg-red-50 hover:bg-red-100 text-red-600 p-2 cursor-pointer flex items-center justify-center shadow-2xs"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Add Store Modal (Claymorphic) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg clay-card bg-white overflow-hidden shadow-2xl my-6">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between rounded-t-[28px]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#1D4E3E] text-white flex items-center justify-center font-black text-sm shadow-xs">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-gray-900 leading-tight">Afiliar Nuevo Comercio</h3>
                  <p className="text-[11px] text-gray-500 font-bold">Crea la tarjeta y las credenciales de acceso para el dueño</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-700 flex items-center justify-center cursor-pointer shadow-2xs font-bold"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">Foto o Logo del Local (Opcional)</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {newLogo ? (
                      <img src={newLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon size={22} className="text-gray-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={newStoreFileInputRef}
                    onChange={handleNewStoreLogoFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => newStoreFileInputRef.current?.click()}
                    className="clay-btn clay-btn-light px-3.5 py-2 text-gray-700 text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Upload size={14} className="text-[#1D4E3E]" />
                    <span>{newLogo ? 'Cambiar foto' : 'Subir foto del logo'}</span>
                  </button>
                  {newLogo && (
                    <button
                      type="button"
                      onClick={() => setNewLogo(null)}
                      className="p-2 text-red-500 hover:text-red-700 text-xs cursor-pointer"
                      title="Quitar foto"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">Nombre del Local / Negocio *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewName(val);
                    const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
                    setNewOwnerEmail(slug ? `${slug}@fidelipass.com` : '');
                    setNewOwnerPassword(slug ? `${slug}123` : '123456');
                  }}
                  placeholder="Ej: MC Rolls, WillStore, etc."
                  className="w-full px-4 py-2.5 text-xs clay-input text-gray-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1.5">Rubro / Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs clay-input text-gray-800 font-bold"
                  >
                    <option value="Comida Rápida">🍔 Comida Rápida</option>
                    <option value="Pizzería">🍕 Pizzería</option>
                    <option value="Heladería">🍦 Heladería</option>
                    <option value="Cafetería">☕ Cafetería</option>
                    <option value="Barbería / Peluquería">✂️ Barbería / Salón</option>
                    <option value="Tattoo & Piercing">💉 Estudio de Tatuajes</option>
                    <option value="Lavadora de Autos">🚗 Car Wash</option>
                    <option value="Otro Comercio">🏪 Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1.5">Idioma / Language</label>
                  <select
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-xs clay-input text-gray-800 font-bold"
                  >
                    <option value="es">🇪🇸 Español (Latam)</option>
                    <option value="en">🇺🇸 English (USA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1.5">Meta de Sellos</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={newMaxStamps}
                    onChange={(e) => setNewMaxStamps(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs clay-input text-gray-800 font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1.5">Premio al Completar</label>
                  <input
                    type="text"
                    required
                    value={newRewardTitle}
                    onChange={(e) => setNewRewardTitle(e.target.value)}
                    placeholder="Ej: 1 Helado / Producto Gratis"
                    className="w-full px-3.5 py-2.5 text-xs clay-input text-gray-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">Eslogan o Subtítulo</label>
                <input
                  type="text"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  placeholder="Ej: Helados, Crepes & Milkshakes"
                  className="w-full px-3.5 py-2.5 text-xs clay-input text-gray-800 font-bold"
                />
              </div>

              {/* Card Background Color Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black text-gray-900">Color de la Tarjeta Digital</label>
                    <p className="text-[11px] text-gray-500">Color principal que verá el cliente en su teléfono</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-7 h-7 rounded-xl shadow-sm border-2 border-white ring-1 ring-slate-200 inline-block"
                      style={{ backgroundColor: newCardBgColor }}
                    />
                    <span className="font-mono text-xs font-black text-gray-800 uppercase">{newCardBgColor}</span>
                  </div>
                </div>

                {/* Preset Circles */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {CARD_COLOR_PRESETS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewCardBgColor(c.hex)}
                      className={`w-7 h-7 rounded-xl cursor-pointer transition-transform flex items-center justify-center shadow-xs ${
                        newCardBgColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'scale-110 ring-2 ring-offset-2 ring-slate-900'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={`${c.name} (${c.hex})`}
                    >
                      {newCardBgColor.toLowerCase() === c.hex.toLowerCase() && (
                        <Check size={14} className="text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pt-1">
                  <label className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <Palette size={13} className="text-[#1D4E3E]" />
                    <span>Elegir otro color:</span>
                    <input
                      type="color"
                      value={newCardBgColor}
                      onChange={(e) => setNewCardBgColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </label>
                  <input
                    type="text"
                    value={newCardBgColor}
                    onChange={(e) => setNewCardBgColor(e.target.value)}
                    placeholder="#1B474A"
                    className="w-24 px-2 py-1 text-xs clay-input font-mono font-bold text-gray-800 uppercase"
                  />
                </div>
              </div>

              {/* Stamp Style Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-black text-gray-900">Diseño del Sello (Sticker en la Tarjeta)</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStampType('logo')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      newStampType === 'logo'
                        ? 'bg-white border-[#1D4E3E] ring-2 ring-[#1D4E3E]/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-gray-900">
                      <span>🖼️ Logo del Negocio</span>
                      {newStampType === 'logo' && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">Activo</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                      El sello será el logo oficial del comercio (como en MC Rolls).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewStampType('icon')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      newStampType === 'icon'
                        ? 'bg-white border-[#1D4E3E] ring-2 ring-[#1D4E3E]/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-gray-900">
                      <span>✨ Ícono / Emoji</span>
                      {newStampType === 'icon' && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">Activo</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                      Usa un emoji temático representativo de su categoría.
                    </p>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    {newStampType === 'logo' ? 'Ícono secundario (si el negocio no sube foto):' : 'Selecciona el ícono del sello:'}
                  </label>
                  <select
                    value={newIconType}
                    onChange={(e) => setNewIconType(e.target.value)}
                    className="w-full px-3 py-2 text-xs clay-input text-gray-800 font-bold"
                  >
                    <option value="icecream">🍦 Helado</option>
                    <option value="burger">🍔 Hamburguesa</option>
                    <option value="pizza">🍕 Pizza</option>
                    <option value="coffee">☕ Café</option>
                    <option value="star">⭐ Estrella VIP</option>
                    <option value="barber">✂️ Barbería / Salón</option>
                    <option value="car">🚗 Lavadora de Autos</option>
                    <option value="gift">🎁 Regalo Sorpresa</option>
                  </select>
                </div>
              </div>

              {/* Owner Credentials */}
              <div className="pt-3 border-t border-gray-100">
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-2">
                  Credenciales de Acceso para el Dueño/Cajero
                </span>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Nombre del dueño (ej. Juan Pérez)"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs clay-input text-gray-800 font-bold"
                  />

                  <input
                    type="email"
                    placeholder="Correo de acceso (ej. juan@gmail.com)"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs clay-input text-gray-800 font-bold"
                  />

                  <div>
                    <label className="block text-[11px] font-black text-gray-700 mb-1 flex items-center justify-between">
                      <span>Contraseña de Acceso para el Cajero *</span>
                      <span className="text-[10px] text-emerald-700 font-bold">Clave para entrar a su caja</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contraseña (ej. will1234)"
                      value={newOwnerPassword}
                      onChange={(e) => setNewOwnerPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs clay-input font-mono text-gray-900 font-black focus:ring-2 focus:ring-[#1D4E3E]"
                    />
                    <p className="text-[10px] text-gray-400 mt-1 font-semibold">
                      El cajero de este local usará este correo y clave para iniciar sesión.
                    </p>
                  </div>

                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                    💡 <strong>Suscripción:</strong> Se activará con acceso completo a Apple Wallet y Google Wallet.
                  </div>

                  {/* Billing Dates for New Store */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider block">
                      🗓️ Periodo de Facturación Inicial
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Fecha de Inicio:</label>
                        <input
                          type="text"
                          value={newJoinedDate}
                          onChange={(e) => setNewJoinedDate(e.target.value)}
                          placeholder="Ej: 24 Oct 2026"
                          className="w-full px-3 py-2 text-xs clay-input text-gray-800 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">Pagado Hasta (1 Mes):</label>
                        <input
                          type="text"
                          value={newPaidUntil}
                          onChange={(e) => setNewPaidUntil(e.target.value)}
                          placeholder="Ej: 24 Nov 2026"
                          className="w-full px-3 py-2 text-xs clay-input text-gray-800 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1D4E3E] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#153B2F]"
                >
                  Crear y Activar Local
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR FOTO DE LOGO ================= */}
      {editingLogoStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-gray-900">
                    Cambiar Foto del Logo
                  </h3>
                  <p className="text-xs text-gray-500">{editingLogoStore.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingLogoStore(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Logo Preview */}
              <div className="flex flex-col items-center justify-center p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8E3DA]">
                <div className="w-28 h-28 rounded-2xl bg-white shadow-md border border-gray-200 overflow-hidden flex items-center justify-center relative mb-2 p-2">
                  {selectedLogoData ? (
                    <img src={selectedLogoData} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-5xl">
                      {editingLogoStore.iconType === 'pizza' ? '🍕' : editingLogoStore.iconType === 'coffee' ? '☕' : editingLogoStore.iconType === 'burger' ? '🍔' : '🏪'}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-700">
                  {selectedLogoData ? 'Vista previa del logo actual' : 'Sin imagen (icono por defecto)'}
                </span>
                <span className="text-[11px] text-gray-400 mt-0.5">
                  Se verá en la tarjeta de fidelidad, en los sellos y en la pantalla del cajero.
                </span>
              </div>

              {logoUploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{logoUploadError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoUploadLoading}
                  className="w-full py-3 px-4 bg-[#1D4E3E] hover:bg-[#153B2F] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Upload size={16} />
                  <span>{logoUploadLoading ? 'Procesando imagen...' : '📁 Subir foto desde mi PC o Teléfono'}</span>
                </button>

                {selectedLogoData && (
                  <button
                    type="button"
                    onClick={() => setSelectedLogoData('')}
                    className="w-full py-2.5 px-4 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Quitar foto y usar icono emoji</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLogoStore(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveLogo}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  💾 Guardar Logo en la Nube
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CAMBIAR CONTRASEÑA DE ADMINISTRADOR ================= */}
      {showChangeAdminPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-gray-900">
                    Cambiar Mi Contraseña de Admin
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">admin@fidelipass.com</p>
                </div>
              </div>
              <button
                onClick={() => setShowChangeAdminPassModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:text-gray-800 flex items-center justify-center cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangeAdminPasswordSubmit} className="p-6 space-y-4">
              {adminPassSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>¡Contraseña de Administrador actualizada exitosamente en la nube!</span>
                </div>
              )}

              {adminPassError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{adminPassError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nueva Contraseña de Administrador *
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? "text" : "password"}
                    required
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8E3DA] rounded-xl font-mono text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#1D4E3E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    {showPasswordText ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  required
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF7F2] border border-[#E8E3DA] rounded-xl font-mono text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#1D4E3E]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                🛡️ <strong>Importante:</strong> Esta contraseña te dará acceso total al Panel Maestro Super-Admin y al control de los cobros de todos los locales afiliados.
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangeAdminPassModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adminPassSuccess}
                  className="px-5 py-2.5 bg-[#1D4E3E] hover:bg-[#153B2F] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock size={14} />
                  <span>Guardar Nueva Clave</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR LOGO OFICIAL DE FIDELIPASS ================= */}
      {showPlatformLogoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md clay-card bg-white overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between rounded-t-[28px] bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black shadow-xs">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-gray-900">
                    Logo Oficial de tu Plataforma
                  </h3>
                  <p className="text-xs text-gray-500 font-bold">Personaliza la imagen principal de {platformName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlatformLogoModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-gray-500 hover:text-gray-900 flex items-center justify-center cursor-pointer text-sm font-bold shadow-2xs"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Logo Preview */}
              <div className="flex flex-col items-center justify-center p-5 clay-card bg-slate-50">
                <div className="w-28 h-28 rounded-2xl bg-[#1D4E3E] shadow-md border border-slate-200 overflow-hidden flex items-center justify-center relative mb-2 p-2">
                  {selectedPlatformLogoData ? (
                    <img src={selectedPlatformLogoData} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <span className="text-5xl">👑</span>
                  )}
                </div>
                <span className="text-xs font-bold text-gray-700">
                  {selectedPlatformLogoData ? 'Vista previa del logo oficial' : 'Sin logo personalizado (icono por defecto)'}
                </span>
                <span className="text-[11px] text-gray-400 font-semibold mt-0.5 text-center">
                  Este logo aparecerá en el encabezado del Super-Admin, en el inicio de sesión y en toda la plataforma.
                </span>
              </div>

              {platformLogoUploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{platformLogoUploadError}</span>
                </div>
              )}

              {/* Platform Name Edit */}
              <div>
                <label className="block text-xs font-black text-gray-700 mb-1.5">Nombre de la Plataforma / Tu Marca</label>
                <input
                  type="text"
                  value={editPlatformNameState}
                  onChange={(e) => setEditPlatformNameState(e.target.value)}
                  placeholder="Ej: FideliPass"
                  className="w-full px-4 py-2.5 clay-input text-xs font-bold text-gray-800"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <input
                  type="file"
                  ref={platformLogoFileInputRef}
                  onChange={handlePlatformLogoFileChange}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => platformLogoFileInputRef.current?.click()}
                  disabled={platformLogoLoading}
                  className="w-full py-3.5 px-4 clay-btn clay-btn-primary text-white text-xs font-black shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload size={16} />
                  <span>{platformLogoLoading ? 'Procesando imagen...' : '📁 Subir foto de mi Logo (PNG, JPG, SVG)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlatformLogoData('/logos/fidelipass-logo.png')}
                  className="w-full py-2.5 px-4 clay-btn clay-btn-light text-emerald-800 hover:text-emerald-950 text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs border border-emerald-200 bg-emerald-50/70"
                >
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>Restablecer al Logo Oficial FideliPass (Limpio HD)</span>
                </button>

                {selectedPlatformLogoData && (
                  <button
                    type="button"
                    onClick={() => setSelectedPlatformLogoData('')}
                    className="w-full py-2.5 px-4 clay-btn clay-btn-light text-gray-700 hover:text-red-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Trash2 size={14} />
                    <span>Quitar foto personalizada</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPlatformLogoModal(false)}
                  className="clay-btn clay-btn-light px-4 py-2 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePlatformSettings}
                  className="clay-btn clay-btn-primary px-5 py-2.5 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle size={14} />
                  <span>Guardar Logo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Store Design & Color Modal (Claymorphic) */}
      {editingDesignStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg clay-card bg-white overflow-hidden shadow-2xl my-6">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between rounded-t-[28px]">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl text-white flex items-center justify-center font-black text-sm shadow-xs transition-colors"
                  style={{ backgroundColor: designCardBgColor }}
                >
                  <Palette size={20} />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-gray-900 leading-tight">
                    Personalizar Tarjeta y Sellos
                  </h3>
                  <p className="text-[11px] text-gray-500 font-bold">
                    Local: <strong className="text-gray-900">{editingDesignStore.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDesignStore(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-700 flex items-center justify-center cursor-pointer shadow-2xs font-bold"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Live Preview Card */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider block">
                  Vista Previa en Vivo (Cómo la verá el cliente)
                </span>
                <div 
                  className="p-4 rounded-3xl text-white transition-all duration-300 shadow-md relative overflow-hidden"
                  style={{ backgroundColor: designCardBgColor }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/15">
                    <div className="flex items-center gap-2.5">
                      {editingDesignStore.logo ? (
                        <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center">
                          <img src={editingDesignStore.logo} alt={editingDesignStore.name} className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                          🏪
                        </div>
                      )}
                      <div>
                        <div className="font-black text-sm tracking-tight leading-tight">{editingDesignStore.name}</div>
                        <div className="text-[10px] text-white/80">{editingDesignStore.tagline || 'Tarjeta de Fidelidad'}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
                      CLUB VIP
                    </span>
                  </div>

                  {/* Stamp slots preview */}
                  <div className="grid grid-cols-4 gap-2 pt-3">
                    {/* Slot 1: Stamped */}
                    <div className="aspect-square rounded-2xl bg-white text-[#173E31] shadow-sm flex flex-col items-center justify-center p-1">
                      {designStampType === 'logo' && editingDesignStore.logo ? (
                        <img src={editingDesignStore.logo} alt="Logo" className="w-6 h-6 object-contain" />
                      ) : (
                        <span className="text-xl">
                          {designIconType === 'icecream' ? '🍦' :
                           designIconType === 'burger' ? '🍔' :
                           designIconType === 'pizza' ? '🍕' :
                           designIconType === 'coffee' ? '☕' :
                           designIconType === 'star' ? '⭐' :
                           designIconType === 'barber' ? '✂️' :
                           designIconType === 'car' ? '🚗' : '🎁'}
                        </span>
                      )}
                      <span className="text-[8px] font-black uppercase tracking-tighter truncate max-w-[46px]" style={{ color: designCardBgColor }}>
                        {editingDesignStore.name}
                      </span>
                    </div>

                    {/* Slot 2: Stamped */}
                    <div className="aspect-square rounded-2xl bg-white text-[#173E31] shadow-sm flex flex-col items-center justify-center p-1">
                      {designStampType === 'logo' && editingDesignStore.logo ? (
                        <img src={editingDesignStore.logo} alt="Logo" className="w-6 h-6 object-contain" />
                      ) : (
                        <span className="text-xl">
                          {designIconType === 'icecream' ? '🍦' :
                           designIconType === 'burger' ? '🍔' :
                           designIconType === 'pizza' ? '🍕' :
                           designIconType === 'coffee' ? '☕' :
                           designIconType === 'star' ? '⭐' :
                           designIconType === 'barber' ? '✂️' :
                           designIconType === 'car' ? '🚗' : '🎁'}
                        </span>
                      )}
                      <span className="text-[8px] font-black uppercase tracking-tighter truncate max-w-[46px]" style={{ color: designCardBgColor }}>
                        {editingDesignStore.name}
                      </span>
                    </div>

                    {/* Slot 3: Empty */}
                    <div className="aspect-square rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center text-[10px] font-bold text-white/60">
                      <span>#3</span>
                    </div>

                    {/* Slot 4: Empty */}
                    <div className="aspect-square rounded-2xl bg-white/10 border border-white/20 flex flex-col items-center justify-center text-[10px] font-bold text-white/60">
                      <span>#4</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Presets & Custom Picker */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-black text-gray-900">Color de Fondo de la Tarjeta</label>
                    <p className="text-[11px] text-gray-500 font-semibold">Toca cualquier color para aplicarlo al instante</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-7 h-7 rounded-xl shadow-sm border-2 border-white ring-1 ring-slate-200 inline-block"
                      style={{ backgroundColor: designCardBgColor }}
                    />
                    <span className="font-mono text-xs font-black text-gray-800 uppercase">{designCardBgColor}</span>
                  </div>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {CARD_COLOR_PRESETS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setDesignCardBgColor(c.hex)}
                      className={`w-8 h-8 rounded-xl cursor-pointer transition-transform flex items-center justify-center shadow-xs ${
                        designCardBgColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'scale-110 ring-2 ring-offset-2 ring-slate-900'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={`${c.name} (${c.hex})`}
                    >
                      {designCardBgColor.toLowerCase() === c.hex.toLowerCase() && (
                        <Check size={16} className="text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 pt-1">
                  <label className="clay-btn clay-btn-light px-3 py-1.5 text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-2xs">
                    <Palette size={13} className="text-[#1D4E3E]" />
                    <span>Selector de Color Libre:</span>
                    <input
                      type="color"
                      value={designCardBgColor}
                      onChange={(e) => setDesignCardBgColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </label>
                  <input
                    type="text"
                    value={designCardBgColor}
                    onChange={(e) => setDesignCardBgColor(e.target.value)}
                    placeholder="#1B474A"
                    className="w-24 px-2 py-1 text-xs clay-input font-mono font-bold text-gray-800 uppercase"
                  />
                </div>
              </div>

              {/* Stamp Style Options */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-black text-gray-900">Diseño del Sello (Sticker que gana el cliente)</label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDesignStampType('logo')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      designStampType === 'logo'
                        ? 'bg-white border-[#1D4E3E] ring-2 ring-[#1D4E3E]/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-gray-900">
                      <span>🖼️ Logo del Negocio</span>
                      {designStampType === 'logo' && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">Activo</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                      El sticker será la foto del logo de {editingDesignStore.name}.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDesignStampType('icon')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      designStampType === 'icon'
                        ? 'bg-white border-[#1D4E3E] ring-2 ring-[#1D4E3E]/20 shadow-xs'
                        : 'bg-white/60 border-slate-200 hover:bg-white text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-gray-900">
                      <span>✨ Ícono / Emoji</span>
                      {designStampType === 'icon' && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">Activo</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 leading-snug">
                      Mostrará un ícono emoji en lugar del logo.
                    </p>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    {designStampType === 'logo' ? 'Ícono secundario (de respaldo):' : 'Selecciona el emoji del sello:'}
                  </label>
                  <select
                    value={designIconType}
                    onChange={(e) => setDesignIconType(e.target.value)}
                    className="w-full px-3 py-2 text-xs clay-input text-gray-800 font-bold"
                  >
                    <option value="icecream">🍦 Helado</option>
                    <option value="burger">🍔 Hamburguesa</option>
                    <option value="pizza">🍕 Pizza</option>
                    <option value="coffee">☕ Café</option>
                    <option value="star">⭐ Estrella VIP</option>
                    <option value="barber">✂️ Barbería / Salón</option>
                    <option value="car">🚗 Lavadora de Autos</option>
                    <option value="gift">🎁 Regalo Sorpresa</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingDesignStore(null)}
                  className="clay-btn clay-btn-light px-4 py-2 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDesign}
                  className="clay-btn clay-btn-primary px-5 py-2.5 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle size={14} />
                  <span>Guardar Tarjeta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUSPENSION / REACTIVATION CONFIRMATION MODAL ================= */}
      {suspensionTargetStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left">
            <div className={`p-6 border-b ${suspensionTargetStore.status === 'suspended' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xs shrink-0 ${
                  suspensionTargetStore.status === 'suspended' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {suspensionTargetStore.status === 'suspended' ? <Play size={22} className="fill-current" /> : <Pause size={22} className="fill-current" />}
                </div>
                <div>
                  <h3 className="font-heading font-black text-base sm:text-lg text-gray-900 leading-tight">
                    {suspensionTargetStore.status === 'suspended' 
                      ? `¿Deseas reactivar a ${suspensionTargetStore.name}?` 
                      : `¿Estás seguro que quieres suspender a ${suspensionTargetStore.name}?`}
                  </h3>
                  <p className="text-xs text-gray-600 font-semibold mt-0.5">
                    {suspensionTargetStore.status === 'suspended' ? 'Habilitar acceso y tarjeta' : 'Pausar servicio por falta de pago'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {suspensionTargetStore.status === 'suspended' ? (
                <div className="space-y-3 text-xs text-gray-600">
                  <p className="font-bold text-gray-800">
                    Al reactivar este local:
                  </p>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">✓</span>
                      <span>La terminal de caja se habilitará al instante para el dueño y cajeros.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">✓</span>
                      <span>Los clientes volverán a ver su tarjeta activa con código QR y premios.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">✓</span>
                      <span>Todos los sellos y clientes guardados continúan intactos.</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-gray-600">
                  <p className="font-bold text-gray-800">
                    Al suspender este local por falta de pago:
                  </p>
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-700 font-bold">⏸️</span>
                      <span>La aplicación y caja del dueño quedará pausada y no podrá otorgar sellos.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-700 font-bold">⏸️</span>
                      <span>Los clientes verán un aviso de cortesía indicando que el servicio está temporalmente en pausa.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-700 font-bold">🔒</span>
                      <span className="font-bold text-gray-800">Los sellos y datos de los clientes NO se borran. Quedan 100% protegidos en la nube.</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 italic">
                    Podrás volver a habilitarlo con un solo clic en cuanto el negocio se ponga al día.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSuspensionTargetStore(null)}
                  className="clay-btn clay-btn-light px-4 py-2.5 text-gray-700 text-xs font-bold cursor-pointer"
                >
                  No, Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmToggleSuspend}
                  className={`clay-btn px-5 py-2.5 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer ${
                    suspensionTargetStore.status === 'suspended'
                      ? 'clay-btn-primary bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {suspensionTargetStore.status === 'suspended' ? (
                    <>
                      <Play size={14} className="fill-current" />
                      <span>Sí, Reactivar Local</span>
                    </>
                  ) : (
                    <>
                      <Pause size={14} className="fill-current" />
                      <span>Sí, Suspender Local</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MULTI-BRANCH / CASHIER ACCOUNTS MODAL ================= */}
      {branchesStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl shrink-0 border border-white/20">
                  🏢
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-black text-lg sm:text-xl truncate leading-tight">
                    Sucursales de {branchesStore.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Accesos de caja independientes sincronizados a la misma tarjeta
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBranchesStore(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Concept Banner */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 space-y-1">
                <div className="font-black flex items-center gap-1.5 text-blue-950">
                  <span>💡 ¿Cómo funciona una cadena con múltiples sucursales?</span>
                </div>
                <p className="text-blue-800 leading-relaxed text-[11px]">
                  Cada sucursal (ej. Urdesa, Alborada, Centro) tiene su propio correo y clave de caja. Cuando un cliente compra en cualquiera de las 13 sucursales, <strong>los sellos se suman automáticamente a la misma tarjeta de {branchesStore.name}</strong> en tiempo real.
                </p>
              </div>

              {/* Existing Branches List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-black text-sm text-gray-900 flex items-center gap-2">
                    <span>Sucursales Activas</span>
                    <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                      {accounts.filter(a => a.businessId === branchesStore.id).length || 1}
                    </span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {accounts.filter(a => a.businessId === branchesStore.id).length === 0 ? (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-gray-400">
                      Acceso principal: {branchesStore.ownerEmail} (Clave: {branchesStore.ownerPassword || '123456'})
                    </div>
                  ) : (
                    accounts.filter(a => a.businessId === branchesStore.id).map((acc, idx) => (
                      <div
                        key={acc.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900 text-sm">{acc.name}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                              Caja #{idx + 1}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 font-mono mt-1">
                            <span>✉️ {acc.email}</span>
                            <span>•</span>
                            <span className="font-bold text-gray-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              🔑 Clave: {acc.password || '123456'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fidelipassapp.com';
                              const msg = encodeURIComponent(
                                `👋 Hola equipo de *${acc.name}* (${branchesStore.name}):\n\n` +
                                `Aquí tienen sus datos para acceder a la terminal de caja de FideliPass:\n` +
                                `🌐 Enlace: ${origin}\n` +
                                `✉️ Correo: ${acc.email}\n` +
                                `🔑 Contraseña: ${acc.password || '123456'}\n\n` +
                                `¡Ya pueden iniciar sesión para escanear y entregar sellos a los clientes!`
                              );
                              window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
                            }}
                            className="clay-btn bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Enviar clave de esta sucursal por WhatsApp"
                          >
                            <span>WhatsApp</span>
                          </button>

                          {accounts.filter(a => a.businessId === branchesStore.id).length > 1 && onDeleteAccount && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Eliminar el acceso para "${acc.name}"?`)) {
                                  onDeleteAccount(acc.id);
                                }
                              }}
                              className="clay-btn bg-red-50 hover:bg-red-100 text-red-600 p-2 cursor-pointer shadow-2xs"
                              title="Eliminar esta sucursal"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Form to Add New Branch */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3.5 shadow-xs">
                <h4 className="font-heading font-black text-xs uppercase tracking-wider text-gray-500">
                  + Añadir Nueva Sucursal o Caja
                </h4>

                {branchError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                    {branchError}
                  </div>
                )}
                {branchSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    ✓ {branchSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateBranchAccount} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Nombre de Sucursal:
                      </label>
                      <input
                        type="text"
                        value={branchName}
                        onChange={(e) => setBranchName(e.target.value)}
                        placeholder="Ej. Sucursal Urdesa"
                        className="w-full px-3 py-2 text-xs clay-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Correo de Acceso:
                      </label>
                      <input
                        type="email"
                        value={branchEmail}
                        onChange={(e) => setBranchEmail(e.target.value)}
                        placeholder="urdesa@reypizza.com"
                        className="w-full px-3 py-2 text-xs clay-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Contraseña de Caja:
                      </label>
                      <input
                        type="text"
                        value={branchPassword}
                        onChange={(e) => setBranchPassword(e.target.value)}
                        placeholder="Clave (ej. rey123)"
                        className="w-full px-3 py-2 text-xs clay-input font-mono font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="clay-btn clay-btn-primary px-4 py-2 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Crear Sucursal</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setBranchesStore(null)}
                className="clay-btn clay-btn-light px-5 py-2 text-gray-700 text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR FECHAS DE FACTURACIÓN ================= */}
      {editingDatesStore && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md clay-card bg-white shadow-2xl rounded-3xl border border-slate-200 overflow-hidden text-left">
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-[#1D4E3E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarCheck size={20} className="text-emerald-300" />
                <div>
                  <h3 className="font-heading font-black text-sm sm:text-base leading-tight">
                    Periodo y Fechas: {editingDatesStore.name}
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-medium">Control visual de facturación y vigencia</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDatesStore(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDates} className="p-6 space-y-4">
              {dateUpdateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-black text-emerald-900 flex items-center gap-2">
                  <Check size={16} className="text-emerald-600" />
                  <span>{dateUpdateSuccess}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    💵 Tarifa Mensual ($ USD / mes):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-xs">$</span>
                    <input
                      type="number"
                      step="0.50"
                      min="0"
                      value={customMonthlyFee}
                      onChange={(e) => setCustomMonthlyFee(e.target.value)}
                      placeholder="15.00"
                      className="w-full pl-7 pr-3.5 py-2.5 text-xs clay-input text-gray-900 font-black"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Monto mensual que aporta este local a tu ingreso recurrente (ej: 15.00)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    🗓️ Fecha de Inicio del Negocio:
                  </label>
                  <input
                    type="text"
                    value={customJoinedDate}
                    onChange={(e) => setCustomJoinedDate(e.target.value)}
                    placeholder="Ej: 18 Oct 2026"
                    className="w-full px-3.5 py-2.5 text-xs clay-input text-gray-800 font-bold"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Día que comenzó a usar FideliPass</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">
                    💳 Pagado Hasta / Fecha de Renovación:
                  </label>
                  <input
                    type="text"
                    value={customPaidUntil}
                    onChange={(e) => setCustomPaidUntil(e.target.value)}
                    placeholder="Ej: 18 Nov 2026"
                    className="w-full px-3.5 py-2.5 text-xs clay-input text-gray-800 font-bold"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Cuando esta fecha pase, verás una alerta de cobro en tu panel (la terminal sigue activa).
                  </p>
                </div>
              </div>

              {/* Quick shortcut buttons */}
              <div className="pt-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                  Atajos de Renovación Rápida
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const base = parseSpanishDate(customPaidUntil) || new Date();
                      const n = new Date(base.getTime() + 30 * 86400000);
                      setCustomPaidUntil(formatDateSpanish(n));
                    }}
                    className="clay-btn clay-btn-light px-3 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-50 cursor-pointer shadow-xs"
                  >
                    +30 Días desde fecha actual
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const n = new Date(Date.now() + 30 * 86400000);
                      setCustomPaidUntil(formatDateSpanish(n));
                    }}
                    className="clay-btn clay-btn-light px-3 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-xs"
                  >
                    +30 Días desde Hoy
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDatesStore(null)}
                  className="flex-1 py-2.5 clay-btn clay-btn-light text-gray-700 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 clay-btn clay-btn-primary text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Guardar Fechas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
