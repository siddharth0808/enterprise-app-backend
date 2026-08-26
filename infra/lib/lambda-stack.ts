import { Stack, StackProps, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";

import { APP_NAME } from "../constant";

export interface LambdaStackProps extends StackProps {
  businessTable: dynamodb.Table;
  productsTable: dynamodb.Table;
  ordersTable: dynamodb.Table;
  transactionsTable: dynamodb.Table;
  invoicesTable: dynamodb.Table;
  inventoryFlowBucket: s3.Bucket;
  productsBucket: s3.Bucket;
  stage?: string;
}

export class LambdaStack extends Stack {
  public readonly businessSetup: lambda.Function;
  public readonly productsFn: lambda.Function;
  public readonly ordersFn: lambda.Function;
  public readonly imagesFn: lambda.Function;
  public readonly transactionsFn: lambda.Function;
  public readonly invoicesFn: lambda.Function;
  public readonly invoicesProcesserFn: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const commonProps = {
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.seconds(10),
      memorySize: 256,
    };

    this.businessSetup = new lambda.Function(
      this,
      `${APP_NAME}-businessSetup-${props.stage}`,
      {
        ...commonProps,
        functionName: `${APP_NAME}-businessSetup-${props.stage}`,
        code: lambda.Code.fromAsset("../functions/dist/businessSetup"),
        handler: "index.handler",
        environment: { BUSINESS_TABLE: props.businessTable.tableName },
      },
    );
    props.businessTable.grantReadWriteData(this.businessSetup);

    this.productsFn = new lambda.Function(
      this,
      `${APP_NAME}-productsFn-${props.stage}`,
      {
        ...commonProps,
        functionName: `${APP_NAME}-productsFn-${props.stage}`,
        code: lambda.Code.fromAsset("../functions/dist/products"),
        handler: "index.handler",
        environment: {
          PRODUCTS_TABLE: props.productsTable.tableName,
          BUSINESS_TABLE: props.businessTable.tableName,
        },
      },
    );
    props.productsTable.grantReadWriteData(this.productsFn);
    props.businessTable.grantReadWriteData(this.productsFn);

    this.ordersFn = new lambda.Function(
      this,
      `${APP_NAME}-ordersFn-${props.stage}`,
      {
        ...commonProps,
        functionName: `${APP_NAME}-ordersFn-${props.stage}`,
        code: lambda.Code.fromAsset("../functions/dist/orders"),
        handler: "index.handler",
        environment: { ORDERS_TABLE: props.ordersTable.tableName },
      },
    );
    props.ordersTable.grantReadWriteData(this.ordersFn);

    this.imagesFn = new lambda.Function(
      this,
      `${APP_NAME}-imagesFn-${props.stage}`,
      {
        ...commonProps,
        functionName: `${APP_NAME}-imagesFn-${props.stage}`,
        code: lambda.Code.fromAsset("../functions/dist/images"),
        handler: "index.handler",
        environment: { PRODUCTS_BUCKET: props.productsBucket.bucketName },
      },
    );
    props.productsBucket.grantReadWrite(this.imagesFn);

    this.transactionsFn = new lambda.Function(
      this,
      `${APP_NAME}-transactionsFn-${props.stage}`,
      {
        ...commonProps,
        functionName: `${APP_NAME}-transactionsFn-${props.stage}`,
        code: lambda.Code.fromAsset("../functions/dist/transactions"),
        handler: "index.handler",
        environment: {
          PRODUCTS_TABLE: props.productsTable.tableName,
          TRANSACTIONS_TABLE: props.transactionsTable.tableName,
        },
      },
    );
    props.productsTable.grantReadWriteData(this.transactionsFn);
    props.transactionsTable.grantReadWriteData(this.transactionsFn);

    this.invoicesProcesserFn = new lambda.Function(
      this,
      `${APP_NAME}-invoicesProcesserFn-${props.stage}`,
      {
        ...commonProps,
        functionName: `${APP_NAME}-invoicesProcesserFn-${props.stage}`,
        code: lambda.Code.fromAsset("../functions/dist/invoicesProcesser"),
        handler: "index.handler",
        timeout: Duration.minutes(15),
        environment: {
          INVOICES_TABLE: props.invoicesTable.tableName,
          INVOICE_BUCKET: props.inventoryFlowBucket.bucketName,
        },
      },
    );
    props.invoicesTable.grantReadWriteData(this.invoicesProcesserFn);
    props.inventoryFlowBucket.grantRead(this.invoicesProcesserFn);
    this.invoicesProcesserFn.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["textract:AnalyzeExpense"],
        resources: ["*"],
      }),
    );

    this.invoicesFn = new lambda.Function(
      this,
      `${APP_NAME}-invoicesFn-${props.stage}`,
      {
        ...commonProps,
        functionName: `${APP_NAME}-invoicesFn-${props.stage}`,
        code: lambda.Code.fromAsset("../functions/dist/invoices"),
        handler: "index.handler",
        environment: {
          INVOICES_TABLE: props.invoicesTable.tableName,
          BUSINESS_TABLE: props.businessTable.tableName,
          INVOICE_BUCKET: props.inventoryFlowBucket.bucketName,
          INVOICES_PROCESSER_FUNCTION_NAME:
            this.invoicesProcesserFn.functionName,
        },
      },
    );
    props.businessTable.grantReadWriteData(this.invoicesFn);
    props.invoicesTable.grantReadWriteData(this.invoicesFn);
    props.inventoryFlowBucket.grantPut(this.invoicesFn);
    props.inventoryFlowBucket.grantRead(this.invoicesFn);

    this.invoicesProcesserFn.grantInvoke(this.invoicesFn);
  }
}
