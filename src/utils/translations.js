// Internationalization (i18n) Engine for FideliPass (Spanish & English)

export const TRANSLATIONS = {
  es: {
    // Customer Registration
    joinTitle: (storeName) => `Únete al Club de ${storeName}`,
    joinSubtitle: "Guarda tu tarjeta en tu celular y gana premios con cada visita.",
    fullName: "Tu Nombre y Apellido",
    fullNamePlaceholder: "Ej. María Pérez",
    mobilePhone: "Número de Celular",
    email: "Correo Electrónico (Opcional)",
    birthday: "Fecha de Cumpleaños (Opcional)",
    birthdayHint: "🎂 Te enviaremos un regalo sorpresa en tu cumpleaños",
    getCardBtn: "Obtener Mi Tarjeta Digital 🎁",
    welcomeGiftBadge: "✨ ¡Te regalamos tu 1er sello de bienvenida al registrarte!",
    noAppNeeded: "Sin descargar apps pesadas • 100% Gratis",
    privacyNotice: "Tus datos están protegidos. No enviamos spam.",
    alreadyHaveCard: "¿Ya tienes tarjeta? Ver mi tarjeta en Wallet",

    // Customer Card
    stamps: "SELLOS",
    reward: "PREMIO",
    completeStampsToEarn: (remaining, reward) => remaining === 0 ? `¡Felicidades! Ya tienes tu ${reward} listo.` : `Te faltan solo ${remaining} sellos para tu ${reward}`,
    addToAppleWallet: "Añadir a Apple Wallet",
    addToGoogleWallet: "Añadir a Google Wallet",
    saveAsAppHint: "Guárdala como App en tu teléfono — sin ocupar memoria.",
    cardholder: "Titular:",
    stampsOf: "sellos",
    switchCustomer: "¿Registrar otra tarjeta / Cambiar cliente?",
    rewardUnlocked: "¡PREMIO DESBLOQUEADO!",
    redeemAtCounter: "Muéstrala en caja para canjear",
    terms: "Términos",
    termsText: (maxStamps, reward) => `1 sello por visita o compra. Al acumular ${maxStamps} sellos recibes tu ${reward}.`,
    
    // Merchant Dashboard
    today: "Hoy",
    customers: "Clientes",
    scan: "Escanear",
    push: "Push",
    more: "Más",
    todaySales: "Ventas de hoy",
    stampsAwardedToday: "Otorgados hoy",
    activeCustomers: "Clientes activos",
    addStamp: "+1 Sello",
    undoStamp: "Deshacer",
    claimReward: "Canjear Premio",
    sendPush: "Enviar Notificación Push",
    pushMessagePlaceholder: "Escribe tu mensaje o promoción...",
    pushTargetAll: "Todos los clientes",
    pushTargetIndividual: "Cliente individual",
    sendBtn: "Enviar Notificación",
    storeConfig: "Configuración del Local",
    saveConfig: "Guardar Cambios"
  },
  en: {
    // Customer Registration
    joinTitle: (storeName) => `Join ${storeName}'s VIP Club`,
    joinSubtitle: "Save your digital pass to your phone and earn rewards with every visit.",
    fullName: "Full Name",
    fullNamePlaceholder: "e.g. John Smith",
    mobilePhone: "Mobile Phone Number",
    email: "Email Address (Optional)",
    birthday: "Birthday (Optional)",
    birthdayHint: "🎂 We'll send you a special VIP gift on your birthday",
    getCardBtn: "Get My Digital VIP Pass 🎁",
    welcomeGiftBadge: "✨ Free 1st Welcome Stamp Gift Included on Sign Up!",
    noAppNeeded: "No app download needed • 100% Free",
    privacyNotice: "Your data is secure. We never send spam.",
    alreadyHaveCard: "Already a member? View my card in Wallet",

    // Customer Card
    stamps: "STAMPS",
    reward: "REWARD",
    completeStampsToEarn: (remaining, reward) => remaining === 0 ? `Congratulations! Your ${reward} is ready to redeem.` : `Only ${remaining} more stamp${remaining > 1 ? 's' : ''} to unlock your ${reward}`,
    addToAppleWallet: "Add to Apple Wallet",
    addToGoogleWallet: "Add to Google Wallet",
    saveAsAppHint: "Save as an App on your home screen — uses zero storage.",
    cardholder: "Cardholder:",
    stampsOf: "stamps",
    switchCustomer: "Register another card / Switch member?",
    rewardUnlocked: "REWARD UNLOCKED!",
    redeemAtCounter: "Show this pass at checkout to redeem",
    terms: "Terms",
    termsText: (maxStamps, reward) => `1 stamp per visit or session. Collect ${maxStamps} stamps to earn your ${reward}.`,

    // Merchant Dashboard
    today: "Today",
    customers: "Members",
    scan: "Scan",
    push: "Push",
    more: "Settings",
    todaySales: "Today's Activity",
    stampsAwardedToday: "Stamps today",
    activeCustomers: "Active members",
    addStamp: "+1 Stamp",
    undoStamp: "Undo Stamp",
    claimReward: "Redeem Reward",
    sendPush: "Send Push Notification",
    pushMessagePlaceholder: "Write your special promo or message...",
    pushTargetAll: "All members",
    pushTargetIndividual: "Single member",
    sendBtn: "Send Notification",
    storeConfig: "Store Settings",
    saveConfig: "Save Settings"
  }
};

export function getT(language = 'es') {
  return TRANSLATIONS[language] || TRANSLATIONS.es;
}
