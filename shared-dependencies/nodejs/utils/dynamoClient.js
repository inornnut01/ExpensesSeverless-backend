import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
export const docClient = DynamoDBDocumentClient.from(client); //client to JSON format using DynamoDBDocumentClient
// Table names from environment variables
export const TABLE_NAMES = {
  EXPENSES: process.env.EXPENSES_TABLE_NAME,
}; // const cannot be changed
