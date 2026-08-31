import { Stack, StackProps, RemovalPolicy, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { ALLOW_ORIGINS, APP_NAME } from "../constant";

export interface DataStackProps extends StackProps {
  stage?: string;
}
export class DataStack extends Stack {
  public readonly businessTable: dynamodb.Table;
  public readonly productsTable: dynamodb.Table;
  public readonly ordersTable: dynamodb.Table;
  public readonly transactionsTable: dynamodb.Table;
  public readonly invoicesTable: dynamodb.Table;

  public readonly inventoryFlowBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // Businesses — one item per business. PK = ownerId (Cognito sub).
    this.businessTable = new dynamodb.Table(
      this,
      `${APP_NAME}-businessTable-${props.stage}`,
      {
        tableName: `${APP_NAME}-business-${props.stage}`,
        partitionKey: { name: "ownerId", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
      },
    );

    this.businessTable.addGlobalSecondaryIndex({
      indexName: "byPhone",
      partitionKey: {
        name: "ownerMobile",
        type: dynamodb.AttributeType.STRING,
      },
    });

    this.productsTable = new dynamodb.Table(
      this,
      `${APP_NAME}-productsTable-${props.stage}`,
      {
        tableName: `${APP_NAME}-products-${props.stage}`,
        partitionKey: {
          name: "businessId",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
      },
    );

    this.productsTable.addGlobalSecondaryIndex({
      indexName: "byProductName",
      partitionKey: {
        name: "businessId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "name",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.transactionsTable = new dynamodb.Table(
      this,
      `${APP_NAME}-transactionsTable-${props.stage}`,
      {
        tableName: `${APP_NAME}-transactions-${props.stage}`,
        partitionKey: {
          name: "productId",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
      },
    );

    this.invoicesTable = new dynamodb.Table(
      this,
      `${APP_NAME}-invoicesTable-${props.stage}`,
      {
        tableName: `${APP_NAME}-invoices-${props.stage}`,
        partitionKey: {
          name: "businessId",
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: { name: "id", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
      },
    );

    // Orders — PK = ownerId, SK = orderId. GSI lets a customer look up their own orders.
    this.ordersTable = new dynamodb.Table(
      this,
      `${APP_NAME}-ordersTable-${props.stage}`,
      {
        tableName: `${APP_NAME}-orders-${props.stage}`,
        partitionKey: { name: "ownerId", type: dynamodb.AttributeType.STRING },
        sortKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.RETAIN,
        stream: dynamodb.StreamViewType.NEW_IMAGE, // enables future push-notification-on-status-change
      },
    );

    this.ordersTable.addGlobalSecondaryIndex({
      indexName: "byCustomerPhone",
      partitionKey: {
        name: "customerPhone",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "orderId", type: dynamodb.AttributeType.STRING },
    });

    this.inventoryFlowBucket = new s3.Bucket(
      this,
      `${APP_NAME}-${props.stage}`,
      {
        bucketName: `${APP_NAME}-${props.stage}`, // let CDK generate a unique name
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        cors: [
          {
            allowedHeaders: ["*"],
            allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.HEAD],
            allowedOrigins: ALLOW_ORIGINS,
            exposedHeaders: ["ETag"],
            maxAge: 3000,
          },
        ],
      },
    );
  }
}
