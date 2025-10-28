import { ExpensesService, Expense } from "../services/expenses.service";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { TABLE_NAMES } from "../utils/dynamoClient";

const docClientMock = mockClient(DynamoDBDocumentClient);

describe("ExpensesService", () => {
  let expensesService: ExpensesService;

  beforeEach(() => {
    jest.clearAllMocks();
    docClientMock.reset();
    expensesService = new ExpensesService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getExpenses", () => {
    test("should return empty array when no expenses are found", async () => {
      const userId = "test-user-123";
      const mockResult = {
        Items: [],
      };

      docClientMock.on(QueryCommand).resolves(mockResult);

      const result = await expensesService.getExpenses(userId);

      expect(result).toEqual([]);
      expect(docClientMock.calls()).toHaveLength(1);
      expect(docClientMock.call(0).args[0].input).toMatchObject({
        TableName: TABLE_NAMES.EXPENSES,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: { ":userId": userId },
        ScanIndexForward: false,
      });
    });

    test("should return expenses when found", async () => {
      const userId = "test-user-123";
      const mockExpenses: Expense[] = [
        {
          id: "expense-1",
          userId,
          amount: 100,
          category: "food",
          description: "Lunch",
          type: "expense",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "expense-2",
          userId,
          amount: 500,
          category: "income",
          description: "Salary",
          type: "income",
          createdAt: "2025-01-02T00:00:00.000Z",
          updatedAt: "2025-01-02T00:00:00.000Z",
        },
      ];

      docClientMock.on(QueryCommand).resolves({
        Items: mockExpenses,
      });

      const result = await expensesService.getExpenses(userId);

      expect(result).toEqual(mockExpenses);
      expect(result).toHaveLength(2);
    });

    test("should filter expenses by category", async () => {
      const userId = "test-user-123";
      const mockExpenses: Expense[] = [
        {
          id: "expense-1",
          userId,
          amount: 100,
          category: "food",
          description: "Lunch",
          type: "expense",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "expense-2",
          userId,
          amount: 200,
          category: "transport",
          description: "Taxi",
          type: "expense",
          createdAt: "2025-01-02T00:00:00.000Z",
          updatedAt: "2025-01-02T00:00:00.000Z",
        },
      ];

      docClientMock.on(QueryCommand).resolves({
        Items: mockExpenses,
      });

      const result = await expensesService.getExpenses(userId, {
        category: "food",
      });

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe("food");
    });

    test("should throw error when DynamoDB fails", async () => {
      const userId = "test-user-123";

      docClientMock.on(QueryCommand).rejects(new Error("DynamoDB error"));

      await expect(expensesService.getExpenses(userId)).rejects.toThrow(
        "Failed to fetch expenses from database"
      );
    });
  });

  describe("createExpense", () => {
    test("should create expense successfully", async () => {
      const userId = "test-user-123";
      const expenseData = {
        amount: 100,
        category: "food",
        description: "Lunch",
        type: "expense" as const,
      };

      docClientMock.on(PutCommand).resolves({});

      const result = await expensesService.createExpense(userId, expenseData);

      expect(result).toMatchObject({
        userId,
        amount: 100,
        category: "food",
        description: "Lunch",
        type: "expense",
      });
      expect(result.id).toMatch(/^expense-\d+$/);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(docClientMock.calls()).toHaveLength(1);
    });

    test("should throw error when DynamoDB fails", async () => {
      const userId = "test-user-123";
      const expenseData = {
        amount: 100,
        category: "food",
        description: "Lunch",
        type: "expense" as const,
      };

      docClientMock.on(PutCommand).rejects(new Error("DynamoDB error"));

      await expect(
        expensesService.createExpense(userId, expenseData)
      ).rejects.toThrow("Failed to create expense");
    });
  });

  describe("updateExpense", () => {
    test("should update expense successfully", async () => {
      const userId = "test-user-123";
      const expenseId = "expense-1";
      const updates = {
        amount: 150,
        description: "Updated lunch",
      };
      const mockUpdatedExpense: Expense = {
        id: expenseId,
        userId,
        amount: 150,
        category: "food",
        description: "Updated lunch",
        type: "expense",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      };

      docClientMock.on(UpdateCommand).resolves({
        Attributes: mockUpdatedExpense,
      });

      const result = await expensesService.updateExpense(
        userId,
        expenseId,
        updates
      );

      expect(result).toEqual(mockUpdatedExpense);
      expect(docClientMock.calls()).toHaveLength(1);
      expect(docClientMock.call(0).args[0].input).toMatchObject({
        TableName: TABLE_NAMES.EXPENSES,
        Key: { userId, id: expenseId },
      });
    });

    test("should throw error when DynamoDB fails", async () => {
      const userId = "test-user-123";
      const expenseId = "expense-1";
      const updates = { amount: 150 };

      docClientMock.on(UpdateCommand).rejects(new Error("DynamoDB error"));

      await expect(
        expensesService.updateExpense(userId, expenseId, updates)
      ).rejects.toThrow("Failed to update expense");
    });
  });

  describe("deleteExpense", () => {
    test("should delete expense successfully", async () => {
      const userId = "test-user-123";
      const expenseId = "expense-1";

      docClientMock.on(DeleteCommand).resolves({});

      await expensesService.deleteExpense(userId, expenseId);

      expect(docClientMock.calls()).toHaveLength(1);
      expect(docClientMock.call(0).args[0].input).toMatchObject({
        TableName: TABLE_NAMES.EXPENSES,
        Key: { userId, id: expenseId },
      });
    });

    test("should throw error when DynamoDB fails", async () => {
      const userId = "test-user-123";
      const expenseId = "expense-1";

      docClientMock.on(DeleteCommand).rejects(new Error("DynamoDB error"));

      await expect(
        expensesService.deleteExpense(userId, expenseId)
      ).rejects.toThrow("Failed to delete expense");
    });
  });

  describe("getExpenseById", () => {
    test("should return expense when found", async () => {
      const userId = "test-user-123";
      const expenseId = "expense-1";
      const mockExpense: Expense = {
        id: expenseId,
        userId,
        amount: 100,
        category: "food",
        description: "Lunch",
        type: "expense",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
      };

      docClientMock.on(QueryCommand).resolves({
        Items: [mockExpense],
      });

      const result = await expensesService.getExpenseById(userId, expenseId);

      expect(result).toEqual(mockExpense);
    });

    test("should return null when expense not found", async () => {
      const userId = "test-user-123";
      const expenseId = "non-existent";

      docClientMock.on(QueryCommand).resolves({
        Items: [],
      });

      const result = await expensesService.getExpenseById(userId, expenseId);

      expect(result).toBeNull();
    });
  });

  describe("getExpenseSummary", () => {
    test("should calculate expense summary correctly", async () => {
      const userId = "test-user-123";
      const mockExpenses: Expense[] = [
        {
          id: "expense-1",
          userId,
          amount: 100,
          category: "food",
          description: "Lunch",
          type: "expense",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
        {
          id: "expense-2",
          userId,
          amount: 500,
          category: "salary",
          description: "Monthly salary",
          type: "income",
          createdAt: "2025-01-02T00:00:00.000Z",
          updatedAt: "2025-01-02T00:00:00.000Z",
        },
        {
          id: "expense-3",
          userId,
          amount: 50,
          category: "food",
          description: "Dinner",
          type: "expense",
          createdAt: "2025-01-03T00:00:00.000Z",
          updatedAt: "2025-01-03T00:00:00.000Z",
        },
      ];

      docClientMock.on(QueryCommand).resolves({
        Items: mockExpenses,
      });

      const result = await expensesService.getExpenseSummary(userId);

      expect(result.totalCount).toBe(3);
      expect(result.totalAmount).toBe(650);
      expect(result.totalIncome).toBe(500);
      expect(result.totalExpense).toBe(150);
      expect(result.netAmount).toBe(350);
      expect(result.categoryBreakdown).toEqual({
        food: 150,
        salary: 500,
      });
      expect(result.averageAmount).toBeCloseTo(216.67, 2);
    });

    test("should return zeros for empty expenses", async () => {
      const userId = "test-user-123";

      docClientMock.on(QueryCommand).resolves({
        Items: [],
      });

      const result = await expensesService.getExpenseSummary(userId);

      expect(result).toEqual({
        totalCount: 0,
        totalAmount: 0,
        totalIncome: 0,
        totalExpense: 0,
        netAmount: 0,
        categoryBreakdown: {},
        averageAmount: 0,
      });
    });
  });
});
