import React from 'react';
import { Package, Clock } from 'lucide-react';
import ServiceCard from '../components/shared/ServiceCard';

export default function SuministroRefacciones() {
  const services = [
    {
      title: 'Refacciones Críticas Inmediatas',
      problem: 'Robot parado esperando un componente que normalmente toma semanas en llegar de fábrica o distribuidor, mientras las pérdidas por paro se acumulan cada día.',
      includes: [
        'Inventario local de componentes de alta demanda y falla frecuente',
        'Motores, drives, tarjetas de control, encoders, fuentes de poder',
        'Disponibilidad para entrega en 24-48 horas en la mayoría de los casos',
        'Componentes originales y equivalentes certificados según disponibilidad',
        'Soporte técnico para verificar compatibilidad antes de la compra'
      ],
      differentiator: 'Disponibilidad local que transforma semanas de espera en días, con técnicos que pueden confirmar que el componente es el correcto antes de comprarlo.',
      idealClient: 'Toda planta con robot parado o próximo a fallar que necesita el componente ahora, no en tres semanas.',
      criticality: 'Máxima',
      model: 'Venta por evento, precios competitivos respecto a distribuidores con valor agregado de disponibilidad inmediata'
    },
    {
      title: 'Refacciones de Desgaste Común',
      problem: 'Necesidad recurrente de componentes que se reemplazan regularmente como parte del mantenimiento preventivo o por desgaste normal de operación.',
      includes: [
        'Baterías de respaldo',
        'Sellos y o-rings',
        'Cables de enseñanza (teach pendant)',
        'Conectores',
        'Filtros',
        'Lubricantes especificados por fabricante',
        'Fusibles y componentes eléctricos menores'
      ],
      differentiator: 'Inventario completo de consumibles y desgaste común para las marcas principales, evitando múltiples órdenes pequeñas a diferentes proveedores.',
      idealClient: 'Departamentos de mantenimiento que realizan preventivos internamente, plantas con programa de mantenimiento establecido.',
      criticality: 'Media',
      model: 'Venta recurrente, descuentos por volumen, puede integrarse en contratos de mantenimiento'
    },
    {
      title: 'Refacciones Estratégicas Bajo Pedido',
      problem: 'Necesidad de componentes especializados, de bajo movimiento o específicos de configuraciones particulares que no se mantienen en inventario estándar.',
      includes: [
        'Gestión completa de importación y logística',
        'Cotización con tiempos de entrega realistas',
        'Seguimiento de pedido hasta entrega',
        'Verificación de especificaciones antes de ordenar',
        'Opciones de envío acelerado cuando se requiera'
      ],
      differentiator: 'Experiencia en importación de refacciones robóticas que evita errores costosos de especificación, y relaciones establecidas con fabricantes y distribuidores que optimizan tiempos y costos.',
      idealClient: 'Plantas con robots de configuraciones especiales, equipos de generaciones anteriores con refacciones no estándar, reemplazos mayores programados (reductores, motores especiales).',
      criticality: 'Variable',
      model: 'Cotización por pedido, puede incluir opción de financiamiento para componentes de alto valor'
    },
    {
      title: 'Kits Preventivos',
      problem: 'Complejidad de identificar, cotizar y ordenar por separado todos los componentes necesarios para un mantenimiento preventivo completo.',
      includes: [
        'Paquetes preconfigurados por modelo de robot y tipo de preventivo',
        'Todos los consumibles, lubricantes, sellos y componentes de reemplazo',
        'Recomendados por fabricante',
        'Instructivo de aplicación',
        'Garantía de compatibilidad'
      ],
      differentiator: '"Todo en una caja" para el preventivo, eliminando olvidos, errores de especificación y múltiples órdenes de compra.',
      idealClient: 'Plantas que ejecutan preventivos internamente, departamentos de mantenimiento con personal técnico capacitado pero sin tiempo para gestionar compras complejas.',
      criticality: 'Media',
      model: 'Venta por kit, descuentos por compra de múltiples kits, puede programarse envío automático según calendario de preventivos'
    },
    {
      title: 'Programa de Reserva de Partes Críticas',
      problem: 'Riesgo de paro prolongado por espera de refacciones críticas de difícil obtención, especialmente para robots de generaciones anteriores o configuraciones poco comunes.',
      includes: [
        'Análisis de criticidad de componentes específicos de la flota del cliente',
        'Definición de inventario de reserva recomendado',
        'Almacenamiento y gestión del inventario',
        'Reposición automática cuando se utiliza un componente',
        'Rotación de inventario para evitar obsolescencia',
        'Reportes de estado y valor del inventario'
      ],
      differentiator: 'Transforma el riesgo de "no conseguir la refacción" en un activo gestionado con costo predecible, sin necesidad de que el cliente desarrolle expertise en gestión de inventario de refacciones robóticas.',
      idealClient: 'Plantas con robots críticos de difícil reemplazo, equipos fuera de producción del fabricante, operaciones donde el costo de paro justifica ampliamente el costo de inventario de respaldo.',
      criticality: 'Estratégica',
      model: 'Programa con inversión inicial en inventario (puede financiarse) más cuota mensual de gestión, o integrado en contratos Uptime con Reserva'
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-slate-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Disponibilidad Inmediata</div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl">
            Suministro de Refacciones
          </h1>
          
          <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mb-8">
            Inventario local de componentes críticos que elimina semanas de espera. Desde urgencias hasta programas de reserva estratégica para su flota.
          </p>

          <div className="flex items-center space-x-3 bg-slate-600/30 border border-slate-500/50 rounded-xl p-4 max-w-2xl">
            <Clock className="w-6 h-6 text-slate-300 flex-shrink-0" />
            <p className="text-slate-200 text-sm">
              <strong>Ventaja competitiva:</strong> El tiempo de conseguir refacciones es frecuentemente el cuello de botella real en reparaciones. Nuestro inventario local reduce semanas a días.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 bg-gradient-to-r from-blue-50 to-orange-50 border-2 border-slate-200 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              ¿Por qué comprar refacciones con nosotros?
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-slate-700">
              <div>
                <h4 className="font-semibold mb-2 text-blue-900">Disponibilidad Local</h4>
                <p className="text-sm">Inventario en México elimina tiempos de importación. Componentes críticos disponibles en 24-48 horas.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-blue-900">Compatibilidad Verificada</h4>
                <p className="text-sm">Nuestros técnicos pueden confirmar que el componente es el correcto antes de comprarlo, evitando errores costosos.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-blue-900">Inventario local PANASONIC</h4>
                <p className="text-sm">Refacciones multi marca bajo pedido</p>
                <p className="text-sm">Inventario inmediato Panasonic</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            ¿Necesita una refacción crítica?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Consulte disponibilidad con nuestro equipo técnico. Si está en inventario, puede estar en su planta en 24-48 horas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:ventas@stellarisautomation.com"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-900 transition-all font-semibold shadow-lg"
            >
              Consultar Disponibilidad
            </a>
            <a
              href="tel:+528183519650"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 rounded-xl hover:bg-slate-50 transition-all font-semibold border-2 border-slate-300"
            >
              Llamar: (81) 8351-9650
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}