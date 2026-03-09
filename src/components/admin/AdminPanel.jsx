import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Package } from 'lucide-react';

import ClientesTab       from './ClientesTab';
import RefaccionesAdminTab from './RefaccionesAdminTab';

export default function AdminPanel({ user, onLogout }) {
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
          </TabsList>

          <TabsContent value="clientes">
            <ClientesTab />
          </TabsContent>
          <TabsContent value="refacciones">
            <RefaccionesAdminTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
