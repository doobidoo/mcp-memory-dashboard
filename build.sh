#!/bin/bash
# build.sh

# Ensure we exit on any error
set -e

echo "🚀 Starting build process..."

# Clean up previous builds
echo "🧹 Cleaning up previous builds..."
rm -rf dist/
rm -rf release/

# Install dependencies if needed
echo "📦 Checking dependencies..."
npm install

# Build the Vite app
echo "🛠 Building Vite app..."
npm run build:vite

# Build the electron files
echo "🔧 Building Electron files..."
npm run build:electron

# Copy the preload script to the correct location
echo "📋 Copying preload script..."
npm run copy-preload

# Build the electron app
echo "🏗 Building Electron app..."
npm run electron:build

echo "✅ Build complete!"