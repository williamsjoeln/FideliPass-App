import React, { useRef, useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Printer, X, Sparkles, Smartphone, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getBusinessIcon } from '../data/mockData';

export function PrintableCounterSign({ business, onClose }) {
  const isEn = typeof window !== 'undefined' && localStorage.getItem('fidelipass_lang') === 'en';
  const storeIcon = getBusinessIcon(business.iconType);
  const posterRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState(business.logo || '');

  // Pre-convert logo to base64 data URL so html2canvas and jsPDF can NEVER be tainted by CORS
  useEffect(() => {
    if (!business.logo) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 400;
        c.height = img.naturalHeight || 400;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        setLogoDataUrl(c.toDataURL('image/png'));
      } catch (e) {
        console.warn("Logo base64 conversion note:", e);
        setLogoDataUrl(business.logo);
      }
    };
    img.onerror = () => {
      setLogoDataUrl(business.logo);
    };
    img.src = business.logo;
  }, [business.logo]);

  const capturePoster = async () => {
    if (!posterRef.current) return null;
    return await html2canvas(posterRef.current, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FAF7F2',
      logging: false
    });
  };

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const canvas = await capturePoster();
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const imgWidth = 170; // 17cm width centered
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const xOffset = (pageWidth - imgWidth) / 2;
      const yOffset = Math.max(12, (pageHeight - imgHeight) / 2);

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');
      const safeStoreName = (business.name || 'FideliPass').replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
      pdf.save(`Cartel_QR_${safeStoreName}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      // Clean fallback: open print dialog where ONLY the poster prints on 1 single page!
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    try {
      setIsGeneratingImg(true);
      const canvas = await capturePoster();
      if (!canvas) return;

      const link = document.createElement('a');
      const safeStoreName = (business.name || 'FideliPass').replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
      link.download = `Cartel_QR_${safeStoreName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Image generation error:", err);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      id="printable-sign-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
    >
      <div 
        id="printable-poster-container"
        className="w-full max-w-lg clay-card bg-white overflow-hidden shadow-2xl my-6"
      >
        {/* Modal Controls Bar (Hidden during printing) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-100 rounded-t-[28px] flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2 text-xs font-black text-gray-800">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-[#1D4E3E] flex items-center justify-center shadow-2xs">
              <Printer size={15} />
            </div>
            <span>{isEn ? `Counter Poster: ${business.name}` : `Cartel para Mostrador: ${business.name}`}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf || isGeneratingImg}
              className="clay-btn clay-btn-primary px-3 py-1.5 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title={isEn ? "Download print-ready PDF in A4 or Letter" : "Descargar documento PDF listo para imprimir en A4 o Carta"}
            >
              {isGeneratingPdf ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
              <span>{isEn ? 'Download PDF' : 'Descargar PDF'}</span>
            </button>

            {/* Download PNG Button */}
            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingPdf || isGeneratingImg}
              className="clay-btn clay-btn-light px-2.5 py-1.5 text-emerald-900 border border-emerald-300 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
              title={isEn ? "Save high-res image for WhatsApp or social media" : "Guardar como imagen de alta resolución para WhatsApp o redes"}
            >
              {isGeneratingImg ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
              <span>{isEn ? 'Save Image' : 'Guardar Imagen'}</span>
            </button>

            {/* Direct Print Button */}
            <button
              onClick={handlePrint}
              disabled={isGeneratingPdf || isGeneratingImg}
              className="hidden sm:inline-flex clay-btn clay-btn-light px-2.5 py-1.5 text-gray-800 text-xs font-bold items-center gap-1 cursor-pointer shadow-2xs"
              title={isEn ? "Print directly from browser" : "Imprimir directamente desde tu navegador (solo sale el cartel en 1 página)"}
            >
              <Printer size={13} />
              <span>{isEn ? 'Print' : 'Imprimir'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-700 flex items-center justify-center cursor-pointer ml-1 font-bold shadow-2xs"
              title={isEn ? "Close window" : "Cerrar ventana"}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Printable Poster Sheet (Target for PDF, Image and Print) */}
        <div 
          ref={posterRef}
          id="printable-poster-sheet"
          className="p-6 sm:p-8 text-center bg-[#FAF7F2] border-8 border-white rounded-2xl m-3 sm:m-4 shadow-inner"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1D4E3E] text-white text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles size={14} className="text-amber-300" />
            <span>{isEn ? 'VIP Rewards Club' : 'Club de Clientes VIP'}</span>
          </div>

          {/* Business Brand */}
          <div className="w-24 h-24 mx-auto rounded-3xl bg-white flex items-center justify-center p-2 shadow-md border border-[#E8E3DA] mb-3">
            {logoDataUrl ? (
              <img 
                src={logoDataUrl} 
                alt={business.name} 
                className="w-full h-full object-contain" 
              />
            ) : (
              <span className="text-4xl text-[#1D4E3E]">{storeIcon}</span>
            )}
          </div>

          <h1 className="font-heading text-3xl font-extrabold text-[#1E2922] tracking-tight">
            {business.name}
          </h1>
          <p className="text-sm text-gray-600 font-semibold mt-1">
            {business.tagline || (isEn ? 'Artisanal Ice Cream, Crepes & Rolls' : 'Helados, Crepes & Milkshakes')}
          </p>

          {/* Reward Offer Highlight */}
          <div className="my-5 p-4 bg-white rounded-2xl border-2 border-[#1D4E3E]/20 shadow-sm max-w-sm mx-auto">
            <span className="text-[11px] font-bold text-[#FF5E36] uppercase tracking-wider block">
              {isEn ? 'EXCLUSIVE REWARD!' : '¡RECOMPENSA EXCLUSIVA!'}
            </span>
            <p className="text-base font-heading font-bold text-[#1D4E3E] mt-1">
              {isEn 
                ? `Collect ${business.maxStamps || 8} stamps and get:` 
                : `Colecciona ${business.maxStamps || 8} sellos y recibe:`}
            </p>
            <p className="text-base font-bold text-gray-900 mt-0.5">
              🎁 {business.rewardTitle || (isEn ? '1 Free Treat' : '1 Helado Artesanal Gratis')}
            </p>
          </div>

          {/* Big QR Code Canvas (High precision vector modules) */}
          <div className="inline-block p-4 bg-white rounded-3xl shadow-lg border border-gray-200 my-2">
            <QRCodeCanvas
              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://fidelipassapp.com'}/${business.slug || (business.name ? business.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') : null) || business.id || 'mc-rolls'}`}
              size={185}
              level="H"
              includeMargin={true}
            />
          </div>

          <div className="mt-4">
            <h3 className="font-heading text-lg font-bold text-gray-900">
              {isEn ? 'Scan with your phone camera here' : 'Apunta la cámara de tu celular aquí'}
            </h3>
            <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto leading-relaxed">
              {isEn 
                ? 'Save your digital pass instantly to Apple Wallet or Google Wallet (no app download required).' 
                : 'Guarda tu tarjeta digital al instante en la pantalla de tu celular como una App (sin descargas pesadas).'}
            </p>
          </div>

          {/* Device Badges */}
          <div className="mt-6 pt-5 border-t border-gray-200/80 flex items-center justify-center gap-3 text-xs font-semibold text-gray-700 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Smartphone size={15} className="text-[#1D4E3E]" />
              <span>{isEn ? 'Apple Wallet & Google Wallet Ready' : 'Compatible con iPhone y Android'}</span>
            </div>
            <span>•</span>
            <span className="text-gray-500 font-normal">powered by FideliPass</span>
          </div>
        </div>
      </div>
    </div>
  );
}
