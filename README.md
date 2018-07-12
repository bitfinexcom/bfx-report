# bfx-report

## Setup

### Install

- Clone Github repository and install projects dependencies :

```console
git clone https://github.com/bitfinexcom/bfx-report.git
cd bfx-report
npm install
```

### Configure service

- As to configure the service copy the example files from config folder into new ones:

```console
cp config/default.json.example config/default.json
cp config/common.json.example config/common.json
cp config/service.report.json.example config/service.report.json
cp config/facs/grc.config.json.example config/facs/grc.config.json
cp config/facs/bull.config.json.example config/facs/bull.config.json
```

- If this is intended to run inside a electronjs enviroment, edit common.json

```console
vim config/common.json
## set "app_type": "electron"
```

- If this is intended to run as a nodejs project, you should configure redis, s3 buckets and grenache network to connect.

```console
## Configure grenache network  to connect
vim config/default.json
## Set grenacheClient.grape

## Configure redis
vim config/facs/bull.config.json
## Set bull.port && bull.host values

## Configure s3 (can be left blank, and would get networks values)
vim config/facs/bull.config.json
## Set s3.bucket && s3.acl
```

## Other Requirements

### Grenache network

- Install `Grenache Grape`: <https://github.com/bitfinexcom/grenache-grape>:

```console
npm i -g grenache-grape
```

- Run two Grapes

```console
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

### Run the `bfx-ext-s3-js` Grenache service

- follow the instructions in `readme` <https://github.com/bitfinexcom/bfx-ext-s3-js> to configure and start the service

### Run the `bfx-ext-sendgrid-js` Grenache service

- follow the instructions in `readme` <https://github.com/bitfinexcom/bfx-ext-sendgrid-js> to configure and start the service

## Run

- For production environment run in two different consoles :

```console
## Console 1: runs worker
npm run startWorker
## Console 2: runs server
npm run start
```

- For development environment run in two different consoles :

```console
## Console 1: runs worker
npm run startWorkerDev
## Console 2: runs server
npm run start
```


## Testing

### Configure tests

- As to run test command `npm test` its necessary to complete the fields `apiKey` and `apiSecret` in default.json with keys obtained in https://www.bitfinex.com/api

```console
## Configure for tests
vim config/default.json
## Set auth.apiKey && auth.apiSecret
```
### Run tests

```console
npm test
```
