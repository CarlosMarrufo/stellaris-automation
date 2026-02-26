import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle } from 'lucide-react';

export default function RefaccionesTab() {
  const { data: refacciones = [], isLoading } = useQuery({
    queryKey: ['refacciones'],
    queryFn: () => base44.entities.Refaccion.list('nombre')
  });

  const getStockStatus = (refaccion) => {
    if (refaccion.stock_disponible === 0) {
      return { color: 'bg-red-100 text-red-800 border-red-200', text: 'Sin Stock' };
    }
    if (refaccion.stock_disponible <= (refaccion.stock_minimo || 0)) {
      return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Stock Bajo' };
    }
    return { color: 'bg-green-100 text-green-800 border-green-200', text: 'Disponible' };
  };

  const refaccionesBajoStock = refacciones.filter(r => r.stock_disponible <= (r.stock_minimo || 0));

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Cargando refacciones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {refaccionesBajoStock.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-900">
              <AlertTriangle className="w-5 h-5" />
              <span>Refacciones con Stock Bajo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800">
              Hay {refaccionesBajoStock.length} refacciones por debajo del stock mínimo. Considere reabastecer.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Refacciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Inventario de Refacciones</span>
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
                  <TableHead>Stock Disponible</TableHead>
                  <TableHead>Ubicación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refacciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      No hay refacciones registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  refacciones.map((refaccion) => {
                    const status = getStockStatus(refaccion);
                    return (
                      <TableRow key={refaccion.id}>
                        <TableCell className="font-mono text-sm">{refaccion.codigo}</TableCell>
                        <TableCell className="font-medium">{refaccion.nombre}</TableCell>
                        <TableCell className="text-sm capitalize">
                          {refaccion.categoria?.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell className="text-sm">{refaccion.marca_compatible || 'Universal'}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${
                            refaccion.stock_disponible === 0 ? 'text-red-600' :
                            refaccion.stock_disponible <= (refaccion.stock_minimo || 0) ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {refaccion.stock_disponible}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-slate-600">
                          {refaccion.stock_minimo || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${status.color} border`}>
                            {status.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{refaccion.ubicacion || '-'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}