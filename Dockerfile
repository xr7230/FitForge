FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY apps/api/package*.json ./

RUN npm install

COPY apps/api/ .

RUN npm run build

RUN npm prune --omit=dev

EXPOSE 3001

CMD ["node", "dist/index.js"]
