import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';

export interface LambdaStackProps extends StackProps {
  businessTable: dynamodb.Table;
  productsTable: dynamodb.Table;
  ordersTable: dynamodb.Table;
  productsBucket: s3.Bucket;
  stage?: string;
}

export class LambdaStack extends Stack {
  public readonly registerFn: lambda.Function;
  public readonly productsFn: lambda.Function;
  public readonly ordersFn: lambda.Function;
  public readonly imagesFn: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const commonProps = {
      runtime: lambda.Runtime.NODEJS_24_X,
      timeout: Duration.seconds(10),
      memorySize: 256,
    };

    this.registerFn = new lambda.Function(this, `RegisterFn-${props.stage}`, {
      ...commonProps,
      functionName: `RegisterFn-${props.stage}`,
      code: lambda.Code.fromAsset("../functions/dist/register"),
      handler: 'index.handler',
      environment: { BUSINESS_TABLE: props.businessTable.tableName },
    });
    props.businessTable.grantWriteData(this.registerFn);

    this.productsFn = new lambda.Function(this, `ProductsFn-${props.stage}`, {
      ...commonProps,
      functionName: `ProductsFn-${props.stage}`,
      code: lambda.Code.fromAsset("../functions/dist/products"),
      handler: 'index.handler',
      environment: { PRODUCTS_TABLE: props.productsTable.tableName },
    });
    props.productsTable.grantReadWriteData(this.productsFn);

    this.ordersFn = new lambda.Function(this, `OrdersFn-${props.stage}`, {
      ...commonProps,
      functionName: `OrdersFn-${props.stage}`,
      code: lambda.Code.fromAsset("../functions/dist/orders"),
      handler: 'index.handler',
      environment: { ORDERS_TABLE: props.ordersTable.tableName },
    });
    props.ordersTable.grantReadWriteData(this.ordersFn);

    this.imagesFn = new lambda.Function(this, `ImagesFn-${props.stage}`, {
      ...commonProps,
      functionName: `ImagesFn-${props.stage}`,
      code: lambda.Code.fromAsset("../functions/dist/images"),
      handler: 'index.handler',
      environment: { PRODUCTS_BUCKET: props.productsBucket.bucketName },
    });
    props.productsBucket.grantReadWrite(this.imagesFn);
  }
}
