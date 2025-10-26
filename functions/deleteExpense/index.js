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
    if (event.httpMethod !== "DELETE") {
      return errorResponse(405, "Method not allowed. Use DELETE request.");
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
    // Get expense ID from path parameters
    const expenseId = event.pathParameters?.id;
    if (!expenseId) {
      return errorResponse(400, "Expense ID is required in path parameters");
    }
    // Check if expense exists
    const existingExpense = await expensesService.getExpenseById(
      userId,
      expenseId
    );
    if (!existingExpense) {
      return errorResponse(404, "Expense not found");
    }
    // Delete expense using service
    await expensesService.deleteExpense(userId, expenseId);
    // Return success response
    return successResponse(200, {
      message: "Expense deleted successfully",
      deletedExpenseId: expenseId,
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
