import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import ServiceCard from '../components/shared/ServiceCard';

export default function MantenimientoCorrectivo() {
  const services = [
    {
      title: 'Falla Activa Urgente',
      problem: 'Robot completamente detenido, línea de producción parada, cada hora representa pérdidas directas y potencial incumplimiento de entregas.',
      includes: [
        'Respuesta en sitio en el menor tiempo posible',
        'Diagnóstico acelerado para identificar causa raíz',
        'Reparación inmediata si la refacción está disponible',
        'Solución temporal documentada si se requiere esperar componente',
        'Comunicación continua sobre avances y tiempos estimados'
      ],
      differentiator: 'Disponibilidad de técnicos especializados con inventario móvil de refacciones críticas más comunes, reduciendo drásticamente el tiempo entre llamada y robot operando.',
      idealClient: 'Cualquier planta con robot parado que necesita restablecer producción en el menor tiempo posible.',
      criticality: 'Máxima',
      model: 'Por evento con tarifa de urgencia, o incluido en Contratos Uptime según nivel contratado'
    },
    {
      title: 'Falla Intermitente',
      problem: 'Robot que presenta fallas esporádicas difíciles de reproducir, generando incertidumbre operativa, rechazos de calidad aleatorios y riesgo de falla total inminente.',
      includes: [
        'Análisis de logs y alarmas históricas',
        'Monitoreo extendido durante operación',
        'Pruebas de estrés controladas',
        'Identificación de patrones de falla',
        'Diagnóstico de causa raíz con evidencia documentada',
        'Plan de corrección definitiva'
      ],
      differentiator: 'Metodología sistemática de troubleshooting que no se limita a "esperar que falle de nuevo", sino que provoca y documenta las condiciones de falla para resolución definitiva.',
      idealClient: 'Plantas que llevan semanas o meses tolerando un robot "problemático" sin encontrar la causa real.',
      criticality: 'Alta',
      model: 'Por evento con cotización basada en complejidad estimada'
    },
    {
      title: 'Correctivo Mecánico',
      problem: 'Desgaste o daño en componentes mecánicos del robot: reductores, rodamientos, engranes, cables internos, sistemas de transmisión, que afectan precisión, capacidad de carga o generan ruidos/vibraciones anormales.',
      includes: [
        'Diagnóstico mecánico especializado',
        'Desmontaje y evaluación de componentes dañados',
        'Reemplazo con refacciones originales o equivalentes certificadas',
        'Calibración y ajuste post-reparación',
        'Pruebas de funcionamiento bajo carga',
        'Garantía sobre el trabajo realizado'
      ],
      differentiator: 'Capacidad de intervención en reductores y componentes internos que muchos proveedores locales derivan a fábrica, reduciendo semanas de espera a días.',
      idealClient: 'Plantas con robots de alta utilización, equipos con más de 5 años de operación, aplicaciones de carga pesada o ciclos agresivos.',
      criticality: 'Alta',
      model: 'Por evento, cotización basada en diagnóstico inicial'
    },
    {
      title: 'Correctivo Eléctrico/Electrónico',
      problem: 'Fallas en controlador, tarjetas electrónicas, fuentes de poder, drives de motor, cableado de potencia o señal, que impiden operación o generan comportamientos erráticos.',
      includes: [
        'Diagnóstico electrónico con instrumentación especializada',
        'Identificación de componente fallado a nivel de tarjeta o módulo',
        'Reemplazo y configuración de componentes',
        'Respaldo y restauración de programas y parámetros',
        'Pruebas funcionales completas post-reparación'
      ],
      differentiator: 'Inventario local de tarjetas y componentes electrónicos críticos para las marcas más comunes, evitando importaciones de emergencia que toman semanas.',
      idealClient: 'Plantas con controladores de generaciones anteriores donde la obsolescencia dificulta conseguir refacciones, o con fallas eléctricas recurrentes sin diagnóstico claro.',
      criticality: 'Crítica',
      model: 'Por evento, puede incluir componente en renta temporal mientras se consigue definitivo'
    },
    {
      title: 'Post-Colisión',
      problem: 'Robot que sufrió colisión (contra herramental, producto, estructura o auto-colisión) y requiere evaluación profesional para determinar si puede seguir operando con seguridad y precisión.',
      includes: [
        'Inspección completa de integridad estructural',
        'Verificación de alineación de ejes',
        'Medición de backlash post-impacto',
        'Pruebas de repetibilidad en puntos críticos',
        'Evaluación de daño en reductores y transmisiones',
        'Reporte técnico con dictamen de operabilidad y presupuesto de reparación'
      ],
      differentiator: 'Evaluación objetiva y documentada que protege al cliente de operar un robot dañado (riesgo de calidad y seguridad) o de reemplazar componentes innecesariamente.',
      idealClient: 'Cualquier planta que haya experimentado una colisión, independientemente de si el robot "parece" funcionar después del evento.',
      criticality: 'Crítica',
      model: 'Por evento con tarifa fija de evaluación, reparaciones cotizadas por separado'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-900 via-orange-800 to-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-orange-300 uppercase tracking-wide">Respuesta Rápida</div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl">
            Mantenimiento Correctivo
          </h1>
          
          <p className="text-xl text-orange-100 leading-relaxed max-w-3xl mb-8">
            Desde emergencias urgentes hasta reparaciones programadas. Cada tipo de falla requiere un enfoque especializado para minimizar tiempo de paro y restaurar confiabilidad.
          </p>

          <div className="flex items-center space-x-3 bg-orange-500/20 border border-orange-400/30 rounded-xl p-4 max-w-2xl">
            <Clock className="w-6 h-6 text-orange-300 flex-shrink-0" />
            <p className="text-orange-100 text-sm">
              <strong>Respuesta priorizada:</strong> Los servicios están estructurados según nivel de urgencia y riesgo operativo. En contratos Uptime, la respuesta está garantizada por SLA.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} color="orange" />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            ¿Robot detenido o presentando fallas?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Contacte a nuestro equipo técnico ahora. Cada minuto cuenta cuando la producción está en riesgo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+528183519650"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold shadow-lg shadow-orange-500/30"
            >
              Llamar Urgente: (81) 8351-9650
            </a>
            <a
              href="mailto:ventas@stellarisautomation.com"
              className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold"
            >
              Email de Soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}