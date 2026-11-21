'use strict';
/* SafeWord service worker — caches the app shell so the app works fully offline.
   SafeWord makes no network calls at all: everything (codeword, family, checks) stays on this device. */
const CACHE = 'safeword-v1';
const SHELL = ['./', './index.html', './styles.css', './app.js', './i18n.js', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
