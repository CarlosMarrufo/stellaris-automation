import React from 'react';
import { FileSearch, Target } from 'lucide-react';
import ServiceCard from '../components/shared/ServiceCard';

export default function Diagnosticos() {
  const services = [
    {
      title: 'Diagnóstico por Falla Activa',
      problem: 'Robot fallando sin causa clara identificada, donde el personal interno no tiene la especialización o herramientas para determinar qué está mal y qué se necesita para resolverlo.',
      includes: [
        'Evaluación en sitio por técnico especializado',
        'Análisis de alarmas y códigos de error',
        'Pruebas funcionales sistemáticas',
        'Identificación de componente o sistema fallado',
        'Reporte técnico con diagnóstico, causa probable',
        'Componentes requeridos y estimación de tiempo de reparación'
      ],
      differentiator: 'Diagnóstico pagado por separado de la reparación, dando al cliente información clara para tomar decisiones (reparar, reemplazar, cotizar alternativas) sin compromiso de continuar con un proveedor específico.',
      idealClient: 'Plantas sin equipo técnico interno especializado en robótica, o con fallas que exceden la capacidad de diagnóstico local.',
      criticality: 'Variable',
      model: 'Tarifa fija por diagnóstico, independiente de la reparación posterior'
    },
    {
      title: 'Diagnóstico Preventivo de Condición',
      problem: 'Incertidumbre sobre el estado real de un robot que opera aparentemente normal, pero que podría tener desgaste acumulado o degradación no visible que representa riesgo de falla futura.',
      includes: [
        'Evaluación completa de condición mecánica, eléctrica y de control',
        'Mediciones cuantitativas de parámetros críticos (backlash, corrientes, temperaturas, repetibilidad)',
        'Comparación contra especificaciones de fábrica',
        'Reporte con "score" de salud por sistema',
        'Proyección de vida útil restante de componentes críticos',
        'Plan de acción priorizado'
      ],
      differentiator: 'Convierte la pregunta "¿cuánto le queda a este robot?" en datos objetivos que permiten presupuestar y planificar, en lugar de esperar a que falle.',
      idealClient: 'Plantas planificando presupuestos de mantenimiento, equipos acercándose a fin de garantía, robots adquiridos usados, preparación para auditorías de clientes.',
      criticality: 'Preventiva',
      model: 'Tarifa fija por robot evaluado, descuentos por evaluación de múltiples equipos'
    },
    {
      title: 'Diagnóstico Pre-Compra',
      problem: 'Riesgo de adquirir un robot usado con problemas ocultos, historial de colisiones no declarado, componentes próximos a falla o configuración inadecuada para la aplicación planeada.',
      includes: [
        'Evaluación independiente del equipo antes de la compra',
        'Verificación de condición mecánica y electrónica',
        'Revisión de historial de alarmas si está disponible',
        'Detección de reparaciones previas o componentes no originales',
        'Estimación de inversión adicional necesaria para operación confiable',
        'Recomendación de compra/no compra fundamentada'
      ],
      differentiator: 'Evaluación objetiva por parte de un tercero sin interés en la venta, protegiendo al comprador de adquirir "problemas disfrazados de oportunidades".',
      idealClient: 'Empresas considerando compra de robots usados, departamentos de compras que requieren validación técnica independiente.',
      criticality: 'Alta',
      model: 'Tarifa fija, pagada por el comprador potencial'
    },
    {
      title: 'Diagnóstico Post-Colisión',
      problem: 'Determinar con certeza el alcance del daño después de una colisión, identificando todo lo que debe repararse antes de volver a operar con seguridad y precisión.',
      includes: [
        'Inspección detallada de todos los sistemas potencialmente afectados',
        'Pruebas de integridad estructural',
        'Verificación de calibración y repetibilidad',
        'Documentación fotográfica del daño encontrado',
        'Reporte técnico con listado completo de componentes a reemplazar',
        'Estimación de costos y documentación para reclamaciones de seguro'
      ],
      differentiator: 'Evaluación exhaustiva que evita tanto subestimar el daño (riesgo operativo) como sobreestimarlo (sobrecostos innecesarios), con documentación válida para reclamaciones de seguro si aplica.',
      idealClient: 'Toda planta que experimente una colisión, áreas de seguridad industrial que requieren documentación de evaluación, aseguradoras que necesitan peritaje técnico.',
      criticality: 'Crítica',
      model: 'Tarifa fija de evaluación, puede incluir documentación especial para seguros con costo adicional'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <FileSearch className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-purple-300 uppercase tracking-wide">Evaluación Profesional</div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl">
            Diagnósticos Especializados
          </h1>
          
          <p className="text-xl text-purple-100 leading-relaxed max-w-3xl mb-8">
            Evaluaciones técnicas objetivas que reducen incertidumbre, documentan condición real y guían decisiones críticas con información fundamentada.
          </p>

          <div className="flex items-center space-x-3 bg-purple-500/20 border border-purple-400/30 rounded-xl p-4 max-w-2xl">
            <Target className="w-6 h-6 text-purple-300 flex-shrink-0" />
            <p className="text-purple-100 text-sm">
              <strong>Evaluación independiente:</strong> Todos nuestros diagnósticos se cotizan por separado de las reparaciones, dándole información objetiva sin compromiso.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} color="purple" />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            ¿Necesita claridad sobre el estado de sus robots?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Un diagnóstico profesional le proporciona la información que necesita para tomar decisiones informadas sobre su flota robótica.
          </p>
          <a
            href="mailto:soporte@robotech.com"
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all font-semibold shadow-lg shadow-purple-500/30"
          >
            Solicitar Diagnóstico
          </a>
        </div>
      </div>
    </div>
  );
}