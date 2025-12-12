@echo off
:: Change to the directory containing package.json (parent of scripts/)
cd /d "%~dp0.."

echo [run-electron] Target App Directory: %CD%

:: Run Electron pointing explicitly to this directory
:: We use 'call' to ensure batch processing continues if needed
call pnpm exec electron "%CD%"
