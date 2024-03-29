FROM node:16

WORKDIR /usr/src/aeguir
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

COPY . .

CMD [ "./run" ]
