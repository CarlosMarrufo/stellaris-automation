import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle, Clock, Calendar, Building2, Search,
  ChevronDown, ChevronUp, Save,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const estadoColors = {
  abierto:      'bg-yellow-100 text-yellow-800 border-yellow-200',
  'en proceso': 'bg-purple-100 text-purple-800 border-purple-200',
  en_proceso:   'bg-purple-100 text-purple-800 border-purple-200',
  resuelto:     'bg-green-100 text-green-800 border-green-200',
  cancelado:    'bg-slate-100 text-slate-800 border-slate-200',
};

const prioridadColors = {
  baja:    'bg-green-100 text-green-800',
  media:   'bg-yellow-100 text-yellow-800',
  alta:    'bg-orange-100 text-orange-800',
  critica: 'bg-red-100 text-red-800',
};

export default function TicketsAdminTab() {
  const queryClient = useQueryClient();
  const [filterEstado,    setFilterEstado]    = useState('todos');
  const [filterPrioridad, setFilterPrioridad] = useState('todas');
  const [filterCliente,   setFilterCliente]   = useState('todos');
  const [searchText,      setSearchText]      = useState('');
  const [expandedId,      setExpandedId]      = useState(null);
  const [editState,       setEditState]       = useState({}); // { [ticketId]: { estado, fecha, motivo } }

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tickets', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar tickets');
      return res.json();
    },
  });

  const { data: catalogos } = useQuery({
    queryKey: ['admin-catalogos'],
    queryFn: async () => {
      const res = await fetch('/api/admin/catalogos', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar catálogos');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, idEstadoSolicitud, fechaProgramada, motivo }) => {
      const body = { motivo };
      if (idEstadoSolicitud !== undefined) body.idEstadoSolicitud = idEstadoSolicitud;
      if (fechaProgramada !== undefined)   body.fechaProgramada = fechaProgramada || null;
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Error al actualizar');
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setEditState((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
    },
  });

  // Unique clients for filter
  const clientes = [...new Map(tickets.map((t) => [t.idCliente, t.cliente])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1]));

  // Unique estados from data
  const estadosUnicos = [...new Set(tickets.map((t) => t.estado))];

  const search = searchText.toLowerCase().trim();
  const filtered = tickets
    .filter((t) => filterEstado    === 'todos' || t.estado    === filterEstado)
    .filter((t) => filterPrioridad === 'todas' || t.prioridad === filterPrioridad)
    .filter((t) => filterCliente   === 'todos' || String(t.idCliente) === filterCliente)
    .filter((t) => !search || t.numero.toLowerCase().includes(search)
                           || t.cliente.toLowerCase().includes(search)
                           || t.robot.toLowerCase().includes(search)
                           || t.solicitante.toLowerCase().includes(search)
                           || t.detalle.toLowerCase().includes(search));

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Cargando tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',         count: tickets.length,                                                  color: 'text-slate-900' },
          { label: 'Abiertos',      count: tickets.filter((t) => t.estado.toLowerCase().includes('abiert')).length, color: 'text-yellow-600' },
          { label: 'En Proceso',    count: tickets.filter((t) => t.estado.toLowerCase().includes('proces')).length, color: 'text-purple-600' },
          { label: 'Resueltos',     count: tickets.filter((t) => t.estado.toLowerCase().includes('resuelt')).length, color: 'text-green-600' },
          { label: 'Cancelados',    count: tickets.filter((t) => t.estado.toLowerCase().includes('cancel')).length, color: 'text-slate-500' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar por ticket, cliente, robot..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Cliente:</span>
          <Select value={filterCliente} onValueChange={setFilterCliente}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los clientes</SelectItem>
              {clientes.map(([id, nombre]) => (
                <SelectItem key={id} value={String(id)}>{nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Estado:</span>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {estadosUnicos.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Prioridad:</span>
          <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            No hay tickets que coincidan con los filtros seleccionados
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => {
            const isExpanded = expandedId === ticket.id;
            return (
              <Card key={ticket.id} className={`overflow-hidden transition-shadow ${isExpanded ? 'shadow-md ring-1 ring-slate-200' : ''}`}>
                {/* Collapsed row */}
                <button
                  className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                >
                  <span className="font-mono font-semibold text-slate-900 text-sm flex-shrink-0">
                    {ticket.numero}
                  </span>
                  <span className="hidden sm:block text-sm text-slate-500 flex-shrink-0">
                    {format(new Date(ticket.fecha), 'dd/MMM/yy', { locale: es })}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-600 flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                    {ticket.cliente}
                  </span>
                  <span className="text-sm text-slate-500 truncate min-w-0 flex-1 hidden md:block">
                    {ticket.robot}
                  </span>
                  <Badge variant="outline" className={`${estadoColors[ticket.estado] ?? 'bg-slate-100 text-slate-800 border-slate-200'} border text-xs flex-shrink-0`}>
                    {ticket.estado}
                  </Badge>
                  <Badge className={`${prioridadColors[ticket.prioridad] ?? 'bg-slate-100 text-slate-800'} text-xs flex-shrink-0`}>
                    {ticket.prioridad}
                  </Badge>
                  <span className="text-slate-400 flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Tipo de Servicio</p>
                        <p className="font-medium text-slate-800">{ticket.tipo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Robot</p>
                        <p className="font-medium text-slate-800">{ticket.robot}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Solicitante</p>
                        <p className="font-medium text-slate-800">{ticket.solicitante}</p>
                        <p className="text-xs text-slate-400">{ticket.correo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Fecha Programada</p>
                        <p className="font-medium text-slate-800">
                          {ticket.fechaProgramada
                            ? format(new Date(ticket.fechaProgramada), 'dd/MMM/yyyy', { locale: es })
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {ticket.detalle && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Detalle</p>
                        <p className="text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200">
                          {ticket.detalle}
                        </p>
                      </div>
                    )}

                    {/* Admin actions: change status + confirm fecha + motivo */}
                    {catalogos?.estados && (() => {
                      const es = editState[ticket.id] ?? {
                        estado: String(ticket.idEstadoSolicitud),
                        fecha:  ticket.fechaProgramada ?? '',
                        motivo: '',
                      };
                      const updateField = (field, value) =>
                        setEditState((prev) => ({
                          ...prev,
                          [ticket.id]: { ...es, ...prev[ticket.id], [field]: value },
                        }));
                      const current = editState[ticket.id] ?? es;
                      const canSave = current.motivo?.trim().length > 0;

                      return (
                        <div className="pt-3 border-t border-slate-200 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600">Estado:</span>
                              <Select
                                value={current.estado}
                                onValueChange={(v) => updateField('estado', v)}
                              >
                                <SelectTrigger className="w-44">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {catalogos.estados.map((e) => (
                                    <SelectItem key={e.idEstadoSolicitud} value={String(e.idEstadoSolicitud)}>
                                      {e.estado}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600">Fecha programada:</span>
                              <Input
                                type="date"
                                value={current.fecha}
                                onChange={(e) => updateField('fecha', e.target.value)}
                                className="w-44"
                              />
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500 mb-1">Motivo / Comentario (requerido)</p>
                            <Textarea
                              value={current.motivo}
                              onChange={(e) => updateField('motivo', e.target.value)}
                              rows={2}
                              className="text-sm"
                              placeholder="Ingrese el motivo del cambio..."
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <Button
                              size="sm"
                              disabled={!canSave || updateMutation.isPending}
                              onClick={() => updateMutation.mutate({
                                id: ticket.id,
                                idEstadoSolicitud: Number(current.estado),
                                fechaProgramada: current.fecha || null,
                                motivo: current.motivo.trim(),
                              })}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Save className="w-3.5 h-3.5 mr-1.5" />
                              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                            {!canSave && (
                              <span className="text-xs text-amber-600">Ingrese un motivo para guardar</span>
                            )}
                            {updateMutation.isError && (
                              <span className="text-xs text-red-600">{updateMutation.error?.message}</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 text-right">
        Mostrando {filtered.length} de {tickets.length} tickets
      </p>
    </div>
  );
}
