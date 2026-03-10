import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, X, Send } from 'lucide-react';

export default function CrearTicketPanel({ open, onClose, preselectedRobotId = null }) {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    idRobot:          preselectedRobotId ? String(preselectedRobotId) : '',
    tipo_servicio:    '',
    prioridad:        'media',
    descripcion:      '',
    fecha_programada: '',
  });

  const { data: robots = [] } = useQuery({
    queryKey: ['robots'],
    queryFn: async () => {
      const res = await fetch('/api/robots', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar robots');
      return res.json();
    },
    select: (data) => Array.isArray(data) ? data : [],
    enabled: open,
  });

  const mutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['robots'] });
      setSuccess(true);
      setFormData({ idRobot: '', tipo_servicio: '', prioridad: 'media', descripcion: '', fecha_programada: '' });
    },
  });

  const handleClose = () => {
    setSuccess(false);
    mutation.reset();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  // Reset form when robot changes from outside
  React.useEffect(() => {
    if (open) {
      setSuccess(false);
      mutation.reset();
      setFormData({
        idRobot:          preselectedRobotId ? String(preselectedRobotId) : '',
        tipo_servicio:    '',
        prioridad:        'media',
        descripcion:      '',
        fecha_programada: '',
      });
    }
  }, [open, preselectedRobotId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
      <div className="relative right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Nuevo Ticket de Servicio</h2>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {success ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-5xl">✅</div>
              <h3 className="font-semibold text-slate-900">Ticket creado exitosamente</h3>
              <p className="text-sm text-slate-500">
                Nuestro equipo técnico se pondrá en contacto contigo a la brevedad.
              </p>
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

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

              {mutation.isError && (
                <p className="text-sm text-red-600">{mutation.error?.message}</p>
              )}

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {mutation.isPending ? (
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
  );
}
