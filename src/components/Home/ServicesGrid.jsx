import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Wrench, AlertCircle, FileSearch, Shield, Package, ArrowRight } from 'lucide-react';
import puzzleRobot from '../../utils/puzzle_robot.png'

const services = [
  {
    icon: Wrench,
    title: 'Mantenimiento Preventivo',
    description: 'Programas estructurados desde básico hasta crítico que previenen fallas y extienden vida útil.',
    page: 'MantenimientoPreventivo',
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    icon: AlertCircle,
    title: 'Mantenimiento Correctivo',
    description: 'Respuesta rápida para fallas urgentes, intermitentes, mecánicas y eléctricas.',
    page: 'MantenimientoCorrectivo',
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600'
  },
  {
    icon: FileSearch,
    title: 'Diagnósticos',
    description: 'Evaluaciones técnicas profesionales que reducen incertidumbre y guían decisiones.',
    page: 'Diagnosticos',
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    icon: Shield,
    title: 'Contratos Uptime',
    description: 'Protección total con SLA garantizado, desde cobertura básica hasta 24/7 crítico.',
    page: 'ContratosUptime',
    color: 'green',
    gradient: 'from-green-500 to-green-600'
  },
  {
    icon: Package,
    title: 'Suministro de Refacciones',
    description: 'Inventario local de componentes críticos con disponibilidad inmediata.',
    page: 'SuministroRefacciones',
    color: 'slate',
    gradient: 'from-slate-600 to-slate-700'
  },
  {
    icon: puzzleRobot,
    title: 'Proyectos e Integración',
    description: 'Ingeniería, integración y arranque de nuevos proyectos de automatización robótica.',
    page: 'SuministroRefacciones',
    color: 'orange',
    gradient: 'from-orange-400 to-orange-700'
  }
];

export default function ServicesGrid() {
  return (
    <div id="servicios" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Soluciones Especializadas
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Soluciones integrales para automatización industrial
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Link
              key={service.page}
              to={createPageUrl(service.page)}
              className={`group relative bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 border-2 border-slate-200 hover:border-${service.color}-500 transition-all hover:shadow-2xl ${
                index === services.length - 1 ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${service.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-${service.color}-500/30 group-hover:scale-110 transition-transform`}>
                {typeof service.icon === 'string'
                  ? <img src={service.icon} className="w-12 h-12" alt="" />
                  : <service.icon className="w-7 h-7 text-white" />
                }
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {service.title}
              </h3>

              <p className="text-slate-600 leading-relaxed mb-4">
                {service.description}
              </p>

              <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                Ver detalles
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}