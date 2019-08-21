window.fetch = (_fetch => function fetch(u, init) {
  if (!/^https?:\/\//.test(u) || /^https:\/\/(?:.+?\.)?webaverse.com/.test(u)) {
    // nothing
  } else {
    const oldUrl = u;
    const parsedUrl = new URL(u);
    u = 'https://' + parsedUrl.origin.replace(/^(https):\/\//, '$1-').replace(/:([0-9]+)$/, '-($1)').replace(/\./g, '-') + '.proxy.webaverse.com' + parsedUrl.pathname;
  }
  return _fetch(u, init);
})(window.fetch);
