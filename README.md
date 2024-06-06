# cl-viewer-backend

## Architecture
![Image](architecture/image.png)

- how to update architecture image

```
$ make pip-install
$ make generate-architecture
```

## Local Development
### Lambda function
- create `.env` in each function directory
  - clviewerdynamodbalertimporter
  - clviewerdynamodbimporter
  - clviewers3sensingimporter
```
$ make init-env
```
- invoke function in local

```
$ amplify mock function
```

### Api
- npm install
```
$ npm install -g nodemon ts-node
$ npm run amplify:clviewercommons
$ npm run amplify:clviewerexpress
```
- start local server
```
$ make start
```
