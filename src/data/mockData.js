export const INITIAL_BUSINESS = {
  id: "mc-rolls",
  name: "MC Rolls",
  tagline: "Helados, Crepes & Milkshakes",
  category: "Heladería & Cafetería",
  logo: "/logos/mcrolls.png",
  banner: "/logos/mcrolls-banner-v2.jpg",
  maxStamps: 8,
  rewardTitle: "1 Helado Artesanal Gratis",
  rewardDescription: "Elige cualquier sabor en cono o vaso al completar tus 8 sellos.",
  accentColor: "#2B787C", // MC Rolls Teal
  cardBgColor: "#1B474A", // Elegant Deep Teal matching logo
  stampType: "logo", // 'logo' | 'icon'
  secondaryColor: "#FF5E36", // Warm Orange
  iconType: "icecream", // 'icecream' | 'coffee' | 'pizza' | 'star' | 'burger' | 'barber' | 'car' | 'gift'
  phone: "+593 99 123 4567",
  address: "Av. Principal y Las Acacias, Local 4",
  ownerPassword: "mcrolls123",
  dailyCost: 0.50,
  monthlyCost: 15.00,
  enableGeofence: true,
  latitude: -2.1911889,
  longitude: -79.9449926,
  proximityMessage: "🍦 ¡Estás cerca de MC Rolls! Pasa por tu helado favorito y suma sellos hoy."
};

export function getBusinessIcon(iconType) {
  switch (iconType) {
    case 'burger': return '🍔';
    case 'pizza': return '🍕';
    case 'coffee': return '☕';
    case 'icecream': return '🍦';
    case 'star': return '⭐';
    case 'barber': return '✂️';
    case 'car': return '🚗';
    case 'gift': return '🎁';
    default: return '🏪';
  }
}

export const INITIAL_CUSTOMERS = [];

export const INITIAL_NOTIFICATIONS = [];

