import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Wrench, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PerfilFlotillaTab() {
  const { data: robots = [], isLoading } = useQuery({
    queryKey: ['robots'],
    queryFn: () => base44.entities.Robot.list('-created_date')
  });

  const estadoColors = {
    operativo: 'bg-green-100 text-green-800 border-green-200',
    mantenimiento: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    falla: 'bg-red-100 text-red-800 border-red-200',
    inactivo: 'bg-slate-100 text-slate-800 border-slate-200'
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
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {robots.filter(r => r.estado === 'operativo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">En Mantenimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {robots.filter(r => r.estado === 'mantenimiento').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Con Falla</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {robots.filter(r => r.estado === 'falla').length}
            </div>
          </CardContent>
        </Card>
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
                  <TableHead>Estado</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Número de Serie</TableHead>
                  <TableHead>Controlador</TableHead>
                  <TableHead>Fuente de Poder</TableHead>
                  <TableHead>Instalación</TableHead>
                  <TableHead>Último Mtto</TableHead>
                  <TableHead>Próximo Mtto</TableHead>
                  <TableHead>Horas Op.</TableHead>
                  <TableHead>Reporte</TableHead>
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
                    <TableRow key={robot.id}>
                      <TableCell>
                        <Badge variant="outline" className={`${estadoColors[robot.estado]} border`}>
                          {robot.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{robot.marca}</TableCell>
                      <TableCell>{robot.modelo}</TableCell>
                      <TableCell className="font-mono text-sm">{robot.numero_serie}</TableCell>
                      <TableCell className="text-sm">{robot.controlador || '-'}</TableCell>
                      <TableCell className="text-sm">{robot.fuente_poder || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {robot.fecha_instalacion ? format(new Date(robot.fecha_instalacion), 'dd/MMM/yyyy', { locale: es }) : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {robot.ultimo_mantenimiento ? format(new Date(robot.ultimo_mantenimiento), 'dd/MMM/yyyy', { locale: es }) : '-'}
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
                        {robot.horas_operacion ? robot.horas_operacion.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        {robot.reporte_preventivo_url ? (
                          <a
                            href={robot.reporte_preventivo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
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
    </div>
  );
}