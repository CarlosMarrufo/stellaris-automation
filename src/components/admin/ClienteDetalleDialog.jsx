import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Badge helpers ────────────────────────────────────────────────────────────

function EstadoRobotBadge({ estado }) {
  const lc = (estado ?? '').toLowerCase();
  const map = {
    activo:       'bg-green-100 text-green-800 border-green-200',
    operativo:    'bg-green-100 text-green-800 border-green-200',
    mantenimiento:'bg-yellow-100 text-yellow-800 border-yellow-200',
    inactivo:     'bg-slate-100 text-slate-600 border-slate-200',
    falla:        'bg-red-100 text-red-800 border-red-200',
  };
  const cls = map[lc] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return <Badge className={`${cls} border`}>{estado}</Badge>;
}

function EstadoTicketBadge({ estado }) {
  const lc = (estado ?? '').toLowerCase();
  let cls = 'bg-slate-100 text-slate-600 border-slate-200';
  if (lc.includes('abiert'))   cls = 'bg-blue-100 text-blue-800 border-blue-200';
  if (lc.includes('progreso') || lc.includes('proceso')) cls = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (lc.includes('cerrad') || lc.includes('resuelto'))  cls = 'bg-slate-100 text-slate-600 border-slate-200';
  return <Badge className={`${cls} border`}>{estado}</Badge>;
}

function EstadoCotizacionBadge({ estado }) {
  const map = {
    pendiente:  'bg-yellow-100 text-yellow-800 border-yellow-200',
    aceptada:   'bg-green-100 text-green-800 border-green-200',
    rechazada:  'bg-red-100 text-red-800 border-red-200',
    modificada: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  const cls = map[estado] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return <Badge className={`${cls} border capitalize`}>{estado}</Badge>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ClienteDetalleDialog({ cliente, onClose }) {
  const queryClient = useQueryClient();
  const [expandedCot, setExpandedCot] = useState(null); // id of expanded cotizacion row
  const [editingCot,  setEditingCot]  = useState(null); // { id, estado, notas }
  const [savingTicket, setSavingTicket] = useState(null); // ticket id being saved
  const [savingCot,    setSavingCot]    = useState(null); // cotizacion id being saved

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data: detail, isLoading, error } = useQuery({
    queryKey: ['admin-cliente-detail', cliente.id],
    queryFn:  async () => {
      const res = await fetch(`/api/admin/clientes/${cliente.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar detalle');
      return res.json();
    },
  });

  const { data: catalogos } = useQuery({
    queryKey: ['admin-catalogos'],
    queryFn:  async () => {
      const res = await fetch('/api/admin/catalogos', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar catálogos');
      return res.json();
    },
  });

  const estadoOpts = catalogos?.estados ?? [];

  // ─── Ticket status change ─────────────────────────────────────────────────

  const handleTicketEstado = async (ticketId, idEstadoSolicitud) => {
    setSavingTicket(ticketId);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method:      'PATCH',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ idEstadoSolicitud: Number(idEstadoSolicitud) }),
      });
      if (!res.ok) throw new Error('Error al actualizar ticket');
      await queryClient.invalidateQueries(['admin-cliente-detail', cliente.id]);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingTicket(null);
    }
  };

  // ─── Cotizacion status change ─────────────────────────────────────────────

  const handleCotizacionSave = async (cotId) => {
    if (!editingCot || editingCot.id !== cotId) return;
    setSavingCot(cotId);
    try {
      const res = await fetch(`/api/admin/cotizaciones/${cotId}`, {
        method:      'PATCH',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ estado: editingCot.estado, notas: editingCot.notas }),
      });
      if (!res.ok) throw new Error('Error al actualizar cotización');
      await queryClient.invalidateQueries(['admin-cliente-detail', cliente.id]);
      setEditingCot(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCot(null);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const robots       = detail?.robots       ?? [];
  const tickets      = detail?.tickets      ?? [];
  const cotizaciones = detail?.cotizaciones ?? [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Cliente: {cliente.nombre}</h2>
            {cliente.rfc && (
              <p className="text-sm text-slate-500 mt-0.5">RFC: {cliente.rfc}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoading && (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
              <p className="text-slate-600">Cargando...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              {error.message}
            </div>
          )}

          {detail && (
            <Tabs defaultValue="robots" className="space-y-4">
              <TabsList className="bg-slate-100 p-1">
                <TabsTrigger value="robots" className="flex items-center gap-1.5">
                  Robots
                  <span className="bg-slate-200 text-slate-700 text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {robots.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="tickets" className="flex items-center gap-1.5">
                  Tickets
                  <span className="bg-slate-200 text-slate-700 text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {tickets.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="cotizaciones" className="flex items-center gap-1.5">
                  Cotizaciones
                  <span className="bg-slate-200 text-slate-700 text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {cotizaciones.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              {/* ─── Robots tab ─────────────────────────────────────────── */}
              <TabsContent value="robots">
                {robots.length === 0 ? (
                  <p className="text-slate-500 py-6 text-center">No hay robots registrados</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Modelo</TableHead>
                          <TableHead>No. Serie</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead>Celda</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Instalación</TableHead>
                          <TableHead>Prox. Mant.</TableHead>
                          <TableHead className="text-right">Horas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {robots.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.modelo}</TableCell>
                            <TableCell className="font-mono text-sm">{r.noSerie}</TableCell>
                            <TableCell>{r.marca}</TableCell>
                            <TableCell>{r.celda || '—'}</TableCell>
                            <TableCell><EstadoRobotBadge estado={r.estado} /></TableCell>
                            <TableCell>{r.fechaInstalacion ?? '—'}</TableCell>
                            <TableCell>{r.fechaProxMant ?? '—'}</TableCell>
                            <TableCell className="text-right">{r.horasOperacion.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ─── Tickets tab ─────────────────────────────────────────── */}
              <TabsContent value="tickets">
                {tickets.length === 0 ? (
                  <p className="text-slate-500 py-6 text-center">No hay tickets registrados</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Robot</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Prioridad</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cambiar Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tickets.map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="font-mono text-xs">{t.numero}</TableCell>
                            <TableCell className="text-sm">{t.robot}</TableCell>
                            <TableCell className="text-sm">{t.tipo}</TableCell>
                            <TableCell className="text-sm">{t.prioridad}</TableCell>
                            <TableCell><EstadoTicketBadge estado={t.estado} /></TableCell>
                            <TableCell className="text-sm">{t.fecha}</TableCell>
                            <TableCell>
                              <Select
                                value={String(t.idEstadoSolicitud)}
                                onValueChange={(v) => handleTicketEstado(t.id, v)}
                                disabled={savingTicket === t.id}
                              >
                                <SelectTrigger className="w-36 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {estadoOpts.map((e) => (
                                    <SelectItem key={e.idEstadoSolicitud} value={String(e.idEstadoSolicitud)}>
                                      {e.estado}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ─── Cotizaciones tab ────────────────────────────────────── */}
              <TabsContent value="cotizaciones">
                {cotizaciones.length === 0 ? (
                  <p className="text-slate-500 py-6 text-center">No hay cotizaciones registradas</p>
                ) : (
                  <div className="space-y-2">
                    {cotizaciones.map((c) => {
                      const isExpanded = expandedCot === c.id;
                      const isEditing  = editingCot?.id === c.id;

                      return (
                        <div key={c.id} className="border border-slate-200 rounded-lg overflow-hidden">
                          {/* Row */}
                          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 bg-white">
                            {/* Expand toggle */}
                            <button
                              className="text-slate-400 hover:text-slate-700"
                              onClick={() => setExpandedCot(isExpanded ? null : c.id)}
                              aria-label="Expandir"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {/* Info */}
                            <div>
                              <span className="font-mono text-xs text-slate-500">COT-{String(c.id).padStart(5, '0')}</span>
                              <span className="text-xs text-slate-500 ml-2">{c.solicitante}</span>
                              <span className="text-xs text-slate-400 ml-2">{c.fecha}</span>
                            </div>

                            {/* Total */}
                            <span className="text-sm font-semibold text-slate-800">
                              ${c.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>

                            {/* Estado badge */}
                            <EstadoCotizacionBadge estado={c.estado} />

                            {/* Gestionar button */}
                            {!isEditing ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setEditingCot({ id: c.id, estado: c.estado, notas: c.notas ?? '' })}
                              >
                                Gestionar
                              </Button>
                            ) : (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                                  onClick={() => handleCotizacionSave(c.id)}
                                  disabled={savingCot === c.id}
                                >
                                  {savingCot === c.id ? '...' : 'Guardar'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => setEditingCot(null)}
                                  disabled={savingCot === c.id}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Inline edit form */}
                          {isEditing && (
                            <div className="px-4 pb-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3 items-end">
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
                                <Select
                                  value={editingCot.estado}
                                  onValueChange={(v) => setEditingCot((prev) => ({ ...prev, estado: v }))}
                                >
                                  <SelectTrigger className="w-36 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {['pendiente', 'aceptada', 'rechazada', 'modificada'].map((e) => (
                                      <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <label className="block text-xs font-medium text-slate-600 mb-1">Notas</label>
                                <textarea
                                  value={editingCot.notas}
                                  onChange={(e) => setEditingCot((prev) => ({ ...prev, notas: e.target.value }))}
                                  rows={2}
                                  className="w-full border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Notas opcionales..."
                                />
                              </div>
                            </div>
                          )}

                          {/* Expanded items */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                              {c.notas && (
                                <p className="text-xs text-slate-600 mb-2 italic">Notas: {c.notas}</p>
                              )}
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-slate-500 border-b border-slate-200">
                                    <th className="text-left pb-1.5 pr-3">Código</th>
                                    <th className="text-left pb-1.5 pr-3">Descripción</th>
                                    <th className="text-center pb-1.5 pr-3">Cant.</th>
                                    <th className="text-right pb-1.5 pr-3">Precio Ref.</th>
                                    <th className="text-right pb-1.5">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.items.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-100 last:border-0">
                                      <td className="py-1.5 pr-3 font-mono">{item.codigo}</td>
                                      <td className="py-1.5 pr-3 text-slate-700">{item.descripcion}</td>
                                      <td className="py-1.5 pr-3 text-center">{item.cantidad}</td>
                                      <td className="py-1.5 pr-3 text-right">
                                        ${item.precioRef.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="py-1.5 text-right font-semibold">
                                        ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr>
                                    <td colSpan={4} className="pt-2 text-right font-bold text-slate-700 pr-3">Total:</td>
                                    <td className="pt-2 text-right font-bold text-slate-900">
                                      ${c.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
}
