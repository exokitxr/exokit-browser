window.rewriteUrl = u => {
  if (!/^https:\/\//.test(u) || /^https:\/\/(?:.+?\.)?webaverse.com/.test(u)) {
    return u;
  } else {
    const parsedUrl = new URL(u);
    return 'https://' + parsedUrl.origin.replace(/^(https?):\/\//, '$1-').replace(/:([0-9]+)$/, '-$1').replace(/\./g, '-') + '.proxy.exokit.org' + parsedUrl.pathname;
  }
};

window.fetch = (oldFetch => function fetch(u, init) {
  return oldFetch(window.rewriteUrl(u), init);
})(window.fetch);
XMLHttpRequest.prototype.open = (oldOpen => function open(method, url, async, user, password) {
  url = window.rewriteUrl(url);

  if (password !== undefined) {
    return oldOpen.call(this, method, url, async, user, password);
  } else if (user !== undefined) {
    return oldOpen.call(this, method, url, async, user);
  } else if (async !== undefined) {
    return oldOpen.call(this, method, url, async);
  } else {
    return oldOpen.call(this, method, url);
  }
})(XMLHttpRequest.prototype.open);
