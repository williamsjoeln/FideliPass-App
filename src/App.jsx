import React, { useState, useEffect } from 'react';
import { 
  INITIAL_BUSINESS, 
  INITIAL_CUSTOMERS, 
  INITIAL_NOTIFICATIONS 
} from './data/mockData';
import { INITIAL_ACCOUNTS, INITIAL_STORES } from './services/auth';
import { MerchantDashboard } from './components/MerchantDashboard';
import { CustomerCard } from './components/CustomerCard';
import { CustomerRegistration } from './components/CustomerRegistration';
import { QRScannerModal } from './components/QRScannerModal';
import { PrintableCounterSign } from './components/PrintableCounterSign';
import { BusinessCalculator } from './components/BusinessCalculator';
import { LoginScreen } from './components/LoginScreen';
import { LandingPage } from './components/LandingPage';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { 
  Smartphone, Store, Columns, Printer, Calculator, 
  Sparkles, Check, ArrowRight, UserPlus, HelpCircle, 
  LogOut, Shield, User
} from 'lucide-react';
import { sounds } from './utils/audio';
import { 
  matchesStore,
  subscribeToStoreCustomers, 
  syncCustomerToFirestore, 
  updateCustomerStampsInFirestore,
  subscribeToStores,
  subscribeToAccounts,
  syncStoreToFirestore,
  syncAccountToFirestore,
  deleteStoreFromFirestore,
  deleteAccountFromFirestore,
  deleteCustomerFromFirestore,
  subscribeToPlatformSettings,
  syncPlatformSettingsToFirestore,
  subscribeToStoreNotifications,
  syncNotificationToFirestore,
  clearStoreNotificationsInFirestore,
  triggerBrowserNotification
} from './services/firestoreSync';
import { sendGoogleWalletPushNotification } from './services/googleWalletService';
import { sendAppleWalletPushNotification } from './services/appleWalletService';
import { Capacitor } from '@capacitor/core';

export function isNativeMobileApp() {
  try {
    if (typeof window === 'undefined') return false;
    if (Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
      return true;
    }
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) {
      return true;
    }
    if (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:') {
      return true;
    }
    if (window.location.hostname === 'localhost' && window.Capacitor) {
      return true;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('app') === 'true' || params.get('caja') === 'true' || params.get('native') === 'true') {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function parseFideliPassRoute() {
  if (typeof window === 'undefined') {
    return { storeParam: null, custParam: null, nameParam: null, isLogin: false, forceRegister: false };
  }
  try {
    const isNative = isNativeMobileApp();
    const params = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/').filter(Boolean);

    let pathStoreId = null;
    let isLogin = isNative || params.get('login') === 'true' || params.get('caja') === 'true' || params.get('app') === 'true';
    let forceRegister = params.get('registro') === 'true' || params.get('register') === 'true' || params.get('nuevo') === 'true';
    let forceCard = params.get('demo') === 'true' || params.get('tarjeta') === 'true';

    const isAdmin = pathParts[0] === 'admin' || params.get('admin') === 'true';
    if (isAdmin) {
      return { storeParam: null, custParam: null, nameParam: null, isLogin: false, forceRegister: false, forceCard: false, isAdmin: true };
    }

    if (pathParts[0] === 'login' || pathParts[0] === 'caja') {
      isLogin = true;
    } else if (pathParts[0] === 'registro' && pathParts[1]) {
      pathStoreId = pathParts[1];
      forceRegister = true;
    } else if (pathParts[0] === 'loyalty' && pathParts[1]) {
      pathStoreId = pathParts[1];
      if (pathParts[2] === 'register') forceRegister = true;
    } else if (pathParts[0] === 'tarjeta' && pathParts[1]) {
      pathStoreId = pathParts[1];
      forceCard = true;
    } else if (pathParts[0] === 'demo' && pathParts[1]) {
      pathStoreId = pathParts[1];
      forceCard = true;
    } else if (pathParts.length === 1 && !['admin', 'api', 'assets', 'logos', 'index.html'].includes(pathParts[0])) {
      pathStoreId = pathParts[0];
    }

    const storeParam = params.get('store') || params.get('b') || params.get('local') || pathStoreId;
    const custParam = params.get('c') || params.get('cust');
    const nameParam = params.get('n') || params.get('name');

    // On native mobile app, if there is no session, ALWAYS stay in login mode
    if (isNative && !sessionStorage.getItem('fidelipass_session') && !localStorage.getItem('fidelipass_session')) {
      return { storeParam: null, custParam: null, nameParam: null, isLogin: true, forceRegister: false, forceCard: false, isAdmin: false };
    }

    return { storeParam, custParam, nameParam, isLogin, forceRegister, forceCard, isAdmin: false };
  } catch {
    return { storeParam: null, custParam: null, nameParam: null, isLogin: isNativeMobileApp(), forceRegister: false };
  }
}

export function slugifyStoreName(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function findStoreByParam(storesList, storeParam, defaultStore) {
  if (!storeParam || !Array.isArray(storesList) || storesList.length === 0) {
    return defaultStore;
  }
  const clean = storeParam.trim().toLowerCase();
  const slug = slugifyStoreName(storeParam);

  // 1. Direct ID or slug match
  let found = storesList.find(s => 
    (s.id && s.id.toLowerCase() === clean) ||
    (s.slug && s.slug.toLowerCase() === clean) ||
    (s.slug && s.slug.toLowerCase() === slug)
  );
  if (found) return found;

  // 2. Slug match on store name (e.g. "El Cafecito de Simba" -> "el-cafecito-de-simba")
  found = storesList.find(s => slugifyStoreName(s.name) === slug);
  if (found) return found;

  // 3. Substring match on name, slug or ID
  found = storesList.find(s => 
    (s.name && s.name.toLowerCase().includes(clean)) ||
    (clean.length > 3 && s.name && slugifyStoreName(s.name).includes(slug)) ||
    (clean.length > 3 && s.name && clean.includes(slugifyStoreName(s.name))) ||
    (s.id && s.id.toLowerCase().includes(clean))
  );
  if (found) return found;

  return defaultStore;
}

export default function App() {
  const [platformName, setPlatformName] = useState(() => {
    try {
      return localStorage.getItem('fidelipass_platform_name') || 'FideliPass';
    } catch {
      return 'FideliPass';
    }
  });
  const [platformLogo, setPlatformLogo] = useState(() => {
    try {
      const stored = localStorage.getItem('fidelipass_platform_logo');
      if (stored && stored.startsWith('data:image')) {
        localStorage.setItem('fidelipass_platform_logo', '/logos/fidelipass-logo.png');
        return '/logos/fidelipass-logo.png';
      }
      return stored || '/logos/fidelipass-logo.png';
    } catch {
      return '/logos/fidelipass-logo.png';
    }
  });
  const [isEditingBrand, setIsEditingBrand] = useState(false);

  // Authentication State with permanent LocalStorage persistence
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('fidelipass_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(a => a.businessId !== 'pizzeria-bella' && a.businessId !== 'cafe-roble' && a.businessId !== 'willstore');
          return cleaned.map(acc => ({
            ...acc,
            password: String(acc.password || (acc.role === 'admin' ? 'williamsadmin' : '123')).trim()
          }));
        }
      }
      return INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fidelipass_session') || sessionStorage.getItem('fidelipass_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.role === 'admin' || parsed.role === 'merchant')) {
          return parsed;
        }
      }
      if (isNativeMobileApp()) {
        return null;
      }
      const route = parseFideliPassRoute();
      if (route.storeParam || route.custParam) {
        return { role: 'guest', name: 'Cliente Invitado' };
      }
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAdminMasterView, setShowAdminMasterView] = useState(() => {
    try {
      const route = parseFideliPassRoute();
      if (route.isAdmin) return true;
      const savedAdminView = localStorage.getItem('fidelipass_show_admin_master') || sessionStorage.getItem('fidelipass_show_admin_master');
      if (savedAdminView !== null) {
        return savedAdminView === 'true';
      }
      const saved = localStorage.getItem('fidelipass_session') || sessionStorage.getItem('fidelipass_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.role === 'admin';
      }
      return false;
    } catch {
      return false;
    }
  });

  const [showLoginModal, setShowLoginModal] = useState(() => {
    try {
      if (isNativeMobileApp()) return true;
      const route = parseFideliPassRoute();
      return route.isLogin;
    } catch {
      return false;
    }
  });

  const [appLang, setAppLang] = useState(() => {
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

  const toggleAppLang = (newLang) => {
    setAppLang(newLang);
    try {
      localStorage.setItem('fidelipass_lang', newLang);
    } catch {}
  };

  useEffect(() => {
    try {
      if (currentUser && currentUser.role !== 'guest') {
        const isRemembered = localStorage.getItem('fidelipass_remember_me') !== 'false';
        if (isRemembered) {
          localStorage.setItem('fidelipass_session', JSON.stringify(currentUser));
        } else {
          localStorage.removeItem('fidelipass_session');
        }
        sessionStorage.setItem('fidelipass_session', JSON.stringify(currentUser));
      }
    } catch (e) {
      console.warn("Session storage error", e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      if (currentUser?.role === 'admin') {
        const isRemembered = localStorage.getItem('fidelipass_remember_me') !== 'false';
        if (isRemembered) {
          localStorage.setItem('fidelipass_show_admin_master', String(showAdminMasterView));
        }
        sessionStorage.setItem('fidelipass_show_admin_master', String(showAdminMasterView));
      } else {
        localStorage.removeItem('fidelipass_show_admin_master');
        sessionStorage.removeItem('fidelipass_show_admin_master');
      }
    } catch (e) {
      console.warn("Session storage error", e);
    }
  }, [showAdminMasterView, currentUser]);

  // Multi-tenant Stores List with permanent LocalStorage persistence
  const [stores, setStores] = useState(() => {
    try {
      const saved = localStorage.getItem('fidelipass_stores');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(s => s.id !== 'pizzeria-bella' && s.id !== 'cafe-roble' && s.id !== 'willstore');
          return cleaned.map(st => ({
            ...st,
            ownerPassword: String(st.ownerPassword || '123').trim()
          }));
        }
      }
      return INITIAL_STORES;
    } catch {
      return INITIAL_STORES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fidelipass_accounts', JSON.stringify(accounts));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem('fidelipass_stores', JSON.stringify(stores));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [stores]);

  const [business, setBusiness] = useState(() => {
    try {
      const route = parseFideliPassRoute();
      let storeParam = route.storeParam;
      if (!storeParam) {
        storeParam = localStorage.getItem('fidelipass_active_store_id') || sessionStorage.getItem('fidelipass_active_store_id');
      }
      if (storeParam) {
        const savedStore = localStorage.getItem(`fidelipass_store_${storeParam}`);
        if (savedStore) {
          try { return JSON.parse(savedStore); } catch {}
        }
        const savedStores = localStorage.getItem('fidelipass_stores');
        if (savedStores) {
          try {
            const parsed = JSON.parse(savedStores);
            const found = findStoreByParam(parsed, storeParam, null);
            if (found) return found;
          } catch {}
        }
        const found = findStoreByParam(INITIAL_STORES, storeParam, null);
        if (found) return found;
      }
      return INITIAL_BUSINESS;
    } catch {
      return INITIAL_BUSINESS;
    }
  });

  // Keep business in sync with active store selection as stores finish loading
  useEffect(() => {
    try {
      const activeStoreId = localStorage.getItem('fidelipass_active_store_id') || sessionStorage.getItem('fidelipass_active_store_id');
      if (activeStoreId && Array.isArray(stores) && stores.length > 0) {
        const matchingStore = findStoreByParam(stores, activeStoreId, null);
        if (matchingStore && matchingStore.id !== business?.id) {
          setBusiness(matchingStore);
        }
      }
    } catch (e) {
      console.warn("Store sync error", e);
    }
  }, [stores]);

  // Keep active store, LocalStorage and URL in perfect lockstep so F5 never switches stores
  useEffect(() => {
    if (business?.id) {
      try {
        localStorage.setItem('fidelipass_active_store_id', business.id);
        sessionStorage.setItem('fidelipass_active_store_id', business.id);
        localStorage.setItem(`fidelipass_store_${business.id}`, JSON.stringify(business));
        if (business.slug) {
          localStorage.setItem(`fidelipass_store_${business.slug}`, JSON.stringify(business));
        }

        if (typeof window !== 'undefined') {
          const savedSession = localStorage.getItem('fidelipass_session') || sessionStorage.getItem('fidelipass_session');
          let role = null;
          try { role = JSON.parse(savedSession)?.role; } catch {}

          if (role === 'admin' || role === 'merchant') {
            const isAdminMaster = localStorage.getItem('fidelipass_show_admin_master') === 'true';
            if (isAdminMaster) {
              if (window.location.pathname !== '/admin') {
                window.history.replaceState(null, '', '/admin');
              }
            } else {
              const targetSlug = business.slug || business.id;
              const currentPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
              if (currentPath !== targetSlug && !['login', 'caja'].includes(currentPath)) {
                window.history.replaceState(null, '', `/${targetSlug}`);
              }
            }
          }
        }
      } catch (e) {
        console.warn("Business sync error", e);
      }
    }
  }, [business?.id, business?.slug, showAdminMasterView]);

  const [customers, setCustomers] = useState(() => {
    const MOCK_IDS = new Set(['cust-1', 'cust-2', 'cust-3', 'cust-4', 'cust-5']);
    try {
      const saved = localStorage.getItem('fidelipass_customers');
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed = parsed.filter(c => !MOCK_IDS.has(c.id) && !c.name?.startsWith('Primer Cliente ('));
          parsed = parsed.map(c => {
            if (c.id.toLowerCase() === 'cust-9023') {
              return {
                ...c,
                name: 'Williams Navarrete',
                email: 'williams_joel@hotmail.com',
                phone: '+593 99 240 7645',
                currentStamps: Math.max(c.currentStamps || 1, 2)
              };
            }
            return c;
          });
          return parsed;
        }
      }
      return INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fidelipass_customers', JSON.stringify(customers));
    } catch (e) {
      console.warn("Storage error", e);
    }
  }, [customers]);

  // One-time cleanup of mock customers & test stores from Firestore
  useEffect(() => {
    const MOCK_IDS = ['cust-1', 'cust-2', 'cust-3', 'cust-4', 'cust-5'];
    MOCK_IDS.forEach(id => {
      deleteCustomerFromFirestore(id);
    });
    deleteStoreFromFirestore('willstore');
    deleteAccountFromFirestore('acc-willstore');
    try {
      localStorage.removeItem('fidelipass_store_willstore');
    } catch {}
  }, []);

  // Real-time Cloud Sync for registered customers of the active store
  useEffect(() => {
    if (!business?.id) return;
    try {
      const MOCK_IDS = new Set(['cust-1', 'cust-2', 'cust-3', 'cust-4', 'cust-5']);
      const unsub = subscribeToStoreCustomers(business.id, (remoteCustomers) => {
        if (!Array.isArray(remoteCustomers)) return;
        setCustomers(prev => {
          // Keep customers belonging to OTHER stores
          const otherStoresCustomers = prev.filter(c => 
            !MOCK_IDS.has(c.id) && 
            !c.name?.startsWith('Primer Cliente (') && 
            !matchesStore(c.businessId, business.id) &&
            !(business.slug && matchesStore(c.businessId, business.slug))
          );

          // Build clean list of this store's valid remote customers
          const thisStoreCustomers = [];
          remoteCustomers.forEach(rc => {
            if (MOCK_IDS.has(rc.id)) return;
            if (rc.name && rc.name.startsWith('Primer Cliente (')) {
              deleteCustomerFromFirestore(rc.id);
              return;
            }
            const key = rc.id.toLowerCase();
            let safeRc = { ...rc };
            if (key === 'cust-9023' && (business.id === 'mc-rolls' || !rc.businessId)) {
              safeRc.name = 'Williams Navarrete';
              safeRc.email = 'williams_joel@hotmail.com';
              safeRc.phone = '+593 99 240 7645';
            }
            thisStoreCustomers.push(safeRc);
            try {
              localStorage.setItem(`fidelipass_cust_${safeRc.id}`, JSON.stringify(safeRc));
            } catch {}
          });

          const combined = [...thisStoreCustomers, ...otherStoresCustomers];
          try {
            localStorage.setItem('fidelipass_customers', JSON.stringify(combined));
          } catch {}
          return combined;
        });
      });

      return () => {
        if (typeof unsub === 'function') unsub();
      };
    } catch (e) {
      console.warn("Firestore sync setup note:", e);
    }
  }, [business?.id]);

  // Real-time Cloud Sync for stores & cashier accounts (keeps changed passwords synced across all devices)
  useEffect(() => {
    try {
      const unsubAcc = subscribeToAccounts((remoteAccounts) => {
        if (!Array.isArray(remoteAccounts) || remoteAccounts.length === 0) return;
        const validAccounts = remoteAccounts.filter(a => a.businessId !== 'pizzeria-bella' && a.businessId !== 'cafe-roble' && a.businessId !== 'willstore');
        setAccounts(validAccounts);
      });

      const unsubSt = subscribeToStores((remoteStores) => {
        if (!Array.isArray(remoteStores) || remoteStores.length === 0) return;
        const validStores = remoteStores.filter(s => s.id !== 'pizzeria-bella' && s.id !== 'cafe-roble' && s.id !== 'willstore');
        setStores(validStores);
        setBusiness(prev => {
          const route = parseFideliPassRoute();
          const activeStoreId = localStorage.getItem('fidelipass_active_store_id') || sessionStorage.getItem('fidelipass_active_store_id');
          const target = route.storeParam || activeStoreId || (prev ? prev.id : validStores[0]?.id);
          const updated = findStoreByParam(validStores, target, prev || validStores[0]);
          return updated;
        });
      });

      const unsubSettings = subscribeToPlatformSettings((settings) => {
        if (!settings) return;
        if (settings.name) {
          setPlatformName(settings.name);
          try { localStorage.setItem('fidelipass_platform_name', settings.name); } catch {}
        }
        if (settings.logo !== undefined) {
          const effectiveLogo = (settings.logo && settings.logo.startsWith('data:image'))
            ? '/logos/fidelipass-logo.png'
            : (settings.logo || '/logos/fidelipass-logo.png');
          setPlatformLogo(effectiveLogo);
          try {
            localStorage.setItem('fidelipass_platform_logo', effectiveLogo);
            if (settings.logo && settings.logo.startsWith('data:image')) {
              syncPlatformSettingsToFirestore({ name: settings.name || platformName, logo: '/logos/fidelipass-logo.png' });
            }
          } catch {}
        }
      });

      return () => {
        if (typeof unsubAcc === 'function') unsubAcc();
        if (typeof unsubSt === 'function') unsubSt();
        if (typeof unsubSettings === 'function') unsubSettings();
      };
    } catch (e) {
      console.warn("Stores/Accounts sync setup note:", e);
    }
  }, []);

  const [activeCustomerId, setActiveCustomerId] = useState(() => {
    try {
      const route = parseFideliPassRoute();
      if (route.custParam) return route.custParam;
      if (route.storeParam) {
        const saved = localStorage.getItem(`fidelipass_my_cust_${route.storeParam}`);
        if (saved) return saved;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeNotification, setActiveNotification] = useState(null);
  const [lastNotifHandledAt, setLastNotifHandledAt] = useState(() => Date.now());

  // Real-time Cloud Sync for Store Push Notifications
  useEffect(() => {
    if (!business?.id) return;
    try {
      const unsubNotif = subscribeToStoreNotifications(
        business.id,
        (newest) => {
          if (newest && newest.createdAt && newest.createdAt > lastNotifHandledAt) {
            setLastNotifHandledAt(newest.createdAt);
            setActiveNotification(newest);
            try { sounds.playPush(); } catch {}
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try { navigator.vibrate([250, 100, 250]); } catch {}
            }
            triggerBrowserNotification(`🔔 ${business.name}`, {
              body: newest.message,
              icon: business.logo || undefined
            });
          }
        },
        (history) => {
          if (Array.isArray(history) && history.length > 0) {
            setNotifications(history);
          }
        }
      );

      return () => {
        if (typeof unsubNotif === 'function') unsubNotif();
      };
    } catch (e) {
      console.warn("Notifications subscription setup note:", e);
    }
  }, [business?.id, lastNotifHandledAt]);
  
  // Views and Modals
  const [viewMode, setViewMode] = useState(() => {
    try {
      const route = parseFideliPassRoute();
      if (route.isAdmin) return 'merchant';
      const savedSession = localStorage.getItem('fidelipass_session') || sessionStorage.getItem('fidelipass_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && (parsed.role === 'admin' || parsed.role === 'merchant')) {
          const savedViewMode = localStorage.getItem('fidelipass_view_mode') || sessionStorage.getItem('fidelipass_view_mode');
          return savedViewMode || 'merchant';
        }
      }
      if (route.storeParam || route.custParam) {
        return 'customer';
      }
      return 'merchant';
    } catch {
      return 'merchant';
    }
  });

  useEffect(() => {
    try {
      if (viewMode) {
        localStorage.setItem('fidelipass_view_mode', viewMode);
        sessionStorage.setItem('fidelipass_view_mode', viewMode);
      }
    } catch (e) {
      console.warn("View mode storage note", e);
    }
  }, [viewMode]);

  const [customerScreen, setCustomerScreen] = useState(() => {
    try {
      const route = parseFideliPassRoute();
      if (route.forceRegister) return 'register';
      if (route.forceCard || route.custParam) return 'card';
      if (route.storeParam) {
        const saved = localStorage.getItem(`fidelipass_my_cust_${route.storeParam}`);
        return saved ? 'card' : 'register';
      }
      return 'register';
    } catch {
      return 'register';
    }
  });

  const [scannerOpen, setScannerOpen] = useState(false);
  const [counterSignOpen, setCounterSignOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  // Auto-detect customer QR scan from counter sign or home screen webclip
  useEffect(() => {
    try {
      const route = parseFideliPassRoute();
      if (route.isAdmin) {
        setShowAdminMasterView(true);
        setViewMode('merchant');
        return;
      }
      const storeParam = route.storeParam;
      const custParam = route.custParam;
      const nameParam = route.nameParam;

      if (storeParam || custParam) {
        const found = findStoreByParam(stores, storeParam, business);
        if (found) {
          setBusiness(found);
          const savedSession = localStorage.getItem('fidelipass_session') || sessionStorage.getItem('fidelipass_session');
          let sessionRole = null;
          try { sessionRole = JSON.parse(savedSession)?.role; } catch {}

          if (!sessionRole || sessionRole === 'guest' || sessionRole === 'admin') {
            if (sessionRole !== 'admin') {
              setCurrentUser({ role: 'guest', name: 'Cliente Invitado' });
            }
            setShowAdminMasterView(false);
            setViewMode('customer');

            if (route.forceRegister) {
              setCustomerScreen('register');
              return;
            }

            let targetCustId = custParam || localStorage.getItem(`fidelipass_my_cust_${found.id}`);
            if (route.forceCard && !targetCustId) {
              targetCustId = `demo-${found.id}`;
            }

            if (targetCustId) {
              setActiveCustomerId(targetCustId);
              setCustomerScreen('card');

              const savedCustJson = localStorage.getItem(`fidelipass_cust_${targetCustId}`);
              let savedCustObj = null;
              try {
                if (savedCustJson) savedCustObj = JSON.parse(savedCustJson);
              } catch {}

              // Restore customer object if opening from an isolated Home Screen container
              setCustomers(prev => {
                const existing = prev.find(c => c.id.toLowerCase() === targetCustId.toLowerCase());
                if (!existing) {
                  const restored = savedCustObj || {
                    id: targetCustId,
                    businessId: found.id,
                    name: nameParam ? decodeURIComponent(nameParam) : `${found.name} VIP`,
                    email: `cliente@${found.id}.com`,
                    phone: '+593 99 240 7645',
                    status: 'Activo',
                    device: 'Apple Wallet (iPhone)',
                    deviceType: 'apple',
                    currentStamps: 2,
                    totalSpent: 9.50,
                    rewardsClaimed: 0,
                    joinedDate: 'Hoy',
                    lastVisit: 'Recién',
                    history: [
                      { id: 'h2', type: 'stamp', date: 'Hoy', note: '✨ Sello #2 de ejemplo' },
                      { id: 'h1', type: 'stamp', date: 'Hoy', note: '🎉 Sello de bienvenida' }
                    ]
                  };
                  return [restored, ...prev];
                } else if (savedCustObj && (existing.name.includes('Cliente (') || existing.name === 'Cliente VIP')) {
                  // If existing has a generic placeholder name, upgrade profile details without overwriting currentStamps!
                  return prev.map(c => c.id.toLowerCase() === targetCustId.toLowerCase() ? {
                    ...c,
                    name: savedCustObj.name || c.name,
                    email: savedCustObj.email || c.email,
                    phone: savedCustObj.phone || c.phone
                  } : c);
                }
                return prev;
              });

              // Ensure URL contains customer ID so "Agregar a Inicio" bookmarks this exact card
              if (!custParam) {
                const newUrl = `${window.location.pathname}?store=${found.id}&c=${targetCustId}`;
                window.history.replaceState({ customerId: targetCustId }, '', newUrl);
              }
            } else {
              setCustomerScreen('register');
            }
          }
        }
      }
    } catch (e) {
      console.warn("URL parse error", e);
    }
  }, [stores]);

  // Dynamic Apple Touch Icon and Document Title for iOS Add to Home Screen & Landing Page
  useEffect(() => {
    try {
      if (viewMode === 'customer' && business) {
        document.title = `${business.name} | Tarjeta de Fidelidad`;
        const iconEl = document.getElementById('apple-touch-icon');
        if (iconEl && business.logo) {
          iconEl.href = business.logo;
        }
        const appTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
        if (appTitleMeta) {
          appTitleMeta.content = business.name;
        }
      } else if (currentUser && currentUser.role === 'admin') {
        document.title = `SuperAdmin | ${platformName}`;
      } else if (currentUser && currentUser.role === 'merchant' && business) {
        document.title = `Terminal de Caja | ${business.name}`;
      } else {
        document.title = `${platformName} | Tarjetas de Fidelidad Digitales en tu Celular`;
        const iconEl = document.getElementById('apple-touch-icon');
        if (iconEl) {
          iconEl.href = platformLogo || '/logos/fidelipass-logo.png';
        }
      }
    } catch (e) {
      console.warn("Meta update error", e);
    }
  }, [business, viewMode, currentUser, platformName, platformLogo]);

  // Scope customers to the active business so WillStore NEVER sees MC Rolls customers!
  const currentStoreCustomers = customers.filter(c => 
    matchesStore(c.businessId, business.id) || (business.slug && matchesStore(c.businessId, business.slug))
  );

  const effectiveStoreCustomers = currentStoreCustomers;

  // Active customer object (for preview / card simulator)
  const activeCustomer = (activeCustomerId 
    ? effectiveStoreCustomers.find(c => c.id.toLowerCase() === String(activeCustomerId).toLowerCase()) 
    : null) || effectiveStoreCustomers[0] || {
      id: `cust-${business.id}-preview`,
      businessId: business.id,
      name: `${business.name} VIP`,
      email: `cliente@${business.id}.com`,
      phone: "+593 99 000 1122",
      status: "Activo",
      device: "Apple Wallet (iPhone)",
      deviceType: "apple",
      currentStamps: 0,
      totalSpent: 0,
      rewardsClaimed: 0,
      joinedDate: "Hoy",
      lastVisit: "Nunca",
      history: []
    };

  // Scope notifications to the active business
  const currentStoreNotifications = notifications.filter(n =>
    n.businessId === business.id || (!n.businessId && business.id === 'mc-rolls')
  );

  // Handle Login
  const handleLogin = (account, rememberMe = true) => {
    setCurrentUser(account);
    try {
      localStorage.setItem('fidelipass_remember_me', String(rememberMe));
      if (rememberMe) {
        localStorage.setItem('fidelipass_session', JSON.stringify(account));
      } else {
        localStorage.removeItem('fidelipass_session');
      }
      sessionStorage.setItem('fidelipass_session', JSON.stringify(account));
    } catch {}

    if (account.role === 'admin') {
      setShowAdminMasterView(true);
      try {
        if (rememberMe) {
          localStorage.setItem('fidelipass_show_admin_master', 'true');
        }
        sessionStorage.setItem('fidelipass_show_admin_master', 'true');
      } catch {}
    } else {
      setShowAdminMasterView(false);
      try {
        localStorage.removeItem('fidelipass_show_admin_master');
        sessionStorage.removeItem('fidelipass_show_admin_master');
      } catch {}
      const matchedStore = stores.find(s => s.id === account.businessId) || 
                           stores.find(s => s.ownerEmail && s.ownerEmail.toLowerCase().trim() === account.email.toLowerCase().trim());
      if (matchedStore) {
        setBusiness(matchedStore);
      } else {
        // Fallback dedicated store matching this account so it NEVER shows MC Rolls or another store!
        const fallbackStore = {
          id: account.businessId || 'store-' + Date.now(),
          name: account.name ? account.name.replace(/^Cajero\s*-\s*/, '') : 'Mi Negocio',
          tagline: 'Programa de Fidelidad Oficial',
          category: account.badge || 'Comercio',
          ownerName: account.name || 'Propietario',
          ownerEmail: account.email,
          ownerPassword: account.password,
          maxStamps: 6,
          rewardTitle: '1 Producto Gratis',
          accentColor: '#1D4E3E',
          cardBgColor: '#1F2937',
          iconType: 'star'
        };
        setStores(prev => [fallbackStore, ...prev]);
        setBusiness(fallbackStore);
      }
      setViewMode('merchant');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowAdminMasterView(false);
    setViewMode('merchant');
    setShowLoginModal(true);
    try {
      localStorage.removeItem('fidelipass_session');
      localStorage.removeItem('fidelipass_show_admin_master');
      localStorage.removeItem('fidelipass_active_store_id');
      localStorage.removeItem('fidelipass_view_mode');
      sessionStorage.removeItem('fidelipass_session');
      sessionStorage.removeItem('fidelipass_show_admin_master');
      sessionStorage.removeItem('fidelipass_active_store_id');
      sessionStorage.removeItem('fidelipass_view_mode');
    } catch {}

    if (!isNativeMobileApp() && typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', '/');
      } catch {}
      window.location.href = '/';
    }
  };

  // Admin Actions
  const handleAddStore = (newStore) => {
    setStores(prev => [newStore, ...prev]);
    syncStoreToFirestore(newStore);
    
    // Automatically register cashier login credentials
    const newAccount = {
      id: "acc-" + Date.now(),
      name: `Cajero - ${newStore.name}`,
      email: newStore.ownerEmail,
      password: newStore.ownerPassword || '123456',
      role: 'merchant',
      businessId: newStore.id,
      badge: newStore.category
    };
    setAccounts(prev => [...prev, newAccount]);
    syncAccountToFirestore(newAccount);
    sounds.playStamp();
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!customerId) return;
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    if (activeCustomerId === customerId) {
      setActiveCustomerId(null);
    }
    try {
      localStorage.removeItem(`fidelipass_cust_${customerId}`);
      if (business?.id && localStorage.getItem(`fidelipass_my_cust_${business.id}`) === customerId) {
        localStorage.removeItem(`fidelipass_my_cust_${business.id}`);
      }
      if (business?.slug && localStorage.getItem(`fidelipass_my_cust_${business.slug}`) === customerId) {
        localStorage.removeItem(`fidelipass_my_cust_${business.slug}`);
      }
      const saved = localStorage.getItem('fidelipass_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          localStorage.setItem('fidelipass_customers', JSON.stringify(parsed.filter(c => c.id !== customerId)));
        }
      }
      await deleteCustomerFromFirestore(customerId);
    } catch (e) {
      console.warn("Error deleting customer from firestore:", e);
    }
  };

  const handleResetCustomer = () => {
    try {
      if (business?.id) {
        localStorage.removeItem(`fidelipass_my_cust_${business.id}`);
      }
      if (business?.slug) {
        localStorage.removeItem(`fidelipass_my_cust_${business.slug}`);
      }
      const route = parseFideliPassRoute();
      if (route.storeParam) {
        localStorage.removeItem(`fidelipass_my_cust_${route.storeParam}`);
      }
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('c');
      currentUrl.searchParams.delete('cust');
      currentUrl.searchParams.delete('name');
      currentUrl.searchParams.delete('n');
      window.history.replaceState({}, '', currentUrl.pathname + (currentUrl.search ? currentUrl.search : ''));
    } catch (e) {
      console.warn("Reset customer note:", e);
    }
    setActiveCustomerId(null);
    setCustomerScreen('register');
  };

  const handleDeleteStore = async (storeId) => {
    // 1. Delete permanently from Firestore
    await deleteStoreFromFirestore(storeId);
    const relatedAccounts = accounts.filter(a => a.businessId === storeId);
    for (const acc of relatedAccounts) {
      await deleteAccountFromFirestore(acc.id);
    }

    // 2. Remove from local state and LocalStorage
    setStores(prev => {
      const updated = prev.filter(s => s.id !== storeId);
      try { localStorage.setItem('fidelipass_stores', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setAccounts(prev => {
      const updated = prev.filter(a => a.businessId !== storeId);
      try { localStorage.setItem('fidelipass_accounts', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setCustomers(prev => {
      const updated = prev.filter(c => c.businessId !== storeId);
      try { localStorage.setItem('fidelipass_customers', JSON.stringify(updated)); } catch {}
      return updated;
    });

    if (business.id === storeId) {
      setBusiness(prev => {
        const remaining = stores.filter(s => s.id !== storeId);
        return remaining.length > 0 ? remaining[0] : INITIAL_BUSINESS;
      });
    }
  };

  const handleChangePassword = (businessId, newPassword) => {
    const trimmedPass = String(newPassword).trim();
    // 1. Update stores list
    setStores(prev => prev.map(s => {
      if (s.id === businessId) {
        const u = { ...s, ownerPassword: trimmedPass };
        syncStoreToFirestore(u);
        return u;
      }
      return s;
    }));

    // 2. Update active business if it matches
    if (business.id === businessId) {
      setBusiness(prev => {
        const u = { ...prev, ownerPassword: trimmedPass };
        syncStoreToFirestore(u);
        return u;
      });
    }

    // 3. Update cashier account in accounts list
    setAccounts(prev => prev.map(a => {
      if (a.businessId === businessId) {
        const u = { ...a, password: trimmedPass };
        syncAccountToFirestore(u);
        return u;
      }
      return a;
    }));

    // 4. Update currentUser if active
    setCurrentUser(prev => {
      if (prev && (prev.businessId === businessId || prev.email === business.ownerEmail)) {
        const updated = { ...prev, password: trimmedPass };
        try {
          sessionStorage.setItem('fidelipass_session', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });
  };

  const handleUpdateStore = async (updatedStore) => {
    const colorChanged = business && updatedStore.cardBgColor && updatedStore.cardBgColor !== business.cardBgColor;
    setBusiness(prev => (prev && prev.id === updatedStore.id ? { ...prev, ...updatedStore } : prev));
    setStores(prev => prev.map(s => s.id === updatedStore.id ? { ...s, ...updatedStore } : s));
    syncStoreToFirestore(updatedStore);
    try {
      localStorage.setItem(`fidelipass_store_${updatedStore.id}`, JSON.stringify(updatedStore));
    } catch {}

    // Auto-dispatch Apple & Google Wallet push so all member phones refresh in real time
    const configChanged = !business || (
      Number(updatedStore.maxStamps) !== Number(business.maxStamps) ||
      updatedStore.cardBgColor !== business.cardBgColor ||
      updatedStore.banner !== business.banner ||
      updatedStore.logo !== business.logo ||
      updatedStore.rewardTitle !== business.rewardTitle ||
      updatedStore.name !== business.name ||
      updatedStore.tagline !== business.tagline ||
      Boolean(colorChanged)
    );

    if (configChanged) {
      try {
        await sendAppleWalletPushNotification({
          storeId: updatedStore.id,
          serialNumber: 'ALL',
          message: `✨ ${updatedStore.name}: ¡Tarjeta de fidelidad actualizada!`
        });
      } catch (e) {
        console.warn("Auto push for store update skipped:", e);
      }
      try {
        await sendGoogleWalletPushNotification({
          businessName: updatedStore.name,
          message: `✨ ¡Tarjeta de fidelidad actualizada!`,
          customerId: null
        });
      } catch (e) {
        console.warn("Google Wallet push on config update skipped:", e);
      }
    }
  };

  const handleChangeAdminPassword = (newPassword) => {
    const trimmed = String(newPassword).trim();
    if (!trimmed || trimmed.length < 3) return false;

    // 1. Update accounts in state and Firestore
    setAccounts(prev => prev.map(a => {
      if (a.role === 'admin' || a.id === 'acc-admin' || a.email === 'admin@fidelipass.com') {
        const updated = { ...a, password: trimmed };
        syncAccountToFirestore(updated);
        return updated;
      }
      return a;
    }));

    // 2. Update currentUser session
    setCurrentUser(prev => {
      if (prev && (prev.role === 'admin' || prev.email === 'admin@fidelipass.com')) {
        const updated = { ...prev, password: trimmed };
        try {
          sessionStorage.setItem('fidelipass_session', JSON.stringify(updated));
        } catch {}
        return updated;
      }
      return prev;
    });

    return true;
  };

  const handleUpdatePlatformSettings = ({ name, logo }) => {
    if (name) {
      setPlatformName(name.trim());
      try { localStorage.setItem('fidelipass_platform_name', name.trim()); } catch {}
    }
    setPlatformLogo(logo || null);
    try {
      if (logo) {
        localStorage.setItem('fidelipass_platform_logo', logo);
      } else {
        localStorage.removeItem('fidelipass_platform_logo');
      }
    } catch {}
    syncPlatformSettingsToFirestore({ name: name || platformName, logo: logo || null });
    sounds.playStamp();
  };

  const handleAddAccount = (newAccount) => {
    setAccounts(prev => {
      const updated = [...prev, newAccount];
      try { localStorage.setItem('fidelipass_accounts', JSON.stringify(updated)); } catch {}
      return updated;
    });
    syncAccountToFirestore(newAccount);
    sounds.playStamp();
  };

  const handleDeleteAccount = async (accountId) => {
    await deleteAccountFromFirestore(accountId);
    setAccounts(prev => {
      const updated = prev.filter(a => a.id !== accountId);
      try { localStorage.setItem('fidelipass_accounts', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const handleSelectStoreAsCashier = (store) => {
    setBusiness(store);
    setShowAdminMasterView(false);
    try {
      localStorage.setItem('fidelipass_active_store_id', store.id);
      sessionStorage.setItem('fidelipass_active_store_id', store.id);
      localStorage.setItem('fidelipass_show_admin_master', 'false');
      sessionStorage.setItem('fidelipass_show_admin_master', 'false');
      const targetSlug = store.slug || store.id;
      window.history.replaceState(null, '', `/${targetSlug}`);
    } catch {}
    setViewMode('dual');
  };

  const handleSwitchStore = (store) => {
    setBusiness(store);
    try {
      localStorage.setItem('fidelipass_active_store_id', store.id);
      sessionStorage.setItem('fidelipass_active_store_id', store.id);
      const targetSlug = store.slug || store.id;
      window.history.replaceState(null, '', `/${targetSlug}`);
    } catch {}
  };

  const handleOpenCounterSignForStore = (store) => {
    setBusiness(store);
    setCounterSignOpen(true);
  };

  // Action: Add Stamp
  const handleAddStamp = (customerId) => {
    const now = Date.now();
    setCustomers(prev => prev.map(c => {
      if (c.id.toLowerCase() === String(customerId).toLowerCase()) {
        const nextStamps = Math.min(business.maxStamps, (c.currentStamps || 0) + 1);
        const newHistory = [
          {
            id: "h-" + now,
            type: "stamp",
            date: "Hoy, ahora",
            createdAt: now,
            amount: 4.50,
            note: `Sello #${nextStamps} otorgado`
          },
          ...(c.history || [])
        ];
        const updated = {
          ...c,
          currentStamps: nextStamps,
          lastVisit: "Hoy, recién",
          totalSpent: (c.totalSpent || 0) + 4.50,
          history: newHistory
        };
        // Sync to cloud Firestore
        syncCustomerToFirestore(updated);
        updateCustomerStampsInFirestore(c.id, nextStamps, newHistory);
        try {
          localStorage.setItem(`fidelipass_cust_${c.id}`, JSON.stringify(updated));
        } catch {}

        // Auto-dispatch APNs push to wake up Apple Wallet and update stickers in real time
        try {
          sendAppleWalletPushNotification({
            storeId: business.id,
            customerId: c.id,
            serialNumber: `${business.id}_${c.id}`,
            phone: c.phone,
            message: `¡Ganaste 1 nuevo sello en ${business.name}! Tienes ${nextStamps} de ${business.maxStamps} sellos.`
          }).catch(() => {});
        } catch {}

        return updated;
      }
      return c;
    }));
  };

  // Action: Undo Stamp
  const handleUndoStamp = (customerId) => {
    setCustomers(prev => prev.map(c => {
      if (c.id.toLowerCase() === String(customerId).toLowerCase()) {
        if (c.currentStamps <= 1) {
          // Never undo below 1 because the 1st stamp is the welcome registration gift!
          return c;
        }
        const nextStamps = Math.max(1, c.currentStamps - 1);
        const newHistory = [
          {
            id: "h-" + Date.now(),
            type: "undo",
            date: "Hoy, ahora",
            note: `↺ Se deshizo el último sello (queda en ${nextStamps})`
          },
          ...(c.history || [])
        ];
        const updated = {
          ...c,
          currentStamps: nextStamps,
          history: newHistory
        };
        // Real-time Firestore sync
        syncCustomerToFirestore(updated);
        updateCustomerStampsInFirestore(c.id, nextStamps, newHistory);
        try {
          localStorage.setItem(`fidelipass_cust_${c.id}`, JSON.stringify(updated));
        } catch {}

        // Auto-dispatch APNs push to wake up Apple Wallet and update stickers in real time
        try {
          sendAppleWalletPushNotification({
            storeId: business.id,
            customerId: c.id,
            serialNumber: `${business.id}_${c.id}`,
            phone: c.phone,
            message: `Tus sellos en ${business.name} se actualizaron a ${nextStamps} de ${business.maxStamps}.`
          }).catch(() => {});
        } catch {}

        return updated;
      }
      return c;
    }));
  };

  // Action: Claim Reward
  const handleClaimReward = (customerId) => {
    setCustomers(prev => prev.map(c => {
      if (c.id.toLowerCase() === String(customerId).toLowerCase()) {
        const newHistory = [
          {
            id: "h-" + Date.now(),
            type: "claimed",
            date: "Hoy, ahora",
            note: `🎉 ¡Premio canjeado!: ${business.rewardTitle}`
          },
          ...(c.history || [])
        ];
        const updated = {
          ...c,
          currentStamps: 0,
          rewardsClaimed: (c.rewardsClaimed || 0) + 1,
          history: newHistory
        };
        // Real-time Firestore sync
        syncCustomerToFirestore(updated);
        updateCustomerStampsInFirestore(c.id, 0, newHistory);
        try {
          localStorage.setItem(`fidelipass_cust_${c.id}`, JSON.stringify(updated));
        } catch {}

        // Auto-dispatch APNs push to reset Apple Wallet pass
        try {
          sendAppleWalletPushNotification({
            storeId: business.id,
            customerId: c.id,
            serialNumber: `${business.id}_${c.id}`,
            phone: c.phone,
            message: `¡Premio canjeado en ${business.name}! Tu tarjeta ha iniciado un nuevo ciclo.`
          }).catch(() => {});
        } catch {}

        return updated;
      }
      return c;
    }));
  };

  // Action: Send Push Notification
  const handleSendPush = async (notif) => {
    const now = Date.now();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const storeNotif = {
      ...notif,
      businessId: business.id,
      businessName: business.name,
      sentAt: notif.sentAt || `Hoy, ${timeFormatted}`,
      time: notif.time || `Hoy, ${timeFormatted}`,
      createdAt: notif.createdAt || now,
      recipientsCount: notif.recipientsCount || effectiveStoreCustomers.length || 1,
      openedCount: 0
    };

    setLastNotifHandledAt(now);
    setNotifications(prev => [storeNotif, ...prev.filter(n => n.id !== storeNotif.id)]);
    setActiveNotification(storeNotif);
    sounds.playPush();

    // Broadcast in real-time to Cloud Firestore
    await syncNotificationToFirestore(storeNotif);

    // Send native push notification to Google Wallet Android devices
    try {
      await sendGoogleWalletPushNotification({
        businessName: business.name,
        message: storeNotif.message,
        customerId: storeNotif.targetCustomerId
      });
    } catch (err) {
      console.warn("Google Wallet push dispatch skipped:", err);
    }

    // Send native push notification to Apple Wallet iPhone devices (APNs)
    try {
      const appleResult = await sendAppleWalletPushNotification({
        storeId: business.id,
        customerId: storeNotif.targetCustomerId,
        serialNumber: storeNotif.targetCustomerId 
          ? `${business.id}_${storeNotif.targetCustomerId}` 
          : (storeNotif.targetCustomerPhone ? `${business.id}_${storeNotif.targetCustomerPhone.replace(/\D/g, '')}` : null),
        phone: storeNotif.targetCustomerPhone,
        message: storeNotif.message
      });
      console.log("🍏 Dispatched Apple Wallet Push:", appleResult);
    } catch (err) {
      console.warn("Apple Wallet push dispatch skipped:", err);
    }

    setTimeout(() => {
      setActiveNotification(prev => (prev?.id === storeNotif.id ? null : prev));
    }, 15000);
  };

  // Action: Clear Push Notifications History (Manual or Daily Reset)
  const handleClearNotifications = async () => {
    if (!business?.id) return;
    setNotifications([]);
    setActiveNotification(null);
    await clearStoreNotificationsInFirestore(business.id);
  };

  // Action: Register New Customer
  const handleRegisterSuccess = (newCust) => {
    const storeCust = {
      ...newCust,
      businessId: business.id
    };
    setCustomers(prev => [storeCust, ...prev]);
    setActiveCustomerId(storeCust.id);
    setCustomerScreen('card');
    sounds.playStamp();
    // Sync to Cloud Firestore in real time
    syncCustomerToFirestore(storeCust);
    try {
      localStorage.setItem(`fidelipass_my_cust_${business.id}`, storeCust.id);
      localStorage.setItem(`fidelipass_cust_${storeCust.id}`, JSON.stringify(storeCust));
      // Put &c=... in URL so when added to home screen, iOS Safari bookmarked URL remembers this exact card!
      const newUrl = `${window.location.pathname}?store=${business.id}&c=${storeCust.id}&n=${encodeURIComponent(storeCust.name)}`;
      window.history.replaceState({ customerId: storeCust.id }, '', newUrl);
    } catch (e) {
      console.warn("URL update error", e);
    }
  };

  // Action: Auto-enroll customer scanned from their phone QR
  const handleAddNewCustomerFromScan = (scannedCust) => {
    setCustomers(prev => {
      const exists = prev.find(c => c.id.toLowerCase() === scannedCust.id.toLowerCase());
      if (exists) {
        return prev.map(c => c.id.toLowerCase() === scannedCust.id.toLowerCase() ? {
          ...c,
          name: (c.name.includes('Cliente (') || c.name === 'Cliente VIP') && scannedCust.name ? scannedCust.name : c.name,
          email: (!c.email || c.email.includes('@fidelipass.com') || c.email.includes('@ejemplo.com')) && scannedCust.email ? scannedCust.email : c.email,
          phone: scannedCust.phone || c.phone
        } : c);
      }
      return [scannedCust, ...prev];
    });
    setActiveCustomerId(scannedCust.id);
    syncCustomerToFirestore(scannedCust);
  };

  // Action: Update Customer Info (Name, Email, Phone)
  const handleUpdateCustomer = (updatedCust) => {
    setCustomers(prev => prev.map(c => {
      if (c.id.toLowerCase() === updatedCust.id.toLowerCase()) {
        const merged = { ...c, ...updatedCust };
        syncCustomerToFirestore(merged);
        try {
          localStorage.setItem(`fidelipass_cust_${c.id}`, JSON.stringify(merged));
        } catch {}
        return merged;
      }
      return c;
    }));
  };

  // Auto-upgrade cust-9023 to Williams Navarrete if stored with generic placeholder name
  useEffect(() => {
    setCustomers(prev => prev.map(c => {
      if (c.id.toLowerCase() === 'cust-9023') {
        const isPlaceholderName = c.name.includes('Cliente (') || c.name === 'Cliente VIP' || c.name.toLowerCase() === 'cliente';
        const isOldEmail = !c.email || c.email === 'will.store@fidelipass.com' || c.email === 'williams@ejemplo.com';
        if (isPlaceholderName || isOldEmail) {
          const fixed = {
            ...c,
            name: isPlaceholderName ? 'Williams Navarrete' : c.name,
            email: isOldEmail ? 'williams_joel@hotmail.com' : c.email,
            phone: '+593 99 240 7645'
          };
          syncCustomerToFirestore(fixed);
          try {
            localStorage.setItem(`fidelipass_cust_${c.id}`, JSON.stringify(fixed));
          } catch {}
          return fixed;
        }
      }
      return c;
    }));
  }, []);

  // If not logged in: show Login Screen directly on Native Mobile Apps (iOS & Android) or Landing Page on Web
  if (!currentUser) {
    const isNative = isNativeMobileApp();
    const route = parseFideliPassRoute();
    const isDirectLoginRequested = route.isLogin || isNative;

    if (isNative || showLoginModal || isDirectLoginRequested) {
      return (
        <LoginScreen
          platformName={platformName}
          platformLogo={platformLogo}
          accounts={accounts}
          onLogin={handleLogin}
          onBackToLanding={isNative ? null : () => setShowLoginModal(false)}
        />
      );
    }

    return (
      <>
        <LandingPage
          platformName={platformName}
          platformLogo={platformLogo}
          onOpenLogin={() => setShowLoginModal(true)}
          onTryCustomerDemo={() => {
            setCurrentUser({ role: 'guest', name: 'Cliente Invitado' });
            setBusiness(INITIAL_BUSINESS);
            setViewMode('customer');
            setCustomerScreen('card');
          }}
          onOpenCalculator={() => setCalculatorOpen(true)}
        />
        {/* Business Calculator Modal */}
        {calculatorOpen && (
          <BusinessCalculator
            isOpen={calculatorOpen}
            onClose={() => setCalculatorOpen(false)}
          />
        )}
      </>
    );
  }

  // If Admin views Master Dashboard
  const activeRoute = parseFideliPassRoute();
  const isDirectStoreOrCardRoute = Boolean(activeRoute.storeParam || activeRoute.custParam || activeRoute.forceRegister || activeRoute.forceCard);

  if (currentUser.role === 'admin' && (showAdminMasterView || !isDirectStoreOrCardRoute)) {
    return (
      <div className="relative overflow-x-hidden">
        <div className="print:hidden">
          <SuperAdminDashboard
          stores={stores}
          accounts={accounts}
          onAddAccount={handleAddAccount}
          onDeleteAccount={handleDeleteAccount}
          platformName={platformName}
          platformLogo={platformLogo}
          onUpdatePlatformSettings={handleUpdatePlatformSettings}
          onAddStore={handleAddStore}
          onUpdateStore={handleUpdateStore}
          onDeleteStore={handleDeleteStore}
          onChangeStorePassword={handleChangePassword}
          onChangeAdminPassword={handleChangeAdminPassword}
          onSelectStoreAsCashier={handleSelectStoreAsCashier}
          onOpenCounterSignForStore={handleOpenCounterSignForStore}
          onLogout={handleLogout}
        />
        </div>
        {/* Printable Poster Modal */}
        {counterSignOpen && (
          <PrintableCounterSign
            business={business}
            onClose={() => setCounterSignOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-900 flex flex-col font-sans selection:bg-[#E8F1EC] selection:text-[#1D4E3E] overflow-x-hidden">
      {/* Top Global Control Bar - Claymorphic Header (hidden in native mobile apps to avoid duplicate header) */}
      {!isNativeMobileApp() && viewMode !== 'customer' && (
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-10 py-3.5 lg:py-4 sticky top-0 z-40 shadow-sm print:hidden">
          <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Logo & Store Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white text-gray-900 border border-gray-200/90 flex items-center justify-center font-bold text-base shadow-xs overflow-hidden p-1">
                {platformLogo ? (
                  <img src={platformLogo} alt={platformName} className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <span>🌱</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-xl text-[#1D4E3E] tracking-tight">
                    {platformName}
                  </span>
                  <span className="clay-badge-dark px-3 py-0.5 text-xs font-black bg-[#FF5E36] text-white uppercase tracking-wider">
                    {business.name}
                  </span>
                  {currentUser?.role === 'merchant' && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 clay-badge bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {appLang === 'en' ? 'Cashier Terminal' : 'Terminal de Caja'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 font-semibold hidden sm:block">
                  {appLang === 'en'
                    ? 'fidelipassapp.com • Digital loyalty passes in Apple Wallet & Google Wallet'
                    : 'fidelipassapp.com • Tarjetas de fidelidad en Apple Wallet & Google Wallet'}
                </p>
              </div>
            </div>

            {/* Admin-only Store Switcher & Mode Switcher */}
            {currentUser?.role === 'admin' && (
              <>
                <div className="hidden xl:flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                  <span className="text-[10px] font-extrabold text-gray-400 px-2 uppercase">
                    {appLang === 'en' ? 'Switch Store:' : 'Probar Local:'}
                  </span>
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSwitchStore(s)}
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        business.id === s.id
                          ? 'clay-btn clay-btn-primary text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                  <button
                    onClick={() => setViewMode('dual')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      viewMode === 'dual'
                        ? 'clay-btn clay-btn-light text-[#1D4E3E] shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Columns size={14} />
                    <span className="hidden md:inline">{appLang === 'en' ? 'Dual View' : 'Simulador Dual'}</span>
                  </button>

                  <button
                    onClick={() => setViewMode('merchant')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      viewMode === 'merchant'
                        ? 'clay-btn clay-btn-light text-[#1D4E3E] shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Store size={14} />
                    <span>{appLang === 'en' ? 'Cashier' : 'Cajero'}</span>
                  </button>

                  <button
                    onClick={() => setViewMode('customer')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      viewMode === 'customer'
                        ? 'clay-btn clay-btn-light text-[#1D4E3E] shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Smartphone size={14} />
                    <span>{appLang === 'en' ? 'Member' : 'Cliente'}</span>
                  </button>
                </div>
              </>
            )}

            {/* Extra Actions & Auth status */}
            <div className="flex items-center gap-2">
              {currentUser?.role === 'admin' && (
                <>
                  <button
                    onClick={() => {
                      setShowAdminMasterView(true);
                      try {
                        localStorage.setItem('fidelipass_show_admin_master', 'true');
                        sessionStorage.setItem('fidelipass_show_admin_master', 'true');
                        window.history.replaceState(null, '', '/admin');
                      } catch {}
                    }}
                    className="clay-btn px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{appLang === 'en' ? '👑 Master Admin' : '👑 Panel Maestro Admin'}</span>
                  </button>

                  <button
                    onClick={() => setCalculatorOpen(true)}
                    className="clay-btn px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1D4E3E] text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
                  >
                    <Calculator size={14} />
                    <span className="hidden sm:inline">{appLang === 'en' ? 'ROI Calculator' : 'Calculadora de Ganancias'}</span>
                  </button>
                </>
              )}

              <button
                onClick={() => setCounterSignOpen(true)}
                className="clay-btn clay-btn-orange px-3.5 py-1.5 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer size={14} />
                <span className="hidden sm:inline">{appLang === 'en' ? 'QR Stand' : 'Cartel QR'}</span>
              </button>

              {/* Language Switcher ES / EN in Header */}
              <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 shadow-inner text-[11px] font-black">
                <button
                  type="button"
                  onClick={() => toggleAppLang('es')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    appLang === 'es' ? 'bg-[#1D4E3E] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => toggleAppLang('en')}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    appLang === 'en' ? 'bg-[#1D4E3E] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  EN
                </button>
              </div>

              <button
                onClick={handleLogout}
                title={`Sesión iniciada como: ${currentUser?.name || ''}. Clic para salir al Login.`}
                className="clay-btn clay-btn-light flex items-center gap-1.5 px-3 py-1.5 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">{appLang === 'en' ? 'Exit' : 'Salir'}</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Top Customer Brand Bar (Claymorphic) */}
      {viewMode === 'customer' && (
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sticky top-0 z-40 print:hidden shadow-xs">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div 
              onClick={() => {
                if (currentUser?.role === 'admin') {
                  setShowAdminMasterView(true);
                  try { localStorage.setItem('fidelipass_show_admin_master', 'true'); } catch {}
                  window.location.href = '/admin';
                  return;
                }
                if (currentUser?.role === 'guest') {
                  setCurrentUser(null);
                  setShowLoginModal(false);
                  setViewMode('merchant');
                  try {
                    localStorage.removeItem('fidelipass_active_store_id');
                    sessionStorage.removeItem('fidelipass_active_store_id');
                  } catch {}
                  if (typeof window !== 'undefined') {
                    try { window.history.replaceState(null, '', '/'); } catch {}
                    window.location.href = '/';
                  }
                }
              }}
              className={`flex items-center gap-2.5 ${(currentUser?.role === 'guest' || currentUser?.role === 'admin') ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
              title={currentUser?.role === 'admin' ? "Volver al Panel SuperAdmin" : (currentUser?.role === 'guest' ? (appLang === 'en' ? "Back to home page" : "Volver a la página principal") : undefined)}
            >
              <div className="w-8 h-8 rounded-2xl bg-white text-gray-900 border border-gray-200/90 flex items-center justify-center font-black text-xs shadow-xs overflow-hidden p-1">
                {platformLogo ? (
                  <img src={platformLogo} alt={platformName} className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <span>🌱</span>
                )}
              </div>
              <span className="font-heading font-black text-base text-[#1D4E3E]">{platformName}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="clay-badge px-3 py-1 text-xs font-black text-gray-700 bg-white">
                {business.name}
              </span>
              
              {/* Language Switcher ES / EN in Customer Bar */}
              <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 shadow-inner text-[10px] font-black">
                <button
                  type="button"
                  onClick={() => toggleAppLang('es')}
                  className={`px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                    appLang === 'es' ? 'bg-[#1D4E3E] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => toggleAppLang('en')}
                  className={`px-1.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                    appLang === 'en' ? 'bg-[#1D4E3E] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  EN
                </button>
              </div>

              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminMasterView(true);
                    try { localStorage.setItem('fidelipass_show_admin_master', 'true'); } catch {}
                    window.location.href = '/admin';
                  }}
                  className="clay-btn bg-[#1D4E3E] text-white px-2.5 py-1 text-[11px] font-black cursor-pointer shadow-xs hover:bg-[#153B2F] flex items-center gap-1"
                  title="Volver al Panel SuperAdmin"
                >
                  <Shield size={12} />
                  <span>Admin</span>
                </button>
              )}

              {currentUser?.role === 'guest' && (
                <button
                  onClick={() => {
                    setCurrentUser(null);
                    setShowLoginModal(false);
                    setViewMode('merchant');
                    try {
                      localStorage.removeItem('fidelipass_active_store_id');
                      sessionStorage.removeItem('fidelipass_active_store_id');
                    } catch {}
                    if (typeof window !== 'undefined') {
                      try { window.history.replaceState(null, '', '/'); } catch {}
                      window.location.href = '/';
                    }
                  }}
                  className="clay-btn clay-btn-light px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer shadow-2xs"
                  title="Volver a la portada de FideliPass"
                >
                  {appLang === 'en' ? 'Home' : 'Inicio'}
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Container - Edge to edge on mobile, padded on desktop */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-0 sm:p-4 lg:p-8 flex flex-col justify-center print:hidden">
        {/* ================= DUAL MODE: SIDE BY SIDE ================= */}
        {viewMode === 'dual' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Merchant Dashboard (Cajero del Local) */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#1D4E3E]"></span>
                  <h2 className="font-heading font-bold text-gray-900 text-sm">
                    1. Celular del Cajero / Dueño (caja.fidelipassapp.com/{business.id})
                  </h2>
                </div>
                <span className="text-[11px] text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                  Usa el botón naranja "Escanear" para dar sellos
                </span>
              </div>

              <MerchantDashboard
                currentUser={currentUser}
                business={business}
                customers={effectiveStoreCustomers}
                platformName={platformName}
                platformLogo={platformLogo}
                selectedCustomerId={activeCustomerId}
                onSelectCustomer={setActiveCustomerId}
                onAddStamp={handleAddStamp}
                onUndoStamp={handleUndoStamp}
                onClaimReward={handleClaimReward}
                onOpenScanner={() => setScannerOpen(true)}
                onSendPushNotification={handleSendPush}
                onClearNotifications={handleClearNotifications}
                notifications={currentStoreNotifications}
                onOpenCounterSign={() => setCounterSignOpen(true)}
                onUpdateBusiness={handleUpdateStore}
                onChangePassword={(newPass) => handleChangePassword(business.id, newPass)}
                onUpdateCustomer={handleUpdateCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onLogout={handleLogout}
                appLang={appLang}
                setAppLang={setAppLang}
              />
            </div>

            {/* Right Column: Customer Phone (Apple / Google Wallet) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF5E36]"></span>
                  <h2 className="font-heading font-bold text-gray-900 text-sm">
                    2. Celular del Cliente (fidelipassapp.com/{business.id})
                  </h2>
                </div>

                {/* Switch between card view and registration view (Claymorphic) */}
                <div className="flex gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-inner text-xs">
                  <button
                    onClick={() => setCustomerScreen('card')}
                    className={`px-3 py-1 rounded-xl font-black transition-all cursor-pointer ${
                      customerScreen === 'card' ? 'clay-btn clay-btn-primary text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Ver Tarjeta
                  </button>
                  <button
                    onClick={() => setCustomerScreen('register')}
                    className={`px-3 py-1 rounded-xl font-black transition-all cursor-pointer ${
                      customerScreen === 'register' ? 'clay-btn clay-btn-primary text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    + Registro
                  </button>
                </div>
              </div>

              {/* Customer Selector dropdown for testing */}
              {customerScreen === 'card' && (
                <div className="w-full max-w-sm mb-3.5 clay-card p-3 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600">Probando como:</span>
                  <select
                    value={activeCustomerId}
                    onChange={(e) => setActiveCustomerId(e.target.value)}
                    className="text-xs font-black text-[#1D4E3E] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none"
                  >
                    {effectiveStoreCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.currentStamps}/{business.maxStamps} sellos)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Simulated Mobile Device Frame - Smooth Clay Finish */}
              <div className="w-full max-w-sm bg-slate-900 p-4 rounded-[46px] shadow-2xl border-4 border-slate-700/80 relative ring-4 ring-slate-900/10">
                {/* iPhone Dynamic Island notch */}
                <div className="w-24 h-4 bg-black rounded-full mx-auto mb-3.5 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-800 mr-2"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-900"></div>
                </div>

                {customerScreen === 'card' ? (
                  <CustomerCard
                    customer={activeCustomer}
                    business={business}
                    activeNotification={activeNotification}
                    onCloseNotification={() => setActiveNotification(null)}
                    latestNotification={currentStoreNotifications[0] || null}
                    onResetCustomer={handleResetCustomer}
                  />
                ) : (
                  <CustomerRegistration
                    business={business}
                    onRegisterSuccess={handleRegisterSuccess}
                  />
                )}

                {/* iPhone Home Bar */}
                <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mt-4"></div>
              </div>

              <div className="mt-4 text-center max-w-xs">
                <p className="text-xs text-gray-500">
                  💡 <strong className="text-gray-800">Prueba interactiva:</strong> Cuando el comerciante da un sello a la izquierda, la tarjeta de la derecha se sella y suena al instante.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= MERCHANT ONLY MODE ================= */}
        {viewMode === 'merchant' && (
          <div className="flex flex-col items-center w-full">
            <MerchantDashboard
              currentUser={currentUser}
              business={business}
              customers={effectiveStoreCustomers}
              platformName={platformName}
              platformLogo={platformLogo}
              selectedCustomerId={activeCustomerId}
              onSelectCustomer={setActiveCustomerId}
              onAddStamp={handleAddStamp}
              onUndoStamp={handleUndoStamp}
              onClaimReward={handleClaimReward}
              onOpenScanner={() => setScannerOpen(true)}
              onSendPushNotification={handleSendPush}
              onClearNotifications={handleClearNotifications}
              notifications={currentStoreNotifications}
              onOpenCounterSign={() => setCounterSignOpen(true)}
              onUpdateBusiness={handleUpdateStore}
              onChangePassword={(newPass) => handleChangePassword(business.id, newPass)}
              onUpdateCustomer={handleUpdateCustomer}
              onDeleteCustomer={handleDeleteCustomer}
              onLogout={handleLogout}
              appLang={appLang}
              setAppLang={setAppLang}
            />
          </div>
        )}

        {/* ================= CUSTOMER ONLY MODE ================= */}
        {viewMode === 'customer' && (
          <div className="flex flex-col items-center max-w-sm mx-auto w-full py-2">
            {/* Admin/Debug Switchers only for Admin */}
            {currentUser?.role === 'admin' && (
              <div className="w-full mb-4 flex flex-wrap justify-between items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomerScreen(customerScreen === 'card' ? 'register' : 'card')}
                  className="clay-btn clay-btn-light text-xs font-black text-[#1D4E3E] px-3.5 py-2 shadow-xs cursor-pointer"
                >
                  {customerScreen === 'card' ? '← Ver Pantalla de Registro' : '← Ver Tarjeta en Wallet'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAdminMasterView(true);
                    try { localStorage.setItem('fidelipass_show_admin_master', 'true'); } catch {}
                    window.location.href = '/admin';
                  }}
                  className="clay-btn bg-[#1D4E3E] text-white text-xs font-black px-3.5 py-2 shadow-xs cursor-pointer flex items-center gap-1.5 hover:bg-[#153B2F]"
                >
                  <Shield size={14} />
                  <span>Volver a SuperAdmin</span>
                </button>

                {customerScreen === 'card' && (
                  <select
                    value={activeCustomerId}
                    onChange={(e) => setActiveCustomerId(e.target.value)}
                    className="text-xs font-black text-[#1D4E3E] bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-xs"
                  >
                    {effectiveStoreCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.currentStamps}/{business.maxStamps} sellos)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="w-full">
              {customerScreen === 'card' ? (
                <div>
                  <CustomerCard
                    customer={activeCustomer}
                    business={business}
                    activeNotification={activeNotification}
                    onCloseNotification={() => setActiveNotification(null)}
                    latestNotification={currentStoreNotifications[0] || null}
                    onResetCustomer={handleResetCustomer}
                  />
                  <div className="text-center mt-5">
                    <button
                      onClick={() => setCustomerScreen('register')}
                      className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 cursor-pointer shadow-xs"
                    >
                      ¿No tienes tarjeta aún? Regístrate gratis aquí
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <CustomerRegistration
                    business={business}
                    onRegisterSuccess={handleRegisterSuccess}
                  />
                  <div className="text-center mt-5">
                    <button
                      onClick={() => setCustomerScreen('card')}
                      className="clay-btn clay-btn-light px-4 py-2 text-xs font-bold text-gray-700 hover:text-gray-900 cursor-pointer shadow-xs"
                    >
                      Ya tengo tarjeta, ver mi tarjeta en Wallet
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* QR Scanner Modal (Camera & Simulation) */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        business={business}
        customers={effectiveStoreCustomers}
        onAddNewCustomerFromScan={handleAddNewCustomerFromScan}
        onScanSuccess={(cust) => {
          handleAddStamp(cust.id);
        }}
      />

      {/* Printable Poster Modal for MC Rolls Counter */}
      {counterSignOpen && (
        <PrintableCounterSign
          business={business}
          onClose={() => setCounterSignOpen(false)}
        />
      )}

      {/* SaaS Business Plan & Calculator Modal */}
      <BusinessCalculator
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
      />
    </div>
  );
}
