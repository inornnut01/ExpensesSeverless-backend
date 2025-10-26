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
    if (event.httpMethod !== "POST") {
      return errorResponse(405, "Method not allowed. Use POST request.");
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
    // Parse request body
    if (!event.body) {
      return errorResponse(400, "Request body is required");
    }
    let expenseData;
    try {
      expenseData = JSON.parse(event.body);
    } catch (parseError) {
      return errorResponse(400, "Invalid JSON in request body");
    }
    // Validate required fields
    const { amount, category, description } = expenseData;
    if (!amount || !category) {
      return errorResponse(400, "Missing required fields: amount and category");
    }
    // Validate data types
    if (typeof amount !== "number" || amount <= 0) {
      return errorResponse(400, "Amount must be a positive number");
    }
    if (typeof category !== "string" || category.trim() === "") {
      return errorResponse(400, "Category must be a non-empty string");
      //TODO: Check category in frontend or can be add it.
    }
    if (typeof description !== "string" || description.trim() === "") {
      return errorResponse(400, "Description must be a non-empty string");
    }
    // Create expense using service
    const expense = await expensesService.createExpense(userId, {
      amount,
      category: category.trim(),
      description: description.trim(),
      tags: expenseData.tags || [],
    });
    // Return success response
    return successResponse(201, {
      message: "Expense created successfully",
      expense,
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
