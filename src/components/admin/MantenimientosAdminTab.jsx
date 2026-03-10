import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Wrench, Building2, Search, Calendar,
  ChevronDown, ChevronUp, Plus, X,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const estadoColors = {
  abierto:      'bg-yellow-100 text-yellow-800 border-yellow-200',
  'en proceso': 'bg-purple-100 text-purple-800 border-purple-200',
  resuelto:     'bg-green-100 text-green-800 border-green-200',
  cancelado:    'bg-slate-100 text-slate-800 border-slate-200',
};

export default function MantenimientosAdminTab() {
  const queryClient = useQueryClient();
  const [filterCliente,  setFilterCliente]  = useState('todos');
  const [filterEstado,   setFilterEstado]   = useState('todos');
  const [searchText,     setSearchText]     = useState('');
  const [expandedId,     setExpandedId]     = useState(null);
  const [showCreate,     setShowCreate]     = useState(false);
  const [createForm,     setCreateForm]     = useState({ idRobot: '', idTicket: '', idTipoSolicitud: '', idEstadoSolicitud: '', fecha: '', costoTotal: '', reporte: '' });
  const [createError,    setCreateError]    = useState('');

  const { data: mantenimientos = [], isLoading } = useQuery({
    queryKey: ['admin-mantenimientos'],
    queryFn: async () => {
      const res = await fetch('/api/admin/mantenimientos', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar mantenimientos');
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

  const { data: robots = [] } = useQuery({
    queryKey: ['admin-robots-list'],
    queryFn: async () => {
      const res = await fetch('/api/admin/clientes', { credentials: 'include' });
      if (!res.ok) return [];
      const clientes = await res.json();
      // Fetch robots for each client — simplified: use all robots via admin tickets data
      return [];
    },
    enabled: false, // We'll use a different approach
  });

  // Fetch all robots via a separate admin query
  const { data: allTickets = [] } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tickets', { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Build robot list from tickets
  const robotMap = new Map();
  allTickets.forEach((t) => {
    if (!robotMap.has(t.idRobot)) {
      robotMap.set(t.idRobot, { id: t.idRobot, label: `${t.cliente} — ${t.robot}` });
    }
  });
  const robotOptions = [...robotMap.values()].sort((a, b) => a.label.localeCompare(b.label));

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/admin/mantenimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Error al crear mantenimiento');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-mantenimientos'] });
      setShowCreate(false);
      setCreateForm({ idRobot: '', idTicket: '', idTipoSolicitud: '', idEstadoSolicitud: '', fecha: '', costoTotal: '', reporte: '' });
      setCreateError('');
    },
    onError: (err) => setCreateError(err.message),
  });

  const clientes = [...new Map(mantenimientos.map((m) => [m.idCliente, m.cliente])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1]));

  const estadosUnicos = [...new Set(mantenimientos.map((m) => m.estado))];

  const search = searchText.toLowerCase().trim();
  const filtered = mantenimientos
    .filter((m) => filterCliente === 'todos' || String(m.idCliente) === filterCliente)
    .filter((m) => filterEstado  === 'todos' || m.estado === filterEstado)
    .filter((m) => !search || m.folio.toLowerCase().includes(search)
                           || m.cliente.toLowerCase().includes(search)
                           || m.robot.toLowerCase().includes(search)
                           || (m.ticket ?? '').toLowerCase().includes(search)
                           || m.reporte.toLowerCase().includes(search));

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Cargando mantenimientos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Total</p>
          <p className="text-3xl font-bold mt-1 text-slate-900">{mantenimientos.length}</p>
        </div>
        {estadosUnicos.slice(0, 3).map((estado) => (
          <div key={estado} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-slate-500">{estado}</p>
            <p className="text-3xl font-bold mt-1 text-slate-700">{mantenimientos.filter((m) => m.estado === estado).length}</p>
          </div>
        ))}
      </div>

      {/* Filters + Create */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="pl-9" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Cliente:</span>
          <Select value={filterCliente} onValueChange={setFilterCliente}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {clientes.map(([id, nombre]) => (
                <SelectItem key={id} value={String(id)}>{nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Estado:</span>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {estadosUnicos.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => { setShowCreate(true); setCreateError(''); }} className="bg-emerald-600 hover:bg-emerald-700 ml-auto">
          <Plus className="w-4 h-4 mr-1.5" />
          Nuevo Mantenimiento
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">No hay mantenimientos que coincidan</CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((mant) => {
            const isExpanded = expandedId === mant.id;
            const lc = mant.estado.toLowerCase();
            return (
              <Card key={mant.id} className={`overflow-hidden transition-shadow ${isExpanded ? 'shadow-md ring-1 ring-slate-200' : ''}`}>
                <button
                  className="w-full text-left px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : mant.id)}
                >
                  <span className="font-mono font-semibold text-slate-900 text-sm flex-shrink-0">{mant.folio}</span>
                  <span className="hidden sm:block text-sm text-slate-500 flex-shrink-0">
                    {mant.fechaMantenimiento ? format(new Date(mant.fechaMantenimiento), 'dd/MMM/yy', { locale: es }) : mant.fecha}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-600 flex-shrink-0">
                    <Building2 className="w-3.5 h-3.5" />{mant.cliente}
                  </span>
                  <span className="text-sm text-slate-500 truncate min-w-0 flex-1 hidden md:block">{mant.robot}</span>
                  {mant.ticket && (
                    <span className="font-mono text-xs text-blue-600 flex-shrink-0">{mant.ticket}</span>
                  )}
                  <Badge variant="outline" className={`${estadoColors[lc] ?? 'bg-slate-100 text-slate-800 border-slate-200'} border text-xs flex-shrink-0`}>
                    {mant.estado}
                  </Badge>
                  <span className="text-slate-400 flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Tipo de Solicitud</p>
                        <p className="font-medium text-slate-800">{mant.tipo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Robot</p>
                        <p className="font-medium text-slate-800">{mant.robot}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Técnico</p>
                        <p className="font-medium text-slate-800">{mant.tecnico}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-0.5">Costo Total</p>
                        <p className="font-medium text-slate-800">
                          {mant.costoTotal != null ? `$${mant.costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'}
                        </p>
                      </div>
                    </div>
                    {mant.fuente && (
                      <div className="text-sm">
                        <p className="text-xs text-slate-500 mb-0.5">Fuente de Poder</p>
                        <p className="font-medium text-slate-800">{mant.fuente}</p>
                      </div>
                    )}
                    {mant.ticket && (
                      <div className="text-sm">
                        <p className="text-xs text-slate-500 mb-0.5">Ticket Asociado</p>
                        <p className="font-mono font-medium text-blue-700">{mant.ticket}</p>
                      </div>
                    )}
                    {mant.reporte && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Reporte</p>
                        <p className="text-sm text-slate-700 bg-white rounded-lg p-3 border border-slate-200">{mant.reporte}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-400 text-right">
        Mostrando {filtered.length} de {mantenimientos.length} mantenimientos
      </p>

      {/* Create Mantenimiento Dialog */}
      {showCreate && catalogos && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Nuevo Mantenimiento</h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Robot</Label>
                <Select value={createForm.idRobot} onValueChange={(v) => setCreateForm((f) => ({ ...f, idRobot: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar robot" /></SelectTrigger>
                  <SelectContent>
                    {robotOptions.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ticket Asociado (opcional)</Label>
                <Input
                  placeholder="ID de ticket (ej: 1)"
                  value={createForm.idTicket}
                  onChange={(e) => setCreateForm((f) => ({ ...f, idTicket: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tipo de Solicitud</Label>
                <Select value={createForm.idTipoSolicitud} onValueChange={(v) => setCreateForm((f) => ({ ...f, idTipoSolicitud: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  <SelectContent>
                    {catalogos.tipos?.map((t) => (
                      <SelectItem key={t.idTipoSolicitud} value={String(t.idTipoSolicitud)}>{t.tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado del Mantenimiento</Label>
                <Select value={createForm.idEstadoSolicitud} onValueChange={(v) => setCreateForm((f) => ({ ...f, idEstadoSolicitud: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                  <SelectContent>
                    {catalogos.estados?.map((e) => (
                      <SelectItem key={e.idEstadoSolicitud} value={String(e.idEstadoSolicitud)}>{e.estado}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha de Mantenimiento</Label>
                <Input type="date" value={createForm.fecha} onChange={(e) => setCreateForm((f) => ({ ...f, fecha: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Costo Total (opcional)</Label>
                <Input type="number" min={0} step="0.01" value={createForm.costoTotal} onChange={(e) => setCreateForm((f) => ({ ...f, costoTotal: e.target.value }))} className="mt-1" placeholder="0.00" />
              </div>
              <div>
                <Label>Reporte (opcional)</Label>
                <Textarea value={createForm.reporte} onChange={(e) => setCreateForm((f) => ({ ...f, reporte: e.target.value }))} rows={3} className="mt-1 text-sm" placeholder="Descripción del mantenimiento..." />
              </div>
            </div>

            {createError && <p className="text-sm text-red-600">{createError}</p>}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)} disabled={createMutation.isPending}>Cancelar</Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={!createForm.idRobot || !createForm.idTipoSolicitud || !createForm.idEstadoSolicitud || createMutation.isPending}
                onClick={() => createMutation.mutate({
                  idRobot:           Number(createForm.idRobot),
                  idTicket:          createForm.idTicket ? Number(createForm.idTicket) : null,
                  idTipoSolicitud:   Number(createForm.idTipoSolicitud),
                  idEstadoSolicitud: Number(createForm.idEstadoSolicitud),
                  fechaMantenimiento: createForm.fecha || null,
                  costoTotal:        createForm.costoTotal ? parseFloat(createForm.costoTotal) : null,
                  reporte:           createForm.reporte || null,
                })}
              >
                {createMutation.isPending ? 'Creando...' : 'Crear Mantenimiento'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
