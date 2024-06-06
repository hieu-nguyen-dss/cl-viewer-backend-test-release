init-env: init-env-dynamodb-alert-importer init-env-s3-importer

init-env-dynamodb-alert-importer:
	echo \
	"ENV=dev"\\n\
	"LL_API_URL=https://api-pre.landlog.info"\\n\
	"LL_AUTH_URL=https://auth-pre.landlog.info"\\n\
	"LL_DATASTORE_CHANNEL_ID=c4ov8b8a78qvl7f4oja0"\\n\
	"REGION=ap-northeast-1"\\n\
	"STORAGE_CLVIEWERRAWDATA_NAME=clviewerrawdata-dev"\\n\
	"LL_CLIENT_ID_BACKEND=$(shell AWS_PROFILE=cl-viewer-dev aws secretsmanager get-secret-value --secret-id clviewer/dev | jq '.SecretString | fromjson | .LL_CLIENT_ID_BACKEND')"\\n\
	"LL_CLIENT_SECRET_BACKEND=$(shell AWS_PROFILE=cl-viewer-dev aws secretsmanager get-secret-value --secret-id clviewer/dev | jq '.SecretString | fromjson | .LL_CLIENT_SECRET_BACKEND')" > ./amplify/backend/function/clviewerdynamodbalertimporter/.env

init-env-s3-importer:
	echo \
	"ENV=dev"\\n\
	"LL_API_URL=https://api-pre.landlog.info"\\n\
	"LL_AUTH_URL=https://auth-pre.landlog.info"\\n\
	"LL_FILE_STORAGE_ID=c4oq7jf1cn7ssis0bn4g"\\n\
	"REGION=ap-northeast-1"\\n\
	"STORAGE_CLVIEWERFILES_BUCKETNAME=clviewerfiles163101-dev"\\n\
	"LL_CLIENT_ID_BACKEND=$(shell AWS_PROFILE=cl-viewer-dev aws secretsmanager get-secret-value --secret-id clviewer/dev | jq '.SecretString | fromjson | .LL_CLIENT_ID_BACKEND')"\\n\
	"LL_CLIENT_SECRET_BACKEND=$(shell AWS_PROFILE=cl-viewer-dev aws secretsmanager get-secret-value --secret-id clviewer/dev | jq '.SecretString | fromjson | .LL_CLIENT_SECRET_BACKEND')" > ./amplify/backend/function/clviewers3sensingimporter/.env

start:
		LL_AUTH_URL=https://auth-pre.landlog.info \
		LL_API_URL=https://api-pre.landlog.info \
		JWT_SECRET=cyocmrseaesstue \
		CLIENT_ID=$(shell AWS_PROFILE=cl-viewer-dev aws secretsmanager get-secret-value --secret-id clviewer/dev | jq '.SecretString | fromjson | .LL_CLIENT_ID_FRONTEND') \
		CLIENT_SECRET=$(shell AWS_PROFILE=cl-viewer-dev aws secretsmanager get-secret-value --secret-id clviewer/dev | jq '.SecretString | fromjson | .LL_CLIENT_SECRET_FRONTEND') \
		REDIRECT_URI=http://localhost:3000/oauth \
		STORAGE_CLVIEWERUSERDATA_NAME=clvieweruserdata-dev \
		STORAGE_CLVIEWERRAWDATA_NAME=clviewerrawdata-dev \
		AWS_PROFILE=cl-viewer-dev \
		AWS_REGION=ap-northeast-1 \
		nodemon amplify/backend/function/clviewerexpress/ts/app.ts -V


###############################
#### for architecture image ###
###############################

pip-install:
	pip install diagrams

generate-architecture:
	python architecture/main.py
