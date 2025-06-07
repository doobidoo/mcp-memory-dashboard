@echo off
echo Updating mcp-memory-dashboard dependencies...

echo.
echo Removing deprecated packages...
npm uninstall @types/electron electron-forge

echo.
echo Installing updated packages...
npm install --save-dev electron@latest
npm install --save-dev electron-builder@latest
npm install --save-dev @electron-forge/cli@latest

echo.
echo Updating other dependencies...
npm update

echo.
echo Running security audit...
npm audit

echo.
echo Attempting to fix vulnerabilities...
npm audit fix

echo.
echo Done! Check the output above for any remaining issues.
pause
