import React from 'react';
import { Users, Zap, Target, Boxes } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Técnicos Especializados',
    description: 'Certificados en las principales marcas de robots industriales con experiencia real en piso de planta.'
  },
  {
    icon: Zap,
    title: 'Respuesta Rápida',
    description: 'Desde 4 horas en contratos críticos. Inventario local de refacciones para minimizar tiempos de paro.'
  },
  {
    icon: Target,
    title: 'Enfoque en Uptime',
    description: 'Cada servicio está diseñado para maximizar disponibilidad y minimizar interrupciones productivas.'
  },
  {
    icon: Boxes,
    title: 'Multi-Marca',
    description: 'Damos soporte a todas las marcas principales bajo un solo proveedor, simplificando su gestión.'
  }
];

export default function WhyChooseUs() {
  return (
    <div className="py-20 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Por qué elegirnos
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Somos el socio estratégico que necesita para mantener su automatización operando sin interrupciones
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/30">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-500 to-orange-500 rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            ¿Robot detenido o en riesgo de falla?
          </h3>
          <p className="text-lg text-blue-50 mb-8 max-w-2xl mx-auto">
            Contáctenos ahora. Nuestro equipo técnico evaluará su situación y le proporcionará una solución en el menor tiempo posible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+528183519650"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all font-semibold shadow-xl"
            >
              Llamar Ahora
            </a>
            <a
              href="mailto:ventas@stellarisautomation.com"
              className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold border-2 border-white/20"
            >
              Enviar Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}