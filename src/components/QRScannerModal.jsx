import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  X, Camera, Sparkles, CheckCircle2, AlertCircle, Search, 
  Smartphone, ArrowRight, Zap, ZoomIn, ZoomOut, RotateCcw, 
  Lightbulb, RefreshCw, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';

export function QRScannerModal({ isOpen, onClose, business, customers = [], onScanSuccess, onAddNewCustomerFromScan }) {
  const isEn = typeof window !== 'undefined' && localStorage.getItem('fidelipass_lang') === 'en';
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scannedResult, setScannedResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  
  // Camera Controls: Zoom & Torch (Flash)
  const [currentZoom, setCurrentZoom] = useState(1);
  const [hasHardwareZoom, setHasHardwareZoom] = useState(false);
  const [maxHardwareZoom, setMaxHardwareZoom] = useState(3);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const scannerRef = useRef(null);
  const videoTrackRef = useRef(null);
  const isStoppingRef = useRef(false);

  // Safe stop helper that cleans up tracks, flashlight and Html5Qrcode gracefully without crashing
  const safeStopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      if (videoTrackRef.current && typeof videoTrackRef.current.applyConstraints === 'function') {
        await videoTrackRef.current.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
      }
    } catch {}

    try {
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
        videoTrackRef.current = null;
      }
      const videoEl = document.querySelector('#qr-reader-viewport video');
      if (videoEl?.srcObject) {
        const stream = videoEl.srcObject;
        stream.getTracks().forEach(t => {
          try { t.stop(); } catch {}
        });
        videoEl.srcObject = null;
      }
    } catch (e) {
      console.warn("Camera track stop note:", e);
    }

    try {
      const scanner = scannerRef.current;
      if (scanner) {
        if (scanner.isScanning) {
          await scanner.stop().catch(() => {});
        }
        await scanner.clear().catch(() => {});
      }
    } catch (e) {
      console.warn("Scanner stop note:", e);
    } finally {
      scannerRef.current = null;
      isStoppingRef.current = false;
    }
  };

  const handleSafeClose = async () => {
    setCameraActive(false);
    await safeStopScanner();
    onClose();
  };

  // Auto-start or auto-clean camera when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      setCameraError(null);
      setManualCode('');
      setCurrentZoom(1);
      setIsTorchOn(false);
      setCameraActive(true);
    } else {
      setCameraActive(false);
      safeStopScanner();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !cameraActive) return;

    let isMounted = true;
    const qrRegionId = "qr-reader-viewport";
    
    const startScanner = async () => {
      await safeStopScanner();
      if (!isMounted) return;

      try {
        const html5QrCode = new Html5Qrcode(qrRegionId, false);
        scannerRef.current = html5QrCode;

        let cameraIdOrConfig = { facingMode: "environment" };
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            const backCam = devices.find(d => /back|rear|environment|trasera|posterior/i.test(d.label));
            if (backCam) {
              cameraIdOrConfig = backCam.id;
            }
          }
        } catch (camErr) {
          console.warn("Camera enumeration note:", camErr);
        }

        const config = {
          fps: 15,
          disableFlip: false
        };

        await html5QrCode.start(
          cameraIdOrConfig,
          config,
          async (decodedText) => {
            if (!isMounted) return;
            await handleProcessQR(decodedText);
          },
          () => {} // silent search frame
        );

        if (!isMounted) {
          await safeStopScanner();
          return;
        }

        setTimeout(() => {
          if (!isMounted) return;
          try {
            const video = document.querySelector('#qr-reader-viewport video');
            const stream = video?.srcObject;
            const track = stream?.getVideoTracks?.()[0];
            if (track) {
              videoTrackRef.current = track;
              if (typeof track.getCapabilities === 'function') {
                const caps = track.getCapabilities();
                if (caps.zoom) {
                  setHasHardwareZoom(true);
                  setMaxHardwareZoom(Math.min(caps.zoom.max || 5, 4));
                }
                if (caps.torch) {
                  setHasTorch(true);
                }
              }
            }
          } catch (trackErr) {
            console.warn("Track capabilities inspection note:", trackErr);
          }
        }, 400);

      } catch (err) {
        console.warn("Camera start fallback attempt:", err);
        try {
          if (isMounted) {
            const fallbackScanner = new Html5Qrcode(qrRegionId, false);
            scannerRef.current = fallbackScanner;
            await fallbackScanner.start(
              { facingMode: "environment" },
              { fps: 15, disableFlip: false },
              async (decodedText) => {
                if (!isMounted) return;
                await handleProcessQR(decodedText);
              },
              () => {}
            );
            return;
          }
        } catch (fallbackErr) {
          console.warn("Secondary camera fallback failed:", fallbackErr);
        }
        if (isMounted) {
          setCameraError("No se pudo iniciar el video de la cámara. Puedes ingresar el código o ID abajo manualmente.");
          setCameraActive(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      safeStopScanner();
    };
  }, [isOpen, cameraActive]);

  // Handle Zoom (Hardware Optical/Sensor Zoom with Digital Fallback)
  const applyZoom = async (newZoom) => {
    setCurrentZoom(newZoom);
    
    // 1. Try Hardware Camera Zoom
    const track = videoTrackRef.current;
    if (track && typeof track.applyConstraints === 'function') {
      try {
        const caps = track.getCapabilities ? track.getCapabilities() : {};
        if (caps.zoom) {
          const clamped = Math.min(caps.zoom.max || 5, Math.max(caps.zoom.min || 1, newZoom));
          await track.applyConstraints({ advanced: [{ zoom: clamped }] });
        }
      } catch (e) {
        console.warn("Hardware zoom error, using digital zoom fallback:", e);
      }
    }

    // 2. Smooth Digital Zoom on Video Viewport
    const video = document.querySelector('#qr-reader-viewport video');
    if (video) {
      video.style.transform = `scale(${newZoom})`;
      video.style.transformOrigin = 'center center';
      video.style.transition = 'transform 0.25s ease-out';
    }
  };

  // Handle Flashlight / Torch Toggle
  const toggleTorch = async () => {
    const nextTorch = !isTorchOn;
    const track = videoTrackRef.current;
    if (track && typeof track.applyConstraints === 'function') {
      try {
        await track.applyConstraints({ advanced: [{ torch: nextTorch }] });
        setIsTorchOn(nextTorch);
      } catch (e) {
        console.warn("Torch constraint error:", e);
      }
    }
  };

  const handleProcessQR = (rawText) => {
    let customerId = null;
    let customerName = null;
    let customerEmail = null;
    let customerPhone = null;
    let currentStamps = 1;
    let targetBusinessId = business?.id || 'mc-rolls';

    const text = String(rawText || '').trim();
    if (!text) {
      setCameraError("Código QR vacío.");
      return;
    }

    // 1. Try JSON parsing (supports both full and compact keys)
    try {
      const parsed = JSON.parse(text);
      customerId = parsed.id || parsed.customerId || (parsed.c ? parsed.c : null) || (parsed.token ? String(parsed.token).replace(/^fpass-/, '') : null);
      customerName = parsed.n || parsed.name;
      customerEmail = parsed.e || parsed.email;
      customerPhone = parsed.p || parsed.phone;
      if (parsed.s !== undefined) currentStamps = Number(parsed.s);
      else if (parsed.currentStamps !== undefined) currentStamps = Number(parsed.currentStamps);
      if (parsed.b || parsed.businessId) targetBusinessId = parsed.b || parsed.businessId;
    } catch {
      try {
        const parsed = JSON.parse(text.replace(/'/g, '"'));
        customerId = parsed.id || parsed.customerId || (parsed.c ? parsed.c : null) || (parsed.token ? String(parsed.token).replace(/^fpass-/, '') : null);
        customerName = parsed.n || parsed.name;
        customerEmail = parsed.e || parsed.email;
        customerPhone = parsed.p || parsed.phone;
        if (parsed.s !== undefined) currentStamps = Number(parsed.s);
        else if (parsed.currentStamps !== undefined) currentStamps = Number(parsed.currentStamps);
        if (parsed.b || parsed.businessId) targetBusinessId = parsed.b || parsed.businessId;
      } catch {}
    }

    // 2. Try URL parsing if text contains URL or params
    if (!customerId && (text.includes('?') || text.startsWith('http'))) {
      try {
        const url = new URL(text, window.location.origin);
        customerId = url.searchParams.get('c') || url.searchParams.get('cust') || url.searchParams.get('id');
        const nParam = url.searchParams.get('n') || url.searchParams.get('name');
        if (nParam) customerName = decodeURIComponent(nParam);
        const eParam = url.searchParams.get('e') || url.searchParams.get('email');
        if (eParam) customerEmail = decodeURIComponent(eParam);
        const bParam = url.searchParams.get('store') || url.searchParams.get('b');
        if (bParam) targetBusinessId = bParam;
      } catch {}
    }

    // 3. Try matching cust-XXXX pattern
    if (!customerId) {
      const match = text.match(/cust-[a-zA-Z0-9_-]+/i);
      if (match) {
        customerId = match[0];
      }
    }

    // 4. Fallback: treat text itself as customer ID
    if (!customerId) {
      customerId = text.slice(0, 30);
    }

    const normalizedId = customerId.trim();

    // Search in current store customers (case-insensitive)
    let matched = customers.find(c => c.id.toLowerCase() === normalizedId.toLowerCase());

    if (matched) {
      if (customerName && (matched.name.includes('Cliente (') || matched.name === 'Cliente VIP')) {
        matched.name = customerName;
      }
      if (customerEmail && (!matched.email || matched.email.includes('@fidelipass.com') || matched.email.includes('@ejemplo.com'))) {
        matched.email = customerEmail;
      }
      customerName = matched.name;
    } else {
      // Auto-enroll customer immediately so cashier never rejects a customer!
      const finalName = customerName || `Cliente (${normalizedId.slice(-4).toUpperCase()})`;
      matched = {
        id: normalizedId,
        businessId: targetBusinessId,
        name: finalName,
        email: customerEmail || `${normalizedId.toLowerCase()}@fidelipass.com`,
        phone: customerPhone || '+593 99 000 0000',
        status: 'Recién activado',
        device: 'Apple Wallet (iPhone)',
        deviceType: 'apple',
        currentStamps: currentStamps,
        totalSpent: 4.50,
        rewardsClaimed: 0,
        joinedDate: 'Hoy',
        lastVisit: 'Hoy, recién',
        history: [
          { id: 'h-' + Date.now(), type: 'stamp', date: 'Hoy', note: '🎉 Tarjeta escaneada y registrada en caja' }
        ]
      };

      if (onAddNewCustomerFromScan) {
        onAddNewCustomerFromScan(matched);
      }
    }

    // Success actions
    sounds.playStamp();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    setScannedResult(matched);
    safeStopScanner();
    onScanSuccess(matched);
    setCameraError(null);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleProcessQR(manualCode.trim());
  };

  const handleQuickStamp = (cust) => {
    sounds.playStamp();
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 }
    });
    setScannedResult(cust);
    safeStopScanner();
    onScanSuccess(cust);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)] bg-slate-950/80 backdrop-blur-xl animate-fade-in text-left ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      style={{ display: isOpen ? 'flex' : 'none' }}
    >
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[36px] overflow-hidden flex flex-col max-h-[92dvh] shadow-[0_25px_70px_rgba(0,0,0,0.35)] border border-white/60 ring-1 ring-black/5 animate-scale-up">
        
        {/* Modal Header - Apple Glass Style */}
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-100/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#38BDF8] text-white flex items-center justify-center shadow-md shadow-sky-500/25">
              <Camera size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-heading font-black text-slate-900 text-base leading-tight tracking-tight">
                {isEn ? 'Scan Member Pass' : 'Escanear Tarjeta de Cliente'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isEn ? 'Point at Apple Wallet or Google Wallet QR' : 'Apunta al código QR en el celular del cliente'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSafeClose}
            className="w-9 h-9 rounded-full bg-slate-200/70 hover:bg-slate-300/80 text-slate-700 flex items-center justify-center transition-colors cursor-pointer font-bold active:scale-95"
            title={isEn ? "Close" : "Cerrar"}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Success Toast Banner */}
          {scannedResult && (
            <div className="p-4 rounded-3xl bg-sky-50 border border-sky-100 text-sky-950 flex items-center gap-3.5 animate-stamp shadow-sm">
              <div className="w-11 h-11 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/30">
                <CheckCircle2 size={26} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>{isEn ? 'Stamp Awarded Successfully!' : '¡Sello Otorgado con Éxito!'}</span>
                  <span>🎉</span>
                </h4>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  {isEn ? 'Member:' : 'Cliente:'} <strong className="font-black text-slate-900">{scannedResult.name}</strong>
                </p>
                <div className="mt-1 inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-black bg-sky-100 text-[#007AFF]">
                  {isEn ? 'Total stamps:' : 'Total de sellos:'} {Math.min(business?.maxStamps || 8, (scannedResult.currentStamps || 1) + 1)} / {business?.maxStamps || 8}
                </div>
              </div>
            </div>
          )}

          {/* LARGE CAMERA VIEWFINDER */}
          <div className="relative rounded-[28px] overflow-hidden bg-black aspect-square sm:aspect-[4/3] min-h-[290px] flex flex-col items-center justify-center border-2 border-slate-900/10 shadow-2xl group">
            
            {/* The Html5Qrcode video injects here */}
            <div id="qr-reader-viewport" className="w-full h-full" />

            {/* Inactive Camera Screen */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-950/95 text-white z-20">
                <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-3 border border-white/15 shadow-inner">
                  <Camera size={32} className="text-[#38BDF8]" />
                </div>
                <h4 className="font-black text-base">{isEn ? 'Camera Paused' : 'Cámara en Pausa'}</h4>
                <p className="text-xs text-gray-300 font-medium mt-1 mb-4 max-w-xs leading-relaxed">
                  {isEn ? 'Click below to activate lens or use manual member search.' : 'Haz clic abajo para activar el lente o usa la búsqueda rápida de clientes.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCameraError(null);
                    setCameraActive(true);
                  }}
                  className="px-6 py-3 clay-btn clay-btn-primary text-white text-xs font-black shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Camera size={16} />
                  <span>{isEn ? 'Reactivate Camera' : 'Reactivar Cámara'}</span>
                </button>
              </div>
            )}

            {/* Active Scanning HUD Overlay - Clean iOS Style */}
            {cameraActive && (
              <>
                {/* Status Badge & Flashlight Button (Top Bar) */}
                <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10 pointer-events-none">
                  <div className="bg-black/45 backdrop-blur-xl border border-white/15 text-white text-[10px] px-3.5 py-1 rounded-full flex items-center gap-1.5 font-bold shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-ping" />
                    <span>{isEn ? 'CAMERA ACTIVE • SCANNING' : 'LENTE ACTIVO • ESCANEANDO'}</span>
                  </div>

                  {/* Flashlight / Torch Button (clickable) */}
                  <div className="pointer-events-auto flex items-center gap-1.5">
                    {hasTorch && (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg cursor-pointer ${
                          isTorchOn 
                            ? 'bg-[#FF5E36] text-white shadow-orange-500/30' 
                            : 'bg-black/45 backdrop-blur-xl border border-white/15 text-white hover:bg-black/60'
                        }`}
                        title="Encender o apagar la linterna"
                      >
                        <Lightbulb size={13} className={isTorchOn ? 'fill-current' : ''} />
                        <span>{isTorchOn ? 'Luz ON' : 'Flash'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Subtle Modern Blue Laser Sweeper Animation */}
                <div className="absolute inset-x-10 h-0.5 bg-gradient-to-r from-transparent via-[#007AFF] to-transparent shadow-[0_0_16px_rgba(0,122,255,0.9)] animate-scanline z-10 pointer-events-none" />

                {/* Targeting Reticle Frame (4 Royal Blue iOS Brackets) */}
                <div className="absolute inset-9 sm:inset-12 pointer-events-none flex flex-col justify-between z-10">
                  <div className="flex justify-between">
                    <div className="w-9 h-9 border-t-[3.5px] border-l-[3.5px] border-[#007AFF] rounded-tl-2xl drop-shadow-[0_0_12px_rgba(0,122,255,0.8)]" />
                    <div className="w-9 h-9 border-t-[3.5px] border-r-[3.5px] border-[#007AFF] rounded-tr-2xl drop-shadow-[0_0_12px_rgba(0,122,255,0.8)]" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-9 h-9 border-b-[3.5px] border-l-[3.5px] border-[#007AFF] rounded-bl-2xl drop-shadow-[0_0_12px_rgba(0,122,255,0.8)]" />
                    <div className="w-9 h-9 border-b-[3.5px] border-r-[3.5px] border-[#007AFF] rounded-br-2xl drop-shadow-[0_0_12px_rgba(0,122,255,0.8)]" />
                  </div>
                </div>

                {/* Center Targeting Dot */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/40 ring-4 ring-white/10" />
                </div>

                {/* ZOOM CONTROLS BAR (Segmented iOS Camera Style) */}
                <div className="absolute bottom-3 inset-x-3 z-10 flex flex-col items-center gap-1.5">
                  <div className="bg-black/55 backdrop-blur-xl p-1 px-1.5 rounded-2xl border border-white/15 flex items-center gap-1 shadow-xl">
                    <span className="text-[10px] uppercase font-bold text-gray-300 flex items-center gap-1 px-1.5">
                      <ZoomIn size={12} className="text-[#38BDF8]" />
                      <span>Zoom:</span>
                    </span>

                    {/* Zoom Presets: 1x, 1.5x, 2x, 2.5x */}
                    {[1, 1.5, 2, 2.5].map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => applyZoom(z)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentZoom === z 
                            ? 'bg-gradient-to-r from-[#007AFF] to-[#38BDF8] text-white shadow-md shadow-sky-500/30 scale-105' 
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                  
                  <span className="text-[10px] text-white/90 font-medium drop-shadow bg-black/45 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10">
                    💡 Mantén a 15–20 cm o presiona 2x para agrandar el código
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Camera Error Alert */}
          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">{cameraError}</span>
                <span className="text-[11px] text-amber-700 mt-0.5 block">
                  Puedes otorgar el sello usando el botón de 1 clic abajo o ingresando su ID.
                </span>
              </div>
            </div>
          )}

          {/* QUICK 1-CLICK CUSTOMER ACTION (Zero Friction for Cashier - Modern Apple Card Style) */}
          <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Zap size={15} className="text-[#007AFF] fill-current" />
                <span>{isEn ? 'Guest is here? Give stamp with 1 Click:' : '¿Está aquí el cliente? Sellar con 1 Clic:'}</span>
              </span>
              <span className="text-[10px] font-bold text-[#007AFF] bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 rounded-full">
                {isEn ? 'No scan needed' : 'Sin escaneo'}
              </span>
            </div>

            <div className="space-y-2">
              {customers.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleQuickStamp(c)}
                  className="w-full p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-sky-300 flex items-center justify-between text-left transition-all cursor-pointer shadow-xs hover:shadow-md group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#007AFF] to-[#38BDF8] text-white text-xs font-black flex items-center justify-center shadow-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 group-hover:text-[#007AFF] transition-colors leading-tight">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-semibold mt-0.5">
                        {c.id.toUpperCase()} • {c.currentStamps || 1} {isEn ? 'stamps' : 'sellos'}
                      </div>
                    </div>
                  </div>
                  <span className="clay-btn clay-btn-primary px-3.5 py-1.5 text-white text-[11px] font-black shadow-xs flex items-center gap-1">
                    <span>{isEn ? '+1 Stamp' : '+1 Sello'}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Code / ID Entry Box */}
          <form onSubmit={handleManualSubmit} className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Search size={14} className="text-slate-400" />
                <span>{isEn ? 'Or type customer ID manually:' : 'O busca por ID o celular del cliente:'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold">{isEn ? 'E.g. CUST-9023' : 'Ej. CUST-1247'}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={isEn ? "Paste or type member ID / phone..." : "Escribe ID o celular..."}
                className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200/90 rounded-2xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] transition-all"
              />
              <button
                type="submit"
                className="clay-btn clay-btn-primary px-4 py-2.5 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <span>{isEn ? 'Process' : 'Sellar'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-medium truncate max-w-[220px]">
            {scannedResult ? `${isEn ? 'Last:' : 'Último:'} ${scannedResult.name}` : (isEn ? 'Align QR inside the box' : 'Alinea el código QR en el recuadro')}
          </span>
          <button
            type="button"
            onClick={handleSafeClose}
            className="px-5 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
          >
            {isEn ? 'Close Scanner' : 'Cerrar'}
          </button>
        </div>

      </div>
    </div>
  );
}
