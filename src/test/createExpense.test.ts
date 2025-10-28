/**
 * ======================================================
 * การเขียน Unit Test สำหรับ createExpense Lambda Handler
 * ======================================================
 *
 * หลักการของการเขียน Test:
 * 1. Arrange (จัดเตรียม): เตรียมข้อมูลและ mock dependencies
 * 2. Act (ทำงาน): เรียกใช้ function ที่ต้องการ test
 * 3. Assert (ตรวจสอบ): ตรวจสอบว่าผลลัพธ์ถูกต้องตามที่คาดหวัง
 */

import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { handler } from "../expenses/createExpense.js";
import { ExpensesService } from "../services/expenses.service.js";
import { authHelper } from "../utils/authHelper.js";

// ========================================
// MOCK: การจำลอง Dependencies
// ========================================
// เราใช้ jest.mock() เพื่อสร้าง "ของปลอม" ของ modules ที่เราไม่ต้องการ test จริง ๆ
// เช่น ไม่ต้องเชื่อมต่อ Database จริง หรือเรียก AWS Cognito จริง

// Mock ExpensesService - จำลองการทำงานของ Service ที่เชื่อมต่อ DynamoDB
jest.mock("../services/expenses.service.js");

// Mock authHelper - จำลองการตรวจสอบ authentication
jest.mock("../utils/authHelper.js");

// ========================================
// ฟังก์ชันช่วยในการสร้าง Mock Event
// ========================================
/**
 * สร้าง mock APIGatewayProxyEvent ที่ใช้ในการทดสอบ
 * Lambda function รับ event จาก API Gateway ซึ่งมีข้อมูลเกี่ยวกับ HTTP request
 */
const createMockEvent = (
  overrides?: Partial<APIGatewayProxyEvent>
): APIGatewayProxyEvent => {
  return {
    httpMethod: "POST",
    body: null,
    headers: {
      Authorization: "Bearer valid-token",
    },
    pathParameters: null,
    queryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {} as any,
    resource: "",
    path: "",
    stageVariables: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    ...overrides, // นำค่าที่ต้องการแทนที่เข้ามา
  } as APIGatewayProxyEvent;
};

/**
 * สร้าง mock Context ที่ Lambda ใช้
 * Context มีข้อมูลเกี่ยวกับการรัน Lambda เช่น requestId, timeout, etc.
 */
const createMockContext = (): Context => {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: "createExpense",
    functionVersion: "$LATEST",
    invokedFunctionArn:
      "arn:aws:lambda:us-east-1:123456789012:function:createExpense",
    memoryLimitInMB: "128",
    awsRequestId: "test-request-id",
    logGroupName: "/aws/lambda/createExpense",
    logStreamName: "2024/01/01/[$LATEST]test",
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  } as Context;
};

// ========================================
// TEST SUITE: กลุ่มของ test cases
// ========================================
/**
 * describe() ใช้จัดกลุ่ม test cases ที่เกี่ยวข้องกัน
 * ทำให้ดูง่ายและจัดระเบียบได้ดี
 */
describe("createExpense Lambda Handler", () => {
  // ========================================
  // SETUP: การเตรียมพร้อมก่อนแต่ละ test
  // ========================================

  // ประกาศตัวแปรเพื่อเก็บ mock spy
  let createExpenseSpy: jest.SpyInstance;

  /**
   * beforeEach() จะรันก่อนแต่ละ test case
   * ใช้เพื่อ reset state และเตรียมพร้อม mock ใหม่ทุกครั้ง
   */
  beforeEach(() => {
    // Clear ข้อมูลของ mock ทั้งหมดเพื่อให้แต่ละ test ไม่ส่งผลกระทบต่อกัน
    jest.clearAllMocks();

    // สร้าง spy สำหรับ createExpense method
    createExpenseSpy = jest.spyOn(ExpensesService.prototype, "createExpense");
  });

  /**
   * afterEach() จะรันหลังแต่ละ test case
   * ใช้เพื่อทำความสะอาด
   */
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========================================
  // TEST CASE 1: CORS Preflight Request
  // ========================================
  /**
   * test() หรือ it() ใช้กำหนด test case แต่ละอัน
   * รูปแบบ: test("คำอธิบายว่า test นี้ทำอะไร", async () => { ... })
   */
  test("Should return CORS response for OPTIONS request", async () => {
    // ARRANGE: เตรียม mock event ที่เป็น OPTIONS method
    const event = createMockEvent({ httpMethod: "OPTIONS" });
    const context = createMockContext();

    // ACT: เรียกใช้ handler ที่ต้องการ test
    const result = await handler(event, context);

    // ASSERT: ตรวจสอบผลลัพธ์
    // expect() ใช้สำหรับการเช็คค่า
    expect(result.statusCode).toBe(200);
    expect(result.headers).toHaveProperty("Access-Control-Allow-Origin");
    expect(result.body).toBe("");
  });

  // ========================================
  // TEST CASE 2: Method Validation
  // ========================================
  test("Should return error 405 when using HTTP method other than POST", async () => {
    const event = createMockEvent({ httpMethod: "GET" });
    const context = createMockContext();

    const result = await handler(event, context);

    expect(result.statusCode).toBe(405);

    const body = JSON.parse(result.body);
    expect(body.error).toContain("Method not allowed. Use POST request.");
  });

  // ========================================
  // TEST CASE 3: Authentication Failure
  // ========================================
  test("Should return error 401 when authentication fails", async () => {
    // ARRANGE
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 100,
        category: "Food",
        description: "Lunch",
        type: "expense",
      }),
    });
    const context = createMockContext();

    // Mock authHelper ให้ throw error
    // jest.mocked() ช่วยให้ TypeScript รู้ว่าเป็น mock object
    jest
      .mocked(authHelper.validateCognitoToken)
      .mockRejectedValue(new Error("Invalid token"));

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Authentication failed");
    expect(body.error).toContain("Invalid token");

    // ตรวจสอบว่า authHelper ถูกเรียกใช้
    expect(authHelper.validateCognitoToken).toHaveBeenCalledWith(event.headers);
  });

  // ========================================
  // TEST CASE 4: Missing Request Body
  // ========================================
  test("Should return error 400 when request body is missing", async () => {
    // ARRANGE
    const event = createMockEvent({
      httpMethod: "POST",
      body: null, // ไม่มี body
    });
    const context = createMockContext();

    // Mock authentication ให้สำเร็จ
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
      email: "test@example.com",
      username: "testuser",
    });

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Request body is required");
  });

  // ========================================
  // TEST CASE 5: Invalid JSON in Body
  // ========================================
  test("Should return error 400 when JSON in body is invalid", async () => {
    // ARRANGE
    const event = createMockEvent({
      httpMethod: "POST",
      body: "invalid json string {", // JSON ที่ไม่ถูกต้อง
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Invalid JSON");
  });

  // ========================================
  // TEST CASE 6: Missing Required Fields
  // ========================================
  test("Should return error 400 when required fields are missing (amount, type)", async () => {
    // ARRANGE
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        category: "Food",
        description: "Lunch",
        // ขาด amount และ type
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Missing required fields: amount and type");
  });

  // ========================================
  // TEST CASE 7: Invalid Amount (Not a Number)
  // ========================================
  test("Should return error 400 when amount is not a number", async () => {
    // ARRANGE
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: "not-a-number", // amount เป็น string
        category: "Food",
        description: "Lunch",
        type: "expense",
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Amount must be a positive number");
  });

  // ========================================
  // TEST CASE 8: Invalid Amount (Negative)
  // ========================================
  test("Should return error 400 when amount is negative", async () => {
    // ARRANGE
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: -50, // ค่าลบ
        category: "Food",
        description: "Lunch",
        type: "expense",
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Amount must be a positive number");
  });

  // ========================================
  // TEST CASE 9: Invalid Category (Empty String)
  // ========================================
  test("Should return error 400 when category is an empty string", async () => {
    // ARRANGE
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 100,
        category: "  ", // empty string
        description: "Lunch",
        type: "expense",
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Category must be a non-empty string");
  });

  // ========================================
  // TEST CASE 10: Invalid Description (Empty String)
  // ========================================
  test("Should return error 400 when description is an empty string", async () => {
    // ARRANGE
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 100,
        category: "Food",
        description: "", // empty string
        type: "expense",
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Description must be a non-empty string");
  });

  // ========================================
  // TEST CASE 11: Invalid Type (Not 'income' or 'expense')
  // ========================================
  test("Should return error 400 when type is not 'income' or 'expense'", async () => {
    // ARRANGE
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 100,
        category: "Food",
        description: "Lunch",
        type: "invalid-type", // invalid type
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Type must be either 'income' or 'expense'");
  });

  // ========================================
  // TEST CASE 12: Invalid Date Format
  // ========================================
  test("Should return error 400 when date format is invalid", async () => {
    // ARRANGE
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 100,
        category: "Food",
        description: "Lunch",
        type: "expense",
        date: "invalid-date-format", // invalid date format
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Invalid date format.");
  });

  // ========================================
  // TEST CASE 13: Successful Expense Creation (Type: Expense)
  // ========================================
  test("Should create expense successfully when data is valid (type: expense)", async () => {
    // ARRANGE
    const mockExpense = {
      id: "expense-123456789",
      userId: "test-user-123",
      amount: 150.5,
      category: "Food",
      description: "Dinner at restaurant",
      type: "expense" as const,
      tags: ["restaurant", "dinner"],
      createdAt: "2024-01-01T10:00:00.000Z",
      updatedAt: "2024-01-01T10:00:00.000Z",
    };

    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 150.5,
        category: "Food",
        description: "Dinner at restaurant",
        type: "expense",
        tags: ["restaurant", "dinner"],
      }),
    });
    const context = createMockContext();

    // Mock authentication
    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
      email: "test@example.com",
      username: "testuser",
    });

    // Mock ExpensesService.createExpense โดยใช้ spy
    createExpenseSpy.mockResolvedValue(mockExpense);

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);

    // ตรวจสอบ response structure
    expect(body).toHaveProperty("message");
    expect(body.message).toBe("Expense created successfully");

    // ตรวจสอบข้อมูล expense ที่ส่งกลับมา
    expect(body.expense).toEqual(mockExpense);

    // ตรวจสอบว่า createExpense ถูกเรียกด้วย parameters ที่ถูกต้อง
    expect(createExpenseSpy).toHaveBeenCalledWith("test-user-123", {
      amount: 150.5,
      category: "Food",
      description: "Dinner at restaurant",
      type: "expense",
      tags: ["restaurant", "dinner"],
    });

    // ตรวจสอบว่า createExpense ถูกเรียกครั้งเดียว
    expect(createExpenseSpy).toHaveBeenCalledTimes(1);
  });

  // ========================================
  // TEST CASE 14: Successful Income Creation (Type: Income)
  // ========================================
  test("Should create income successfully when data is valid (type: income)", async () => {
    // ARRANGE
    const mockIncome = {
      id: "expense-987654321",
      userId: "test-user-123",
      amount: 5000,
      category: "Salary",
      description: "Monthly salary",
      type: "income" as const,
      tags: ["work", "monthly"],
      createdAt: "2024-01-01T10:00:00.000Z",
      updatedAt: "2024-01-01T10:00:00.000Z",
    };

    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 5000,
        category: "Salary",
        description: "Monthly salary",
        type: "income",
        tags: ["work", "monthly"],
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    createExpenseSpy.mockResolvedValue(mockIncome);

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.message).toBe("Expense created successfully");
    expect(body.expense.type).toBe("income");
    expect(body.expense.amount).toBe(5000);
    expect(body.expense.category).toBe("Salary");
    expect(body.expense.description).toBe("Monthly salary");
    expect(body.expense.tags).toEqual(["work", "monthly"]);
    expect(body.expense.createdAt).toBe("2024-01-01T10:00:00.000Z");
    expect(body.expense.updatedAt).toBe("2024-01-01T10:00:00.000Z");
  });

  // ========================================
  // TEST CASE 15: Successful Creation with Custom Date
  // ========================================
  test("Should create expense successfully with custom date", async () => {
    // ARRANGE
    const customDate = "2024-06-15T08:30:00.000Z";
    const mockExpense = {
      id: "expense-111111111",
      userId: "test-user-123",
      amount: 200,
      category: "Shopping",
      description: "Books",
      type: "expense" as const,
      tags: [],
      createdAt: customDate,
      updatedAt: "2024-01-01T10:00:00.000Z",
    };

    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 200,
        category: "Shopping",
        description: "Books",
        type: "expense",
        date: customDate, // ส่ง custom date มาด้วย
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    createExpenseSpy.mockResolvedValue(mockExpense);

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(201);

    // ตรวจสอบว่า createExpense ถูกเรียกด้วย createdAt ที่เรากำหนด
    expect(createExpenseSpy).toHaveBeenCalledWith("test-user-123", {
      amount: 200,
      category: "Shopping",
      description: "Books",
      type: "expense",
      tags: [],
      createdAt: customDate,
    });
  });

  // ========================================
  // TEST CASE 16: Successful Creation without Tags
  // ========================================
  test("Should create expense successfully without tags (default is empty array)", async () => {
    // ARRANGE
    const mockExpense = {
      id: "expense-222222222",
      userId: "test-user-123",
      amount: 50,
      category: "Transport",
      description: "Taxi",
      type: "expense" as const,
      tags: [],
      createdAt: "2024-01-01T10:00:00.000Z",
      updatedAt: "2024-01-01T10:00:00.000Z",
    };

    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 50,
        category: "Transport",
        description: "Taxi",
        type: "expense",
        // ไม่ส่ง tags มา
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    createExpenseSpy.mockResolvedValue(mockExpense);

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(201);

    // ตรวจสอบว่า tags ถูกส่งเป็น empty array
    expect(createExpenseSpy).toHaveBeenCalledWith("test-user-123", {
      amount: 50,
      category: "Transport",
      description: "Taxi",
      type: "expense",
      tags: [],
    });
  });

  // ========================================
  // TEST CASE 17: Database Error Handling
  // ========================================
  test("Should return error 500 when database connection fails", async () => {
    // ARRANGE
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 100,
        category: "Food",
        description: "Lunch",
        type: "expense",
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    // Mock createExpense ให้ throw error (จำลองว่า database มีปัญหา)
    createExpenseSpy.mockRejectedValue(new Error("Database connection failed"));

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toContain("Internal server error");
    expect(body.error).toContain("Database connection failed");
  });

  // ========================================
  // TEST CASE 18: Category and Description Trimming
  // ========================================
  test("Should trim whitespace from category and description", async () => {
    // ARRANGE
    const mockExpense = {
      id: "expense-333333333",
      userId: "test-user-123",
      amount: 100,
      category: "Food",
      description: "Lunch",
      type: "expense" as const,
      tags: [],
      createdAt: "2024-01-01T10:00:00.000Z",
      updatedAt: "2024-01-01T10:00:00.000Z",
    };

    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 100,
        category: "  Food  ",
        description: "  Lunch  ",
        type: "expense",
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    createExpenseSpy.mockResolvedValue(mockExpense);

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.statusCode).toBe(201);

    expect(createExpenseSpy).toHaveBeenCalledWith("test-user-123", {
      amount: 100,
      category: "Food",
      description: "Lunch",
      type: "expense",
      tags: [],
    });
  });

  // ========================================
  // TEST CASE 19: CORS Headers in Success Response
  // ========================================
  test("Should have CORS headers in success response", async () => {
    // ARRANGE
    const mockExpense = {
      id: "expense-444444444",
      userId: "test-user-123",
      amount: 100,
      category: "Food",
      description: "Lunch",
      type: "expense" as const,
      tags: [],
      createdAt: "2024-01-01T10:00:00.000Z",
      updatedAt: "2024-01-01T10:00:00.000Z",
    };

    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        amount: 100,
        category: "Food",
        description: "Lunch",
        type: "expense",
      }),
    });
    const context = createMockContext();

    jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
      userId: "test-user-123",
    });

    createExpenseSpy.mockResolvedValue(mockExpense);

    // ACT
    const result = await handler(event, context);

    // ASSERT
    expect(result.headers).toHaveProperty("Access-Control-Allow-Origin");
    expect(result.headers!["Access-Control-Allow-Origin"]).toBe("*");
    expect(result.headers).toHaveProperty("Content-Type");
  });
});

/**
 * ======================================================
 * สรุปแนวคิดสำคัญในการเขียน Test
 * ======================================================
 *
 * 1. **Mock Dependencies**:
 *    - จำลอง dependencies ที่ไม่ต้องการ test จริง
 *    - ใช้ jest.mock() เพื่อ mock modules
 *    - ใช้ mockResolvedValue() สำหรับ mock async functions
 *    - ใช้ mockRejectedValue() สำหรับ mock errors
 *
 * 2. **Test Coverage**:
 *    - Test happy path (กรณีที่ทุกอย่างถูกต้อง)
 *    - Test error cases (กรณีที่มีข้อผิดพลาด)
 *    - Test edge cases (กรณีขอบเขต)
 *    - Test validation (การตรวจสอบข้อมูล)
 *
 * 3. **Arrange-Act-Assert Pattern**:
 *    - Arrange: เตรียมข้อมูลและ mock
 *    - Act: เรียกใช้ function ที่ต้องการ test
 *    - Assert: ตรวจสอบผลลัพธ์
 *
 * 4. **Jest Matchers ที่ใช้บ่อย**:
 *    - toBe(): เช็คว่าค่าเท่ากันแบบ strict equality (===)
 *    - toEqual(): เช็คว่า object หรือ array มีค่าเท่ากัน
 *    - toContain(): เช็คว่า string มีข้อความนั้นอยู่หรือไม่
 *    - toHaveProperty(): เช็คว่า object มี property นั้นหรือไม่
 *    - toHaveBeenCalled(): เช็คว่า mock function ถูกเรียกใช้หรือไม่
 *    - toHaveBeenCalledWith(): เช็คว่า mock function ถูกเรียกด้วย parameters อะไร
 *    - toHaveBeenCalledTimes(): เช็คว่า mock function ถูกเรียกกี่ครั้ง
 *
 * 5. **Best Practices**:
 *    - แต่ละ test ควรทดสอบเพียงสิ่งเดียว
 *    - ใช้ชื่อ test ที่อธิบายได้ชัดเจน
 *    - Clear mocks ระหว่าง tests (beforeEach, afterEach)
 *    - Don't test implementation details, test behavior
 *    - เขียน test ให้อ่านง่าย เข้าใจง่าย
 */
