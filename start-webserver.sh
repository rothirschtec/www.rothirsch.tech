#!/bin/bash

echo "Start server"
cd $(dirname $0)

python3 -m http.server
