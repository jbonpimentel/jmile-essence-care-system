/**
 * service-worker.js — J'mile Essence Care PWA
 * Cache-first strategy para funcionamento offline completo
 */

const CACHE_NAME = 'jmile-v1';

// Todos os arquivos que serão cacheados para uso offline
const ASSETS_TO_CACHE = [
  '/',
  '/pages/login.html',
  '/pages/index.html',
  '/css/login.css',
  '/css/dashboard.css',
  '/css/components.css',
  '/css/tables.css',
  '/js/login.js',
  '/js/dashboard.js',
  '/js/storage/storage.js',
  '/js/utils/helpers.js',
  '/js/utils/ui.js',
  '/js/modules/clientes.js',
  '/js/modules/procedimentos.js',
  '/js/modules/calendario.js',
  '/js/modules/financeiro.js',
  '/js/modules/contas.js',
  '/assets/images/logo.png',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/apple-touch-icon.png',
  '/manifest.json'
];

// ── INSTALL: pré-cacheia todos os assets ──────────────────
self.addEventListener('install', event => {
  console.log('[SW] Instalando e cacheando assets...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      console.log('[SW] Todos os assets cacheados com sucesso!');
      return self.skipWaiting();
    }).catch(err => {
      console.warn('[SW] Erro ao cachear assets:', err);
    })
  );
});

// ── ACTIVATE: limpa caches antigos ───────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Ativando novo service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH: Cache-first com fallback para rede ────────────
self.addEventListener('fetch', event => {
  // Ignora requisições não-GET e chrome-extension
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Retorna do cache e atualiza em background
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {});

        return cachedResponse;
      }

      // Não existe no cache: busca na rede e cacheia
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback offline: retorna login.html para navegação
        if (event.request.destination === 'document') {
          return caches.match('/pages/login.html');
        }
      });
    })
  );
});

// ── SYNC: Background sync para dados pendentes ────────────
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
});

// ── PUSH: Notificações push (preparado para futura expansão)
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || 'Nova notificação J\'mile',
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/pages/index.html' }
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'J\'mile Essence Care', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
