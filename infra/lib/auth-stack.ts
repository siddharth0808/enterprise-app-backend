import { Stack, StackProps, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

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
    this.userPool = new cognito.UserPool(this, `enterprise-app-user-pool-${props.stage}`, {
      userPoolName: `enterprise-app-user-pool-${props.stage}`,
      signInAliases: { phone: true, email: true },
      autoVerify: { phone: true, email: true }, // enable SNS/SES verification later if desired
      standardAttributes: {
        phoneNumber: { required: true, mutable: false },
        email: { required: true, mutable: true },
        fullname: { required: true, mutable: true },
      },
      customAttributes: {
        // distinguishes "canteen owner" accounts from "customer" accounts
        role: new cognito.StringAttribute({ mutable: false }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: false,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
      selfSignUpEnabled: true,
      removalPolicy: RemovalPolicy.RETAIN, // don't accidentally delete user accounts
    });

    this.userPoolClient = new cognito.UserPoolClient(this, `enterprise-app-user-pool-client-${props.stage}`, {
      userPool: this.userPool,
      authFlows: { userPassword: true, userSrp: true },
      generateSecret: false, // mobile app clients (Expo) must not have a client secret
      accessTokenValidity: undefined, // defaults to 1 hour
      refreshTokenValidity: undefined, // defaults to 30 days
    });

    new CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
    new CfnOutput(this, 'UserPoolIssuer', {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}`,
    });
  }
}
