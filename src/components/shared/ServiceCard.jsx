import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function ServiceCard({ title, problem, includes, differentiator, idealClient, criticality, model, color = 'blue' }) {
  const criticalityColors = {
    'Baja': 'bg-green-100 text-green-800 border-green-200',
    'Media': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Alta': 'bg-orange-100 text-orange-800 border-orange-200',
    'Crítica': 'bg-red-100 text-red-800 border-red-200',
    'Máxima': 'bg-red-100 text-red-800 border-red-200',
    'Estratégica': 'bg-purple-100 text-purple-800 border-purple-200',
    'Preventiva': 'bg-blue-100 text-blue-800 border-blue-200',
    'Variable': 'bg-slate-100 text-slate-800 border-slate-200'
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 hover:border-blue-300 transition-all hover:shadow-xl">
      <div className="flex items-start justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${criticalityColors[criticality] || criticalityColors['Media']}`}>
          {criticality}
        </span>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Problema que resuelve</h4>
          <p className="text-slate-700 leading-relaxed">{problem}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Qué incluye</h4>
          <div className="space-y-2">
            {Array.isArray(includes) ? (
              includes.map((item, idx) => (
                <div key={idx} className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 text-sm">{item}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-700">{includes}</p>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Diferenciador Competitivo</h4>
          <p className="text-blue-800 text-sm leading-relaxed">{differentiator}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Cliente Ideal</h4>
            <p className="text-sm text-slate-700">{idealClient}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Modelo Comercial</h4>
            <p className="text-sm text-slate-700">{model}</p>
          </div>
        </div>
      </div>
    </div>
  );
}