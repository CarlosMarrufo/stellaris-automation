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
  ChevronDown, ChevronUp, Wrench, TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEstadoColor(estado) {
  const lc = (estado ?? '').toLowerCase();
  if (lc === 'operativo')          return 'bg-green-100 text-green-800 border-green-200';
  if (lc.includes('mantenimient')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (lc.includes('atenci'))       return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (lc.includes('falla'))        return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-slate-100 text-slate-800 border-slate-200';
}

function calcularSalud(robot) {
  let score = 100;
  if (robot.proximo_mantenimiento && new Date(robot.proximo_mantenimiento) < new Date()) score -= 25;
  const lc = (robot.estado ?? '').toLowerCase();
  if (lc.includes('falla'))             score -= 30;
  else if (lc.includes('atenci'))       score -= 15;
  else if (lc.includes('mantenimient')) score -= 10;
  else if (lc.includes('sin'))          score -= 5;
  return Math.max(0, score);
}

function SaludBadge({ score }) {
  let cls   = 'bg-green-100 text-green-700';
  let label = 'Óptima';
  if (score < 40)       { cls = 'bg-red-100 text-red-700';    label = 'Crítica'; }
  else if (score < 60)  { cls = 'bg-orange-100 text-orange-700'; label = 'Baja'; }
  else if (score < 80)  { cls = 'bg-yellow-100 text-yellow-700'; label = 'Regular'; }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {score}% — {label}
    </span>
  );
}

// ─── RobotCard ────────────────────────────────────────────────────────────────

function RobotCard({ robot, onCrearTicket }) {
  const [expanded, setExpanded] = useState(false);
  const salud = calcularSalud(robot);

  const { data: mantenimientos = [], isLoading: loadingMant } = useQuery({
    queryKey: ['robot-mantenimientos', robot.id],
    queryFn: async () => {
      const res = await fetch(`/api/robots/${robot.id}/mantenimientos`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar historial');
      return res.json();
    },
    enabled: expanded,
  });

  // Analíticos
  const totalMant    = mantenimientos.length;
  const costos       = mantenimientos.filter((m) => m.costo !== null).map((m) => m.costo);
  const ultimoCosto  = costos[0] ?? null;
  const costoPromedio = costos.length ? costos.reduce((a, b) => a + b, 0) / costos.length : null;

  const porAnio = mantenimientos.reduce((acc, m) => {
    if (!m.fecha) return acc;
    const anio = m.fecha.slice(0, 4);
    acc[anio] = (acc[anio] ?? 0) + 1;
    return acc;
  }, {});
  const maxPorAnio = Math.max(...Object.values(porAnio), 1);

  const vencido = robot.proximo_mantenimiento && new Date(robot.proximo_mantenimiento) < new Date();

  return (
    <Card className={`overflow-hidden transition-shadow ${expanded ? 'shadow-md ring-1 ring-slate-200' : ''}`}>

      {/* ─── Fila colapsada (siempre visible) ─── */}
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
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

        {/* Salud */}
        <div className="flex-shrink-0 hidden md:block">
          <SaludBadge score={salud} />
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 text-slate-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* ─── Contenido expandido ─── */}
      {expanded && (
        <div className="border-t border-slate-100">

          {/* Detalles técnicos */}
          <div className="px-5 py-4 bg-slate-50 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">No. Serie Robot</p>
              <p className="font-mono font-medium text-slate-800">{robot.numero_serie_robot}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Fuente de Poder</p>
              <p className="font-medium text-slate-800">{robot.fuente_poder ?? '—'}</p>
              {robot.numero_serie_fuente && (
                <p className="text-xs font-mono text-slate-500">{robot.numero_serie_fuente}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Instalación</p>
              <p className="font-medium text-slate-800">
                {robot.fecha_instalacion
                  ? format(new Date(robot.fecha_instalacion), 'dd/MMM/yyyy', { locale: es })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Próximo Mantenimiento</p>
              <p className={`font-medium ${vencido ? 'text-red-600' : 'text-slate-800'}`}>
                {robot.proximo_mantenimiento
                  ? format(new Date(robot.proximo_mantenimiento), 'dd/MMM/yyyy', { locale: es })
                  : '—'}
                {vencido && <span className="ml-1 text-xs font-normal">(vencido)</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Horas de Operación</p>
              <p className="font-medium text-slate-800">
                {robot.horas_operacion ? robot.horas_operacion.toLocaleString() : '—'}
              </p>
            </div>
          </div>

          {/* Salud (mobile) + Crear Ticket */}
          <div className="px-5 py-3 flex flex-wrap items-center gap-3 border-t border-slate-100 bg-white">
            <div className="md:hidden">
              <SaludBadge score={salud} />
            </div>
            <div className="flex-1" />
            <Button
              size="sm"
              onClick={() => onCrearTicket(robot)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Crear Ticket
            </Button>
          </div>

          {/* ─── Historial de Mantenimientos ─── */}
          <div className="px-5 pb-5 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2 py-4">
              <Wrench className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-800 text-sm">Historial de Mantenimientos</h3>
            </div>

            {loadingMant ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : mantenimientos.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">
                Sin registros de mantenimiento en el sistema
              </p>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-slate-100 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-2xl font-bold text-slate-900">{totalMant}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Total</p>
                  </div>
                  <div className="bg-slate-100 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-slate-900">
                      {ultimoCosto !== null
                        ? `$${ultimoCosto.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
                        : '—'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Último costo</p>
                  </div>
                  <div className="bg-slate-100 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-slate-900">
                      {costoPromedio !== null
                        ? `$${Math.round(costoPromedio).toLocaleString('es-MX')}`
                        : '—'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Costo promedio</p>
                  </div>
                </div>

                {/* Frecuencia por año */}
                {Object.keys(porAnio).length > 1 && (
                  <div className="mb-5">
                    <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Frecuencia por año
                    </p>
                    <div className="flex items-end gap-2 h-16 bg-slate-50 rounded-lg px-3 py-2">
                      {Object.entries(porAnio).sort().map(([anio, count]) => (
                        <div key={anio} className="flex flex-col items-center gap-1 flex-1">
                          <span className="text-[10px] text-slate-600 font-semibold">{count}</span>
                          <div
                            className="w-full bg-blue-300 hover:bg-blue-400 rounded-sm transition-colors"
                            style={{ height: `${Math.max(Math.round((count / maxPorAnio) * 32), 4)}px` }}
                            title={`${anio}: ${count} mantenimiento${count !== 1 ? 's' : ''}`}
                          />
                          <span className="text-[10px] text-slate-400">{anio}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {mantenimientos.map((m) => (
                    <div key={m.id} className="flex gap-3 text-sm py-1.5 border-b border-slate-100 last:border-0">
                      <div className="flex-shrink-0 w-20 text-xs text-slate-400 pt-0.5">
                        {m.fecha ? format(new Date(m.fecha), 'dd/MMM/yy', { locale: es }) : '—'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-700 text-sm">{m.tipo}</p>
                        {m.reporte && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{m.reporte}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        {m.costo !== null && (
                          <span className="text-xs font-semibold text-slate-700">
                            ${m.costo.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 capitalize">{m.estado}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
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

        {/* ─── Tarjetas de Robots ─── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-slate-500" />
            <h2 className="font-semibold text-slate-800 text-sm">
              Detalle de Flotilla
              <span className="ml-2 text-xs font-normal text-slate-400">
                — haz clic en un robot para ver detalles e historial
              </span>
            </h2>
          </div>

          {robots.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl py-12 text-center text-slate-500">
              No hay robots registrados en el sistema
            </div>
          ) : (
            <div className="space-y-2">
              {robots.map((robot) => (
                <RobotCard
                  key={robot.id}
                  robot={robot}
                  onCrearTicket={openPanel}
                />
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
