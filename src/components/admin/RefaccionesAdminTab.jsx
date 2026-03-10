import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, AlertTriangle, ChevronLeft, ChevronRight, Search, Pencil } from 'lucide-react';

const PAGE_SIZE = 20;

export default function RefaccionesAdminTab() {
  const queryClient = useQueryClient();

  const [page,        setPage]       = useState(1);
  const [search,      setSearch]     = useState('');
  const [marcaId,     setMarcaId]    = useState('');
  const [categoriaId, setCategoriaId] = useState('');

  const [editItem,  setEditItem]  = useState(null); // refaccion being edited
  const [editForm,  setEditForm]  = useState({ descripcion: '', noParte: '', precioVenta: '', stockActual: '' });
  const [saving,    setSaving]    = useState(false);
  const [editError, setEditError] = useState('');

  const skip = (page - 1) * PAGE_SIZE;

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data: marcas = [] } = useQuery({
    queryKey: ['marcas'],
    queryFn:  async () => {
      const res = await fetch('/api/marcas', { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      return res.json();
    },
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn:  async () => {
      const res = await fetch('/api/categorias', { credentials: 'include' });
      if (!res.ok) throw new Error('Error');
      return res.json();
    },
  });

  const { data: response = { data: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['refacciones', search, marcaId, categoriaId, page],
    queryFn:  async () => {
      const params = new URLSearchParams({ skip: String(skip), take: String(PAGE_SIZE) });
      if (search.trim()) params.set('search', search.trim());
      if (marcaId)       params.set('marca', marcaId);
      if (categoriaId)   params.set('categoria', categoriaId);
      const res = await fetch(`/api/refacciones?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar refacciones');
      return res.json();
    },
    keepPreviousData: true,
  });

  const refacciones = Array.isArray(response?.data) ? response.data : [];
  const total       = response?.total ?? 0;
  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const refaccionesBajoStock = refacciones.filter((r) => r.stock_disponible < 5);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };
  const handleMarcaChange  = (v)  => { setMarcaId(v === 'all' ? '' : v); setPage(1); };
  const handleCatChange    = (v)  => { setCategoriaId(v === 'all' ? '' : v); setPage(1); };

  const openEdit = (item) => {
    setEditItem(item);
    setEditForm({
      descripcion: item.nombre,
      noParte:     item.codigo,
      precioVenta: String(item.precio_venta),
      stockActual: String(item.stock_disponible ?? ''),
    });
    setEditError('');
  };

  const closeEdit = () => {
    setEditItem(null);
    setEditError('');
  };

  const handleSave = async () => {
    if (!editItem) return;
    const precioNum = parseFloat(editForm.precioVenta);
    if (isNaN(precioNum) || precioNum < 0) {
      setEditError('El precio debe ser un número válido mayor o igual a 0');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      const body = {};
      if (editForm.descripcion.trim()) body.descripcion = editForm.descripcion.trim();
      if (editForm.noParte.trim())     body.noParte     = editForm.noParte.trim();
      body.precioVenta = precioNum;
      const stockNum = Number(editForm.stockActual);
      if (editForm.stockActual !== '' && !isNaN(stockNum) && stockNum >= 0) {
        body.stockActual = stockNum;
      }

      const res = await fetch(`/api/admin/refacciones/${editItem.id}`, {
        method:      'PATCH',
        credentials: 'include',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Error al guardar');
      }
      // Invalidate all refacciones queries (any search/page combo)
      await queryClient.invalidateQueries({ queryKey: ['refacciones'] });
      closeEdit();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (isLoading && refacciones.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Cargando refacciones...</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Stock bajo hint */}
      {refaccionesBajoStock.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-orange-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{refaccionesBajoStock.length} con stock bajo en esta página</span>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar por código o descripción..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9"
              />
            </div>
            <Select value={marcaId || 'all'} onValueChange={handleMarcaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las marcas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las marcas</SelectItem>
                {marcas.map((m) => (
                  <SelectItem key={m.idMarca} value={String(m.idMarca)}>{m.marca}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoriaId || 'all'} onValueChange={handleCatChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.idCategoria} value={String(c.idCategoria)}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <span>Catálogo de Refacciones</span>
            </div>
            <span className="text-sm font-normal text-slate-500">{total} registros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-right">Precio Ref.</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Editar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refacciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No se encontraron resultados
                    </TableCell>
                  </TableRow>
                ) : (
                  refacciones.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-sm">{r.codigo}</TableCell>
                      <TableCell className="font-medium max-w-xs truncate">{r.nombre}</TableCell>
                      <TableCell className="text-sm">{r.categoria}</TableCell>
                      <TableCell className="text-sm">{r.marca_compatible}</TableCell>
                      <TableCell className="text-right font-semibold text-sm">
                        ${r.precio_venta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${
                          r.stock_disponible === 0 ? 'text-red-600' :
                          r.stock_disponible < 5  ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {r.stock_disponible}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-600 border-amber-200 hover:bg-amber-50"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">Página {page} de {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-semibold text-slate-900">Editar Refacción</h3>
            <p className="text-xs text-slate-500 font-mono">{editItem.codigo}</p>

            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-noParte">No. de Parte</Label>
                <Input
                  id="edit-noParte"
                  value={editForm.noParte}
                  onChange={(e) => setEditForm((f) => ({ ...f, noParte: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-descripcion">Descripción</Label>
                <textarea
                  id="edit-descripcion"
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm((f) => ({ ...f, descripcion: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="edit-precio">Precio de Venta (ref.)</Label>
                <Input
                  id="edit-precio"
                  type="number"
                  min={0}
                  step="0.01"
                  value={editForm.precioVenta}
                  onChange={(e) => setEditForm((f) => ({ ...f, precioVenta: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-stock">Stock Actual</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  min={0}
                  value={editForm.stockActual}
                  onChange={(e) => setEditForm((f) => ({ ...f, stockActual: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {editError && (
              <p className="text-sm text-red-600">{editError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeEdit} disabled={saving}>
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
    </div>
  );
}
