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

```bash
bash setup-config.sh
```

- To set grenache client for express, edit common.json. If running locally, leave actual values skipping this step.

```console
vim config/common.json
## set grenacheClient value
```

- To change the bitfinex api to connect to, edit `resUrl` in common.json. If you want to conect to main bitfinex api, skip this step, as this value is set by default.

```console
vim config/service.report.json
## set restUrl value
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

## Run

### Production environment

- For production environment, run the worker in the console:

```console
npm run start
```
### Development environment

- For development environment, run the worker in the console:

```console
npm run startDev
```


## Testing

### Run tests

```console
npm test
```
