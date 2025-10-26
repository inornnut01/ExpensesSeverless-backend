import { ExpensesService } from "/opt/nodejs/services/expenses.service.js";
import {
  successResponse,
  errorResponse,
  corsResponse,
} from "/opt/nodejs/utils/response.js";
import { authHelper } from "/opt/nodejs/utils/authHelper.js";
// Initialize service
const expensesService = new ExpensesService();
// Main Lambda handler
export const handler = async (event, context) => {
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
    let userId;
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
    };
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
