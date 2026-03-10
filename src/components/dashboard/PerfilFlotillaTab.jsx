import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText, Activity, Plus,
} from 'lucide-react';
import CrearTicketPanel from './CrearTicketPanel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEstadoColor(estado) {
  const lc = (estado ?? '').toLowerCase();
  if (lc === 'operativo')          return 'bg-green-100 text-green-800 border-green-200';
  if (lc.includes('mantenimient')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (lc.includes('atenci'))       return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (lc.includes('falla'))        return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-slate-100 text-slate-800 border-slate-200';
}

// ─── PerfilFlotillaTab ────────────────────────────────────────────────────────

export default function PerfilFlotillaTab() {
  const [ticketOpen, setTicketOpen] = useState(false);
  const [selectedRobotId, setSelectedRobotId] = useState(null);

  const { data: robots = [], isLoading } = useQuery({
    queryKey: ['robots'],
    queryFn: async () => {
      const res = await fetch('/api/robots', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar robots');
      return res.json();
    },
    select: (data) => Array.isArray(data) ? data : [],
  });

  const openPanel = (robot = null) => {
    setSelectedRobotId(robot?.id ?? null);
    setTicketOpen(true);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Cargando flotilla...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">

        {/* ─── Resumen + Nuevo Ticket ─── */}
        <div className="flex items-start justify-between gap-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1">
            {[
              { label: 'Total Robots',      count: robots.length,                                                                        color: 'text-slate-900' },
              { label: 'Operativos',        count: robots.filter((r) => r.estado?.toLowerCase() === 'operativo').length,                 color: 'text-green-600' },
              { label: 'En Mantenimiento',  count: robots.filter((r) => r.estado?.toLowerCase().includes('mantenimient')).length,        color: 'text-blue-600' },
              { label: 'Requiere Atención', count: robots.filter((r) => r.estado?.toLowerCase().includes('atenci')).length,             color: 'text-yellow-600' },
              { label: 'Con Falla',         count: robots.filter((r) => r.estado?.toLowerCase().includes('falla')).length,              color: 'text-red-600' },
            ].map(({ label, count, color }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className={`text-3xl font-bold mt-1 ${color}`}>{count}</p>
              </div>
            ))}
          </div>

          <div className="pt-1 flex-shrink-0">
            <Button onClick={() => openPanel()} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Ticket
            </Button>
          </div>
        </div>

        {/* ─── Lista de Robots ─── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800 text-sm">Robots de la Flotilla</h2>
          </div>

          {robots.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-12 text-center text-slate-500">
              No hay robots registrados en el sistema
            </div>
          ) : (
            <div className="space-y-2">
              {robots.map((robot) => (
                <Card key={robot.id} className="overflow-hidden">
                  <div className="w-full text-left px-5 py-4 flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">{robot.marca} {robot.modelo}</p>
                      {robot.celda && (
                        <p className="text-xs text-slate-500 mt-0.5">Celda {robot.celda}</p>
                      )}
                    </div>
                    <div className="hidden sm:block font-mono text-sm text-slate-500 flex-shrink-0 text-right">
                      {robot.numero_serie_robot}
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className={`${getEstadoColor(robot.estado)} border text-xs capitalize`}>
                        {robot.estado}
                      </Badge>
                    </div>
                    <div className="flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPanel(robot)}
                        className="flex items-center gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Crear Ticket
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <CrearTicketPanel
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
        preselectedRobotId={selectedRobotId}
      />
    </>
  );
}
