const _rewriteUrlToProxy = u => {
  /* if (!/^https:\/\//.test(u) || /^https:\/\/(?:.+?\.)?webaverse.com/.test(u)) {
    return u;
  } else { */
  if (/^[a-z]+:/.test(u) && u.indexOf(self.location.origin) !== 0) {
    const parsedUrl = new URL(u);
    return 'https://' + parsedUrl.origin.replace(/^(https?):\/\//, '$1-').replace(/:([0-9]+)$/, '-$1').replace(/\./g, '-') + '.proxy.webaverse.com' + parsedUrl.pathname;
  } else {
    return u;
  }
  // }
};
const _getBaseUrl = u => {
  if (!/^(?:[a-z]+:|\/)/.test(u)) {
    u = '/' + u;
  }
  u = u.replace(/(\/)[^\/]+$/, '$1');
  return u;
};
const _insertAfter = (htmlString, match, s) => {
  return htmlString.slice(0, match.index) + match[0] + s + htmlString.slice();
};
const _insertBefore = (htmlString, match, s) => {
  return htmlString.slice(0, match.index) + s + match[0] + htmlString.slice();
};
const _addHtmlBase = (htmlString, u) => {
  const match = htmlString.match(/<[\s]*head[\s>]/i);
  if (match) {
    // console.log('rebase 1', u);
    return _insertAfter(htmlString, match, `<base href="${encodeURI(u)}" target="_blank">`);
  } else if (match = htmlString.match(/<[\s]*body[\s>]/i)) {
    // console.log('rebase 2', u);
    return _insertBefore(htmlString, match, `<head><base href="${encodeURI(u)}" target="_blank"></head>`);
  } else {
    throw new Error(`no head or body tag: ${htmlString}`);
  }
};

self.addEventListener('install', event => {
  self.skipWaiting();

  /* event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  ); */
});
self.addEventListener('activate', event => {
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  // console.log('got request', event.request.url);

  let match = event.request.url.match(/^[a-z]+:\/\/[a-zA-Z0-9\-\.:]+(.+)$/);
  if (match) {
    const match2 = match[1].match(/^\/p\/(.+)$/);
    if (match2) {
      const u = _rewriteUrlToProxy(match2[1]);
      event.respondWith(
        fetch(u)
          .then(res => {
            const type = res.headers.get('Content-Type');
            if (/^text\/html(?:;|$)/.test(type)) {
              return res.text()
                .then(htmlString => new Response(_addHtmlBase(htmlString, _getBaseUrl(u)), {
                  status: res.status,
                  headers: res.headers,
                }));
            } else {
              return res;
            }
          })
      );
    } else {
      event.respondWith(fetch(event.request));
    }
  } else {
    event.respondWith(new Response('invalid url', {
      status: 500,
    }));
  }
});
