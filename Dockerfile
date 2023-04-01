FROM node:19.8.1
COPY . app
WORKDIR /app
RUN npm install
CMD ["npm","run","haraka-w-tls"]

# EXPOSE 22