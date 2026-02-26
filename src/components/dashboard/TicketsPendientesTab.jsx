import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TicketsPendientesTab() {
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => base44.entities.Ticket.list('-created_date')
  });

  const ticketsPendientes = tickets.filter(t => 
    t.estado !== 'completado' && t.estado !== 'cancelado'
  );

  const estadoColors = {
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    asignado: 'bg-blue-100 text-blue-800 border-blue-200',
    en_proceso: 'bg-purple-100 text-purple-800 border-purple-200',
    esperando_refaccion: 'bg-orange-100 text-orange-800 border-orange-200',
    completado: 'bg-green-100 text-green-800 border-green-200',
    cancelado: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const prioridadColors = {
    baja: 'bg-green-100 text-green-800',
    media: 'bg-yellow-100 text-yellow-800',
    alta: 'bg-orange-100 text-orange-800',
    critica: 'bg-red-100 text-red-800'
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
      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-slate-900">{ticketsPendientes.length}</div>
            <div className="text-sm text-slate-600 mt-1">Total Pendientes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {ticketsPendientes.filter(t => t.estado === 'pendiente').length}
            </div>
            <div className="text-sm text-slate-600 mt-1">Sin Asignar</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {ticketsPendientes.filter(t => t.estado === 'en_proceso').length}
            </div>
            <div className="text-sm text-slate-600 mt-1">En Proceso</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {ticketsPendientes.filter(t => t.prioridad === 'critica').length}
            </div>
            <div className="text-sm text-slate-600 mt-1">Críticos</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tickets */}
      <div className="space-y-4">
        {ticketsPendientes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              No hay tickets pendientes
            </CardContent>
          </Card>
        ) : (
          ticketsPendientes.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-lg">{ticket.numero_ticket}</CardTitle>
                      <Badge variant="outline" className={`${estadoColors[ticket.estado]} border`}>
                        {ticket.estado.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={prioridadColors[ticket.prioridad]}>
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
                        <span>Robot: {ticket.robot_numero_serie}</span>
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
    </div>
  );
}