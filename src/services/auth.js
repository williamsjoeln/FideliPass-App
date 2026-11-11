// Authentication & Multi-tenant Store Manager for fidelipassapp.com

export const INITIAL_ACCOUNTS = [
  {
    id: "acc-admin",
    name: "Administrador FideliPass (Tú)",
    email: "admin@fidelipass.com",
    password: "williamsadmin",
    role: "admin", // 'admin' | 'merchant'
    businessId: null,
    badge: "Super Admin"
  },
  {
    id: "acc-mcrolls",
    name: "Cajero - MC Rolls",
    email: "mcrolls@fidelipass.com",
    password: "mcrolls123",
    role: "merchant",
    businessId: "mc-rolls",
    badge: "Heladería"
  }
];

export const INITIAL_STORES = [
  {
    id: "mc-rolls",
    name: "MC Rolls",
    tagline: "Helados, Crepes & Milkshakes",
    category: "Heladería",
    ownerName: "Familia MC Rolls",
    ownerEmail: "mcrolls@fidelipass.com",
    ownerPassword: "mcrolls123",
    ownerPhone: "+593 99 123 4567",
    status: "active", // 'active' | 'trial' | 'suspended'
    plan: "Plan Oficial",
    monthlyFee: 15.00,
    paidUntil: "18 Nov 2026",
    joinedDate: "18 Oct 2026",
    maxStamps: 8,
    rewardTitle: "1 Helado Artesanal Gratis",
    logo: "/logos/mcrolls.png",
    cardBgColor: "#1B474A",
    stampType: "logo",
    accentColor: "#2B787C",
    iconType: "icecream",
    activeCustomersCount: 1,
    totalStampsAwarded: 1,
    enableGeofence: true,
    latitude: -2.1911889,
    longitude: -79.9449926,
    proximityMessage: "🍦 ¡Estás cerca de MC Rolls! Pasa por tu helado favorito y suma sellos hoy."
  },
  {
    id: "one-stop-barber-studio",
    slug: "one-stop-barber-studio",
    name: "One Stop Barber Studio",
    tagline: "Mobile Barber Van • San Diego, CA",
    category: "Barbería & Grooming",
    ownerName: "Ricardo",
    ownerEmail: "onestopbarbervanstudio@gmail.com",
    ownerPassword: "barberpass2026",
    ownerPhone: "+1 619 555 0199",
    status: "active",
    plan: "Plan Pro VIP",
    monthlyFee: 50.00,
    paidUntil: "29 Nov 2026",
    joinedDate: "29 Oct 2026",
    maxStamps: 6,
    rewardTitle: "50% OFF or Free Beard Trim",
    logo: "/logos/onestopbarber-logo.png",
    banner: "/onestopbarber-banner.png",
    cardBgColor: "#121212",
    stampType: "logo",
    accentColor: "#D4AF37",
    iconType: "scissors",
    language: "en",
    activeCustomersCount: 1,
    totalStampsAwarded: 1,
    enableGeofence: true,
    latitude: 32.7157,
    longitude: -117.1611,
    address: "San Diego, CA (Mobile Studio)",
    proximityMessage: "✂️ You're near One Stop Barber Studio! Show your VIP pass for your discount."
  }
];

