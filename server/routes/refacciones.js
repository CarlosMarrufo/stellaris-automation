// server/routes/refacciones.js
// GET /api/refacciones  — Catálogo con búsqueda, filtros y paginación
// GET /api/marcas       — Lista de marcas para filtros
// GET /api/categorias   — Lista de categorías para filtros

import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// ─── GET /api/marcas ──────────────────────────────────────────────────────

router.get('/marcas', async (_req, res) => {
  try {
    const marcas = await prisma.marca.findMany({
      where:   { activo: true, refacciones: { some: { activo: true } } },
      select:  { idMarca: true, marca: true },
      orderBy: { marca: 'asc' },
    });
    return res.json(marcas);
  } catch (err) {
    console.error('[api/marcas]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener marcas' });
  }
});

// ─── GET /api/categorias ──────────────────────────────────────────────────

router.get('/categorias', async (_req, res) => {
  try {
    const cats = await prisma.categoriaRefaccion.findMany({
      where:   { refacciones: { some: { activo: true } } },
      select:  { idCategoria: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
    return res.json(cats);
  } catch (err) {
    console.error('[api/categorias]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// ─── GET /api/refacciones ─────────────────────────────────────────────────

router.get('/refacciones', async (req, res) => {
  try {
    const search    = String(req.query.search    ?? '').trim();
    const categoria = req.query.categoria ? parseInt(req.query.categoria, 10) : undefined;
    const marca     = req.query.marca     ? parseInt(req.query.marca, 10)     : undefined;
    const skip      = Math.max(0, parseInt(req.query.skip ?? '0', 10));
    const take      = Math.min(200, Math.max(1, parseInt(req.query.take ?? '20', 10)));

    const where = {
      activo: true,
      ...(categoria && !isNaN(categoria) ? { idCategoria: categoria } : {}),
      ...(marca     && !isNaN(marca)     ? { idMarca: marca }         : {}),
      ...(search ? {
        OR: [
          { noParte:     { contains: search } },
          { descripcion: { contains: search } },
        ],
      } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.refaccion.findMany({
        where,
        skip,
        take,
        include: {
          categoria: { select: { nombre: true } },
          marca:     { select: { marca: true } },
        },
        orderBy: { noParte: 'asc' },
      }),
      prisma.refaccion.count({ where }),
    ]);

    const result = data.map((r) => ({
      id:               r.idRefaccion,
      codigo:           r.noParte,
      nombre:           r.descripcion ?? r.noParte,
      categoria:        r.categoria.nombre,
      marca_compatible: r.marca.marca,
      stock_disponible: r.stockActual,
      stock_minimo:     0,
      precio_venta:     Number(r.precioVenta),
      disponible:       r.stockActual > 0,
    }));

    return res.json({ data: result, total });
  } catch (err) {
    console.error('[api/refacciones]', err instanceof Error ? err.message : String(err));
    return res.status(500).json({ error: 'Error al obtener refacciones' });
  }
});

export default router;
