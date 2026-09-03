import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({});

export class LambdaService {
  constructor() {}

  public async invokeAsync(fn: string, event: any) {
    try {
      await lambda.send(
        new InvokeCommand({
          FunctionName: fn,
          InvocationType: "Event",
          Payload: Buffer.from(JSON.stringify(event)),
        }),
      );
    } catch (error:any) {
        throw Error(error.message);
    }
  }
}
export const lambdaService = new LambdaService();