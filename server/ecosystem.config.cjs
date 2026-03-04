// server/ecosystem.config.cjs
// PM2 Process Manager — Configuración de producción
//
// El archivo DEBE ser .cjs porque PM2 usa require() para cargar su config,
// independientemente de que el proyecto sea ESM.
//
// Uso:
//   pm2 start ecosystem.config.cjs --env production
//   pm2 save
//   pm2 startup   ← sigue las instrucciones que imprime este comando

'use strict';

module.exports = {
  apps: [
    {
      // ── Identidad ─────────────────────────────────────────────────────────
      name:        'stellaris-api',
      script:      './server.js',

      // ── Ejecución ─────────────────────────────────────────────────────────
      // 'fork' para un solo proceso. Si en el futuro se necesita cluster,
      // cambiar a 'cluster' e incrementar instances.
      exec_mode:   'fork',
      instances:   1,

      // ── Directorio de trabajo ─────────────────────────────────────────────
      // PM2 resolverá rutas relativas desde este directorio.
      // Ajustar si el servidor se despliega en una ruta distinta.
      cwd:         '/var/www/stellaris/server',

      // ── Política de reinicio ──────────────────────────────────────────────
      watch:        false,          // No reiniciar en cambios de archivo (producción)
      restart_delay: 3_000,         // Espera 3 s antes de reiniciar tras un crash
      max_restarts:  10,            // Máximo 10 reinicios consecutivos
      min_uptime:    '10s',         // El proceso debe vivir >10 s para no contar el reinicio

      // ── Variables de entorno ──────────────────────────────────────────────
      // Las variables sensibles (secretos Microsoft) se leen desde el
      // archivo .env ubicado en cwd (cargado por dotenv/config en server.js).
      // Solo se definen aquí las no sensibles.
      env_production: {
        NODE_ENV: 'production',
        PORT:     4000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT:     4000,
      },

      // ── Logs ──────────────────────────────────────────────────────────────
      // Asegurarse de que /var/log/pm2/ exista y sea escribible por el usuario
      // que ejecuta PM2.  Orangenbaum debe ejecutar:
      //   sudo mkdir -p /var/log/pm2 && sudo chown $USER:$USER /var/log/pm2
      error_file:      '/var/log/pm2/stellaris-api-error.log',
      out_file:        '/var/log/pm2/stellaris-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:      true,

      // ── Rotación de logs (requiere pm2-logrotate) ─────────────────────────
      // Instalar con: pm2 install pm2-logrotate
      // La configuración de rotación se hace aparte con pm2 set pm2-logrotate:*
    },
  ],
};
