import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, ChevronDown, ChevronUp, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';

// ─── Badge helpers ────────────────────────────────────────────────────────────

function EstadoRobotBadge({ estado }) {
  const lc = (estado ?? '').toLowerCase();
  let cls = 'bg-slate-100 text-slate-600 border-slate-200';
  if (lc === 'operativo')              cls = 'bg-green-100 text-green-800 border-green-200';
  else if (lc.includes('mantenimient')) cls = 'bg-blue-100 text-blue-800 border-blue-200';
  else if (lc.includes('atenci'))      cls = 'bg-yellow-100 text-yellow-800 border-yellow-200';
  else if (lc.includes('falla'))       cls = 'bg-red-100 text-red-800 border-red-200';
  return <Badge className={`${cls} border`}>{estado}</Badge>;
}

function EstadoTicketBadge({ estado }) {
  const lc = (estado ?? '').toLowerCase();
  let cls = 'bg-slate-100 text-slate-600 border-slate-200';
  if (lc.includes('abiert'))                              cls = 'bg-blue-100 text-blue-800 border-blue-200';
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

  // cotizaciones state
  const [expandedCot,  setExpandedCot]  = useState(null);
  const [editingCot,   setEditingCot]   = useState(null);
  const [savingTicket, setSavingTicket] = useState(null);
  const [savingCot,    setSavingCot]    = useState(null);

  // usuarios state
  const [userDialog,  setUserDialog]  = useState(null); // null | 'create' | 'edit'
  const [selUser,     setSelUser]     = useState(null);
  const [userForm,    setUserForm]    = useState({ nombre: '', correo: '', telefono: '', password: '' });
  const [userSaving,  setUserSaving]  = useState(false);
  const [userError,   setUserError]   = useState('');

  // robots state
  const [robotDialog,  setRobotDialog]  = useState(null); // null | 'create' | 'edit' | 'delete'
  const [selRobot,     setSelRobot]     = useState(null);
  const [robotForm,    setRobotForm]    = useState({
    idMarca: '', idEstado: '', modelo: '', noSerie: '',
    celda: '', fechaInstalacion: '', fechaProxMant: '', horasOperacion: '0',
  });
  const [robotSaving,  setRobotSaving]  = useState(false);
  const [robotError,   setRobotError]   = useState('');

  // fuente de poder state
  const [fuentePrompt,       setFuentePrompt]       = useState(null); // { id, modelo, noSerie } of newly created robot
  const [fuenteDialog,       setFuenteDialog]       = useState(null); // null | 'create' | 'edit'
  const [fuenteTargetRobotId, setFuenteTargetRobotId] = useState(null);
  const [fuenteEditId,       setFuenteEditId]       = useState(null);
  const [fuenteForm,         setFuenteForm]         = useState({ idMarca: '', modelo: '', noSerie: '' });
  const [fuenteSaving,       setFuenteSaving]       = useState(false);
  const [fuenteError,        setFuenteError]        = useState('');

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

  const { data: usuarios = [] } = useQuery({
    queryKey: ['admin-usuarios', cliente.id],
    queryFn:  async () => {
      const res = await fetch(`/api/admin/clientes/${cliente.id}/usuarios`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar usuarios');
      return res.json();
    },
  });

  const { data: marcas = [] } = useQuery({
    queryKey: ['marcas'],
    queryFn:  async () => {
      const res = await fetch('/api/marcas', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar marcas');
      return res.json();
    },
  });

  const estadoOpts = catalogos?.estados ?? [];

  // ─── Ticket status change ─────────────────────────────────────────────────

  const handleTicketEstado = async (ticketId, idEstadoSolicitud) => {
    setSavingTicket(ticketId);
    try {
      await fetch(`/api/admin/tickets/${ticketId}`, {
        method:      'PATCH',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ idEstadoSolicitud: Number(idEstadoSolicitud) }),
      });
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
      await fetch(`/api/admin/cotizaciones/${cotId}`, {
        method:      'PATCH',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ estado: editingCot.estado, notas: editingCot.notas }),
      });
      await queryClient.invalidateQueries(['admin-cliente-detail', cliente.id]);
      setEditingCot(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCot(null);
    }
  };

  // ─── Usuario CRUD ─────────────────────────────────────────────────────────

  const openCreateUser = () => {
    setUserForm({ nombre: '', correo: '', telefono: '', password: '' });
    setUserError('');
    setSelUser(null);
    setUserDialog('create');
  };

  const openEditUser = (u) => {
    setSelUser(u);
    setUserForm({ nombre: u.nombre, correo: u.correo, telefono: u.telefono ?? '', password: '' });
    setUserError('');
    setUserDialog('edit');
  };

  const closeUserDialog = () => {
    setUserDialog(null);
    setSelUser(null);
    setUserError('');
  };

  const handleUserSave = async () => {
    if (!userForm.nombre.trim() || !userForm.correo.trim()) {
      setUserError('Nombre y correo son obligatorios');
      return;
    }
    if (userDialog === 'create' && userForm.password.length < 6) {
      setUserError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setUserSaving(true);
    setUserError('');
    try {
      let res;
      if (userDialog === 'create') {
        res = await fetch('/api/admin/usuarios', {
          method:      'POST',
          credentials: 'include',
          headers:     { 'Content-Type': 'application/json' },
          body:        JSON.stringify({
            idCliente: cliente.id,
            nombre:    userForm.nombre.trim(),
            correo:    userForm.correo.trim(),
            telefono:  userForm.telefono.trim(),
            password:  userForm.password,
          }),
        });
      } else {
        const body = {
          nombre:   userForm.nombre.trim(),
          correo:   userForm.correo.trim(),
          telefono: userForm.telefono.trim(),
        };
        if (userForm.password) body.password = userForm.password;
        res = await fetch(`/api/admin/usuarios/${selUser.id}`, {
          method:      'PATCH',
          credentials: 'include',
          headers:     { 'Content-Type': 'application/json' },
          body:        JSON.stringify(body),
        });
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Error al guardar');
      }
      await queryClient.invalidateQueries(['admin-usuarios', cliente.id]);
      closeUserDialog();
    } catch (err) {
      setUserError(err.message);
    } finally {
      setUserSaving(false);
    }
  };

  const handleUserToggle = async (u) => {
    const url    = u.activo ? `/api/admin/usuarios/${u.id}` : `/api/admin/usuarios/${u.id}/reactivar`;
    const method = u.activo ? 'DELETE' : 'PUT';
    try {
      await fetch(url, { method, credentials: 'include' });
      await queryClient.invalidateQueries(['admin-usuarios', cliente.id]);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Robot CRUD ───────────────────────────────────────────────────────────

  const openCreateRobot = () => {
    setRobotForm({ idMarca: '', idEstado: '', modelo: '', noSerie: '', celda: '', fechaInstalacion: '', fechaProxMant: '', horasOperacion: '0' });
    setRobotError('');
    setSelRobot(null);
    setRobotDialog('create');
  };

  const openEditRobot = (r) => {
    setSelRobot(r);
    setRobotForm({
      idMarca:          String(marcas.find(m => m.marca === r.marca)?.idMarca ?? ''),
      idEstado:         String(catalogos?.estadosRobot?.find(e => e.estado === r.estado)?.idEstado ?? ''),
      modelo:           r.modelo,
      noSerie:          r.noSerie,
      celda:            r.celda ?? '',
      fechaInstalacion: r.fechaInstalacion ?? '',
      fechaProxMant:    r.fechaProxMant ?? '',
      horasOperacion:   String(r.horasOperacion ?? 0),
    });
    setRobotError('');
    setRobotDialog('edit');
  };

  const closeRobotDialog = () => { setRobotDialog(null); setSelRobot(null); setRobotError(''); };

  const handleRobotSave = async () => {
    if (!robotForm.modelo.trim() || !robotForm.noSerie.trim() || !robotForm.idMarca || !robotForm.idEstado) {
      setRobotError('Modelo, No. Serie, Marca y Estado son obligatorios');
      return;
    }
    setRobotSaving(true);
    setRobotError('');
    try {
      const body = {
        idMarca:          Number(robotForm.idMarca),
        idEstado:         Number(robotForm.idEstado),
        modelo:           robotForm.modelo.trim(),
        noSerie:          robotForm.noSerie.trim(),
        celda:            robotForm.celda.trim() || null,
        fechaInstalacion: robotForm.fechaInstalacion || null,
        fechaProxMant:    robotForm.fechaProxMant    || null,
        horasOperacion:   Number(robotForm.horasOperacion) || 0,
      };
      let res;
      if (robotDialog === 'create') {
        res = await fetch('/api/admin/robots', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, idCliente: cliente.id }),
        });
      } else {
        res = await fetch(`/api/admin/robots/${selRobot.id}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      const isCreate = robotDialog === 'create';
      const capturedModelo  = robotForm.modelo.trim();
      const capturedNoSerie = robotForm.noSerie.trim();
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Error'); }
      const responseData = await res.json().catch(() => ({}));
      await queryClient.invalidateQueries(['admin-cliente-detail', cliente.id]);
      closeRobotDialog();
      if (isCreate && responseData.id) {
        setFuentePrompt({ id: responseData.id, modelo: capturedModelo, noSerie: capturedNoSerie });
      }
    } catch (err) {
      setRobotError(err.message);
    } finally {
      setRobotSaving(false);
    }
  };

  // ─── Fuente de Poder CRUD ─────────────────────────────────────────────────

  const openFuenteCreate = (robotId) => {
    setFuenteTargetRobotId(robotId);
    setFuenteEditId(null);
    setFuenteForm({ idMarca: '', modelo: '', noSerie: '' });
    setFuenteError('');
    setFuenteDialog('create');
    setFuentePrompt(null);
  };

  const openFuenteEdit = (robot) => {
    setFuenteTargetRobotId(robot.id);
    setFuenteEditId(robot.fuente.id);
    setFuenteForm({
      idMarca: String(marcas.find(m => m.marca === robot.fuente.marca)?.idMarca ?? ''),
      modelo:  robot.fuente.modelo,
      noSerie: robot.fuente.noSerie,
    });
    setFuenteError('');
    setFuenteDialog('edit');
  };

  const closeFuenteDialog = () => { setFuenteDialog(null); setFuenteError(''); };

  const handleFuenteSave = async () => {
    if (!fuenteForm.idMarca || !fuenteForm.modelo.trim() || !fuenteForm.noSerie.trim()) {
      setFuenteError('Marca, modelo y número de serie son obligatorios');
      return;
    }
    setFuenteSaving(true);
    setFuenteError('');
    try {
      let res;
      if (fuenteDialog === 'create') {
        res = await fetch('/api/admin/fuentes', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idRobot: fuenteTargetRobotId,
            idMarca: Number(fuenteForm.idMarca),
            modelo:  fuenteForm.modelo.trim(),
            noSerie: fuenteForm.noSerie.trim(),
          }),
        });
      } else {
        res = await fetch(`/api/admin/fuentes/${fuenteEditId}`, {
          method: 'PATCH', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idMarca: Number(fuenteForm.idMarca),
            modelo:  fuenteForm.modelo.trim(),
            noSerie: fuenteForm.noSerie.trim(),
          }),
        });
      }
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Error'); }
      await queryClient.invalidateQueries(['admin-cliente-detail', cliente.id]);
      closeFuenteDialog();
    } catch (err) {
      setFuenteError(err.message);
    } finally {
      setFuenteSaving(false);
    }
  };

  const handleRobotDelete = async () => {
    setRobotSaving(true);
    setRobotError('');
    try {
      const res = await fetch(`/api/admin/robots/${selRobot.id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Error'); }
      await queryClient.invalidateQueries(['admin-cliente-detail', cliente.id]);
      closeRobotDialog();
    } catch (err) {
      setRobotError(err.message);
    } finally {
      setRobotSaving(false);
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
            <Tabs defaultValue="usuarios" className="space-y-4">
              <TabsList className="bg-slate-100 p-1 flex-wrap h-auto gap-1">
                <TabsTrigger value="usuarios" className="flex items-center gap-1.5">
                  Usuarios
                  <span className="bg-slate-200 text-slate-700 text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {usuarios.length}
                  </span>
                </TabsTrigger>
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

              {/* ─── Usuarios tab ────────────────────────────────────────── */}
              <TabsContent value="usuarios">
                <div className="flex justify-end mb-3">
                  <Button onClick={openCreateUser} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Nuevo Usuario
                  </Button>
                </div>
                {usuarios.length === 0 ? (
                  <p className="text-slate-500 py-6 text-center">No hay usuarios registrados</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Correo</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead className="text-center">Portal</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usuarios.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.nombre}</TableCell>
                            <TableCell className="text-sm text-slate-600">{u.correo}</TableCell>
                            <TableCell className="text-sm">{u.telefono || '—'}</TableCell>
                            <TableCell className="text-center">
                              {u.portalActivo
                                ? <Badge className="bg-green-100 text-green-800 border border-green-200">Activo</Badge>
                                : <Badge className="bg-slate-100 text-slate-600 border border-slate-200">Inactivo</Badge>
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Editar"
                                  onClick={() => openEditUser(u)}
                                  className="text-slate-600 hover:text-amber-600"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                {u.activo ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Desactivar acceso"
                                    onClick={() => handleUserToggle(u)}
                                    className="text-slate-600 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Reactivar acceso"
                                    onClick={() => handleUserToggle(u)}
                                    className="text-slate-600 hover:text-green-600"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* ─── Robots tab ─────────────────────────────────────────── */}
              <TabsContent value="robots">
                <div className="flex justify-end mb-3">
                  <Button onClick={openCreateRobot} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Nuevo Robot
                  </Button>
                </div>
                {robots.length === 0 ? (
                  <p className="text-slate-500 py-6 text-center">No hay robots registrados</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Modelo</TableHead>
                          <TableHead>No. Serie Robot</TableHead>
                          <TableHead>Marca</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fuente de Poder</TableHead>
                          <TableHead>No. Serie FdP</TableHead>
                          <TableHead>Celda</TableHead>
                          <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {robots.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.modelo}</TableCell>
                            <TableCell className="font-mono text-sm">{r.noSerie}</TableCell>
                            <TableCell>{r.marca}</TableCell>
                            <TableCell><EstadoRobotBadge estado={r.estado} /></TableCell>
                            <TableCell className="text-sm">{r.fuente ? `${r.fuente.marca} ${r.fuente.modelo}` : <span className="text-slate-400 italic text-xs">Sin asignar</span>}</TableCell>
                            <TableCell className="font-mono text-sm">{r.fuente ? r.fuente.noSerie : '—'}</TableCell>
                            <TableCell>{r.celda || '—'}</TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" title="Editar robot" onClick={() => openEditRobot(r)} className="text-slate-600 hover:text-amber-600">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost" size="sm"
                                  title={r.fuente ? 'Editar Fuente de Poder' : 'Agregar Fuente de Poder'}
                                  onClick={() => r.fuente ? openFuenteEdit(r) : openFuenteCreate(r.id)}
                                  className={r.fuente ? 'text-blue-500 hover:text-blue-700' : 'text-slate-400 hover:text-blue-600'}
                                >
                                  ⚡
                                </Button>
                                <Button variant="ghost" size="sm" title="Eliminar" onClick={() => { setSelRobot(r); setRobotError(''); setRobotDialog('delete'); }} className="text-slate-600 hover:text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
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
                          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-4 py-3 bg-white">
                            <button
                              className="text-slate-400 hover:text-slate-700"
                              onClick={() => setExpandedCot(isExpanded ? null : c.id)}
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <div>
                              <span className="font-mono text-xs text-slate-500">COT-{String(c.id).padStart(5, '0')}</span>
                              <span className="text-xs text-slate-500 ml-2">{c.solicitante}</span>
                              <span className="text-xs text-slate-400 ml-2">{c.fecha}</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-800">
                              ${c.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                            <EstadoCotizacionBadge estado={c.estado} />
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

      {/* ─── Create / Edit usuario dialog ──────────────────────────────────── */}
      {userDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-semibold text-slate-900">
              {userDialog === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="u-nombre">Nombre <span className="text-red-500">*</span></Label>
                <Input
                  id="u-nombre"
                  value={userForm.nombre}
                  onChange={(e) => setUserForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre completo"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="u-correo">Correo <span className="text-red-500">*</span></Label>
                <Input
                  id="u-correo"
                  type="email"
                  value={userForm.correo}
                  onChange={(e) => setUserForm((f) => ({ ...f, correo: e.target.value }))}
                  placeholder="correo@empresa.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="u-tel">Teléfono</Label>
                <Input
                  id="u-tel"
                  value={userForm.telefono}
                  onChange={(e) => setUserForm((f) => ({ ...f, telefono: e.target.value }))}
                  placeholder="(opcional)"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="u-pass">
                  {userDialog === 'create' ? <>Contraseña <span className="text-red-500">*</span></> : 'Nueva Contraseña (dejar vacío para no cambiar)'}
                </Label>
                <Input
                  id="u-pass"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={userDialog === 'create' ? 'Mínimo 6 caracteres' : 'Sin cambios'}
                  className="mt-1"
                />
              </div>
            </div>

            {userError && <p className="text-sm text-red-600">{userError}</p>}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeUserDialog} disabled={userSaving}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleUserSave}
                disabled={userSaving}
              >
                {userSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create / Edit robot dialog ─────────────────────────────────────── */}
      {(robotDialog === 'create' || robotDialog === 'edit') && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 my-8">
            <h3 className="text-lg font-semibold text-slate-900">
              {robotDialog === 'create' ? 'Nuevo Robot' : 'Editar Robot'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Modelo <span className="text-red-500">*</span></Label>
                <Input value={robotForm.modelo} onChange={(e) => setRobotForm(f => ({ ...f, modelo: e.target.value }))} placeholder="Ej. IRB 2600" className="mt-1" />
              </div>
              <div>
                <Label>No. Serie <span className="text-red-500">*</span></Label>
                <Input value={robotForm.noSerie} onChange={(e) => setRobotForm(f => ({ ...f, noSerie: e.target.value }))} placeholder="Número de serie" className="mt-1" />
              </div>
              <div>
                <Label>Marca <span className="text-red-500">*</span></Label>
                <Select value={robotForm.idMarca} onValueChange={(v) => setRobotForm(f => ({ ...f, idMarca: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar marca" /></SelectTrigger>
                  <SelectContent>
                    {marcas.map(m => <SelectItem key={m.idMarca} value={String(m.idMarca)}>{m.marca}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado <span className="text-red-500">*</span></Label>
                <Select value={robotForm.idEstado} onValueChange={(v) => setRobotForm(f => ({ ...f, idEstado: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
                  <SelectContent>
                    {(catalogos?.estadosRobot ?? []).map(e => <SelectItem key={e.idEstado} value={String(e.idEstado)}>{e.estado}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Celda</Label>
                <Input value={robotForm.celda} onChange={(e) => setRobotForm(f => ({ ...f, celda: e.target.value }))} placeholder="Celda (opcional)" className="mt-1" />
              </div>
              <div>
                <Label>Horas de Operación</Label>
                <Input type="number" min={0} value={robotForm.horasOperacion} onChange={(e) => setRobotForm(f => ({ ...f, horasOperacion: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Fecha Instalación</Label>
                <Input type="date" value={robotForm.fechaInstalacion} onChange={(e) => setRobotForm(f => ({ ...f, fechaInstalacion: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Próximo Mantenimiento</Label>
                <Input type="date" value={robotForm.fechaProxMant} onChange={(e) => setRobotForm(f => ({ ...f, fechaProxMant: e.target.value }))} className="mt-1" />
              </div>
            </div>

            {robotError && <p className="text-sm text-red-600">{robotError}</p>}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeRobotDialog} disabled={robotSaving}>Cancelar</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleRobotSave} disabled={robotSaving}>
                {robotSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete robot dialog ─────────────────────────────────────────────── */}
      {robotDialog === 'delete' && selRobot && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Eliminar Robot</h3>
            <p className="text-slate-600 text-sm">
              ¿Deseas eliminar <strong>{selRobot.modelo} — {selRobot.noSerie}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Si el robot tiene tickets o mantenimientos asociados, no se podrá eliminar. Cambia su estado a Inactivo en su lugar.
            </p>
            {robotError && <p className="text-sm text-red-600">{robotError}</p>}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeRobotDialog} disabled={robotSaving}>Cancelar</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleRobotDelete} disabled={robotSaving}>
                {robotSaving ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Fuente de Poder prompt (after robot creation) ───────────────────── */}
      {fuentePrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4 text-center">
            <div className="text-4xl">⚡</div>
            <h3 className="text-lg font-semibold text-slate-900">¿Agregar Fuente de Poder?</h3>
            <p className="text-sm text-slate-600">
              El robot <strong>{fuentePrompt.modelo} — {fuentePrompt.noSerie}</strong> fue creado exitosamente.
              ¿Deseas asignarle una Fuente de Poder ahora?
            </p>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setFuentePrompt(null)}>
                Omitir
              </Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => openFuenteCreate(fuentePrompt.id)}>
                Agregar Fuente
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Fuente de Poder create / edit dialog ────────────────────────────── */}
      {fuenteDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {fuenteDialog === 'create' ? 'Agregar Fuente de Poder' : 'Editar Fuente de Poder'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Marca <span className="text-red-500">*</span></Label>
                <Select value={fuenteForm.idMarca} onValueChange={(v) => setFuenteForm(f => ({ ...f, idMarca: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar marca" /></SelectTrigger>
                  <SelectContent>
                    {marcas.map(m => <SelectItem key={m.idMarca} value={String(m.idMarca)}>{m.marca}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo <span className="text-red-500">*</span></Label>
                <Input
                  value={fuenteForm.modelo}
                  onChange={(e) => setFuenteForm(f => ({ ...f, modelo: e.target.value }))}
                  placeholder="Ej. AW11/DSQC662"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>No. Serie <span className="text-red-500">*</span></Label>
                <Input
                  value={fuenteForm.noSerie}
                  onChange={(e) => setFuenteForm(f => ({ ...f, noSerie: e.target.value }))}
                  placeholder="Número de serie"
                  className="mt-1"
                />
              </div>
            </div>

            {fuenteError && <p className="text-sm text-red-600">{fuenteError}</p>}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeFuenteDialog} disabled={fuenteSaving}>Cancelar</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleFuenteSave} disabled={fuenteSaving}>
                {fuenteSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
