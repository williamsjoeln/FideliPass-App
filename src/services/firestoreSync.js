import { db, collection, doc, setDoc, onSnapshot, updateDoc, getDocs, deleteDoc } from './firebase';

// Helper to check if Firestore is reachable or if the user hasn't clicked "Create Database" in Firebase Console yet
let isFirestoreAvailable = false;

export async function testFirestoreConnection() {
  try {
    const snap = await getDocs(collection(db, '_health_check'));
    isFirestoreAvailable = true;
    return true;
  } catch (err) {
    console.warn("Firestore not active yet, using local storage fallback:", err.message);
    isFirestoreAvailable = false;
    return false;
  }
}

export function matchesStore(customerStoreId, activeStoreId) {
  if (!customerStoreId && (activeStoreId === 'mc-rolls' || activeStoreId === 'mcrolls')) return true;
  if (!customerStoreId || !activeStoreId) return false;
  const c = String(customerStoreId).toLowerCase().trim();
  const s = String(activeStoreId).toLowerCase().trim();
  if (c === s) return true;
  if ((c.includes('simba') || c === 'store-1792951625504') && (s.includes('simba') || s === 'store-1792951625504')) return true;
  if (c.includes('pure') && s.includes('pure')) return true;
  if ((c.includes('mcrolls') || c.includes('mc-rolls')) && (s.includes('mcrolls') || s.includes('mc-rolls'))) return true;
  return false;
}

// Real-time synchronization for Customers of a store
export function subscribeToStoreCustomers(storeId, onUpdate) {
  try {
    const unsub = onSnapshot(collection(db, 'customers'), (snapshot) => {
      const customers = [];
      const mockIds = ['cust-1', 'cust-2', 'cust-3', 'cust-4', 'cust-5'];
      snapshot.forEach(docSnap => {
        if (mockIds.includes(docSnap.id)) {
          // Permanently remove mock customers from Firestore
          try { deleteDoc(doc(db, 'customers', docSnap.id)); } catch {}
          return;
        }
        const data = docSnap.data();
        if (matchesStore(data.businessId, storeId)) {
          customers.push({ id: docSnap.id, ...data });
        }
      });
      onUpdate(customers);
    }, (err) => {
      console.warn("Firestore subscription note:", err.message);
    });
    return unsub;
  } catch (e) {
    console.warn("Firestore subscribe error:", e);
    return () => {};
  }
}

// Delete customer from Firestore
export async function deleteCustomerFromFirestore(customerId) {
  try {
    await deleteDoc(doc(db, 'customers', customerId));
  } catch (e) {
    console.warn("Could not delete customer from Firestore:", e.message);
  }
}

export function sanitizeString(val) {
  if (typeof val !== 'string') return val;
  return val
    .replace(/\0/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

function sanitizeForFirestore(obj) {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }
  return JSON.parse(JSON.stringify(obj, (k, v) => {
    if (v === undefined) return null;
    if (typeof v === 'string') return sanitizeString(v);
    return v;
  }));
}

// Add or update customer in Firestore
export async function syncCustomerToFirestore(customer) {
  try {
    const cleanCustomer = sanitizeForFirestore(customer);
    await setDoc(doc(db, 'customers', cleanCustomer.id), cleanCustomer, { merge: true });
  } catch (e) {
    console.warn("Could not sync customer to Firestore (offline/pending):", e.message);
  }
}

// Update stamps in Firestore
export async function updateCustomerStampsInFirestore(customerId, newStamps, history) {
  try {
    const cleanHistory = sanitizeForFirestore(history || []);
    await setDoc(doc(db, 'customers', customerId), {
      currentStamps: Number(newStamps),
      lastVisit: 'Hoy, recién',
      history: cleanHistory
    }, { merge: true });
  } catch (e) {
    console.warn("Could not update stamps in Firestore:", e.message);
  }
}

// Real-time synchronization for Stores
export function subscribeToStores(onUpdate) {
  try {
    const unsub = onSnapshot(collection(db, 'stores'), (snapshot) => {
      const stores = [];
      snapshot.forEach(docSnap => {
        stores.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (stores.length > 0) {
        onUpdate(stores);
      }
    }, (err) => {
      console.warn("Firestore stores subscription note:", err.message);
    });
    return unsub;
  } catch (e) {
    console.warn("Firestore stores subscribe error:", e);
    return () => {};
  }
}

// Real-time synchronization for Accounts (passwords, logins)
export function subscribeToAccounts(onUpdate) {
  try {
    const unsub = onSnapshot(collection(db, 'accounts'), (snapshot) => {
      const accounts = [];
      snapshot.forEach(docSnap => {
        accounts.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (accounts.length > 0) {
        onUpdate(accounts);
      }
    }, (err) => {
      console.warn("Firestore accounts subscription note:", err.message);
    });
    return unsub;
  } catch (e) {
    console.warn("Firestore accounts subscribe error:", e);
    return () => {};
  }
}

// Sync store config to Firestore
export async function syncStoreToFirestore(store) {
  if (!store || !store.id) return;
  if (store.id === 'pizzeria-bella' || store.id === 'cafe-roble' || store.id === 'willstore') {
    try { await deleteDoc(doc(db, 'stores', store.id)); } catch {}
    return;
  }
  try {
    const cleanStore = sanitizeForFirestore(store);
    await setDoc(doc(db, 'stores', cleanStore.id), cleanStore, { merge: true });
  } catch (e) {
    console.warn("Could not sync store to Firestore:", e.message);
  }
}

// Sync account to Firestore
export async function syncAccountToFirestore(account) {
  if (!account || !account.id) return;
  if (account.id === 'acc-pizzeria' || account.id === 'acc-cafe' || account.id === 'acc-willstore' || account.businessId === 'pizzeria-bella' || account.businessId === 'cafe-roble' || account.businessId === 'willstore') {
    try { await deleteDoc(doc(db, 'accounts', account.id)); } catch {}
    return;
  }
  try {
    const cleanAccount = sanitizeForFirestore(account);
    await setDoc(doc(db, 'accounts', cleanAccount.id), cleanAccount, { merge: true });
  } catch (e) {
    console.warn("Could not sync account to Firestore:", e.message);
  }
}

// Delete store permanently from Firestore
export async function deleteStoreFromFirestore(storeId) {
  try {
    await deleteDoc(doc(db, 'stores', storeId));
  } catch (e) {
    console.error("Could not delete store from Firestore:", e.message);
    throw e;
  }
}

// Delete account permanently from Firestore
export async function deleteAccountFromFirestore(accountId) {
  try {
    await deleteDoc(doc(db, 'accounts', accountId));
  } catch (e) {
    console.warn("Could not delete account from Firestore:", e.message);
  }
}

// Real-time synchronization for Platform Settings (logo, platform name)
export function subscribeToPlatformSettings(onUpdate) {
  try {
    const unsub = onSnapshot(doc(db, 'settings', 'platform'), (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      }
    }, (err) => {
      console.warn("Platform settings subscription note:", err.message);
    });
    return unsub;
  } catch (e) {
    console.warn("Firestore platform settings subscribe error:", e);
    return () => {};
  }
}

// Sync platform settings to Firestore
export async function syncPlatformSettingsToFirestore(settings) {
  try {
    const clean = sanitizeForFirestore(settings);
    await setDoc(doc(db, 'settings', 'platform'), clean, { merge: true });
  } catch (e) {
    console.warn("Could not sync platform settings to Firestore:", e.message);
  }
}

// Real-time synchronization for Store Push Notifications
export function subscribeToStoreNotifications(storeId, onNewNotification, onHistoryUpdate) {
  try {
    const unsub = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const notifs = [];
      let newest = null;
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.businessId === storeId || (!data.businessId && storeId === 'mc-rolls')) {
          const item = { id: docSnap.id, ...data };
          const itemCreatedAt = Number(item.createdAt || 0);

          // Auto-purge notifications older than 24 hours from Cloud Firestore
          if (itemCreatedAt && itemCreatedAt < oneDayAgo) {
            try { deleteDoc(doc(db, 'notifications', docSnap.id)); } catch {}
            return;
          }

          notifs.push(item);
          if (!newest || (item.createdAt || 0) > (newest.createdAt || 0)) {
            newest = item;
          }
        }
      });

      notifs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      if (onHistoryUpdate) {
        onHistoryUpdate(notifs);
      }

      // If there is a recent notification (created within the last 5 minutes), notify
      if (newest && newest.createdAt && (Date.now() - Number(newest.createdAt) < 300000)) {
        if (onNewNotification) {
          onNewNotification(newest);
        }
      }
    }, (err) => {
      console.warn("Notifications subscription note:", err.message);
    });
    return unsub;
  } catch (e) {
    console.warn("Notifications subscribe error:", e);
    return () => {};
  }
}

// Clean all store push notifications from Firestore (e.g., daily reset or manual clear)
export async function clearStoreNotificationsInFirestore(storeId) {
  try {
    const snapshot = await getDocs(collection(db, 'notifications'));
    const deletePromises = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.businessId === storeId || (!data.businessId && storeId === 'mc-rolls')) {
        deletePromises.push(deleteDoc(doc(db, 'notifications', docSnap.id)));
      }
    });
    await Promise.all(deletePromises);
  } catch (e) {
    console.warn("Could not clear notifications in Firestore:", e.message);
  }
}

// Sync push notification to Firestore
export async function syncNotificationToFirestore(notification) {
  if (!notification || !notification.message) return;
  try {
    const notifId = notification.id || `notif-${Date.now()}`;
    const cleanNotif = sanitizeForFirestore({
      ...notification,
      id: notifId,
      createdAt: Number(notification.createdAt || Date.now())
    });
    await setDoc(doc(db, 'notifications', notifId), cleanNotif, { merge: true });
  } catch (e) {
    console.warn("Could not sync notification to Firestore:", e.message);
  }
}

// Browser native Web Push / Notification helpers
export async function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch (e) {
      console.warn("Notification permission request error:", e);
      return false;
    }
  }
  return false;
}

export function triggerBrowserNotification(title, options) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      return new Notification(title, options);
    } catch (e) {
      console.warn("Browser notification display error:", e);
    }
  }
}


