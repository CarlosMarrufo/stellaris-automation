import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Clock, User, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CrearTicketPanel from './CrearTicketPanel';

export default function TicketsPendientesTab() {
  const [filterEstado,    setFilterEstado]    = useState('todos');
  const [filterPrioridad, setFilterPrioridad] = useState('todas');
  const [ticketOpen,      setTicketOpen]      = useState(false);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const res = await fetch('/api/tickets', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar tickets');
      return res.json();
    },
    select: (data) => Array.isArray(data) ? data : [],
  });

  const filteredTickets = tickets
    .filter((t) => filterEstado    === 'todos'  || t.estado    === filterEstado)
    .filter((t) => filterPrioridad === 'todas'  || t.prioridad === filterPrioridad);

  const estadoColors = {
    abierto:      'bg-yellow-100 text-yellow-800 border-yellow-200',
    'en proceso':  'bg-purple-100 text-purple-800 border-purple-200',
    en_proceso:    'bg-purple-100 text-purple-800 border-purple-200',
    resuelto:      'bg-green-100 text-green-800 border-green-200',
    cancelado:     'bg-slate-100 text-slate-800 border-slate-200',
  };

  const prioridadColors = {
    baja:   'bg-green-100 text-green-800',
    media:  'bg-yellow-100 text-yellow-800',
    alta:   'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800',
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Cargando tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Crear Ticket */}
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => setTicketOpen(true)} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 whitespace-nowrap">Estado:</span>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="abierto">Abierto</SelectItem>
              <SelectItem value="en proceso">En proceso</SelectItem>
              <SelectItem value="resuelto">Resuelto</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 whitespace-nowrap">Prioridad:</span>
          <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las prioridades</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900">{tickets.length}</div>
            <div className="text-sm text-slate-600 mt-1">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {tickets.filter((t) => t.estado === 'abierto').length}
            </div>
            <div className="text-sm text-slate-600 mt-1">Abiertos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {tickets.filter((t) => t.estado === 'en proceso' || t.estado === 'en_proceso').length}
            </div>
            <div className="text-sm text-slate-600 mt-1">En Proceso</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter((t) => t.estado === 'resuelto').length}
            </div>
            <div className="text-sm text-slate-600 mt-1">Resueltos</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tickets */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              No hay tickets que coincidan con los filtros seleccionados
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-lg">{ticket.numero_ticket}</CardTitle>
                      <Badge variant="outline" className={`${estadoColors[ticket.estado] ?? 'bg-slate-100 text-slate-800 border-slate-200'} border`}>
                        {ticket.estado.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={prioridadColors[ticket.prioridad] ?? 'bg-slate-100 text-slate-800'}>
                        {ticket.prioridad}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span className="flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{ticket.tipo_servicio.replace(/_/g, ' ')}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Robot: {ticket.robot}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-700">{ticket.descripcion}</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                  <div className="flex items-start space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div className="text-sm">
                      <div className="text-slate-500">Creado</div>
                      <div className="font-medium text-slate-700">
                        {ticket.fecha_creacion ? format(new Date(ticket.fecha_creacion), 'dd MMM yyyy', { locale: es }) : 'N/D'}
                      </div>
                    </div>
                  </div>

                  {ticket.fecha_programada && (
                    <div className="flex items-start space-x-2">
                      <Calendar className="w-4 h-4 text-blue-400 mt-0.5" />
                      <div className="text-sm">
                        <div className="text-slate-500">Programado</div>
                        <div className="font-medium text-blue-700">
                          {format(new Date(ticket.fecha_programada), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                    </div>
                  )}

                  {ticket.tecnico_asignado && (
                    <div className="flex items-start space-x-2">
                      <User className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div className="text-sm">
                        <div className="text-slate-500">Técnico</div>
                        <div className="font-medium text-slate-700">{ticket.tecnico_asignado}</div>
                      </div>
                    </div>
                  )}
                </div>

                {ticket.notas_tecnico && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium mb-1">Notas del Técnico:</p>
                    <p className="text-sm text-blue-900">{ticket.notas_tecnico}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CrearTicketPanel
        open={ticketOpen}
        onClose={() => setTicketOpen(false)}
      />
    </div>
  );
}
