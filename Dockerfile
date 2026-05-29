FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY client/package*.json ./client/
RUN cd client && npm install
COPY . .
RUN cd client && npm run build
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
VOLUME ["/app/data"]
CMD ["node", "server/index.js"]
