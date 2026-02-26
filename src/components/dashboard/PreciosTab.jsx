import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DollarSign, Search } from 'lucide-react';

export default function PreciosTab() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: refacciones = [], isLoading } = useQuery({
    queryKey: ['refacciones'],
    queryFn: () => base44.entities.Refaccion.list('nombre')
  });

  const filteredRefacciones = refacciones.filter(r =>
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.marca_compatible && r.marca_compatible.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Cargando precios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nombre, código o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Precios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Lista de Precios de Refacciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Marca Compatible</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-center">Disponibilidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefacciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      {searchTerm ? 'No se encontraron resultados' : 'No hay refacciones registradas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRefacciones.map((refaccion) => (
                    <TableRow key={refaccion.id}>
                      <TableCell className="font-mono text-sm">{refaccion.codigo}</TableCell>
                      <TableCell className="font-medium">{refaccion.nombre}</TableCell>
                      <TableCell className="text-sm capitalize">
                        {refaccion.categoria?.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-sm">{refaccion.marca_compatible || 'Universal'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        ${refaccion.precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {refaccion.moneda}
                      </TableCell>
                      <TableCell className="text-center">
                        {refaccion.stock_disponible > 0 ? (
                          <span className="text-green-600 font-medium">En Stock</span>
                        ) : (
                          <span className="text-red-600 font-medium">Bajo Pedido</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-900">
          <strong>Nota:</strong> Los precios mostrados son para referencia. Los precios finales pueden variar según disponibilidad y condiciones de contrato.
        </p>
      </div>
    </div>
  );
}