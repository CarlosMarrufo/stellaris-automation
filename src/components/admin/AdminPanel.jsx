import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Package, FileText, ClipboardList, Wrench } from 'lucide-react';

import ClientesTab             from './ClientesTab';
import RefaccionesAdminTab     from './RefaccionesAdminTab';
import TicketsAdminTab         from './TicketsAdminTab';
import CotizacionesAdminTab    from './CotizacionesAdminTab';
import MantenimientosAdminTab  from './MantenimientosAdminTab';

function PendingDot() {
  return (
    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
      !
    </span>
  );
}

export default function AdminPanel({ user, onLogout }) {
  // Light queries just to count pending items for tab badges
  const { data: tickets = [] } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tickets', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: cotizaciones = [] } = useQuery({
    queryKey: ['admin-cotizaciones'],
    queryFn: async () => {
      const res = await fetch('/api/admin/cotizaciones', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const ticketsPendientes = tickets.filter((t) => {
    const lc = (t.estado ?? '').toLowerCase();
    return lc.includes('abiert');
  }).length;

  const cotizacionesPendientes = cotizaciones.filter((c) => c.estado === 'pendiente').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Panel Administrador</h1>
              <p className="text-slate-600 mt-1">Bienvenido, {user?.nombre}</p>
            </div>
            <Button onClick={onLogout} variant="outline" className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="clientes" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="clientes" className="flex items-center gap-2 py-2.5 px-4">
              <Users className="w-4 h-4" />
              <span>Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="refacciones" className="flex items-center gap-2 py-2.5 px-4">
              <Package className="w-4 h-4" />
              <span>Refacciones</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2 py-2.5 px-4">
              <FileText className="w-4 h-4" />
              <span>Tickets</span>
              {ticketsPendientes > 0 && <PendingDot />}
            </TabsTrigger>
            <TabsTrigger value="cotizaciones" className="flex items-center gap-2 py-2.5 px-4">
              <ClipboardList className="w-4 h-4" />
              <span>Cotizaciones</span>
              {cotizacionesPendientes > 0 && <PendingDot />}
            </TabsTrigger>
            <TabsTrigger value="mantenimientos" className="flex items-center gap-2 py-2.5 px-4">
              <Wrench className="w-4 h-4" />
              <span>Mantenimientos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clientes">
            <ClientesTab />
          </TabsContent>
          <TabsContent value="refacciones">
            <RefaccionesAdminTab />
          </TabsContent>
          <TabsContent value="tickets">
            <TicketsAdminTab />
          </TabsContent>
          <TabsContent value="cotizaciones">
            <CotizacionesAdminTab />
          </TabsContent>
          <TabsContent value="mantenimientos">
            <MantenimientosAdminTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
