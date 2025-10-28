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

    if (event.httpMethod !== "PUT") {
      return errorResponse(405, "Method not allowed. Use PUT request.");
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

    if (!event.body) {
      return errorResponse(400, "Request body is required");
    }

    let updateData;
    try {
      updateData = JSON.parse(event.body);
    } catch (parseError) {
      return errorResponse(400, "Invalid JSON in request body");
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(
        400,
        "At least one field must be provided for update"
      );
    }

    if (updateData.amount !== undefined) {
      if (typeof updateData.amount !== "number" || updateData.amount <= 0) {
        return errorResponse(400, "Amount must be a positive number");
      }
    }

    if (updateData.category !== undefined) {
      if (
        typeof updateData.category !== "string" ||
        updateData.category.trim() === ""
      ) {
        return errorResponse(400, "Category must be a non-empty string");
      }
      updateData.category = updateData.category.trim();
    }

    if (updateData.description !== undefined) {
      if (
        typeof updateData.description !== "string" ||
        updateData.description.trim() === ""
      ) {
        return errorResponse(400, "Description must be a non-empty string");
      }
      updateData.description = updateData.description.trim();
    }

    if (updateData.type !== undefined) {
      if (updateData.type !== "income" && updateData.type !== "expense") {
        return errorResponse(400, "Type must be either 'income' or 'expense'");
      }
    }

    const existingExpense = await expensesService.getExpenseById(
      userId,
      expenseId
    );
    if (!existingExpense) {
      return errorResponse(404, "Expense not found");
    }

    const updatedExpense = await expensesService.updateExpense(
      userId,
      expenseId,
      updateData
    );

    return successResponse(200, {
      message: "Expense updated successfully",
      expense: updatedExpense,
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
