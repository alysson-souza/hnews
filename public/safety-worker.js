// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza
/* global FetchEvent, caches, importScripts */
'use strict';

(function () {
  var _respondWith = FetchEvent.prototype.respondWith;

  FetchEvent.prototype.respondWith = function (responsePromise) {
    if (this.request.mode !== 'navigate') {
      return _respondWith.call(this, responsePromise);
    }

    var safe = Promise.resolve(responsePromise).then(
      function (response) {
        if (response.ok) {
          caches
            .open('ngsw-safety:fallback')
            .then(function (c) {
              return c.put(new Request('/index.html'), response.clone());
            })
            .catch(function () {});
        }
        return response;
      },
      function () {
        return caches.match(new Request('/index.html')).then(function (cached) {
          return (
            cached ||
            new Response(
              '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
                '<body style="font-family:system-ui;display:grid;place-items:center;min-height:100dvh;margin:0;color:#888">' +
                '<div style="text-align:center"><h1>Offline</h1><p>Please reconnect and refresh.</p></div></body></html>',
              { status: 503, headers: { 'Content-Type': 'text/html' } },
            )
          );
        });
      },
    );

    return _respondWith.call(this, safe);
  };
})();

importScripts('./ngsw-worker.js');
