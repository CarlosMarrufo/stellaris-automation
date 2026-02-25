import React from 'react';
import { Wrench, TrendingUp } from 'lucide-react';
import ServiceCard from '../components/shared/ServiceCard';

export default function MantenimientoPreventivo() {
  const services = [
    {
      title: 'Preventivo Básico',
      problem: 'Plantas que operan robots sin ningún programa de mantenimiento estructurado, exponiéndose a fallas imprevistas y paros no planificados que afectan entregas y costos.',
      includes: [
        'Inspección visual y funcional completa',
        'Verificación de niveles de lubricantes',
        'Revisión de conexiones eléctricas',
        'Revisión de baterías',
        'Limpieza de componentes críticos',
        'Reporte técnico con estado actual y recomendaciones priorizadas'
      ],
      differentiator: 'Protocolo estandarizado con checklist de más de 120 puntos específicos para robots de 6 ejes, ejecutado por técnicos certificados en las principales marcas industriales.',
      idealClient: 'Empresas con 1-5 robots que inician su programa de mantenimiento o que operan equipos fuera de garantía sin cobertura técnica.',
      criticality: 'Media',
      model: 'Por evento o paquete semestral con descuento'
    },
    {
      title: 'Preventivo Avanzado',
      problem: 'Robots que operan en condiciones exigentes (ciclos altos, cargas pesadas, ambientes hostiles) donde el preventivo básico resulta insuficiente para garantizar confiabilidad.',
      includes: [
        'Todo lo del Preventivo Básico',
        'Medición de backlash en cada eje',
        'Evaluación de carga operativa del motor',
        'Verificación de encoders y resolvers',
        'Calibración de puntos de referencia',
        'Inspección de cables internos del brazo',
        'Pruebas de frenos de seguridad',
        'Engrasado de ejes'
      ],
      differentiator: 'Incluye mediciones cuantitativas con instrumentación especializada que permiten detectar degradación antes de que se manifieste como falla.',
      idealClient: 'Plantas automotrices, líneas de soldadura, aplicaciones de alta precisión, empresas con turnos continuos (24/7).',
      criticality: 'Alta',
      model: 'Contrato trimestral o cuatrimestral con precio fijo por robot'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-blue-300 uppercase tracking-wide">Servicio Especializado</div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl">
            Mantenimiento Preventivo
          </h1>
          
          <p className="text-xl text-blue-100 leading-relaxed max-w-3xl mb-8">
            Programas estructurados que previenen fallas, extienden vida útil y eliminan sorpresas operativas. Desde básico hasta cobertura crítica para equipos irremplazables.
          </p>

          <div className="flex items-center space-x-3 bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 max-w-2xl">
            <TrendingUp className="w-6 h-6 text-blue-300 flex-shrink-0" />
            <p className="text-blue-100 text-sm">
              <strong>Progresión de valor:</strong> Cada nivel incluye los beneficios del anterior, añadiendo mayor profundidad técnica y protección según la criticidad de sus equipos.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} color="blue" />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            ¿Qué nivel de mantenimiento preventivo necesita su operación?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Nuestros especialistas pueden evaluar su flota y recomendar el programa óptimo para su criticidad operativa y presupuesto.
          </p>
          <a
            href="mailto:soporte@robotech.com"
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg shadow-blue-500/30"
          >
            Solicitar Evaluación
          </a>
        </div>
      </div>
    </div>
  );
}