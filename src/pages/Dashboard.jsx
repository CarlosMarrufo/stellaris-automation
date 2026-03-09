import React, { useState, useEffect } from 'react';
import { createPageUrl } from '../utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Activity, FileText, Database, LogOut, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

import RefaccionesTab           from '../components/dashboard/RefaccionesTab';
import ResumenVidaTab           from '../components/dashboard/ResumenVidaTab';
import TicketsPendientesTab     from '../components/dashboard/TicketsPendientesTab';
import PerfilFlotillaTab        from '../components/dashboard/PerfilFlotillaTab';
import CotizacionesHistorialTab from '../components/dashboard/CotizacionesHistorialTab';
import AdminPanel               from '../components/admin/AdminPanel';

export default function Dashboard() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart]       = useState([]);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        window.location.href = createPageUrl('ClientLogin');
      }
    } catch {
      window.location.href = createPageUrl('ClientLogin');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    window.location.href = createPageUrl('ClientLogin');
  };

  // ─── Cart helpers ──────────────────────────────────────────────────────────

  const addToCart = (item, cantidad) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, cantidad: c.cantidad + cantidad } : c
        );
      }
      return [...prev, { ...item, cantidad }];
    });
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((c) => c.id !== id));

  const updateQty = (id, cantidad) =>
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, cantidad } : c)));

  const clearCart = () => setCart([]);

  // ─── Derived ───────────────────────────────────────────────────────────────

  const isAdmin = user?.rol === 'Admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return <AdminPanel user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Portal de Cliente</h1>
              <p className="text-slate-600 mt-1">Bienvenido, {user?.nombre || user?.correo}</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="flotilla" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto bg-white border border-slate-200 p-1 w-full">
            <TabsTrigger value="flotilla" className="flex items-center gap-2 py-2.5 px-3">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil Flotilla</span>
              <span className="sm:hidden">Flotilla</span>
            </TabsTrigger>
            <TabsTrigger value="vida" className="flex items-center gap-2 py-2.5 px-3">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Vida Robot</span>
              <span className="sm:hidden">Vida</span>
            </TabsTrigger>
            <TabsTrigger value="refacciones" className="flex items-center gap-2 py-2.5 px-3">
              <Package className="w-4 h-4" />
              <span>Refacciones</span>
            </TabsTrigger>
            <TabsTrigger value="cotizaciones" className="flex items-center gap-2 py-2.5 px-3">
              <ClipboardList className="w-4 h-4" />
              <span>Cotizaciones</span>
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center gap-2 py-2.5 px-3">
              <FileText className="w-4 h-4" />
              <span>Tickets</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flotilla">
            <PerfilFlotillaTab />
          </TabsContent>
          <TabsContent value="vida">
            <ResumenVidaTab />
          </TabsContent>
          <TabsContent value="refacciones">
            <RefaccionesTab
              isAdmin={false}
              onAddToCart={addToCart}
              cart={cart}
              onRemove={removeFromCart}
              onUpdateQty={updateQty}
              onClear={clearCart}
              user={user}
            />
          </TabsContent>
          <TabsContent value="cotizaciones">
            <CotizacionesHistorialTab />
          </TabsContent>
          <TabsContent value="tickets">
            <TicketsPendientesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
