FROM node:15
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY ./src ./config.jso[n] ./
RUN dir
EXPOSE 80
CMD ["node", "server.js"]