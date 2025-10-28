import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../expenses/deleteExpense.js";
import { ExpensesService } from "../services/expenses.service.js";
import { authHelper } from "../utils/authHelper.js";

jest.mock("../services/expenses.service.js");
jest.mock("../utils/authHelper.js");

const createMockEvent = (
  overrides?: Partial<APIGatewayProxyEvent>
): APIGatewayProxyEvent => {
  return {
    httpMethod: "DELETE",
    headers: {
      Authorization: "Bearer valid-token",
    },
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
    functionName: "deleteExpense",
    functionVersion: "$LATEST",
    invokedFunctionArn:
      "arn:aws:lambda:us-east-1:123456789012:function:deleteExpense",
    memoryLimitInMB: "128",
    awsRequestId: "test-request-id",
    logGroupName: "/aws/lambda/deleteExpense",
    logStreamName: "2024/01/01/[$LATEST]test",
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  } as Context;
};

describe("deleteExpense Lambda Handler", () => {
  let deleteExpenseSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    deleteExpenseSpy = jest.spyOn(ExpensesService.prototype, "deleteExpense");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("Should return CORS response for OPTIONS request", async () => {
    const event = createMockEvent({ httpMethod: "OPTIONS" });
    const context = createMockContext();
    const result = await handler(event, context);
    expect(result.statusCode).toBe(200);
    expect(result.headers).toHaveProperty("Access-Control-Allow-Origin");
    expect(result.body).toBe("");
  });

  test("Should return error 405 when method is not DELETE", async () => {
    const event = createMockEvent({ httpMethod: "GET" });
    const context = createMockContext();
    const result = await handler(event, context);
    expect(result.statusCode).toBe(405);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Method not allowed. Use DELETE request.");
  });

  test("Should return error 401 when authentication fails", async () => {
    const event = createMockEvent({
      httpMethod: "DELETE",
      headers: {
        Authorization: "Bearer invalid-token",
      },
      pathParameters: {
        expenseId: "expense-123456789",
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
      httpMethod: "DELETE",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: null,
    });
    const context = createMockContext();

    // Mock authentication to pass
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Expense ID is required in path parameters");
    expect(authHelper.validateCognitoToken).toHaveBeenCalledWith(event.headers);
  });

  test("Should return error 404 when expense not found", async () => {
    const event = createMockEvent({
      httpMethod: "DELETE",
      headers: {
        Authorization: "Bearer valid-token",
      },
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

    deleteExpenseSpy.mockResolvedValue(undefined);

    const result = await handler(event, context);
    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Expense not found");
    expect(ExpensesService.prototype.getExpenseById).toHaveBeenCalledWith(
      "test-user-123",
      "non-existent-expense-id"
    );
  });

  test("Should return error 400 when expenseId is empty string", async () => {
    const event = createMockEvent({
      httpMethod: "DELETE",
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
      httpMethod: "DELETE",
      headers: {},
      pathParameters: {
        expenseId: "expense-123456789",
      },
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
      httpMethod: "DELETE",
      headers: {
        Authorization: "Bearer invalid-token",
      },
      pathParameters: {
        expenseId: "expense-123456789",
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

  test("Should return error 500 when getExpenseById throws error", async () => {
    const event = createMockEvent({
      httpMethod: "DELETE",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        expenseId: "expense-123456789",
      },
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
  });

  test("Should return error 500 when deleteExpense throws error", async () => {
    const event = createMockEvent({
      httpMethod: "DELETE",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    jest.mocked(ExpensesService.prototype.getExpenseById).mockResolvedValue({
      id: "expense-123456789",
      userId: "test-user-123",
      amount: 100,
      category: "Food",
      description: "Test expense",
      type: "expense",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });

    deleteExpenseSpy.mockRejectedValue(
      new Error("Failed to delete from database")
    );

    const result = await handler(event, context);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Internal server error");
    expect(body.error).toContain("Failed to delete from database");
  });

  test("Should return success 200 when expense is deleted successfully", async () => {
    const event = createMockEvent({
      httpMethod: "DELETE",
      headers: {
        Authorization: "Bearer valid-token",
      },
      pathParameters: {
        expenseId: "expense-123456789",
      },
    });
    const context = createMockContext();
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });
    jest.mocked(ExpensesService.prototype.getExpenseById).mockResolvedValue({
      id: "expense-123456789",
      userId: "test-user-123",
      amount: 100,
      category: "Food",
      description: "Test expense",
      type: "expense",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    });
    deleteExpenseSpy.mockResolvedValue(event);
    const result = await handler(event, context);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Expense deleted successfully");
    expect(body.deletedExpenseId).toBe("expense-123456789");
    expect(deleteExpenseSpy).toHaveBeenCalledWith(
      "test-user-123",
      "expense-123456789"
    );
  });
});
