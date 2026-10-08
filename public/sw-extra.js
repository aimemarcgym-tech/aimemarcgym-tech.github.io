// Chargé par le service worker (importScripts) AVANT les règles de précache.
// Une navigation vers une page sans "/" final (ex. /gymnaste?id=…) ne correspond à aucune entrée du
// précache (gymnaste/index.html) : le service worker retombait sur l'accueil. On la redirige donc
// vers la même adresse avec le "/" final (en gardant les paramètres), qui, elle, est précachée.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate" || request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/") || /\.[a-z0-9]+$/i.test(url.pathname)) return;
  event.respondWith(Response.redirect(`${url.origin}${url.pathname}/${url.search}${url.hash}`, 301));
});
