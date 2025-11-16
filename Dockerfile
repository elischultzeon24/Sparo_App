FROM denoland/deno:alpine

WORKDIR /app/backend


COPY backend/deno.json backend/deno.lock* ./
COPY backend/ .



RUN deno cache server.js

EXPOSE 3000
ENV PORT=3000

CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "--allow-run", "--allow-scripts", "server.js"]
