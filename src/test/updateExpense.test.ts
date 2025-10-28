import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../expenses/updateExpense.js";
import { ExpensesService } from "../services/expenses.service.js";
import { authHelper } from "../utils/authHelper.js";

jest.mock("../services/expenses.service.js");
jest.mock("../utils/authHelper.js");

const createMockEvent = (
  overrides?: Partial<APIGatewayProxyEvent>
): APIGatewayProxyEvent => {
  return {
    httpMethod: "PUT",
    headers: {
      Authorization: "Bearer valid-token",
    },
    body: '{"amount": 100, "category": "Food", "description": "Lunch", "type": "income"}',
    pathParameters: {
      expenseId: "expense-123456789",
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {} as any,
    resource: "",
    path: "",
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    ...overrides,
  } as APIGatewayProxyEvent;
};

const createMockContext = (): Context => {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: "updateExpense",
    functionVersion: "$LATEST",
    invokedFunctionArn:
      "arn:aws:lambda:us-east-1:123456789012:function:updateExpense",
    memoryLimitInMB: "128",
    awsRequestId: "test-request-id",
    logGroupName: "/aws/lambda/updateExpense",
    logStreamName: "2024/01/01/[$LATEST]test",
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  } as Context;
};

describe("updateExpense Lambda Handler", () => {
  let updateExpenseSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    updateExpenseSpy = jest.spyOn(ExpensesService.prototype, "updateExpense");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("Should return CORS response for OPTIONS request", async () => {
    const event = createMockEvent({
      httpMethod: "OPTIONS",
    });
    const context = createMockContext();
    const result = await handler(event, context);
    expect(result.statusCode).toBe(200);
    expect(result.headers).toHaveProperty("Access-Control-Allow-Origin");
    expect(result.body).toBe("");
  });

  test("Should return error 405 when method is not PUT", async () => {
    const event = createMockEvent({ httpMethod: "GET" });
    const context = createMockContext();

    const result = await handler(event, context);
    expect(result.statusCode).toBe(405);

    const body = JSON.parse(result.body);
    expect(body.error).toContain("Method not allowed. Use PUT request.");
  });

  test("Should return error 401 when authentication fails", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });
    const context = createMockContext();
    jest
      .mocked(authHelper.validateCognitoToken)
      .mockRejectedValue(new Error("Invalid token"));

    const result = await handler(event, context);
    expect(result.statusCode).toBe(401);

    const body = JSON.parse(result.body);
    expect(body.error).toContain("Authentication failed");
    expect(body.error).toContain("Invalid token");
    expect(authHelper.validateCognitoToken).toHaveBeenCalledWith(event.headers);
  });

  test("Should return error 400 when expenseId is missing", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: null,
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Expense ID is required in path parameters");
    expect(authHelper.validateCognitoToken).toHaveBeenCalledWith(event.headers);
  });

  test("Should return error 400 when expenseId is empty string", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        expenseId: "",
      },
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Expense ID is required in path parameters");
  });

  test("Should return error 401 when Authorization header is missing", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {},
    });
    const context = createMockContext();

    jest
      .mocked(authHelper.validateCognitoToken)
      .mockRejectedValue(new Error("Authorization header is missing"));

    const result = await handler(event, context);
    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Authentication failed");
  });

  test("Should return error 401 when authentication fails with non-Error object", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer invalid-token",
      },
    });
    const context = createMockContext();

    jest
      .mocked(authHelper.validateCognitoToken)
      .mockRejectedValue("String error message");

    const result = await handler(event, context);
    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Authentication failed");
    expect(body.error).toContain("Unknown error");
  });

  test("Should return error 400 when request body is missing", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        expenseId: "expense-123456789",
      },
      body: null,
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Request body is required");
    expect(authHelper.validateCognitoToken).toHaveBeenCalledWith(event.headers);
  });

  test("Should return error 400 when JSON in body is invalid", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        expenseId: "expense-123456789",
      },
      body: "{invalid json",
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Invalid JSON in request body");
    expect(authHelper.validateCognitoToken).toHaveBeenCalledWith(event.headers);
  });

  test("Should return error 400 when request body is empty", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        expenseId: "expense-123456789",
      },
      body: "{}",
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain(
      "At least one field must be provided for update"
    );
    expect(authHelper.validateCognitoToken).toHaveBeenCalledWith(event.headers);
  });

  test("Should return error 400 when amount is not a positive number (negative)", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: '{ "amount": -100 }',
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Amount must be a positive number");
    expect(authHelper.validateCognitoToken).toHaveBeenCalledWith(event.headers);
  });

  test("Should return error 400 when amount is zero", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: '{ "amount": 0 }',
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Amount must be a positive number");
  });

  test("Should return error 400 when amount is not a number", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: '{ "amount": "not-a-number" }',
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Amount must be a positive number");
  });

  test("Should return error 400 when category is empty string", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: '{"amount": 100, "category": ""}',
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Category must be a non-empty string");
    expect(authHelper.validateCognitoToken).toHaveBeenCalledWith(event.headers);
  });

  test("Should return error 400 when category is not a string", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: '{"amount": 100, "category": 123}',
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Category must be a non-empty string");
  });

  test("Should return error 400 when category is whitespace only", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: '{"amount": 100, "category": "   "}',
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Category must be a non-empty string");
  });
  test("Should return error 400 when description is empty string", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: '{"amount": 100, "category": "Food", "description": ""}',
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Description must be a non-empty string");
    expect(authHelper.validateCognitoToken).toHaveBeenCalledWith(event.headers);
  });

  test("Should return error 400 when description is not a string", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: '{"amount": 100, "category": "Food", "description": 123}',
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Description must be a non-empty string");
  });

  test("Should return error 400 when description is whitespace only", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: '{"amount": 100, "category": "Food", "description": "   "}',
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Description must be a non-empty string");
  });

  test("Should return error 400 when type is not a valid value", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: '{"amount": 100, "category": "Food", "description": "Lunch", "type": "invalid-type"}',
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Type must be either 'income' or 'expense'");
    expect(authHelper.validateCognitoToken).toHaveBeenCalledWith(event.headers);
  });

  test("Should return error 404 when expense not found", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      body: '{"amount": 100, "category": "Food", "description": "Lunch", "type": "income"}',
      pathParameters: {
        expenseId: "non-existent-expense-id",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });
    jest
      .mocked(ExpensesService.prototype.getExpenseById)
      .mockResolvedValue(null);

    const result = await handler(event, context);
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Expense not found");
    expect(ExpensesService.prototype.getExpenseById).toHaveBeenCalledWith(
      "test-user-123",
      "non-existent-expense-id"
    );
  });

  test("Should return error 500 when getExpenseById throws error", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        expenseId: "expense-123456789",
      },
      body: '{"amount": 100, "category": "Food", "description": "Lunch", "type": "income"}',
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });
    jest
      .mocked(ExpensesService.prototype.getExpenseById)
      .mockRejectedValue(new Error("Database connection error"));

    const result = await handler(event, context);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Internal server error");
    expect(body.error).toContain("Database connection error");
    expect(ExpensesService.prototype.getExpenseById).toHaveBeenCalledWith(
      "test-user-123",
      "expense-123456789"
    );
  });

  test("Should return error 500 when updateExpense throws error", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        expenseId: "expense-123456789",
      },
      body: '{"amount": 100, "category": "Food", "description": "Lunch", "type": "income"}',
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });
    jest.mocked(ExpensesService.prototype.getExpenseById).mockResolvedValue({
      id: "expense-123456789",
      userId: "test-user-123",
      amount: 1000,
      category: "Food",
      description: "Lunch",
      type: "income",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
    updateExpenseSpy.mockRejectedValue(
      new Error("Failed to update expense in database")
    );

    const result = await handler(event, context);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Internal server error");
    expect(body.error).toContain("Failed to update expense in database");
  });

  test("Should return success 200 when expense is updated successfully", async () => {
    const event = createMockEvent({
      httpMethod: "PUT",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        expenseId: "expense-123456789",
      },
      body: '{"amount": 100, "category": "Food", "description": "Lunch", "type": "income"}',
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });
    jest.mocked(ExpensesService.prototype.getExpenseById).mockResolvedValue({
      id: "expense-123456789",
      userId: "test-user-123",
      amount: 1000,
      category: "Food",
      description: "Lunch",
      type: "income",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
    updateExpenseSpy.mockResolvedValue({
      id: "expense-123456789",
      userId: "test-user-123",
      amount: 100,
      category: "Food",
      description: "Lunch",
      type: "income",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
    const result = await handler(event, context);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Expense updated successfully");
    expect(body.expense).toEqual({
      id: "expense-123456789",
      userId: "test-user-123",
      amount: 100,
      category: "Food",
      description: "Lunch",
      type: "income",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
    expect(updateExpenseSpy).toHaveBeenCalledWith(
      "test-user-123",
      "expense-123456789",
      { amount: 100, category: "Food", description: "Lunch", type: "income" }
    );
  });
});
