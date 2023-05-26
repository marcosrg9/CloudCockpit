FROM node:18.10-alpine

WORKDIR /home/cloudcockpit/app

COPY package.json ./package.json
COPY src ./src
COPY public ./public
COPY types ./types
COPY .node-version ./.node-version
COPY tsconfig.json ./tsconfig.json
COPY main.ts ./main.ts
COPY .env.example ./.env

RUN npm i
RUN cd public && npm i --legacy-peer-deps
RUN cd public && npm run build
RUN npm run build
RUN mv /home/cloudcockpit/app/src/static /home/cloudcockpit/app/build/src
RUN mv /home/cloudcockpit/app/.env /home/cloudcockpit/app/build/.env

RUN rm -rf public
RUN rm -rf src
RUN rm main.ts
RUN rm tsconfig.json