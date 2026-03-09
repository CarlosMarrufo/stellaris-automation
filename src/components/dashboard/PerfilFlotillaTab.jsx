import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Calendar, Wrench, Activity, Plus, X, Send } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PerfilFlotillaTab() {
  const queryClient = useQueryClient();

  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [formData, setFormData] = useState({
    idRobot:          '',
    tipo_servicio:    '',
    prioridad:        'media',
    descripcion:      '',
    fecha_programada: '',
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
        method:  'POST',
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

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    createTicketMutation.mutate(formData);
  };

  const openPanel = () => {
    setTicketOpen(true);
    setTicketSuccess(false);
    createTicketMutation.reset();
  };

  const closePanel = () => {
    setTicketOpen(false);
    setTicketSuccess(false);
  };

  const estadoColors = {
    operativo:     'bg-green-100 text-green-800 border-green-200',
    mantenimiento: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    falla:         'bg-red-100 text-red-800 border-red-200',
    inactivo:      'bg-slate-100 text-slate-800 border-slate-200',
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Cargando flotilla...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Resumen + Nuevo Ticket button */}
        <div className="flex items-start justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Total Robots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{robots.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Operativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {robots.filter((r) => r.estado === 'operativo').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">En Mantenimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {robots.filter((r) => r.estado === 'mantenimiento').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">Con Falla</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {robots.filter((r) => r.estado === 'falla').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-1 flex-shrink-0">
            <Button
              onClick={openPanel}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Ticket
            </Button>
          </div>
        </div>

        {/* Tabla de Robots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Detalle de Flotilla</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Número de serie robot</TableHead>
                    <TableHead>Fuente de Poder</TableHead>
                    <TableHead>Número de serie FdP</TableHead>
                    <TableHead>Año de instalación</TableHead>
                    <TableHead>Celda</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Próximo mantenimiento programado</TableHead>
                    <TableHead>Último mantenimiento</TableHead>
                    <TableHead>Horas de operación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {robots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                        No hay robots registrados en el sistema
                      </TableCell>
                    </TableRow>
                  ) : (
                    robots.map((robot) => (
                      <TableRow className="text-center py-8 text-slate-500" key={robot.id}>
                        <TableCell className="font-medium">{robot.modelo}</TableCell>
                        <TableCell>{robot.numero_serie_robot}</TableCell>
                        <TableCell className="font-mono text-sm">{robot.fuente_poder}</TableCell>
                        <TableCell className="text-sm">{robot.numero_serie_fuente || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {robot.fecha_instalacion ? format(new Date(robot.fecha_instalacion), 'dd/MMM/yyyy', { locale: es }) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{robot.celda || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${estadoColors[robot.estado]} border`}>
                            {robot.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {robot.proximo_mantenimiento ? (
                            <span className={`flex items-center space-x-1 ${
                              new Date(robot.proximo_mantenimiento) < new Date() ? 'text-red-600 font-semibold' : ''
                            }`}>
                              <Calendar className="w-3 h-3" />
                              <span>{format(new Date(robot.proximo_mantenimiento), 'dd/MMM/yyyy', { locale: es })}</span>
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {robot.ultimo_mantenimiento ? format(new Date(robot.ultimo_mantenimiento), 'dd/MMM/yyyy', { locale: es }) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {robot.horas_operacion ? robot.horas_operacion.toLocaleString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Nuevo Ticket side panel ─── */}
      {ticketOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={closePanel} />
          {/* Panel */}
          <div className="relative fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 overflow-hidden">
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
                  <p className="text-sm text-slate-500">Nuestro equipo técnico se pondrá en contacto contigo a la brevedad.</p>
                  <Button onClick={closePanel}>Cerrar</Button>
                </div>
              ) : (
                <form onSubmit={handleTicketSubmit} className="space-y-5">
                  <div>
                    <Label>Robot (Número de Serie)</Label>
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
