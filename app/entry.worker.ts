/// <reference lib="WebWorker" />

import { json } from "@remix-run/server-runtime";

import config from "../remix.config";

export type {};
declare const self: ServiceWorkerGlobalScope;

function debug(...messages: any[]) {
  // if (process.env.NODE_ENV === "development") {
  console.debug(...messages);
  // }
}

let STATIC_ASSETS = [config.publicPath || "/build/", "/icons/"];

const ASSET_CACHE = "asset-cache";
const DATA_CACHE = "data-cache";
const DOCUMENT_CACHE = "document-cache";

async function handleInstall(event: ExtendableEvent) {
  debug("Service worker installed");
}

async function handleActivate(event: ExtendableEvent) {
  debug("Service worker activated");
}

async function handleMessage(event: ExtendableMessageEvent) {
  let cachePromises: Map<string, Promise<void>> = new Map();

  if (event.data.type === "REMIX_NAVIGATION") {
    let { isMount, location, matches, manifest } = event.data;
    let documentUrl = location.pathname + location.search + location.hash;

    let [dataCache, documentCache, existingDocument] = await Promise.all([
      caches.open(DATA_CACHE),
      caches.open(DOCUMENT_CACHE),
      caches.match(documentUrl),
    ]);

    if (!existingDocument || !isMount) {
      debug("Caching document for", documentUrl);
      cachePromises.set(
        documentUrl,
        documentCache.add(documentUrl).catch((error) => {
          debug(`Failed to cache document for ${documentUrl}:`, error);
        })
      );
    }

    if (isMount) {
      for (let match of matches) {
        if (manifest.routes[match.id].hasLoader) {
          let params = new URLSearchParams(location.search);
          params.set("_data", match.id);
          let search = params.toString();
          search = search ? `?${search}` : "";
          let url = location.pathname + search + location.hash;
          if (!cachePromises.has(url)) {
            debug("Caching data for", url);
            cachePromises.set(
              url,
              dataCache.add(url).catch((error) => {
                debug(`Failed to cache data for ${url}:`, error);
              })
            );
          }
        }
      }
    }
  }

  await Promise.all(cachePromises.values());
}

async function handleFetch(event: FetchEvent): Promise<Response> {
  let url = new URL(event.request.url);
  if (isAssetRequest(event.request)) {
    let cached = await caches.match(event.request, {
      cacheName: ASSET_CACHE,
      ignoreVary: true,
      ignoreSearch: true,
    });
    if (cached) {
      debug("Serving asset from cache", url.pathname);
      return cached;
    }

    debug("Serving asset from network", url.pathname);
    let response = await fetch(event.request);
    if (response.status === 200) {
      let cache = await caches.open(ASSET_CACHE);
      await cache.put(event.request, response.clone());
    }
    return response;
  }

  if (isDataRequest(event.request)) {
    try {
      debug("Serving data from network", url.pathname + url.search);
      let response = await fetch(event.request);
      let cache = await caches.open(DATA_CACHE);
      await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      debug(
        "Serving data from network failed, falling back to cache",
        url.pathname + url.search
      );
      let response = await caches.match(event.request);
      if (response) {
        return response;
      }

      return json(
        { message: "Network Error" },
        { status: 500, headers: { "X-Remix-Catch": "yes" } }
      );
    }
  }

  if (isDocumentRequest(event.request)) {
    try {
      debug("Serving document from network", url.pathname);
      let response = await fetch(event.request);
      let cache = await caches.open(DOCUMENT_CACHE);
      await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      debug(
        "Serving document from network failed, falling back to cache",
        url.pathname
      );
      let response = await caches.match(event.request);
      if (response) {
        return response;
      }
      throw error;
    }
  }

  return fetch(event.request);
}

function isMethod(request: Request, methods: string[]) {
  return methods.includes(request.method.toLowerCase());
}

function isAssetRequest(request: Request) {
  return (
    isMethod(request, ["get"]) &&
    STATIC_ASSETS.some((publicPath) => request.url.startsWith(publicPath))
  );
}

function isDataRequest(request: Request) {
  let url = new URL(request.url);
  return isMethod(request, ["get"]) && url.searchParams.get("_data");
}

function isDocumentRequest(request: Request) {
  return request.mode === "navigate" && isMethod(request, ["get"]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(handleInstall(event).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(handleActivate(event).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  event.waitUntil(handleMessage(event));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(handleFetch(event));
});