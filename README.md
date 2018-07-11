# bfx-report

## Setup

### Install

- install libraries. Once the project is cloned, execute the following commands from the root directory of the project:

```console
npm install
```

### Other Requirements

- Install `Grenache Grape`: <https://github.com/bitfinexcom/grenache-grape>:

```console
npm i -g grenache-grape
```

### Configure service

- copy the files into new ones:

```console
cp config/default.json.example config/default.json
cp config/common.json.example config/common.json
cp config/service.report.json.example config/service.report.json
cp config/facs/grc.config.json.example config/facs/grc.config.json
cp config/facs/bull.config.json.example config/facs/bull.config.json
```

- you need to configure the fields for AWS S3

```console
vim config/facs/bull.config.json
```

- for tests and the `dev` environment, you need to change the field `restUrl` to `https://dev-prdn.bitfinex.com:2998`

```console
vim config/service.report.json
```

- for the tests you need to enter the fields `apiKey` and `apiSecret`

```console
vim config/default.json
```

### Run two Grapes

```console
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

### Run the `bfx-ext-s3-js` Grenache service

- follow the instructions in `readme` <https://github.com/bitfinexcom/bfx-ext-s3-js> to configure and start the service

### Run the `bfx-ext-sendgrid-js` Grenache service

- follow the instructions in `readme` <https://github.com/bitfinexcom/bfx-ext-sendgrid-js> to configure and start the service

### Run the Grenache service

- for the production environment:

```console
npm run startWorker
```

- or for the development environment:

```console
npm run startWorkerDev
```

### Run the server

- for the production environment:

```console
npm run start
```

- or for the development environment:

```console
npm run startDev
```

### Run tests

```console
npm test
```

> The launch of Grape is integrated into tests and the same ports are used
