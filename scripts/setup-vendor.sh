#!/bin/sh
# Concorde is not on the npm registry yet, so the operator consumes it as a
# vendored source checkout. This fetches it and installs its dependencies
# (without running any lifecycle scripts). Run from the repository root.
set -eu

if [ ! -d vendor/concorde/.git ]; then
  git clone --depth 1 https://github.com/shutter-network/concorde vendor/concorde
fi

cd vendor/concorde
npm ci --ignore-scripts --no-audit --no-fund
echo "vendor/concorde ready — 'npm run typecheck' in operator/ now works."
echo "For a runnable local install (outside Docker), also run: npm run build in vendor/concorde"
