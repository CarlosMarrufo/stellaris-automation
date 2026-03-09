import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  FileText, Activity, Plus, X, Send,
} from 'lucide-react';

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
  const queryClient = useQueryClient();

  const [ticketOpen,    setTicketOpen]    = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [formData, setFormData] = useState({
    idRobot: '', tipo_servicio: '', prioridad: 'media', descripcion: '', fecha_programada: '',
  });

  const { data: robots = [], isLoading } = useQuery({
    queryKey: ['robots'],
    queryFn: async () => {
      const res = await fetch('/api/robots', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar robots');
      return res.json();
    },
    select: (data) => Array.isArray(data) ? data : [],
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, idRobot: Number(data.idRobot) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Error al crear el ticket');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setTicketSuccess(true);
      setFormData({ idRobot: '', tipo_servicio: '', prioridad: 'media', descripcion: '', fecha_programada: '' });
    },
  });

  const openPanel = (robot = null) => {
    setTicketOpen(true);
    setTicketSuccess(false);
    createTicketMutation.reset();
    setFormData({
      idRobot:          robot ? String(robot.id) : '',
      tipo_servicio:    '',
      prioridad:        'media',
      descripcion:      '',
      fecha_programada: '',
    });
  };

  const closePanel = () => {
    setTicketOpen(false);
    setTicketSuccess(false);
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    createTicketMutation.mutate(formData);
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
                    {/* Marca + Modelo */}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">{robot.marca} {robot.modelo}</p>
                      {robot.celda && (
                        <p className="text-xs text-slate-500 mt-0.5">Celda {robot.celda}</p>
                      )}
                    </div>

                    {/* No. Serie */}
                    <div className="hidden sm:block font-mono text-sm text-slate-500 flex-shrink-0 text-right">
                      {robot.numero_serie_robot}
                    </div>

                    {/* Estado */}
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className={`${getEstadoColor(robot.estado)} border text-xs capitalize`}>
                        {robot.estado}
                      </Badge>
                    </div>

                    {/* Crear Ticket */}
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

      {/* ─── Nuevo Ticket side panel ─── */}
      {ticketOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={closePanel} />
          <div className="relative right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-slate-900">Nuevo Ticket de Servicio</h2>
              </div>
              <button onClick={closePanel} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {ticketSuccess ? (
                <div className="text-center py-12 space-y-3">
                  <div className="text-5xl">✅</div>
                  <h3 className="font-semibold text-slate-900">Ticket creado exitosamente</h3>
                  <p className="text-sm text-slate-500">
                    Nuestro equipo técnico se pondrá en contacto contigo a la brevedad.
                  </p>
                  <Button onClick={closePanel}>Cerrar</Button>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-5">

                  <div>
                    <Label>Robot</Label>
                    <Select
                      value={formData.idRobot}
                      onValueChange={(v) => setFormData((f) => ({ ...f, idRobot: v }))}
                      required
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccionar robot" />
                      </SelectTrigger>
                      <SelectContent>
                        {robots.map((robot) => (
                          <SelectItem key={robot.id} value={String(robot.id)}>
                            {robot.marca} {robot.modelo} — {robot.numero_serie_robot}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tipo de Servicio</Label>
                    <Select
                      value={formData.tipo_servicio}
                      onValueChange={(v) => setFormData((f) => ({ ...f, tipo_servicio: v }))}
                      required
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventivo">Mantenimiento Preventivo</SelectItem>
                        <SelectItem value="correctivo_urgente">Mantenimiento Correctivo</SelectItem>
                        <SelectItem value="diagnostico">Diagnóstico</SelectItem>
                        <SelectItem value="post_colision">Post-Colisión</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Prioridad</Label>
                    <Select
                      value={formData.prioridad}
                      onValueChange={(v) => setFormData((f) => ({ ...f, prioridad: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Fecha Programada (Opcional)</Label>
                    <Input
                      type="date"
                      value={formData.fecha_programada}
                      onChange={(e) => setFormData((f) => ({ ...f, fecha_programada: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Descripción del Problema o Servicio</Label>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData((f) => ({ ...f, descripcion: e.target.value }))}
                      placeholder="Describa detalladamente el problema o servicio requerido..."
                      rows={5}
                      required
                      className="mt-1"
                    />
                  </div>

                  {createTicketMutation.isError && (
                    <p className="text-sm text-red-600">{createTicketMutation.error?.message}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {createTicketMutation.isPending ? (
                      'Creando ticket...'
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Crear Ticket
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
