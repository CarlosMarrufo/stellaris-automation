import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Users, Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';

import ClienteDetalleDialog from './ClienteDetalleDialog';

export default function ClientesTab() {
  const queryClient = useQueryClient();

  const [search,   setSearch]   = useState('');
  const [dialog,   setDialog]   = useState(null); // null | 'create' | 'edit' | 'delete' | 'detail'
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState({ nombre: '', rfc: '' });
  const [saving,   setSaving]   = useState(false);
  const [formError, setFormError] = useState('');

  // ─── Query ───────────────────────────────────────────────────────────────────

  const { data: clientes = [], isLoading, error } = useQuery({
    queryKey: ['admin-clientes'],
    queryFn:  async () => {
      const res = await fetch('/api/admin/clientes', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar clientes');
      return res.json();
    },
  });

  // ─── Filtered list ───────────────────────────────────────────────────────────

  const filtered = clientes.filter((c) => {
    const q = search.toLowerCase();
    return c.nombre.toLowerCase().includes(q) || (c.rfc ?? '').toLowerCase().includes(q);
  });

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm({ nombre: '', rfc: '' });
    setFormError('');
    setDialog('create');
  };

  const openEdit = (cliente) => {
    setSelected(cliente);
    setForm({ nombre: cliente.nombre, rfc: cliente.rfc ?? '' });
    setFormError('');
    setDialog('edit');
  };

  const openDelete = (cliente) => {
    setSelected(cliente);
    setDialog('delete');
  };

  const openDetail = (cliente) => {
    setSelected(cliente);
    setDialog('detail');
  };

  const closeDialog = () => {
    setDialog(null);
    setSelected(null);
    setFormError('');
  };

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.nombre.trim() || form.nombre.trim().length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const url    = dialog === 'edit' ? `/api/admin/clientes/${selected.id}` : '/api/admin/clientes';
      const method = dialog === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ nombre: form.nombre.trim(), rfc: form.rfc.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Error al guardar');
      }
      await queryClient.invalidateQueries(['admin-clientes']);
      closeDialog();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clientes/${selected.id}`, {
        method:      'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Error al desactivar');
      }
      await queryClient.invalidateQueries(['admin-clientes']);
      closeDialog();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
        <p className="text-slate-600">Cargando clientes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        Error: {error.message}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Clientes</span>
              <span className="text-sm font-normal text-slate-500">({clientes.length} total)</span>
            </CardTitle>
            <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Cliente
            </Button>
          </div>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre o RFC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {search && (
            <p className="text-sm text-slate-500 mb-3">{filtered.length} resultado(s)</p>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead className="text-center">Robots</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-600">{c.rfc || '—'}</TableCell>
                      <TableCell className="text-center">{c.robots}</TableCell>
                      <TableCell className="text-center">
                        {c.activo
                          ? <Badge className="bg-green-100 text-green-800 border border-green-200">Activo</Badge>
                          : <Badge className="bg-slate-100 text-slate-600 border border-slate-200">Inactivo</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Ver detalle"
                            onClick={() => openDetail(c)}
                            className="text-slate-600 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Editar"
                            onClick={() => openEdit(c)}
                            className="text-slate-600 hover:text-amber-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Desactivar"
                            onClick={() => openDelete(c)}
                            className="text-slate-600 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── Create / Edit dialog ─────────────────────────────────────────── */}
      {(dialog === 'create' || dialog === 'edit') && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-semibold text-slate-900">
              {dialog === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
            </h3>

            <div className="space-y-3">
              <div>
                <Label htmlFor="nombre-input">Nombre <span className="text-red-500">*</span></Label>
                <Input
                  id="nombre-input"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre del cliente"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="rfc-input">RFC</Label>
                <Input
                  id="rfc-input"
                  value={form.rfc}
                  onChange={(e) => setForm((f) => ({ ...f, rfc: e.target.value }))}
                  placeholder="RFC (opcional)"
                  className="mt-1"
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeDialog} disabled={saving}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete dialog ────────────────────────────────────────────────── */}
      {dialog === 'delete' && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-semibold text-slate-900">Desactivar cliente</h3>
            <p className="text-slate-600 text-sm">
              ¿Deseas desactivar a <strong>{selected.nombre}</strong>? Sus robots y tickets se conservarán.
            </p>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeDialog} disabled={saving}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? 'Desactivando...' : 'Desactivar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail dialog ────────────────────────────────────────────────── */}
      {dialog === 'detail' && selected && (
        <ClienteDetalleDialog cliente={selected} onClose={closeDialog} />
      )}
    </>
  );
}
