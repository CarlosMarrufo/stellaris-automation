import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShoppingCart, Trash2, Send, PackageOpen } from 'lucide-react';

export default function CotizacionTab({ cart, onRemove, onUpdateQty, onClear, user }) {
  const [sent, setSent] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.precio_venta * item.cantidad, 0);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cotizaciones', {
        method:  'POST',
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Error al enviar cotización');
      }
      return res.json();
    },
    onSuccess: () => {
      setSent(true);
      onClear();
    },
    onError: (err) => {
      alert(`Error: ${err.message}`);
    },
  });

  if (sent) {
    return (
      <Card className="max-w-lg mx-auto mt-8">
        <CardContent className="py-12 text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h3 className="text-xl font-semibold text-slate-900">Solicitud enviada</h3>
          <p className="text-slate-600 text-sm">
            Hemos recibido tu solicitud de cotización. Nuestro equipo se pondrá en contacto contigo a la brevedad.
          </p>
          <Button className="mt-2" onClick={() => setSent(false)}>
            Nueva cotización
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (cart.length === 0) {
    return (
      <Card className="max-w-lg mx-auto mt-8">
        <CardContent className="py-12 text-center space-y-3">
          <PackageOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-medium text-slate-700">Tu cotización está vacía</h3>
          <p className="text-slate-500 text-sm">
            Ve a la pestaña <strong>Refacciones</strong> y agrega las refacciones que necesitas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>Solicitud de Cotización</span>
            </div>
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={onClear}>
              Vaciar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-center w-28">Cantidad</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.codigo}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{item.nombre}</TableCell>
                    <TableCell className="text-right text-sm">
                      ${item.precio_venta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={(e) => onUpdateQty(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${(item.precio_venta * item.cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total */}
          <div className="flex justify-end mt-4 pt-4 border-t border-slate-200">
            <div className="text-right">
              <p className="text-sm text-slate-500">Total estimado</p>
              <p className="text-2xl font-bold text-slate-900">
                ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info del cliente */}
      {user && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-slate-600">
              La solicitud se enviará a nombre de <strong>{user.nombre}</strong> ({user.correo}).
            </p>
          </CardContent>
        </Card>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-900">
          <strong>Nota:</strong> Los precios son de referencia. La cotización formal y condiciones de venta se coordinarán con nuestro equipo comercial.
        </p>
      </div>

      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-base"
        disabled={submitMutation.isPending}
        onClick={() => submitMutation.mutate()}
      >
        {submitMutation.isPending ? (
          'Enviando solicitud...'
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Enviar Solicitud de Cotización
          </>
        )}
      </Button>
    </div>
  );
}
