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

  // Auto-start camera when modal opens
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
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      videoTrackRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen && cameraActive) {
      const qrRegionId = "qr-reader-viewport";
      
      const startScanner = async () => {
        try {
          // Initialize Html5Qrcode standard instance
          html5QrCode = new Html5Qrcode(qrRegionId, false);
          scannerRef.current = html5QrCode;

          // Enumerate cameras to find the environment (rear) camera
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

          // Full-frame scanning without qrbox crop restriction for maximum instant detection
          const config = {
            fps: 15,
            disableFlip: false
          };

          await html5QrCode.start(
            cameraIdOrConfig,
            config,
            (decodedText) => {
              handleProcessQR(decodedText);
              html5QrCode.stop().catch(() => {});
              setCameraActive(false);
            },
            () => {} // silent parse error during frame search
          );

          // Detect Zoom and Torch capabilities from the active video track
          setTimeout(() => {
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
          // Fallback with standard environment constraint
          try {
            if (html5QrCode) {
              await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 15, disableFlip: false },
                (decodedText) => {
                  handleProcessQR(decodedText);
                  html5QrCode.stop().catch(() => {});
                  setCameraActive(false);
                },
                () => {}
              );
              return;
            }
          } catch (fallbackErr) {
            console.warn("Secondary camera fallback failed:", fallbackErr);
            // Final fallback: any camera
            try {
              if (html5QrCode) {
                await html5QrCode.start(
                  { facingMode: "user" },
                  { fps: 15, disableFlip: false },
                  (decodedText) => {
                    handleProcessQR(decodedText);
                    html5QrCode.stop().catch(() => {});
                    setCameraActive(false);
                  },
                  () => {}
                );
                return;
              }
            } catch (finalErr) {}
          }
          setCameraError("No se pudo iniciar el video de la cámara. Puedes ingresar el código o ID abajo manualmente.");
          setCameraActive(false);
        }
      };

      startScanner();
    }

    return () => {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => {});
          }
        } catch {}
      }
      videoTrackRef.current = null;
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
    onScanSuccess(cust);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in text-left">
      <div className="w-full max-w-lg clay-card bg-white overflow-hidden flex flex-col max-h-[95vh] shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-4 px-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0 rounded-t-[28px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl clay-btn clay-btn-orange text-white flex items-center justify-center shadow-sm">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-heading font-black text-gray-900 text-base leading-tight">
                {isEn ? 'Scan Member Pass' : 'Escanear Tarjeta de Cliente'}
              </h3>
              <p className="text-[11px] text-gray-500 font-semibold">
                {isEn ? 'Point at the QR code on the customer phone' : 'Apunta al código QR en el celular del cliente'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs font-bold"
            title={isEn ? "Close" : "Cerrar"}
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Success Toast Banner */}
          {scannedResult && (
            <div className="p-4 clay-card bg-emerald-50 text-emerald-950 flex items-center gap-3.5 animate-stamp shadow-md">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 size={26} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                  <span>{isEn ? 'Stamp Awarded Successfully!' : '¡Sello Otorgado con Éxito!'}</span>
                  <span>🎉</span>
                </h4>
                <p className="text-xs text-emerald-900 font-semibold mt-0.5">
                  {isEn ? 'Member:' : 'Cliente:'} <strong className="font-black text-emerald-950">{scannedResult.name}</strong>
                </p>
                <div className="mt-1 inline-flex items-center gap-1 px-3 py-0.5 clay-badge text-[11px] font-black bg-emerald-200 text-emerald-950">
                  {isEn ? 'Total stamps:' : 'Total de sellos:'} {Math.min(business?.maxStamps || 8, (scannedResult.currentStamps || 1) + 1)} / {business?.maxStamps || 8}
                </div>
              </div>
            </div>
          )}

          {/* LARGE CAMERA VIEWFINDER */}
          <div className="relative rounded-3xl overflow-hidden bg-black aspect-square sm:aspect-[4/3] min-h-[300px] flex flex-col items-center justify-center border-4 border-slate-900 shadow-2xl group">
            
            {/* The Html5Qrcode video injects here */}
            <div id="qr-reader-viewport" className="w-full h-full" />

            {/* Inactive Camera Screen */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-950/95 text-white z-20">
                <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-3 border border-white/15 shadow-inner">
                  <Camera size={32} className="text-amber-400" />
                </div>
                <h4 className="font-black text-base">{isEn ? 'Camera Paused' : 'Cámara en Pausa'}</h4>
                <p className="text-xs text-gray-300 font-medium mt-1 mb-4 max-w-xs leading-relaxed">
                  {isEn ? 'Click below to activate lens or use manual member search.' : 'Haz clic abajo para activar el lente o usa la búsqueda rápida de clientes.'}
                </p>
                <button
                  onClick={() => {
                    setCameraError(null);
                    setCameraActive(true);
                  }}
                  className="px-6 py-3 clay-btn clay-btn-orange text-white text-xs font-black shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Camera size={16} />
                  <span>{isEn ? 'Reactivate Camera' : 'Reactivar Cámara'}</span>
                </button>
              </div>
            )}

            {/* Active Scanning HUD Overlay */}
            {cameraActive && (
              <>
                {/* Status Badge & Flashlight Button (Top Bar) */}
                <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10 pointer-events-none">
                  <div className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] px-3 py-1 rounded-full flex items-center gap-1.5 font-black shadow-md">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    <span>{isEn ? 'CAMERA ACTIVE • SCANNING' : 'LENTE ACTIVO • ESCANEANDO'}</span>
                  </div>

                  {/* Flashlight / Torch Button (clickable) */}
                  <div className="pointer-events-auto flex items-center gap-1.5">
                    {hasTorch && (
                      <button
                        onClick={toggleTorch}
                        className={`px-3 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                          isTorchOn 
                            ? 'bg-amber-400 text-gray-900 ring-2 ring-amber-200' 
                            : 'bg-black/60 backdrop-blur-md text-white hover:bg-black/80'
                        }`}
                        title="Encender o apagar la linterna"
                      >
                        <Lightbulb size={13} className={isTorchOn ? 'fill-current' : ''} />
                        <span>{isTorchOn ? 'Luz ON' : 'Flash'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Laser Sweeper Animation */}
                <div className="absolute inset-x-8 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-scanline z-10 pointer-events-none" />

                {/* Targeting Reticle Frame (4 High-Contrast Green Corner Brackets) */}
                <div className="absolute inset-8 sm:inset-12 pointer-events-none flex flex-col justify-between z-10">
                  <div className="flex justify-between">
                    <div className="w-10 h-10 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-sm drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <div className="w-10 h-10 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-sm drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-10 h-10 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-sm drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <div className="w-10 h-10 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-sm drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  </div>
                </div>

                {/* Center Targeting Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 z-10">
                  <div className="w-6 h-0.5 bg-white rounded-full"></div>
                  <div className="h-6 w-0.5 bg-white rounded-full absolute"></div>
                </div>

                {/* ZOOM CONTROLS BAR (Bottom of viewfinder) */}
                <div className="absolute bottom-3 inset-x-3 z-10 flex flex-col items-center gap-1.5">
                  <div className="bg-black/70 backdrop-blur-md p-1.5 px-3 rounded-2xl border border-white/20 flex items-center gap-2 shadow-lg">
                    <span className="text-[10px] uppercase font-bold text-gray-300 flex items-center gap-1">
                      <ZoomIn size={12} className="text-emerald-400" />
                      <span>Zoom:</span>
                    </span>

                    {/* Zoom Presets: 1x, 1.5x, 2x, 2.5x */}
                    {[1, 1.5, 2, 2.5].map((z) => (
                      <button
                        key={z}
                        onClick={() => applyZoom(z)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentZoom === z 
                            ? 'bg-[#FF5E36] text-white shadow-sm scale-105' 
                            : 'bg-white/15 text-white hover:bg-white/30'
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                  
                  <span className="text-[10px] text-white/80 font-medium drop-shadow bg-black/40 px-2.5 py-0.5 rounded-full">
                    💡 Mantén a 15-20 cm o presiona 2x para agrandar el código
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

          {/* QUICK 1-CLICK CUSTOMER ACTION (Zero Friction for Cashier) */}
          <div className="p-4 clay-card bg-emerald-50/80">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black text-[#1D4E3E] flex items-center gap-1.5">
                <Zap size={15} className="text-[#FF5E36] fill-current" />
                <span>{isEn ? 'Guest is here? Give stamp with 1 Click:' : '¿Está aquí el cliente? Sellar con 1 Clic:'}</span>
              </span>
              <span className="clay-badge text-[10px] font-black text-emerald-900 bg-white px-2.5 py-0.5">
                {isEn ? 'No scan needed' : 'Sin escaneo'}
              </span>
            </div>

            <div className="space-y-2">
              {customers.slice(0, 3).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleQuickStamp(c)}
                  className="w-full p-3 clay-card bg-white flex items-center justify-between text-left transition-all cursor-pointer shadow-xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-[#1D4E3E] text-white text-xs font-black flex items-center justify-center shadow-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-900 group-hover:text-[#1D4E3E] leading-tight">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono font-bold">
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
          <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-black text-gray-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Search size={14} className="text-gray-500" />
                <span>{isEn ? 'Or type customer ID manually:' : 'O ingresa el ID del cliente manualmente:'}</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono font-bold">{isEn ? 'E.g. CUST-9023' : 'Ej. CUST-9023'}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={isEn ? "Paste or type member ID / phone..." : "Pega o escribe el ID o celular..."}
                className="flex-1 px-3.5 py-2.5 text-xs clay-input font-mono font-bold text-gray-800"
              />
              <button
                type="submit"
                className="clay-btn clay-btn-primary px-4 py-2.5 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>{isEn ? 'Process' : 'Procesar'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-gray-500 font-medium truncate max-w-[220px]">
            {scannedResult ? `${isEn ? 'Last:' : 'Último:'} ${scannedResult.name}` : (isEn ? 'Align QR or tap 2x' : 'Alinea el QR o haz clic en 2x')}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            {isEn ? 'Close Scanner' : 'Cerrar Escáner'}
          </button>
        </div>

      </div>
    </div>
  );
}
