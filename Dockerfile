FROM node

WORKDIR /opt/sca/imagex-data

# Install app dependencies
COPY package.json .

RUN npm install

COPY . .

EXPOSE 8081

CMD [ "node", "data.js"]
