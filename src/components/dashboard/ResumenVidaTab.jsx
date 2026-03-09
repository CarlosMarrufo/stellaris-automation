import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Activity, Calendar, Clock, TrendingUp,
  ChevronDown, ChevronUp, Wrench,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEstadoColor(estado) {
  const lc = (estado ?? '').toLowerCase();
  if (lc === 'operativo')          return 'bg-green-100 text-green-800 border-green-200';
  if (lc.includes('mantenimient')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (lc.includes('atenci'))       return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (lc.includes('falla'))        return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-slate-100 text-slate-800 border-slate-200';
}

function calcularSaludGeneral(robot) {
  let score = 100;
  if (!robot.ultimo_mantenimiento) {
    score -= 20;
  } else {
    const diasSinMtto = differenceInDays(new Date(), new Date(robot.ultimo_mantenimiento));
    if (diasSinMtto > 180) score -= 15;
    else if (diasSinMtto > 90) score -= 10;
  }
  if (robot.proximo_mantenimiento && new Date(robot.proximo_mantenimiento) < new Date()) score -= 25;
  const lc = (robot.estado ?? '').toLowerCase();
  if (lc.includes('falla'))             score -= 30;
  else if (lc.includes('atenci'))       score -= 15;
  else if (lc.includes('mantenimient')) score -= 10;
  else if (lc.includes('sin'))          score -= 5;
  return Math.max(0, score);
}

function getSaludColor(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getSaludLabel(score) {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bueno';
  if (score >= 40) return 'Regular';
  return 'Requiere Atención';
}

function SaludBadge({ score }) {
  let cls   = 'bg-green-100 text-green-700';
  let label = 'Óptima';
  if (score < 40)       { cls = 'bg-red-100 text-red-700';    label = 'Crítica'; }
  else if (score < 60)  { cls = 'bg-orange-100 text-orange-700'; label = 'Baja'; }
  else if (score < 80)  { cls = 'bg-yellow-100 text-yellow-700'; label = 'Regular'; }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {score}% — {label}
    </span>
  );
}

function calcularEdadRobot(fechaInstalacion) {
  if (!fechaInstalacion) return null;
  const dias = differenceInDays(new Date(), new Date(fechaInstalacion));
  const años = Math.floor(dias / 365);
  const meses = Math.floor((dias % 365) / 30);
  return { años, meses, dias };
}

// ─── VidaRobotCard ───────────────────────────────────────────────────────────

function VidaRobotCard({ robot }) {
  const [expanded, setExpanded] = useState(false);
  const saludScore = calcularSaludGeneral(robot);
  const edad = calcularEdadRobot(robot.fecha_instalacion);
  const vencido = robot.proximo_mantenimiento && new Date(robot.proximo_mantenimiento) < new Date();

  const { data: mantenimientos = [], isLoading: loadingMant } = useQuery({
    queryKey: ['robot-mantenimientos', robot.id],
    queryFn: async () => {
      const res = await fetch(`/api/robots/${robot.id}/mantenimientos`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar historial');
      return res.json();
    },
    enabled: expanded,
  });

  // Analíticos
  const totalMant    = mantenimientos.length;
  const costos       = mantenimientos.filter((m) => m.costo !== null).map((m) => m.costo);
  const ultimoCosto  = costos[0] ?? null;
  const costoPromedio = costos.length ? costos.reduce((a, b) => a + b, 0) / costos.length : null;

  const porAnio = mantenimientos.reduce((acc, m) => {
    if (!m.fecha) return acc;
    const anio = m.fecha.slice(0, 4);
    acc[anio] = (acc[anio] ?? 0) + 1;
    return acc;
  }, {});
  const maxPorAnio = Math.max(...Object.values(porAnio), 1);

  return (
    <Card className={`overflow-hidden transition-shadow ${expanded ? 'shadow-md ring-1 ring-slate-200' : ''}`}>

      {/* ─── Fila colapsada (siempre visible) ─── */}
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Marca + Modelo */}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">{robot.marca} {robot.modelo}</p>
          {robot.celda && (
            <p className="text-xs text-slate-500 mt-0.5">Celda {robot.celda}</p>
          )}
        </div>

        {/* No. Serie */}
        <div className="hidden sm:block font-mono text-sm text-slate-500 flex-shrink-0 text-right">
          {robot.numero_serie_robot}
        </div>

        {/* Estado */}
        <div className="flex-shrink-0">
          <Badge variant="outline" className={`${getEstadoColor(robot.estado)} border text-xs capitalize`}>
            {robot.estado}
          </Badge>
        </div>

        {/* Salud */}
        <div className="flex-shrink-0 hidden md:block">
          <SaludBadge score={saludScore} />
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 text-slate-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* ─── Contenido expandido ─── */}
      {expanded && (
        <div className="border-t border-slate-100">

          {/* Salud general + barra */}
          <div className="px-5 py-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Estado de Salud</span>
              <span className={`text-sm font-semibold ${getSaludColor(saludScore)}`}>
                {getSaludLabel(saludScore)}
              </span>
            </div>
            <Progress value={saludScore} className="h-3" />
          </div>

          {/* Métricas de vida */}
          <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-slate-600 mb-1.5">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Edad del Robot</span>
              </div>
              <div className="text-lg font-bold text-slate-900">
                {edad ? `${edad.años}a ${edad.meses}m` : 'N/D'}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-slate-600 mb-1.5">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium">Horas de Operación</span>
              </div>
              <div className="text-lg font-bold text-slate-900">
                {robot.horas_operacion ? robot.horas_operacion.toLocaleString() : 'N/D'}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-slate-600 mb-1.5">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-medium">Último Mtto</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {robot.ultimo_mantenimiento
                  ? format(new Date(robot.ultimo_mantenimiento), 'dd/MMM/yy', { locale: es })
                  : 'Ninguno'}
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-slate-600 mb-1.5">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Próximo Mtto</span>
              </div>
              <div className={`text-sm font-bold ${vencido ? 'text-red-600' : 'text-slate-900'}`}>
                {robot.proximo_mantenimiento
                  ? format(new Date(robot.proximo_mantenimiento), 'dd/MMM/yy', { locale: es })
                  : 'No agendado'}
                {vencido && <span className="ml-1 text-xs font-normal">(vencido)</span>}
              </div>
            </div>
          </div>

          {/* Detalles técnicos */}
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">No. Serie Robot</p>
              <p className="font-mono font-medium text-slate-800">{robot.numero_serie_robot}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Fuente de Poder</p>
              <p className="font-medium text-slate-800">{robot.fuente_poder ?? '—'}</p>
              {robot.numero_serie_fuente && (
                <p className="text-xs font-mono text-slate-500">{robot.numero_serie_fuente}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Instalación</p>
              <p className="font-medium text-slate-800">
                {robot.fecha_instalacion
                  ? format(new Date(robot.fecha_instalacion), 'dd/MMM/yyyy', { locale: es })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Marca / Modelo</p>
              <p className="font-medium text-slate-800">{robot.marca} {robot.modelo}</p>
            </div>
            {robot.celda && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Celda</p>
                <p className="font-medium text-slate-800">{robot.celda}</p>
              </div>
            )}
          </div>

          {/* Alertas */}
          {(saludScore < 60 || vencido) && (
            <div className="px-5 py-3 border-t border-slate-100">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900 font-medium">Recomendaciones:</p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                  {saludScore < 60 && <li>- El robot requiere atención. Considere programar un diagnóstico.</li>}
                  {vencido && <li>- El mantenimiento programado está vencido. Agende servicio lo antes posible.</li>}
                  {!robot.ultimo_mantenimiento && <li>- No hay registro de mantenimiento. Se recomienda evaluación inicial.</li>}
                </ul>
              </div>
            </div>
          )}

          {/* ─── Historial de Mantenimientos ─── */}
          <div className="px-5 pb-5 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2 py-4">
              <Wrench className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-800 text-sm">Historial de Mantenimientos</h3>
            </div>

            {loadingMant ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : mantenimientos.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">
                Sin registros de mantenimiento en el sistema
              </p>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-slate-100 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-2xl font-bold text-slate-900">{totalMant}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Total</p>
                  </div>
                  <div className="bg-slate-100 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-slate-900">
                      {ultimoCosto !== null
                        ? `$${ultimoCosto.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`
                        : '—'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Último costo</p>
                  </div>
                  <div className="bg-slate-100 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-slate-900">
                      {costoPromedio !== null
                        ? `$${Math.round(costoPromedio).toLocaleString('es-MX')}`
                        : '—'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Costo promedio</p>
                  </div>
                </div>

                {/* Frecuencia por año */}
                {Object.keys(porAnio).length > 1 && (
                  <div className="mb-5">
                    <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Frecuencia por año
                    </p>
                    <div className="flex items-end gap-2 h-16 bg-slate-50 rounded-lg px-3 py-2">
                      {Object.entries(porAnio).sort().map(([anio, count]) => (
                        <div key={anio} className="flex flex-col items-center gap-1 flex-1">
                          <span className="text-[10px] text-slate-600 font-semibold">{count}</span>
                          <div
                            className="w-full bg-blue-300 hover:bg-blue-400 rounded-sm transition-colors"
                            style={{ height: `${Math.max(Math.round((count / maxPorAnio) * 32), 4)}px` }}
                            title={`${anio}: ${count} mantenimiento${count !== 1 ? 's' : ''}`}
                          />
                          <span className="text-[10px] text-slate-400">{anio}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {mantenimientos.map((m) => (
                    <div key={m.id} className="flex gap-3 text-sm py-1.5 border-b border-slate-100 last:border-0">
                      <div className="flex-shrink-0 w-20 text-xs text-slate-400 pt-0.5">
                        {m.fecha ? format(new Date(m.fecha), 'dd/MMM/yy', { locale: es }) : '—'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-700 text-sm">{m.tipo}</p>
                        {m.reporte && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{m.reporte}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        {m.costo !== null && (
                          <span className="text-xs font-semibold text-slate-700">
                            ${m.costo.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 capitalize">{m.estado}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── ResumenVidaTab ──────────────────────────────────────────────────────────

export default function ResumenVidaTab() {
  const { data: robots = [], isLoading } = useQuery({
    queryKey: ['robots'],
    queryFn: async () => {
      const res = await fetch('/api/robots', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar robots');
      return res.json();
    },
    select: (data) => Array.isArray(data) ? data : [],
  });

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-slate-600">Cargando información...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-4 h-4 text-slate-500" />
        <h2 className="font-semibold text-slate-800 text-sm">
          Vida de Robots
          <span className="ml-2 text-xs font-normal text-slate-400">
            — haz clic en un robot para ver detalles, salud e historial de mantenimientos
          </span>
        </h2>
      </div>

      {robots.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 text-center text-slate-500">
          No hay robots registrados para mostrar información de vida útil
        </div>
      ) : (
        <div className="space-y-2">
          {robots.map((robot) => (
            <VidaRobotCard key={robot.id} robot={robot} />
          ))}
        </div>
      )}
    </div>
  );
}
