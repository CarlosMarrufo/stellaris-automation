import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, AlertTriangle, ChevronLeft, ChevronRight, Search, ShoppingCart, X, Trash2, PackageOpen, Send } from 'lucide-react';

const PAGE_SIZE = 20;

export default function RefaccionesTab({ isAdmin = false, onAddToCart, cart = [], onRemove, onUpdateQty, onClear, user }) {
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [marcaId, setMarcaId]       = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [dialogItem, setDialogItem] = useState(null);
  const [dialogQty, setDialogQty]   = useState(1);
  const [cartOpen, setCartOpen]     = useState(false);
  const [cartSent, setCartSent]     = useState(false);

  const skip = (page - 1) * PAGE_SIZE;

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

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: cart.map((item) => ({
            idRefaccion: item.id,
            cantidad:    item.cantidad,
            precioRef:   item.precio_venta,
          })),
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Error'); }
      return res.json();
    },
    onSuccess: () => { setCartSent(true); onClear(); },
  });

  const refacciones = Array.isArray(response?.data) ? response.data : [];
  const total       = response?.total ?? 0;
  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const getStockStatus = (stock) => {
    if (stock < 5) return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Bajo Pedido' };
    return           { color: 'bg-green-100 text-green-800 border-green-200',         text: 'En Stock' };
  };

  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };
  const handleMarcaChange  = (v)  => { setMarcaId(v === 'all' ? '' : v); setPage(1); };
  const handleCatChange    = (v)  => { setCategoriaId(v === 'all' ? '' : v); setPage(1); };

  const openDialog  = (item) => { setDialogItem(item); setDialogQty(1); };
  const closeDialog = ()     => setDialogItem(null);

  const handleConfirm = () => {
    if (onAddToCart && dialogItem) onAddToCart(dialogItem, dialogQty);
    closeDialog();
  };

  const showWarning = dialogItem && (dialogItem.stock_disponible - dialogQty) < 5;

  const refaccionesBajoStock = isAdmin ? refacciones.filter((r) => r.stock_disponible < 5) : [];

  if (isLoading && refacciones.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Cargando refacciones...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Alerta stock bajo (solo admin) */}
        {isAdmin && refaccionesBajoStock.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-900 text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Refacciones con Stock Bajo ({refaccionesBajoStock.length} en esta página)</span>
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* Filtros */}
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

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Catálogo de Refacciones</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-normal text-slate-500">{total} registros</span>
                {!isAdmin && onAddToCart && (
                  <button
                    onClick={() => { setCartOpen(true); setCartSent(false); }}
                    className="relative flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Mi Cotización</span>
                    {cart.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center leading-none">
                        {cart.length}
                      </span>
                    )}
                  </button>
                )}
              </div>
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
                    {onAddToCart && <TableHead className="text-center">Cotizar</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refacciones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={onAddToCart ? 7 : 6} className="text-center py-8 text-slate-500">
                        No se encontraron resultados
                      </TableCell>
                    </TableRow>
                  ) : (
                    refacciones.map((r) => {
                      const status = getStockStatus(r.stock_disponible);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-sm">{r.codigo}</TableCell>
                          <TableCell className="font-medium max-w-xs truncate">{r.nombre}</TableCell>
                          <TableCell className="text-sm">{r.categoria}</TableCell>
                          <TableCell className="text-sm">{r.marca_compatible}</TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            ${r.precio_venta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-center">
                            {isAdmin ? (
                              <span className={`font-bold ${
                                r.stock_disponible === 0 ? 'text-red-600' :
                                r.stock_disponible < 5  ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {r.stock_disponible}
                              </span>
                            ) : (
                              <Badge variant="outline" className={`${status.color} border`}>
                                {status.text}
                              </Badge>
                            )}
                          </TableCell>
                          {onAddToCart && (
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => openDialog(r)}
                              >
                                <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                                Agregar
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">Página {page} de {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900">
            <strong>Nota:</strong> Los precios mostrados son de referencia. El precio final depende de las condiciones de su contrato con Stellaris.
          </p>
        </div>

        {/* Dialog agregar a cotización */}
        {dialogItem && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">Agregar a cotización</h3>
              <div>
                <p className="text-sm font-medium text-slate-700 line-clamp-2">{dialogItem.nombre}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{dialogItem.codigo}</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  ${dialogItem.precio_venta.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (ref.)
                </p>
              </div>
              <div>
                <Label className="text-sm">Cantidad</Label>
                <Input
                  type="number"
                  min={1}
                  value={dialogQty}
                  onChange={(e) => setDialogQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-1"
                />
              </div>
              {showWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  La disponibilidad del stock puede cambiar en el transcurso de la solicitud.
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <strong>Nota:</strong> Los precios son de referencia. La cotización formal y condiciones de venta se coordinarán con nuestro equipo comercial.
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={closeDialog}>Cancelar</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleConfirm}>Agregar</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Cart side panel ─── */}
      {cartOpen && !isAdmin && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" onClick={() => setCartOpen(false)} />
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200 h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-slate-900">Mi Cotización</h2>
                {cart.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-0.5">{cart.length} items</span>
                )}
              </div>
              <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {cartSent ? (
                <div className="text-center py-12 space-y-3">
                  <div className="text-5xl">✅</div>
                  <h3 className="font-semibold text-slate-900">Solicitud enviada</h3>
                  <p className="text-sm text-slate-500">Nuestro equipo se pondrá en contacto contigo a la brevedad.</p>
                  <Button onClick={() => { setCartSent(false); setCartOpen(false); }}>Cerrar</Button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <PackageOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-sm">Agrega refacciones desde el catálogo</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.nombre}</p>
                        <p className="text-xs text-slate-500 font-mono">{item.codigo}</p>
                        <p className="text-sm font-semibold text-slate-700 mt-1">
                          ${item.precio_venta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Input
                          type="number"
                          min={1}
                          value={item.cantidad}
                          onChange={(e) => onUpdateQty(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 text-center text-sm h-8"
                        />
                        <button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                    <span className="text-sm text-slate-600">Total estimado</span>
                    <span className="text-xl font-bold text-slate-900">
                      ${cart.reduce((s, i) => s + i.precio_venta * i.cantidad, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {user && (
                    <p className="text-xs text-slate-500">
                      Se enviará a nombre de <strong>{user.nombre}</strong>
                    </p>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <strong>Nota:</strong> Los precios son de referencia. La cotización formal y condiciones de venta se coordinarán con nuestro equipo comercial.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!cartSent && cart.length > 0 && (
              <div className="p-5 border-t border-slate-200 space-y-2">
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                >
                  {submitMutation.isPending ? 'Enviando...' : <><Send className="w-4 h-4 mr-2" /> Enviar Cotización</>}
                </Button>
                <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={onClear}>
                  Vaciar cotización
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
