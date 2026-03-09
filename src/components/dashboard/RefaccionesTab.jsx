import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, AlertTriangle, ChevronLeft, ChevronRight, Search, ShoppingCart } from 'lucide-react';

const PAGE_SIZE = 20;

export default function RefaccionesTab({ isAdmin = false, onAddToCart }) {
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [marcaId, setMarcaId]       = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [dialogItem, setDialogItem] = useState(null);
  const [dialogQty, setDialogQty]   = useState(1);

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

  const refacciones = Array.isArray(response?.data) ? response.data : [];
  const total       = response?.total ?? 0;
  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const getStockStatus = (stock) => {
    if (stock === 0) return { color: 'bg-red-100 text-red-800 border-red-200',       text: 'Sin Stock' };
    if (stock < 5)   return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Bajo Pedido' };
    return             { color: 'bg-green-100 text-green-800 border-green-200',      text: 'En Stock' };
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
                  {isAdmin ? (
                    <>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-center">Disponibilidad</TableHead>
                      {onAddToCart && <TableHead className="text-center">Cotizar</TableHead>}
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {refacciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : onAddToCart ? 7 : 6} className="text-center py-8 text-slate-500">
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
                        {isAdmin ? (
                          <>
                            <TableCell className="text-center">
                              <span className={`font-bold ${
                                r.stock_disponible === 0 ? 'text-red-600' :
                                r.stock_disponible < 5  ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {r.stock_disponible}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={`${status.color} border`}>
                                {status.text}
                              </Badge>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={`${status.color} border`}>
                                {status.text}
                              </Badge>
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
                          </>
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
                ⚠️ La disponibilidad del stock puede cambiar en el transcurso de la solicitud.
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={closeDialog}>Cancelar</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleConfirm}>Agregar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
