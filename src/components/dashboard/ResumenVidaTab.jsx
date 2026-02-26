import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity, Calendar, Clock, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ResumenVidaTab() {
  const { data: robots = [], isLoading } = useQuery({
    queryKey: ['robots'],
    queryFn: () => base44.entities.Robot.list('-horas_operacion'),
    select: (data) => Array.isArray(data) ? data : []
  });

  const calcularEdadRobot = (fechaInstalacion) => {
    if (!fechaInstalacion) return null;
    const dias = differenceInDays(new Date(), new Date(fechaInstalacion));
    const años = Math.floor(dias / 365);
    const meses = Math.floor((dias % 365) / 30);
    return { años, meses, dias };
  };

  const calcularSaludGeneral = (robot) => {
    let score = 100;
    
    // Penalizar por falta de mantenimiento reciente
    if (!robot.ultimo_mantenimiento) {
      score -= 20;
    } else {
      const diasSinMtto = differenceInDays(new Date(), new Date(robot.ultimo_mantenimiento));
      if (diasSinMtto > 180) score -= 15;
      else if (diasSinMtto > 90) score -= 10;
    }
    
    // Penalizar si el próximo mantenimiento está vencido
    if (robot.proximo_mantenimiento && new Date(robot.proximo_mantenimiento) < new Date()) {
      score -= 25;
    }
    
    // Penalizar por estado
    if (robot.estado === 'falla') score -= 30;
    else if (robot.estado === 'mantenimiento') score -= 15;
    else if (robot.estado === 'inactivo') score -= 10;
    
    return Math.max(0, score);
  };

  const getSaludColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Cargando información...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {robots.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              No hay robots registrados para mostrar información de vida útil
            </CardContent>
          </Card>
        ) : (
          robots.map((robot) => {
            const edad = calcularEdadRobot(robot.fecha_instalacion);
            const saludScore = calcularSaludGeneral(robot);
            
            return (
              <Card key={robot.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>{robot.marca} {robot.modelo}</span>
                      </CardTitle>
                      <p className="text-sm text-slate-600 mt-1">S/N: {robot.numero_serie}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getSaludColor(saludScore)}`}>
                        {saludScore}%
                      </div>
                      <p className="text-xs text-slate-500">Salud General</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Barra de Salud */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Estado de Salud</span>
                      <span className={`font-semibold ${getSaludColor(saludScore)}`}>
                        {saludScore >= 80 ? 'Excelente' : saludScore >= 60 ? 'Bueno' : saludScore >= 40 ? 'Regular' : 'Requiere Atención'}
                      </span>
                    </div>
                    <Progress value={saludScore} className="h-3" />
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-slate-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium">Edad del Robot</span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        {edad ? `${edad.años}a ${edad.meses}m` : 'N/D'}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-slate-600 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium">Horas de Operación</span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        {robot.horas_operacion ? robot.horas_operacion.toLocaleString() : 'N/D'}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-slate-600 mb-2">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-medium">Último Mtto</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {robot.ultimo_mantenimiento ? 
                          format(new Date(robot.ultimo_mantenimiento), 'dd/MMM/yy', { locale: es }) : 
                          'Ninguno'}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-slate-600 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-medium">Próximo Mtto</span>
                      </div>
                      <div className={`text-sm font-bold ${
                        robot.proximo_mantenimiento && new Date(robot.proximo_mantenimiento) < new Date() 
                          ? 'text-red-600' 
                          : 'text-slate-900'
                      }`}>
                        {robot.proximo_mantenimiento ? 
                          format(new Date(robot.proximo_mantenimiento), 'dd/MMM/yy', { locale: es }) : 
                          'No agendado'}
                      </div>
                    </div>
                  </div>

                  {/* Alertas */}
                  {(saludScore < 60 || (robot.proximo_mantenimiento && new Date(robot.proximo_mantenimiento) < new Date())) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-900 font-medium">⚠️ Recomendaciones:</p>
                      <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                        {saludScore < 60 && <li>• El robot requiere atención. Considere programar un diagnóstico.</li>}
                        {robot.proximo_mantenimiento && new Date(robot.proximo_mantenimiento) < new Date() && (
                          <li>• El mantenimiento programado está vencido. Agende servicio lo antes posible.</li>
                        )}
                        {!robot.ultimo_mantenimiento && <li>• No hay registro de mantenimiento. Se recomienda evaluación inicial.</li>}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}