#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const fetch = require('window-fetch');
const imageSize = require('image-size');
const sharp = require('sharp');

const SIZE = 192;
const p = path.join(__dirname, '..', 'sites.json');
fs.readFile(p, 'utf8', async (err, s) => {
  if (!err) {
    try {
      const sites = JSON.parse(s);

      for (let i = 0; i < sites.length; i++) {
        const site = sites[i];
        const {icon} = site;
        if (/^https?:/.test(icon)) {
          console.log(icon);
          const res = await fetch(icon);
          let b = new Buffer(await res.arrayBuffer());
          b = await sharp(b)
            .resize(SIZE, SIZE, {
              fit: 'inside',
            })
            .png()
            // .jpeg()
            .toBuffer();
          site.icon = 'data:image/png;base64,' + b.toString('base64');
          // site.icon = 'data:image/jpeg;base64,' + b.toString('base64');

          await new Promise((accept, reject) => {
            const s = JSON.stringify(sites, null, 2);

            fs.writeFile(p, s, err => {
              if (!err) {
                accept();
              } else {
                reject(err);
              }
            });
          });
        }
      }
    } catch(err) {
      console.warn(err.stack);
    }
  } else {
    console.warn(err.stack);
  }
});
