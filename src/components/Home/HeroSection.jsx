import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ArrowRight, Shield, Clock, Award, Package } from 'lucide-react';
import stellarisPicture from '../../utils/Roboto_Inds.png'

export default function HeroSection() {
  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '48px 48px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-500/30">
              <Award className="w-4 h-4" />
              <span>Especialistas Certificados</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent">
              AUTOMATIZACION
              </span>
              , {' '} SOPORTE Y CRECIMIENTO EN UN SOLO LUGAR
            </h1>

            <p className="text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl">
              Mantenimiento industrial y desarrollo de nuevos proyectos de automatización. Integramos, optimizamos y damos soporte continuo para que su producción nunca se detenga.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to={createPageUrl('Home') + '?section=contacto'}
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-2xl shadow-blue-500/30 group"
              >
                Solicitar Evaluación
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to={createPageUrl('ContratosUptime')}
                className="inline-flex items-center justify-center px-8 py-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all font-semibold border border-slate-700"
              >
                Contratos Uptime
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="border-l-2 border-blue-500 pl-4">
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-slate-400 mt-1">Soporte Crítico</div>
              </div>
              <div className="border-l-2 border-orange-500 pl-4">
                <div className="text-3xl font-bold text-white">Especialistas</div>
                <div className="text-sm text-slate-400 mt-1">Soldadura automatizada</div>
              </div>
              <div className="border-l-2 border-green-500 pl-4">
                <div className="text-3xl font-bold text-white">Diágnostico</div>
                <div className="text-sm text-slate-400 mt-1">Técnico especializado</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
              <img
                src={stellarisPicture}
                alt="Robot Industrial"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating Cards */}
            <div className="absolute -bottom-6 -left-6 bg-white text-slate-900 rounded-xl shadow-2xl p-4 flex items-center space-x-3 max-w-xs">
              <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold">Refacciones</div>
                <div className="text-sm text-slate-600">Con entrega inmediata</div>
              </div>
            </div>

            <div className="hidden lg:block absolute -top-6 -right-6 bg-gradient-to-br from-blue-500 to-orange-500 text-white rounded-xl shadow-2xl p-4 flex items-center space-x-3">
              <Clock className="w-6 h-6" />
              <div className="text-sm font-medium">Respuesta Inmediata</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}