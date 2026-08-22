import { Stack, StackProps, CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as cdk from "aws-cdk-lib";
import { APP_NAME } from "../constant";

export interface AuthStackProps extends StackProps {
  stage?: string;
}

export class AuthStack extends Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    // Users sign in with phone number (matches the original app's login-by-phone flow).
    // Cognito issues ID/access/refresh JWTs on sign-in — these are validated natively
    // by API Gateway's JWT authorizer, no custom verification code needed.
    this.userPool = new cognito.UserPool(
      this,
      `${APP_NAME}-user-pool-${props.stage}`,
      {
        userPoolName: `${APP_NAME}-user-pool-${props.stage}`,
        signInAliases: { email: true },
        autoVerify: { email: true }, // enable SNS/SES verification later if desired
        standardAttributes: {
          email: { required: true, mutable: false },
          givenName: { required: true, mutable: false },
        },
        customAttributes: {
          role: new cognito.StringAttribute({ mutable: false }),
        },
        passwordPolicy: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: false,
          requireDigits: true,
          requireSymbols: false,
        },
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        selfSignUpEnabled: true,
      },
    );

    this.userPoolClient = new cognito.UserPoolClient(
      this,
      `${APP_NAME}-user-pool-client-${props.stage}`,
      {
        userPool: this.userPool,
        authFlows: { userPassword: true, userSrp: true },
        generateSecret: false, // mobile app clients (Expo) must not have a client secret
        accessTokenValidity: undefined, // defaults to 1 hour
        refreshTokenValidity: undefined, // defaults to 30 days
      },
    );

    new CfnOutput(this, "UserPoolId", { value: this.userPool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
    new CfnOutput(this, "UserPoolIssuer", {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}`,
    });
  }
}
