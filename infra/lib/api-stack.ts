import { Stack, StackProps, CfnOutput } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { HttpJwtAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import { APP_NAME } from "../constant";

export interface ApiStackProps extends StackProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  businessSetupFn: lambdaNode.NodejsFunction;
  productsFn: lambdaNode.NodejsFunction;
  ordersFn: lambdaNode.NodejsFunction;
  imagesFn: lambdaNode.NodejsFunction;
  transactionsFn: lambdaNode.NodejsFunction;
  invoicesFn: lambdaNode.NodejsFunction;

  stage?: string;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // API Gateway validates the Cognito-issued JWT on every request natively —
    // this is the only "auth" component in the whole stack, and it involves no Lambda.
    const authorizer = new HttpJwtAuthorizer(
      `${APP_NAME}-authorizer-${props.stage}`,
      `https://cognito-idp.${this.region}.amazonaws.com/${props.userPool.userPoolId}`,
      { jwtAudience: [props.userPoolClient.userPoolClientId] },
    );

    const httpApi = new apigwv2.HttpApi(
      this,
      `${APP_NAME}-api-${props.stage}`,
      {
        apiName: `${APP_NAME}-api-${props.stage}`,
        createDefaultStage: false,
        corsPreflight: {
          allowOrigins: ["*"], // tighten once the app's origin(s) are known
          allowMethods: [apigwv2.CorsHttpMethod.ANY],
          allowHeaders: ["authorization", "content-type"],
        },
        defaultAuthorizer: authorizer,
      },
    );

    new apigwv2.HttpStage(this, `${APP_NAME}-stage-${props.stage}`, {
      httpApi,
      stageName: props.stage,
      autoDeploy: true,
    });

    const businessSetupIntegration = new HttpLambdaIntegration(
      "BusinessSetupIntegration",
      props.businessSetupFn,
    );
    const productsIntegration = new HttpLambdaIntegration(
      "ProductsIntegration",
      props.productsFn,
    );
    const ordersIntegration = new HttpLambdaIntegration(
      "OrdersIntegration",
      props.ordersFn,
    );
    const imagesIntegration = new HttpLambdaIntegration(
      "ImagesIntegration",
      props.imagesFn,
    );
    const transactionsIntegration = new HttpLambdaIntegration(
      "transactionsIntegration",
      props.transactionsFn,
    );

    const invoicesIntegration = new HttpLambdaIntegration(
      "invoicesIntegration",
      props.invoicesFn,
    );

    httpApi.addRoutes({
      path: "/business/me",
      methods: [apigwv2.HttpMethod.GET],
      integration: businessSetupIntegration,
    });

    httpApi.addRoutes({
      path: "/business/setup",
      methods: [apigwv2.HttpMethod.POST],
      integration: businessSetupIntegration,
    });

    httpApi.addRoutes({
      path: "/products",
      methods: [apigwv2.HttpMethod.POST],
      integration: productsIntegration,
    });

    httpApi.addRoutes({
      path: "/products/{businessId}",
      methods: [apigwv2.HttpMethod.GET],
      integration: productsIntegration,
    });

    httpApi.addRoutes({
      path: "/inventory/{businessId}/{productId}/transactions",
      methods: [apigwv2.HttpMethod.POST, apigwv2.HttpMethod.GET],
      integration: transactionsIntegration,
    });

    httpApi.addRoutes({
      path: "/invoices",
      methods: [apigwv2.HttpMethod.POST],
      integration: invoicesIntegration,
    });

    new CfnOutput(this, "ApiUrl", { value: httpApi.apiEndpoint });
  }
}
