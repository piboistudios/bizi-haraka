FROM node:19.7.0
COPY . app
WORKDIR /app
RUN npm install
CMD ["npm","run","haraka-w-tls"]

# EXPOSE 22