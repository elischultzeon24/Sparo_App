FROM denoland/deno:alpine

WORKDIR /app/backend

# Kopiere Dependency-Dateien zuerst (für besseres Caching)
COPY backend/deno.json backend/deno.lock* ./

# Cache Dependencies
RUN deno cache server.js || true

# Kopiere den Rest des Codes
COPY backend/ .

# Cache alle Dependencies nochmal mit vollem Code
RUN deno cache server.js

EXPOSE 3000
ENV PORT=3000

# Starte den Server
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "--allow-run", "--allow-scripts", "server.js"]
