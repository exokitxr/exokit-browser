#!/bin/bash

const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');

const PORT = process.env['PORT'] || 80;

const app = express();
app.use(express.static(__dirname));

http.createServer(app)
  .listen(PORT);
https.createServer({
  key: fs.readFileSync('cert/key.pem'),
  cert: fs.readFileSync('cert/cert.pem'),
}, app)
  .listen(443)