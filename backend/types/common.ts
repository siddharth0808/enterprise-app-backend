export interface UpdateItem {
  Key: Record<string, any>;
  UpdateExpression: string;
  ExpressionAttributeValues?: Record<string, any>;
  ExpressionAttributeNames?: Record<string, string>;
}