import React, { useState } from 'react';
import { DollarSign, Store, TrendingUp, CheckCircle, Sparkles, X, Target, Award } from 'lucide-react';

export function BusinessCalculator({ isOpen, onClose }) {
  const [storeCount, setStoreCount] = useState(20);
  const [dailyPrice, setDailyPrice] = useState(0.50);

  const monthlyPerStore = dailyPrice * 30;
  const monthlyRevenue = storeCount * monthlyPerStore;
  const annualRevenue = monthlyRevenue * 12;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto text-left">
      <div className="w-full max-w-lg clay-card bg-white overflow-hidden shadow-2xl my-6">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between rounded-t-[28px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center font-black text-sm shadow-sm">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-gray-900 leading-tight">
                Calculadora de Ingresos SaaS
              </h3>
              <p className="text-[11px] text-gray-500 font-bold">Proyección personalizada de ingresos recurrentes (MRR)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-700 flex items-center justify-center cursor-pointer shadow-2xs font-bold"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sliders and Metrics */}
        <div className="p-6 space-y-5">
          {/* Slider: Number of Stores */}
          <div>
            <div className="flex justify-between items-center text-xs font-black text-gray-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Store size={15} className="text-[#007AFF]" />
                <span>Locales afiliados en tu ciudadela:</span>
              </span>
              <span className="text-base text-[#007AFF] font-heading font-black">{storeCount} locales</span>
            </div>
            <input
              type="range"
              min="1"
              max="150"
              value={storeCount}
              onChange={(e) => setStoreCount(Number(e.target.value))}
              className="w-full accent-[#007AFF] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
              <span>1 local (MC Rolls)</span>
              <span>50 locales</span>
              <span>100 locales</span>
              <span>150 locales</span>
            </div>
          </div>

          {/* Slider: Daily Price */}
          <div>
            <div className="flex justify-between items-center text-xs font-black text-gray-700 mb-2">
              <span>Tarifa cobrada por día:</span>
              <span className="text-base text-[#FF5E36] font-heading font-black">
                ${dailyPrice.toFixed(2)} / día (${monthlyPerStore.toFixed(2)} al mes)
              </span>
            </div>
            <input
              type="range"
              min="0.15"
              max="1.00"
              step="0.05"
              value={dailyPrice}
              onChange={(e) => setDailyPrice(Number(e.target.value))}
              className="w-full accent-[#FF5E36] cursor-pointer"
            />
          </div>

          {/* Revenue Projection Cards (Claymorphic) */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <div className="p-4 clay-card bg-sky-50/80 text-center">
              <span className="text-[10px] uppercase font-black text-[#007AFF] tracking-wider block">
                Ingreso Mensual (MRR)
              </span>
              <div className="font-heading font-black text-3xl text-[#007AFF] mt-1">
                ${monthlyRevenue.toFixed(0)} <span className="text-xs font-bold">/ mes</span>
              </div>
              <p className="text-[10px] text-sky-800 font-bold mt-1">Ingreso pasivo recurrente</p>
            </div>

            <div className="p-4 clay-card bg-slate-50 text-center">
              <span className="text-[10px] uppercase font-black text-gray-500 tracking-wider block">
                Ingreso Anual Proyectado
              </span>
              <div className="font-heading font-black text-3xl text-gray-900 mt-1">
                ${annualRevenue.toFixed(0)} <span className="text-xs font-bold">/ año</span>
              </div>
              <p className="text-[10px] text-gray-500 font-bold mt-1">Cobro automático o mensual</p>
            </div>
          </div>

          {/* Pitching Arguments to Convince Business Owners */}
          <div className="p-4.5 clay-card bg-white">
            <h4 className="text-xs font-black text-gray-900 mb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500 fill-amber-400" />
              <span>Argumentos ganadores para vender a los dueños:</span>
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 font-medium">
              <li className="flex items-start gap-2">
                <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-gray-900 font-black">Más barato que el cartón:</strong> Imprimir tarjetas físicas cuesta dinero continuo y los clientes las botan. FideliPass vive directamente en Apple Wallet y Google Wallet de forma oficial.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-gray-900 font-black">Notificaciones Push sin costo:</strong> En días con pocas ventas, pueden mandar un 2x1 a la pantalla de todos sus clientes.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <span><strong className="text-gray-900 font-black">Base de datos de oro:</strong> Obtienen el nombre y WhatsApp de cada persona que entra a comprar.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end rounded-b-[28px]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 clay-btn clay-btn-primary text-white text-xs font-black cursor-pointer shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
