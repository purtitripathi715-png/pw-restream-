FROM node:18-alpine

RUN apk add --no-cache ffmpeg bash
WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY . .
RUN chmod +x ./start_ffmpeg.sh

EXPOSE 80
CMD ["node","index.js"]
