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
    if (event.httpMethod !== "POST") {
      return errorResponse(405, "Method not allowed. Use POST request.");
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
    const { amount, category, description, type, date } = expenseData;
    if (!amount || !type) {
      return errorResponse(400, "Missing required fields: amount and type");
    }

    // Validate data types
    if (typeof amount !== "number" || amount <= 0) {
      return errorResponse(400, "Amount must be a positive number");
    }

    if (typeof category !== "string" || category.trim() === "") {
      return errorResponse(400, "Category must be a non-empty string");
    }

    if (typeof description !== "string" || description.trim() === "") {
      return errorResponse(400, "Description must be a non-empty string");
    }

    // Validate type field
    if (type !== "income" && type !== "expense") {
      return errorResponse(400, "Type must be either 'income' or 'expense'");
    }

    // Validate date field (optional - ถ้าไม่ส่งมาจะใช้เวลาปัจจุบัน)
    let expenseDate: string | undefined;
    if (date) {
      // ตรวจสอบว่าเป็น ISO string ที่ถูกต้องหรือไม่
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return errorResponse(400, "Invalid date format. Use ISO 8601 format.");
      }
      expenseDate = parsedDate.toISOString();
    }

    // Create expense using service
    const expense = await expensesService.createExpense(userId, {
      amount,
      category: category.trim(),
      description: description.trim(),
      type,
      tags: expenseData.tags || [],
      ...(expenseDate && { createdAt: expenseDate }),
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
