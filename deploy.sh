#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="${PROJECT_ROOT}/client"
SERVER_DIR="${PROJECT_ROOT}/server"
DEPLOY_DIR="${PROJECT_ROOT}/deploy"
SERVER_DIST_DIR="${PROJECT_ROOT}/dist-server"
STAGING_DIR=""

cleanup() {
  if [[ -n "${STAGING_DIR}" && -d "${STAGING_DIR}" ]]; then
    rm -rf -- "${STAGING_DIR}"
  fi
  if [[ -d "${SERVER_DIST_DIR}" ]]; then
    rm -rf -- "${SERVER_DIST_DIR}"
  fi
}
trap cleanup EXIT

if [[ "${DEPLOY_DIR}" != "${PROJECT_ROOT}/deploy" ]]; then
  echo "Refusing to use an unexpected deployment directory: ${DEPLOY_DIR}" >&2
  exit 1
fi

for required_path in \
  "${PROJECT_ROOT}/app.js" \
  "${PROJECT_ROOT}/package.json" \
  "${PROJECT_ROOT}/package-lock.json" \
  "${PROJECT_ROOT}/tsconfig.server.json" \
  "${CLIENT_DIR}/package.json" \
  "${CLIENT_DIR}/package-lock.json" \
  "${SERVER_DIR}"; do
  if [[ ! -e "${required_path}" ]]; then
    echo "Required deployment input is missing: ${required_path}" >&2
    exit 1
  fi
done

echo "[1/6] Installing locked build dependencies..."
npm --prefix "${PROJECT_ROOT}" ci --include=dev || npm --prefix "${PROJECT_ROOT}" install --include=dev
npm --prefix "${CLIENT_DIR}" ci --include=dev || npm --prefix "${CLIENT_DIR}" install --include=dev

echo "[2/6] Validating server TypeScript source..."
npm --prefix "${PROJECT_ROOT}" run check:server

echo "[3/6] Building production client..."
npm --prefix "${CLIENT_DIR}" run build

if [[ ! -f "${CLIENT_DIR}/dist/index.html" ]]; then
  echo "Client build did not create client/dist/index.html" >&2
  exit 1
fi

echo "[4/6] Compiling production server JavaScript..."
npm --prefix "${PROJECT_ROOT}" run build:server

if [[ ! -f "${SERVER_DIST_DIR}/index.js" ]]; then
  echo "Server build did not create dist-server/index.js" >&2
  exit 1
fi

echo "[5/6] Assembling clean cPanel / production runtime package..."
STAGING_DIR="$(mktemp -d "${PROJECT_ROOT}/.deploy-tmp.XXXXXX")"
mkdir -p "${STAGING_DIR}/client"

cp -a "${PROJECT_ROOT}/app.js" "${STAGING_DIR}/app.js"
cp -a "${SERVER_DIST_DIR}" "${STAGING_DIR}/server"
cp -a "${CLIENT_DIR}/dist" "${STAGING_DIR}/client/dist"
cp -a "${PROJECT_ROOT}/package-lock.json" "${STAGING_DIR}/package-lock.json"

# Create a production-ready package.json:
# - Strips devDependencies
# - Retains "type": "module" for ES module imports
# - Points "main" to app.js
# - Adds a no-op "build" script so automated hosting hooks succeed safely
node -e '
const fs = require("fs");
const rootPkg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const prodPkg = {
  name: rootPkg.name || "expensemanager",
  version: rootPkg.version || "1.0.0",
  type: rootPkg.type || "module",
  private: rootPkg.private !== undefined ? rootPkg.private : true,
  description: rootPkg.description || "Expense Manager Production Server",
  main: "app.js",
  scripts: {
    start: "node app.js",
    build: "node -e \"console.log(\\\"Production client and server are already built.\\\")\""
  },
  dependencies: rootPkg.dependencies || {},
  engines: rootPkg.engines || { node: ">=18.0.0" }
};
fs.writeFileSync(process.argv[2], JSON.stringify(prodPkg, null, 2) + "\n");
' "${PROJECT_ROOT}/package.json" "${STAGING_DIR}/package.json"

forbidden_path="$(find "${STAGING_DIR}" \( -name '.env' -o -name 'node_modules' -o -name '.git' -o -name '*.ts' -o -name '*.tsx' \) -print -quit)"
if [[ -n "${forbidden_path}" ]]; then
  echo "Forbidden deployment content detected: ${forbidden_path}" >&2
  exit 1
fi

if [[ -e "${DEPLOY_DIR}" && ! -d "${DEPLOY_DIR}" ]]; then
  echo "Cannot replace ${DEPLOY_DIR} because it is not a directory" >&2
  exit 1
fi

rm -rf -- "${DEPLOY_DIR}"
mv -- "${STAGING_DIR}" "${DEPLOY_DIR}"
STAGING_DIR=""

# Package zip for convenient upload to cPanel File Manager
if command -v zip >/dev/null 2>&1; then
  (cd "${DEPLOY_DIR}" && zip -rq "deploy.zip" . -x "deploy.zip" "*.zip")
fi

echo "[6/6] Deployment package ready!"
echo "=================================================="
echo "Package directory : ${DEPLOY_DIR}"
if [[ -f "${DEPLOY_DIR}/deploy.zip" ]]; then
  echo "Zip archive       : ${DEPLOY_DIR}/deploy.zip ($(du -sh "${DEPLOY_DIR}/deploy.zip" | cut -f1))"
fi
echo "Total files       : $(find "${DEPLOY_DIR}" -type f | wc -l)"
echo "Directory size    : $(du -sh "${DEPLOY_DIR}" | cut -f1)"
echo "=================================================="
echo "cPanel Node.js Deployment Instructions:"
echo "1. Upload 'deploy.zip' to cPanel File Manager (or upload the 'deploy/' directory contents)."
echo "   - Extract it into your application directory (e.g. /home/<user>/expensemanager)."
echo "2. In cPanel > 'Setup Node.js App' (CloudLinux NodeJS Selector):"
echo "   - Click 'Create Application'"
echo "   - Node.js Version: 20.x or 22.x (or 18.x+)"
echo "   - Application Mode: Production"
echo "   - Application Root: expensemanager (or your chosen directory)"
echo "   - Application URL: expense.yourdomain.com (or your domain/path)"
echo "   - Application Startup File: app.js"
echo "3. Configure Environment Variables in cPanel or .env file:"
echo "   - MONGODB_URI=<your_mongodb_atlas_connection_string>"
echo "   - JWT_SECRET=<secure_random_key_min_32_characters>"
echo "   - NODE_ENV=production"
echo "   - PORT=<assigned_port_or_leave_default>"
echo "4. In the cPanel Node.js App interface, click 'Run NPM Install'"
echo "   (or via SSH/Terminal inside the app directory: npm ci --omit=dev)."
echo "5. Click 'Restart' to start the Node.js application."
echo "6. Test your deployment: visit https://<your-domain>/api/health"
echo "=================================================="
