#!/bin/bash

openssl req -x509 -nodes -days 1000 -newkey rsa:2048 -keyout key.pem -out cert.pem -config req.conf -extensions 'v3_req'
openssl x509 -text -noout -in cert.pem
