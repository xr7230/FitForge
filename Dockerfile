FROM node:20-slim

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY apps/api/ .

RUN npm install && npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
