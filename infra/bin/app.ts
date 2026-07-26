#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DataStack } from '../lib/data-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const stage = app.node.tryGetContext('stage') ?? 'dev';

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

if (!env.account) {
  throw new Error(
    'AWS account is not configured. Set CDK_DEFAULT_ACCOUNT or run CDK with a profile that provides account information.'
  );
}

const auth = new AuthStack(app, `enterprise-app-auth-${stage}`, { env, stage });
const data = new DataStack(app, `enterprise-app-data-${stage}`, { env, stage });

const functions = new LambdaStack(app, `enterprise-app-lambda-${stage}`, {
  env,
  stage,
  businessTable: data.businessTable,
  productsTable: data.productsTable,
  ordersTable: data.ordersTable,
  productsBucket: data.productsBucket,
});

new ApiStack(app, `enterprise-app-api-${stage}`, {
  env,
  stage,
  userPool: auth.userPool,
  userPoolClient: auth.userPoolClient,
  registerFn: functions.registerFn,
  productsFn: functions.productsFn,
  ordersFn: functions.ordersFn,
  imagesFn: functions.imagesFn,
});
