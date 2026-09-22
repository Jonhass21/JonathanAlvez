/* ============================================================
   Service worker del panel.

   Sin esto, la app instalada en el teléfono arranca haciendo un
   pedido de red común y silvestre para traer index.html — pero en
   una ventana sin barra de direcciones y sin botón de recargar.
   Si ese pedido tarda o no vuelve (señal floja, cambio de wifi a
   datos, el teléfono recién desbloqueado), queda una ventana en
   blanco y no hay forma de reintentar: parece colgada.

   Con esto, el armazón sale de la caché al instante y la red queda
   para actualizarlo en segundo plano.
   ============================================================ */

const VERSION = "panel-v1";
const ARMAZON = "./index.html";

/* Autenticación y base de datos van siempre a la red, sin pasar por acá:
   una respuesta guardada de esas sería vieja en el mejor de los casos y
   falsa en el peor. */
const SIEMPRE_RED = [
  /identitytoolkit\.googleapis\.com/,
  /securetoken\.googleapis\.com/,
  /firebaseio\.com/,
  /firebasedatabase\.app/,
];

/* El SDK de Firebase y las fuentes llevan la versión en la URL, así que
   una vez guardados no hace falta volver a pedirlos nunca. */
const INMUTABLE = [
  /gstatic\.com\/firebasejs\//,
  /fonts\.gstatic\.com/,
  /fonts\.googleapis\.com/,
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) =>
      // add() de a uno y tolerando fallas: si un icono no está, la
      // instalación igual tiene que salir adelante.
      c.add(new Request(ARMAZON, { cache: "reload" })).catch(() => {})
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function guardar(req, res) {
  if (res && res.ok) {
    const c = await caches.open(VERSION);
    await c.put(req, res.clone());
  }
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (SIEMPRE_RED.some((r) => r.test(url.href))) return;

  // Abrir la app: el armazón guardado primero. Instantáneo y sin depender
  // de que haya señal en ese momento.
  if (req.mode === "navigate") {
    e.respondWith(
      caches.match(ARMAZON).then((guardado) => {
        const red = fetch(req).then((res) => guardar(ARMAZON, res)).catch(() => null);
        if (guardado) {
          e.waitUntil(red); // se refresca para la próxima vez
          return guardado;
        }
        return red.then((res) => res || new Response(
          "<!doctype html><meta charset=utf-8><p style='font:16px system-ui;padding:24px'>" +
          "No hay conexión y todavía no quedó una copia guardada. Abrila una vez con internet.",
          { headers: { "Content-Type": "text/html; charset=utf-8" } }
        ));
      })
    );
    return;
  }

  // SDK y fuentes: si ya está guardado, no se vuelve a pedir.
  if (INMUTABLE.some((r) => r.test(url.href))) {
    e.respondWith(
      caches.match(req).then((guardado) =>
        guardado || fetch(req).then((res) => guardar(req, res)).catch(() => guardado)
      )
    );
    return;
  }

  // El resto de lo propio: se sirve lo guardado y se actualiza atrás.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((guardado) => {
        const red = fetch(req).then((res) => guardar(req, res)).catch(() => null);
        if (guardado) { e.waitUntil(red); return guardado; }
        return red.then((res) => res || Response.error());
      })
    );
  }
});
