import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const estadoBadgeClass = {
  pendiente:  'bg-yellow-100 text-yellow-800 border-yellow-200',
  aceptada:   'bg-green-100 text-green-800 border-green-200',
  rechazada:  'bg-red-100 text-red-800 border-red-200',
  modificada: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default function CotizacionesHistorialTab() {
  const [filterEstado, setFilterEstado] = useState('todos');
  const [expandedIds, setExpandedIds]   = useState(new Set());

  const { data: cotizaciones = [], isLoading, isError } = useQuery({
    queryKey: ['cotizaciones'],
    queryFn: async () => {
      const res = await fetch('/api/cotizaciones', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar cotizaciones');
      return res.json();
    },
    select: (data) => Array.isArray(data) ? data : [],
  });

  const filtered = filterEstado === 'todos'
    ? cotizaciones
    : cotizaciones.filter((c) => c.estado === filterEstado);

  const sorted = [...filtered].sort((a, b) => new Date(b.creado ?? b.fecha) - new Date(a.creado ?? a.fecha));

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Cargando cotizaciones...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error al cargar el historial de cotizaciones.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900">{cotizaciones.length}</div>
            <div className="text-sm text-slate-600 mt-1">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {cotizaciones.filter((c) => c.estado === 'pendiente').length}
            </div>
            <div className="text-sm text-slate-600 mt-1">Pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {cotizaciones.filter((c) => c.estado === 'aceptada').length}
            </div>
            <div className="text-sm text-slate-600 mt-1">Aceptadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {cotizaciones.filter((c) => c.estado === 'rechazada').length}
            </div>
            <div className="text-sm text-slate-600 mt-1">Rechazadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600 whitespace-nowrap">Filtrar por estado:</span>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aceptada">Aceptada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
            <SelectItem value="modificada">Modificada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            <span>Historial de Cotizaciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No hay cotizaciones que coincidan con el filtro seleccionado.
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((cot) => {
                const isExpanded = expandedIds.has(cot.id ?? cot.idCotizacion);
                const cotId      = cot.id ?? cot.idCotizacion;
                const folio      = `COT-${String(cotId).padStart(5, '0')}`;
                const fecha      = cot.creado ?? cot.fecha;
                const items      = Array.isArray(cot.items) ? cot.items : [];
                const total      = cot.total ?? items.reduce((s, i) => s + (i.subtotal ?? i.cantidad * i.precioRef), 0);
                const badgeClass = estadoBadgeClass[cot.estado] ?? 'bg-slate-100 text-slate-800 border-slate-200';

                return (
                  <div key={cotId} className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* Row header */}
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left"
                      onClick={() => toggleExpand(cotId)}
                    >
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-mono font-semibold text-slate-900 text-sm">{folio}</span>
                        <span className="text-sm text-slate-500">
                          {fecha ? format(new Date(fecha), 'dd MMM yyyy', { locale: es }) : '—'}
                        </span>
                        <span className="text-sm text-slate-600">{items.length} {items.length === 1 ? 'artículo' : 'artículos'}</span>
                        <span className="text-sm font-semibold text-slate-800">
                          ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                        <Badge variant="outline" className={`${badgeClass} border text-xs`}>
                          {cot.estado}
                        </Badge>
                      </div>
                      <span className="ml-2 text-slate-400 flex-shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </button>

                    {/* Expanded items */}
                    {isExpanded && items.length > 0 && (
                      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Código</TableHead>
                              <TableHead className="text-xs">Descripción</TableHead>
                              <TableHead className="text-xs text-center">Cantidad</TableHead>
                              <TableHead className="text-xs text-right">Precio Ref.</TableHead>
                              <TableHead className="text-xs text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item) => (
                              <TableRow key={item.id ?? item.idItem}>
                                <TableCell className="font-mono text-xs">{item.codigo ?? item.noParte}</TableCell>
                                <TableCell className="text-xs max-w-xs truncate">{item.descripcion}</TableCell>
                                <TableCell className="text-xs text-center">{item.cantidad}</TableCell>
                                <TableCell className="text-xs text-right">
                                  ${Number(item.precioRef).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-xs text-right font-semibold">
                                  ${Number(item.subtotal ?? item.cantidad * item.precioRef).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {cot.notas && (
                          <p className="text-xs text-slate-600 mt-2">
                            <strong>Notas:</strong> {cot.notas}
                          </p>
                        )}
                      </div>
                    )}

                    {isExpanded && items.length === 0 && (
                      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Sin detalle de artículos disponible.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
