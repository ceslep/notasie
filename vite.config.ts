import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'url'

// Este proyecto NO usa proxy en produccion: el frontend habla con el PHP por
// ruta absoluta calculada desde la ruta de la app.
//
// Estructura de despliegue (produccion):
//   https://app.iedeoccidente.com/est/      <- contenido de dist\     (frontend)
//   https://app.iedeoccidente.com/est/php/  <- contenido de backend\  (backend)
//
// ---------------------------------------------------------------------------
// DESARROLLO (npm run dev)
// ---------------------------------------------------------------------------
// Vite no ejecuta PHP, asi que las llamadas a /est/php/api.php se reenvian al
// backend real con este proxy.
//
// Por defecto se apunta al servidor del colegio, para poder desarrollar la
// interfaz contra datos reales. El reenvio ocurre EN EL SERVIDOR DE VITE
// (Node -> colegio), no en el navegador: el navegador solo habla con
// localhost, asi que no hay peticion cross-origin y CORS no interviene.
//
// Para usar un servidor PHP local en su lugar:
//      npm run dev:php        (php -S 127.0.0.1:8000 -t backend)
//      $env:VITE_PHP_TARGET='http://127.0.0.1:8000'; npm run dev
//
// En ese caso el backend esta en la RAIZ del servidor PHP, asi que el proxy
// quita el prefijo /est/php. Con el servidor del colegio no se toca la ruta.
// Si usas XAMPP replicando produccion (htdocs\est\php\), añade
// VITE_PHP_REWRITE=0 para que la ruta se conserve tal cual.
const PHP_TARGET = process.env.VITE_PHP_TARGET || 'https://app.iedeoccidente.com'
const ES_LOCAL = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(PHP_TARGET)
const REESCRIBIR = ES_LOCAL && process.env.VITE_PHP_REWRITE !== '0'

// Backend PHP local (npm run dev:php) donde vive GetExcusas.php.
const PHP_DEV_TARGET = process.env.VITE_PHP_DEV_TARGET || 'http://127.0.0.1:8000'
const DEV_LOCAL = /^https?:\/\/(127\.0\.0\.1|localhost)/.test(PHP_DEV_TARGET)

export default defineConfig({
  base: '/est/',
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // El frontend pide exactamente esta ruta (misma que en produccion),
      // asi que el navegador no sale de localhost y no hay CORS.
      '/est/php/api.php': {
        target: PHP_TARGET,
        changeOrigin: true,
        // Con el servidor del colegio la ruta se conserva tal cual.
        // Con un PHP local (backend\ en la raiz) se quita el prefijo /est/php.
        rewrite: (ruta) => (REESCRIBIR ? ruta.replace(/^\/est\/php/, '') : ruta),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            const pista = ES_LOCAL
              ? '  Levantalo con:  npm run dev:php\n'
              : `  Comprueba que ${PHP_TARGET} sea accesible desde este equipo.\n`
            console.error(
              `\n[red social] No se pudo conectar con el backend en ${PHP_TARGET}.\n` +
                pista +
                `  Detalle: ${err.message}\n`,
            )
          })
        },
      },
      // Por si la app se abre fuera de /est/ y el endpoint se resuelve relativo.
      '/est/api.php': {
        target: PHP_TARGET,
        changeOrigin: true,
        rewrite: () => '/est/php/api.php',
      },
      // GetExcusas.php si vive en el backend local (backend\GetExcusas.php):
      // el frontend pide /est/php/GetExcusas.php, que en el servidor del colegio
      // todavia no esta desplegado (devuelve 404). Con `npm run dev:php` este
      // proxy lo resuelve contra http://127.0.0.1:8000 y evita el CORS, porque
      // la peticion sale del navegador hacia Vite y no hacia el PHP.
      // Un backend PHP distinto se configura con VITE_PHP_DEV_TARGET.
      ...(DEV_LOCAL || ES_LOCAL
        ? {
            '/est/php/GetExcusas.php': {
              target: PHP_DEV_TARGET,
              changeOrigin: true,
              rewrite: () => '/GetExcusas.php',
              configure: (proxy: any) => {
                proxy.on('error', (err: Error) => {
                  console.error(
                    `\n[GetExcusas] No se pudo conectar con ${PHP_DEV_TARGET}.\n` +
                      '  Levanta el backend con:  npm run dev:php\n' +
                      `  Detalle: ${err.message}\n`,
                  )
                })
              },
            },
          }
        : {}),
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
