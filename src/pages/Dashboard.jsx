import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, DollarSign, Activity, FileText, AlertCircle, Database, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

import RefaccionesTab from '../components/dashboard/RefaccionesTab';
import PreciosTab from '../components/dashboard/PreciosTab';
import ResumenVidaTab from '../components/dashboard/ResumenVidaTab';
import TicketTab from '../components/dashboard/TicketTab';
import TicketsPendientesTab from '../components/dashboard/TicketsPendientesTab';
import PerfilFlotillaTab from '../components/dashboard/PerfilFlotillaTab';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    // Verificar si hay sesión de cliente
    const isAuth = localStorage.getItem('clientAuth');
    const username = localStorage.getItem('clientUsername');
    
    if (isAuth === 'true' && username) {
      setUser({ email: username, full_name: 'Cliente' });
      setLoading(false);
    } else {
      // Redirigir a login si no está autenticado
      window.location.href = createPageUrl('ClientLogin');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clientAuth');
    localStorage.removeItem('clientUsername');
    window.location.href = createPageUrl('Home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Portal de Cliente</h1>
              <p className="text-slate-600 mt-1">Bienvenido, {user?.full_name || user?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="flotilla" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 bg-white border border-slate-200 p-1 h-auto">
            <TabsTrigger value="flotilla" className="flex items-center space-x-2 py-3">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil Flotilla</span>
              <span className="sm:hidden">Flotilla</span>
            </TabsTrigger>
            <TabsTrigger value="refacciones" className="flex items-center space-x-2 py-3">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Refacciones</span>
              <span className="sm:hidden">Stock</span>
            </TabsTrigger>
            <TabsTrigger value="vida" className="flex items-center space-x-2 py-3">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Vida Robot</span>
              <span className="sm:hidden">Vida</span>
            </TabsTrigger>
            <TabsTrigger value="ticket" className="flex items-center space-x-2 py-3">
              <FileText className="w-4 h-4" />
              <span>Ticket</span>
            </TabsTrigger>
            <TabsTrigger value="pendientes" className="flex items-center space-x-2 py-3">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Pendientes</span>
              <span className="sm:hidden">Pend.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flotilla">
            <PerfilFlotillaTab />
          </TabsContent>

          <TabsContent value="refacciones">
            <RefaccionesTab />
          </TabsContent>

          <TabsContent value="vida">
            <ResumenVidaTab />
          </TabsContent>

          <TabsContent value="ticket">
            <TicketTab />
          </TabsContent>

          <TabsContent value="pendientes">
            <TicketsPendientesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}