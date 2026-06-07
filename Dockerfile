FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy everything - cache invalidates when source changes
COPY apps/api/ .

# Verify key routes exist
RUN grep -q "/ping" src/index.ts && echo "OK: ping route found" || (echo "MISSING ping!" && exit 1)

RUN npm install && npm run build && npm prune --omit=dev

EXPOSE 3001

CMD ["node", "dist/index.js"]
