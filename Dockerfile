FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Build ID: 1780839300
COPY apps/api/ .

RUN grep -q "/ping" src/index.ts && echo "OK: ping in source" || (echo "MISSING from source!" && exit 1)

RUN npm install && npm run build && npm prune --omit=dev

# Debug: verify compiled output has ping
RUN grep -q "/ping" dist/index.js && echo "OK: ping in compiled dist" || (echo "MISSING from compiled dist!" && cat dist/index.js | head -40 && exit 1)

EXPOSE 3001

CMD ["node", "dist/index.js"]
