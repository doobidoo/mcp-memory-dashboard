#!/bin/bash
# build.sh

# Build the electron files
npm run build:electron

# Build the Vite app
npm run build

# Copy the preload script to the correct location
cp dist/electron/preload.js dist/