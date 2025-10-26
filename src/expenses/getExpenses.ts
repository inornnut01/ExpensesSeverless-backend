import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { ExpensesService } from "../services/expenses.service.js";
import {
  successResponse,
  errorResponse,
  corsResponse,
} from "../utils/response.js";
import { authHelper } from "../utils/authHelper.js";

// Initialize service
const expensesService = new ExpensesService();

// Main Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    // Handle CORS preflight request
    if (event.httpMethod === "OPTIONS") {
      return corsResponse();
    }

    // Validate HTTP method
    if (event.httpMethod !== "GET") {
      return errorResponse(405, "Method not allowed. Use GET request.");
    }

    // Validate authentication
    let userId: string;
    try {
      const authResult = authHelper.validateAuthMock(event.headers);
      userId = authResult.userId;
    } catch (authError) {
      return errorResponse(
        401,
        `Authentication failed: ${
          authError instanceof Error ? authError.message : "Unknown error"
        }`
      );
    }

    // Get query parameters for filtering/pagination
    const queryParams = event.queryStringParameters || {};
    const filters = {
      limit: queryParams.limit ? parseInt(queryParams.limit) : 25,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      category: queryParams.category,
      type: queryParams.type as "income" | "expense" | undefined,
    };

    // Validate type filter if provided
    if (
      filters.type &&
      filters.type !== "income" &&
      filters.type !== "expense"
    ) {
      return errorResponse(
        400,
        "Type filter must be either 'income' or 'expense'"
      );
    }

    // Fetch expenses from DynamoDB using service
    const expenses = await expensesService.getExpenses(userId, filters);

    // Get summary statistics
    const summary = await expensesService.getExpenseSummary(userId, filters);

    // Return success response
    return successResponse(200, {
      expenses,
      summary: {
        ...summary,
        pagination: {
          limit: filters.limit,
          hasMore: expenses.length === filters.limit,
        },
      },
      filters: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        category: filters.category,
      },
    });
  } catch (error) {
    console.error("Handler error:", error);
    return errorResponse(
      500,
      `Internal server error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
