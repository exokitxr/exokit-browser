const _rewriteUrlToProxy = u => {
  /* if (!/^https:\/\//.test(u) || /^https:\/\/(?:.+?\.)?webaverse.com/.test(u)) {
    return u;
  } else { */
  if (/^[a-z]+:/.test(u) && u.indexOf(self.location.origin) !== 0) {
    const parsedUrl = new URL(u);
    parsedUrl.host = parsedUrl.host.replace('-', '--');
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
  let match;
  if (match = htmlString.match(/<[\s]*head[\s>]/i)) {
    // console.log('rebase 1', u);
    return _insertAfter(htmlString, match, `<base href="${encodeURI(u)}" target="_blank">`);
  } else if (match = htmlString.match(/<[\s]*body[\s>]/i)) {
    // console.log('rebase 2', u);
    return _insertBefore(htmlString, match, `<head><base href="${encodeURI(u)}" target="_blank"></head>`);
  } else {
    throw new Error(`no head or body tag: ${htmlString}`);
  }
};
const _proxyHtmlScripts = htmlString => htmlString.replace(/(src=")([^"]+)(")/g, (all, pre, src, post) => {
  if (/^[a-z]+:\/\//.test(src)) {
    return pre + location.origin + '/p/' + src + post;
  } else {
    return all;
  }
});
const _rewriteResText = (res, rewriteFn) => res.text()
  .then(text => new Response(rewriteFn(text), {
    status: res.status,
    headers: res.headers,
  }));
const _rewriteRes = res => {
  const {url, headers, originalUrl} = res;

  if (originalUrl && /^text\/html(?:;|$)/.test(headers.get('Content-Type'))) {
    return _rewriteResText(res, htmlString => {
      htmlString = _addHtmlBase(htmlString, _getBaseUrl(url));
      htmlString = _proxyHtmlScripts(htmlString);
      return htmlString;
    });
  } else if (/^https:\/\/assets-prod\.reticulum\.io\/hubs\/assets\/js\/hub-[a-zA-Z0-9]+\.js$/.test(originalUrl)) {
    return _rewriteResText(res, jsString => jsString.replace(`throw new Error("no embed token");`, ''));
  } else {
    return res;
  }
};

self.addEventListener('install', event => {
  // console.log('sw install');
  self.skipWaiting();

  /* event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  ); */
});
self.addEventListener('activate', event => {
  // console.log('sw activate');
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  // console.log('got request', event.request.url);

  let match = event.request.url.match(/^[a-z]+:\/\/[a-zA-Z0-9\-\.:]+(.+)$/);
  if (match) {
    let match2;
    if (match2 = match[1].match(/^\/p\/(.+)$/)) {
      const originalUrl = match2[1];
      const u = _rewriteUrlToProxy(originalUrl);
      event.respondWith(
        fetch(u).then(res => {
          res.originalUrl = originalUrl;
          return _rewriteRes(res);
        })
      );
    } else if (match2 = match[1].match(/^\/d\/(.+)$/)) {
      event.respondWith(fetch(match2[1]));
    } else {
      event.respondWith(fetch(event.request));
    }
  } else {
    event.respondWith(new Response('invalid url', {
      status: 500,
    }));
  }
});
