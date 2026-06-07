FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Build ID: 1780838503
COPY apps/api/ .

RUN grep -q "/ping" src/index.ts && echo "OK: ping found" || (echo "MISSING!" && exit 1)

RUN npm install && npm run build && npm prune --omit=dev

EXPOSE 3001

CMD ["node", "dist/index.js"]
