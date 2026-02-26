import React from 'react';
import { Shield, Zap } from 'lucide-react';
import ServiceCard from '../components/shared/ServiceCard';

export default function ContratosUptime() {
  const services = [
    {
      title: 'Uptime Básico',
      problem: 'Plantas que necesitan la tranquilidad de tener acceso garantizado a soporte técnico cuando algo falle, sin incertidumbre sobre disponibilidad o costos de emergencia.',
      includes: [
        'Línea de soporte técnico en horario laboral',
        'Tiempo de respuesta en sitio dentro de 24-48 horas hábiles',
        'Tarifas preferenciales en mano de obra correctiva',
        'Prioridad sobre clientes sin contrato',
        'Preventivo básico anual incluido'
      ],
      differentiator: 'Costo predecible de acceso a soporte especializado, eliminando la incertidumbre de buscar proveedor cuando hay emergencia.',
      idealClient: 'Pequeñas plantas con pocos robots, operaciones con criticidad moderada, empresas iniciando relación de servicio.',
      criticality: 'Media',
      model: 'Contrato anual con pago mensual o trimestral fijo por robot'
    },
    {
      title: 'Uptime Estándar',
      problem: 'Plantas con operación de múltiples turnos que no pueden esperar 24-48 horas para atención, requiriendo respuesta más rápida y cobertura de mantenimiento preventivo completo.',
      includes: [
        'Soporte técnico en horario extendido',
        'Tiempo de respuesta en sitio dentro de 8-12 horas',
        'Preventivo avanzado semestral incluido',
        'Diagnósticos remotos cuando sea posible',
        'Descuentos significativos en refacciones',
        'Reportes mensuales de estado de equipos cubiertos'
      ],
      differentiator: 'Balance óptimo entre costo y nivel de servicio para operaciones industriales típicas, con preventivo incluido que reduce probabilidad de necesitar el correctivo.',
      idealClient: 'Plantas manufactureras de tamaño medio, operaciones de dos o tres turnos, empresas que valoran la prevención pero necesitan respaldo de emergencia.',
      criticality: 'Alta',
      model: 'Contrato anual con pago mensual fijo, tarifas de correctivo incluidas o con descuento según nivel'
    },
    {
      title: 'Uptime Crítico',
      problem: 'Robots que son absolutamente críticos para la operación, donde cada hora de paro representa pérdidas mayores, y que requieren el máximo nivel de protección y respuesta.',
      includes: [
        'Soporte técnico 24/7',
        'Tiempo de respuesta en sitio dentro de 4 horas',
        'Preventivo crítico trimestral incluido',
        'Técnico dedicado familiarizado con los equipos específicos',
        'Acceso prioritario a refacciones críticas',
        'Monitoreo remoto de condición cuando el equipo lo permita',
        'Revisión ejecutiva trimestral con métricas de servicio'
      ],
      differentiator: 'Nivel de servicio comparable al que ofrecen los fabricantes de robots para sus clientes más importantes, pero con flexibilidad y atención personalizada de proveedor local.',
      idealClient: 'Plantas automotrices Tier 1, operaciones 24/7, equipos sin redundancia donde la falla es inaceptable.',
      criticality: 'Máxima',
      model: 'Contrato anual premium con pago mensual fijo, puede incluir penalizaciones/bonificaciones por cumplimiento de SLA'
    },
    {
      title: 'Uptime Corporativo por Planta',
      problem: 'Grupos industriales con múltiples plantas que necesitan estandarizar su gestión de mantenimiento robótico, consolidar proveedores y tener visibilidad corporativa del estado de todos sus activos.',
      includes: [
        'Cobertura de toda la flota robótica bajo un solo contrato',
        'Niveles de servicio diferenciados por criticidad de cada equipo',
        'Dashboard corporativo de estado de flota',
        'Coordinación con paros programados de cada planta',
        'Gestor de cuenta dedicado',
        'Reuniones ejecutivas con dirección de manufactura',
        'Benchmarking entre plantas del grupo'
      ],
      differentiator: 'Un solo contrato, una sola factura, una sola responsabilidad para toda la robótica del grupo, con economías de escala y consistencia de servicio entre plantas.',
      idealClient: 'Grupos industriales con presencia multi-sitio, corporativos en proceso de centralizar gestión de activos, empresas con más de 50 robots distribuidos en varias plantas.',
      criticality: 'Estratégica',
      model: 'Contrato marco corporativo con precios por robot/mes según nivel de criticidad, revisión anual de alcance y condiciones'
    },
    {
      title: 'Uptime con Reserva de Refacciones',
      problem: 'Situaciones donde incluso con respuesta inmediata del técnico, la reparación se retrasa días o semanas esperando una refacción crítica que debe importarse.',
      includes: [
        'Todo lo del nivel Uptime contratado',
        'Análisis de criticidad de componentes específicos de los robots cubiertos',
        'Inventario dedicado de refacciones críticas almacenado para uso exclusivo',
        'Reposición garantizada dentro de tiempos acordados',
        'Costo de inventario distribuido en mensualidades',
        'Rotación de inventario para evitar obsolescencia'
      ],
      differentiator: 'Elimina el factor "esperar la refacción" que es frecuentemente la causa real de paros prolongados, convirtiendo reparaciones de semanas en reparaciones de horas.',
      idealClient: 'Plantas con robots de generaciones anteriores con refacciones difíciles de conseguir, operaciones donde el costo de paro por día excede ampliamente el costo de mantener inventario de respaldo.',
      criticality: 'Crítica',
      model: 'Adición a cualquier nivel de Uptime, con costo mensual adicional basado en valor del inventario reservado'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-900 via-green-800 to-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-green-300 uppercase tracking-wide">Protección Total</div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl">
            Contratos Uptime
          </h1>
          
          <p className="text-xl text-green-100 leading-relaxed max-w-3xl mb-8">
            Gestión proactiva de activos con SLA garantizado. Desde cobertura básica hasta protección 24/7 crítica, con costos predecibles y respuesta asegurada.
          </p>

          <div className="flex items-center space-x-3 bg-green-500/20 border border-green-400/30 rounded-xl p-4 max-w-2xl">
            <Zap className="w-6 h-6 text-green-300 flex-shrink-0" />
            <p className="text-green-100 text-sm">
              <strong>Garantía de servicio:</strong> Todos nuestros contratos incluyen SLA documentado con tiempos de respuesta garantizados y preventivo incluido según el nivel contratado.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 bg-white border-2 border-blue-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              ¿Por qué un Contrato Uptime?
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-slate-700">
              <div>
                <h4 className="font-semibold mb-2">Costos Predecibles</h4>
                <p className="text-sm">Presupuesto mensual fijo sin sorpresas de emergencia. Incluye preventivo y respuesta garantizada.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Prioridad Absoluta</h4>
                <p className="text-sm">Los clientes con contrato tienen prioridad sobre servicios por evento en asignación de técnicos y refacciones.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Menor Riesgo</h4>
                <p className="text-sm">El preventivo incluido reduce drásticamente la probabilidad de fallas imprevistas.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">SLA Garantizado</h4>
                <p className="text-sm">Tiempos de respuesta documentados y garantizados según el nivel de criticidad contratado.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} color="green" />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Transforme el mantenimiento reactivo en gestión proactiva
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Un contrato Uptime es una inversión en estabilidad operativa. Hablemos sobre el nivel adecuado para su criticidad y presupuesto.
          </p>
          <a
            href="mailto:ventas@stellarisautomation.com"
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all font-semibold shadow-lg shadow-green-500/30"
          >
            Solicitar Cotización
          </a>
        </div>
      </div>
    </div>
  );
}