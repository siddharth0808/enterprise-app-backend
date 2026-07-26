# Enterprise app — AWS backend (CDK)

Architecture: **client → API Gateway (Cognito JWT authorizer) → Lambda → DynamoDB / S3**

No Lambda authorizer, no OIDC service to run — API Gateway's built-in JWT authorizer
validates the token Cognito issued at login, on every request, before Lambda runs.

## Stacks (deploy in this order — `bin/app.ts` already encodes the dependency)

1. **`enterprise-app-auth`** — Cognito User Pool + App Client. Issues the JWTs the app sends
   on every request.
2. **`enterprise-app-data`** — DynamoDB tables (`Owners`, `Products`, `Orders`) + S3 bucket
   for product item images.
3. **`enterprise-app-lambda`** — the 4 functions (`register`, `product`, `orders`, `images`),
   each granted least-privilege access to only the table(s)/bucket it needs.
4. **`enterprise-app-api`** — HTTP API, Cognito JWT authorizer, routes wired to the functions.

## Setup

```bash
cd infra
npm install
npm install --prefix ../functions   # Lambda dependencies, bundled in by esbuild at deploy time
npx cdk bootstrap                   # first time only, per account/region
npx cdk deploy --all
```

After deploy, note the `CfnOutput` values:
- `UserPoolId`, `UserPoolClientId` — used by the Expo app's Amplify/Cognito config
- `ApiUrl` — base URL for all requests

## Routes

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | JWT | Create owner profile after Cognito sign-up |
| POST | `/products` | JWT | Add a product item |
| GET | `/products/{ownerId}` | JWT | List a canteen's product |
| POST | `/orders` | JWT | Place an order |
| GET | `/orders/{ownerId}` | JWT | List a canteen's orders |
| PATCH | `/orders/{ownerId}/{orderId}/status` | JWT | Update order status |
| POST | `/images/presign` | JWT | Get a presigned S3 upload URL |

Every route requires an `Authorization: Bearer <id_token>` header. The Expo app gets
this token from Cognito after login (via `amazon-cognito-identity-js` or Amplify Auth)
and attaches it to every request.

## Not included yet (add if/when needed)

- Push notification on order status change (DynamoDB Streams on `Orders` table is
  already enabled — wire a stream-triggered Lambda to SNS/Expo push when you want it)
- Rate limiting / usage plans on the API
- Custom domain + ACM cert for the API URL
