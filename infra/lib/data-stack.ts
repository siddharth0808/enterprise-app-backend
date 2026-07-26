import { Stack, StackProps, RemovalPolicy, CfnOutput, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export interface DataStackProps extends StackProps {
  stage?: string;
}
export class DataStack extends Stack {
  public readonly businessTable: dynamodb.Table;
  public readonly productsTable: dynamodb.Table;
  public readonly ordersTable: dynamodb.Table;
  public readonly productsBucket: s3.Bucket;
  public readonly imagesDistribution: cloudfront.Distribution;


  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // Businesses — one item per business. PK = ownerId (Cognito sub).
    this.businessTable = new dynamodb.Table(this, `BusinessTable-${props.stage}`, {
      tableName: `Business-${props.stage}`,
      partitionKey: { name: 'ownerId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    // lookup by phone number for login, mirrors the old "Canteen Owners" keyed-by-phone structure
    this.businessTable.addGlobalSecondaryIndex({
      indexName: 'byPhone',
      partitionKey: { name: 'ownerMobile', type: dynamodb.AttributeType.STRING },
    });

    // Products — PK = ownerId, SK = productId. All products for one canteen live together.
    this.productsTable = new dynamodb.Table(this, `ProductsTable-${props.stage}`, {
      tableName: `Products-${props.stage}`,
      partitionKey: { name: 'ownerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Orders — PK = ownerId, SK = orderId. GSI lets a customer look up their own orders.
    this.ordersTable = new dynamodb.Table(this, `OrdersTable-${props.stage}`, {
      tableName: `Orders-${props.stage}`,
      partitionKey: { name: 'ownerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_IMAGE, // enables future push-notification-on-status-change
    });
    this.ordersTable.addGlobalSecondaryIndex({
      indexName: 'byCustomerPhone',
      partitionKey: { name: 'customerPhone', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
    });

    // Images — product photos. Lambda hands out presigned PUT/GET URLs; the app
    // never gets direct bucket credentials.
    this.productsBucket = new s3.Bucket(this, `ProductsBucket-${props.stage}`, {
      bucketName: undefined, // let CDK generate a unique name
      removalPolicy: RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ['*'], // tighten to your app's origin(s) once known
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [{ noncurrentVersionExpiration: Duration.days(30) }],
    });

    // CloudFront serves the (still-private) bucket via Origin Access Control —
    // no public bucket policy needed, but reads are free of per-request signing
    // and get cached at the edge. productImgUri becomes a permanent path like
    // "products/<ownerId>/<uuid>" and the app builds the full URL as
    // `https://<distributionDomain>/<productImgUri>`.
    this.imagesDistribution = new cloudfront.Distribution(this, `ImagesDistribution-${props.stage}`, {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.productsBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    new CfnOutput(this, 'ProductsBucketName', { value: this.productsBucket.bucketName });
      new CfnOutput(this, 'ImagesDistributionDomain', { value: this.imagesDistribution.distributionDomainName });
  }
}
