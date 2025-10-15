#!/bin/bash

if [ -z "$ENVIRONMENT" ]; then
  echo "Error: ENVIRONMENT environment variable is not set"
  exit 1
fi

if [ -z "$AWS_REGION" ]; then
  echo "Error: AWS_REGION environment variable is not set"
  exit 1
fi

echo "Packaging and deploying serverless application for environment: $ENVIRONMENT"
echo "Using AWS region: $AWS_REGION"

cd apps/backend

echo "Installing dependencies..."
npm ci

if [ "$ENVIRONMENT" = "prod" ]; then
  STAGE="prod"
elif [ "$ENVIRONMENT" = "dev" ]; then
  STAGE="dev"
else
  STAGE="staging"
fi

echo "Using stage: $STAGE"

echo "Setting up environment variables..."
cat > .env << EOF
DEPLOYMENT_ENV=$STAGE
NODE_ENV=$([ "$STAGE" = "dev" ] && echo "development" || echo "production")
MONGO_URL=${MONGO_URL}
EOF

echo "Packaging serverless application..."
npx serverless package --stage $STAGE

echo "Deploying serverless application..."
npx serverless deploy --stage $STAGE

echo "Serverless application successfully deployed to $ENVIRONMENT environment"
