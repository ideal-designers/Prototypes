#!/usr/bin/env bash
# Builds the client-demo configuration (only qna-setup-demo) and deploys it
# as the separate Vercel project "qna-client-demo". Does not touch the
# dashboard project. Usage: scripts/deploy-client-demo.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"

"$ROOT/node_modules/.bin/ng" build --configuration client-demo --output-path "$WORK/build"

mkdir -p "$WORK/deploy"
cp -R "$WORK/build/browser/." "$WORK/deploy/"
cp "$ROOT/deploy/client-demo/vercel.json" "$WORK/deploy/vercel.json"

cd "$WORK/deploy"
npx -y vercel@66.1.0 deploy --prod --yes --name qna-client-demo
