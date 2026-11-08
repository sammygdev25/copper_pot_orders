# Stage 1: Python dependencies
FROM python:3.11-slim AS python-deps
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Node build (production frontend bundle)
FROM node:18-alpine AS node-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps
COPY frontend/ .
RUN npm run build 2>/dev/null || echo "No build script -- dev mode will be used"

# Stage 3: Runtime (production image ~400MB vs ~2GB single-stage)
FROM python:3.11-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends     curl     && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace

# Copy Python packages from builder
COPY --from=python-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-deps /usr/local/bin /usr/local/bin

# Copy frontend build (falls back to source for dev mode)
COPY --from=node-build /app/frontend/build /workspace/frontend/build
COPY frontend/ /workspace/frontend/

# Copy backend source
COPY backend/ /workspace/backend/

# Copy infrastructure files
COPY start.sh docker-compose.yml* .env* ./
RUN chmod +x start.sh

# Install Node.js for dev server fallback (React dev mode in preview)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -     && apt-get install -y --no-install-recommends nodejs     && rm -rf /var/lib/apt/lists/*

EXPOSE 8000 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3     CMD curl -sf http://localhost:8000/health/ || exit 1

CMD ["./start.sh"]
