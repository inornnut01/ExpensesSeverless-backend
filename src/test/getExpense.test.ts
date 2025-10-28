import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../expenses/getExpenses.js";
import { ExpensesService } from "../services/expenses.service.js";
import { authHelper } from "../utils/authHelper.js";

jest.mock("../services/expenses.service.js");
jest.mock("../utils/authHelper.js");

const createMockEvent = (
  overrides?: Partial<APIGatewayProxyEvent>
): APIGatewayProxyEvent => {
  return {
    httpMethod: "GET",
    headers: {
      Authorization: "Bearer valid-token",
    },
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {} as any,
    resource: "",
    path: "",
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    pathParameters: null,
    ...overrides,
  } as APIGatewayProxyEvent;
};

const createMockContext = (): Context => {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: "getExpenses",
    functionVersion: "$LATEST",
    invokedFunctionArn:
      "arn:aws:lambda:us-east-1:123456789012:function:getExpenses",
    memoryLimitInMB: "128",
    awsRequestId: "test-request-id",
    logGroupName: "/aws/lambda/getExpenses",
    logStreamName: "2024/01/01/[$LATEST]test",
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  } as Context;
};

describe("getExpenses Lambda Handler", () => {
  let getExpensesSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    getExpensesSpy = jest.spyOn(ExpensesService.prototype, "getExpenses");
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

  test("Should return error 405 when method is not GET", async () => {
    const event = createMockEvent({ httpMethod: "POST" });
    const context = createMockContext();

    const result = await handler(event, context);
    expect(result.statusCode).toBe(405);

    const body = JSON.parse(result.body);
    expect(body.error).toContain("Method not allowed. Use GET request.");
  });

  test("Should return error 401 when authentication fails", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
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

  test("Should return error 401 when Authorization header is missing", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
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
      httpMethod: "GET",
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

  test("Should return error 400 when type filter is invalid", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
      queryStringParameters: {
        type: "invalid-type",
      },
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    const result = await handler(event, context);
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain(
      "Type filter must be either 'income' or 'expense'"
    );
  });

  test("Should return error 500 when getExpenses throws error", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    getExpensesSpy.mockRejectedValue(new Error("Database connection error"));

    const result = await handler(event, context);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Internal server error");
    expect(body.error).toContain("Database connection error");
  });

  test("Should return error 500 when getExpenseSummary throws error", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    getExpensesSpy.mockResolvedValue([
      {
        id: "expense-1",
        userId: "test-user-123",
        amount: 100,
        category: "Food",
        description: "Lunch",
        type: "expense",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ]);

    jest
      .mocked(ExpensesService.prototype.getExpenseSummary)
      .mockRejectedValue(new Error("Failed to calculate summary"));

    const result = await handler(event, context);
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Internal server error");
    expect(body.error).toContain("Failed to calculate summary");
  });

  test("Should return success 200 with expenses and summary (no filters)", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });
    const context = createMockContext();

    const mockExpenses = [
      {
        id: "expense-1",
        userId: "test-user-123",
        amount: 100,
        category: "Food",
        description: "Lunch",
        type: "expense" as const,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "expense-2",
        userId: "test-user-123",
        amount: 500,
        category: "Salary",
        description: "Monthly salary",
        type: "income" as const,
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
      },
    ];

    const mockSummary = {
      totalCount: 2,
      totalAmount: 600,
      totalIncome: 500,
      totalExpense: 100,
      netAmount: 400,
      categoryBreakdown: {
        Food: 100,
        Salary: 500,
      },
      averageAmount: 300,
    };

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    getExpensesSpy.mockResolvedValue(mockExpenses);

    jest
      .mocked(ExpensesService.prototype.getExpenseSummary)
      .mockResolvedValue(mockSummary);

    const result = await handler(event, context);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);

    expect(body.expenses).toEqual(mockExpenses);
    expect(body.summary).toHaveProperty("totalCount", 2);
    expect(body.summary).toHaveProperty("totalAmount", 600);
    expect(body.summary).toHaveProperty("totalIncome", 500);
    expect(body.summary).toHaveProperty("totalExpense", 100);
    expect(body.summary).toHaveProperty("netAmount", 400);
    expect(body.summary).toHaveProperty("pagination");
    expect(body.summary.pagination).toEqual({
      limit: 25,
      hasMore: false,
    });
    expect(body.filters).toEqual({
      startDate: undefined,
      endDate: undefined,
      category: undefined,
    });

    expect(getExpensesSpy).toHaveBeenCalledWith("test-user-123", {
      limit: 25,
      startDate: undefined,
      endDate: undefined,
      category: undefined,
      type: undefined,
    });
  });

  test("Should return success 200 with filters (startDate, endDate, category)", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
      queryStringParameters: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        category: "Food",
        limit: "10",
      },
    });
    const context = createMockContext();

    const mockExpenses = [
      {
        id: "expense-1",
        userId: "test-user-123",
        amount: 100,
        category: "Food",
        description: "Lunch",
        type: "expense" as const,
        createdAt: "2024-01-15T00:00:00.000Z",
        updatedAt: "2024-01-15T00:00:00.000Z",
      },
    ];

    const mockSummary = {
      totalCount: 1,
      totalAmount: 100,
      totalIncome: 0,
      totalExpense: 100,
      netAmount: -100,
      categoryBreakdown: {
        Food: 100,
      },
      averageAmount: 100,
    };

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    getExpensesSpy.mockResolvedValue(mockExpenses);

    jest
      .mocked(ExpensesService.prototype.getExpenseSummary)
      .mockResolvedValue(mockSummary);

    const result = await handler(event, context);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);

    expect(body.expenses).toEqual(mockExpenses);
    expect(body.summary.pagination).toEqual({
      limit: 10,
      hasMore: false,
    });
    expect(body.filters).toEqual({
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      category: "Food",
    });

    expect(getExpensesSpy).toHaveBeenCalledWith("test-user-123", {
      limit: 10,
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      category: "Food",
      type: undefined,
    });
  });

  test("Should return success 200 with type filter (income)", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
      queryStringParameters: {
        type: "income",
      },
    });
    const context = createMockContext();

    const mockExpenses = [
      {
        id: "expense-1",
        userId: "test-user-123",
        amount: 5000,
        category: "Salary",
        description: "Monthly salary",
        type: "income" as const,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];

    const mockSummary = {
      totalCount: 1,
      totalAmount: 5000,
      totalIncome: 5000,
      totalExpense: 0,
      netAmount: 5000,
      categoryBreakdown: {
        Salary: 5000,
      },
      averageAmount: 5000,
    };

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    getExpensesSpy.mockResolvedValue(mockExpenses);

    jest
      .mocked(ExpensesService.prototype.getExpenseSummary)
      .mockResolvedValue(mockSummary);

    const result = await handler(event, context);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);

    expect(body.expenses).toEqual(mockExpenses);
    expect(getExpensesSpy).toHaveBeenCalledWith("test-user-123", {
      limit: 25,
      startDate: undefined,
      endDate: undefined,
      category: undefined,
      type: "income",
    });
  });

  test("Should return success 200 with type filter (expense)", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
      queryStringParameters: {
        type: "expense",
      },
    });
    const context = createMockContext();

    const mockExpenses = [
      {
        id: "expense-1",
        userId: "test-user-123",
        amount: 100,
        category: "Food",
        description: "Lunch",
        type: "expense" as const,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    ];

    const mockSummary = {
      totalCount: 1,
      totalAmount: 100,
      totalIncome: 0,
      totalExpense: 100,
      netAmount: -100,
      categoryBreakdown: {
        Food: 100,
      },
      averageAmount: 100,
    };

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    getExpensesSpy.mockResolvedValue(mockExpenses);

    jest
      .mocked(ExpensesService.prototype.getExpenseSummary)
      .mockResolvedValue(mockSummary);

    const result = await handler(event, context);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);

    expect(body.expenses).toEqual(mockExpenses);
    expect(getExpensesSpy).toHaveBeenCalledWith("test-user-123", {
      limit: 25,
      startDate: undefined,
      endDate: undefined,
      category: undefined,
      type: "expense",
    });
  });

  test("Should return success 200 with hasMore: true when limit is reached", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
      queryStringParameters: {
        limit: "2",
      },
    });
    const context = createMockContext();

    const mockExpenses = [
      {
        id: "expense-1",
        userId: "test-user-123",
        amount: 100,
        category: "Food",
        description: "Lunch",
        type: "expense" as const,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "expense-2",
        userId: "test-user-123",
        amount: 200,
        category: "Transport",
        description: "Taxi",
        type: "expense" as const,
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
      },
    ];

    const mockSummary = {
      totalCount: 2,
      totalAmount: 300,
      totalIncome: 0,
      totalExpense: 300,
      netAmount: -300,
      categoryBreakdown: {
        Food: 100,
        Transport: 200,
      },
      averageAmount: 150,
    };

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    getExpensesSpy.mockResolvedValue(mockExpenses);

    jest
      .mocked(ExpensesService.prototype.getExpenseSummary)
      .mockResolvedValue(mockSummary);

    const result = await handler(event, context);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);

    expect(body.summary.pagination).toEqual({
      limit: 2,
      hasMore: true,
    });
  });

  test("Should return empty expenses array when no expenses found", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });
    const context = createMockContext();

    const mockSummary = {
      totalCount: 0,
      totalAmount: 0,
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
      categoryBreakdown: {},
      averageAmount: 0,
    };

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    getExpensesSpy.mockResolvedValue([]);

    jest
      .mocked(ExpensesService.prototype.getExpenseSummary)
      .mockResolvedValue(mockSummary);

    const result = await handler(event, context);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);

    expect(body.expenses).toEqual([]);
    expect(body.summary.totalCount).toBe(0);
    expect(body.summary.pagination).toEqual({
      limit: 25,
      hasMore: false,
    });
  });
});
