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

const expensesService = new ExpensesService();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    if (event.httpMethod === "OPTIONS") {
      return corsResponse();
    }

    if (event.httpMethod !== "DELETE") {
      return errorResponse(405, "Method not allowed. Use DELETE request.");
    }

    let userId: string;
    try {
      const authResult = await authHelper.validateCognitoToken(event.headers);
      userId = authResult.userId;
    } catch (authError) {
      return errorResponse(
        401,
        `Authentication failed: ${
          authError instanceof Error ? authError.message : "Unknown error"
        }`
      );
    }

    const expenseId = event.pathParameters?.expenseId;
    if (!expenseId) {
      return errorResponse(400, "Expense ID is required in path parameters");
    }

    const existingExpense = await expensesService.getExpenseById(
      userId,
      expenseId
    );
    if (!existingExpense) {
      return errorResponse(404, "Expense not found");
    }

    await expensesService.deleteExpense(userId, expenseId);

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
