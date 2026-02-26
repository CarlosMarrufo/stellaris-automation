import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const services = [
    { name: 'Mantenimiento Preventivo', page: 'MantenimientoPreventivo' },
    { name: 'Mantenimiento Correctivo', page: 'MantenimientoCorrectivo' },
    { name: 'Diagnósticos', page: 'Diagnosticos' },
    { name: 'Venta de robots Panasonic', page: '' }, //TO-DO: Mandar a páagina real.
    { name: 'Contratos Uptime', page: 'ContratosUptime' } 
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white rounded"></div>
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight">Stellaris Automation</div>
                <div className="text-xs text-slate-400">Robótica Industrial</div>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              <Link
                to={createPageUrl('ClientLogin')}
                className="px-4 py-2 rounded-lg transition-colors text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Log In
              </Link>
              
              <Link
                to={createPageUrl('Home')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPageName === 'Home' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Inicio
              </Link>

              <Link
                to={createPageUrl('Home') + '?section=servicios'}
                className="px-4 py-2 rounded-lg transition-colors text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Servicios
              </Link>

              <Link
                to={createPageUrl('Home') + '?section=contacto'}
                className="ml-4 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-lg shadow-blue-500/30"
              >
                Contacto
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-900">
            <div className="px-4 py-4 space-y-2">
              <Link
                to={createPageUrl('ClientLogin')}
                className="block px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              
              <Link
                to={createPageUrl('Home')}
                className="block px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>

              <Link
                to={createPageUrl('Home') + '?section=servicios'}
                className="block px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Servicios
              </Link>

              <Link
                to={createPageUrl('Home') + '?section=contacto'}
                className="block px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contacto
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white rounded"></div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">Stellaris Automation</div>
                  <div className="text-xs text-slate-500">Robótica Industrial</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed max-w-md">
                Soluciones integrales en automatización industrial.
              </p>
              <p className="text-sm leading-relaxed max-w-md">
                Mantenimiento especializado, integración de proyectos y venta de robots Panasonic.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Servicios</h3>
              <ul className="space-y-2 text-sm">
                {services.map((service) => (
                  <li key={service.page}>
                    <Link to={createPageUrl(service.page)} className="hover:text-white transition-colors">
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm">
                <li>ventas@stellarisautomation.com</li>
                <li>+52 (81) 8351-9650</li>
                <li>Lun - Vie: 8:00 - 18:00</li>
                <li className="pt-2 text-xs text-slate-500">Servicio 24/7 disponible con contrato</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-sm text-center">
            <p>&copy; 2026 Stellaris Automation. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}