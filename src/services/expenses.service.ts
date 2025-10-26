import {
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../utils/dynamoClient.js";

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  type: "income" | "expense";
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  type?: "income" | "expense";
  limit?: number;
}

export class ExpensesService {
  private tableName = TABLE_NAMES.EXPENSES;

  async getExpenses(
    userId: string,
    filters?: ExpenseFilters
  ): Promise<Expense[]> {
    try {
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false, // Sort by createdAt descending
      });

      const result = await docClient.send(command);
      let expenses = (result.Items || []) as Expense[];

      // Apply filters
      if (filters) {
        if (filters.startDate || filters.endDate) {
          expenses = expenses.filter((expense) => {
            const expenseDate = new Date(expense.createdAt);
            if (filters.startDate && expenseDate < new Date(filters.startDate))
              return false;
            if (filters.endDate && expenseDate > new Date(filters.endDate))
              return false;
            return true;
          });
        }

        if (filters.category) {
          expenses = expenses.filter(
            (expense) => expense.category === filters.category
          );
        }

        // เพิ่ม filter สำหรับ type
        if (filters.type) {
          expenses = expenses.filter(
            (expense) => expense.type === filters.type
          );
        }

        if (filters.limit) {
          expenses = expenses.slice(0, filters.limit);
        }
      }

      return expenses;
    } catch (error) {
      console.error("DynamoDB getExpenses error:", error);
      throw new Error("Failed to fetch expenses from database");
    }
  }

  async createExpense(
    userId: string,
    expenseData: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt"> & {
      createdAt?: string;
    }
  ): Promise<Expense> {
    try {
      const now = new Date().toISOString();
      const expense: Expense = {
        id: `expense-${Date.now()}`,
        userId,
        createdAt: expenseData.createdAt || now, // ใช้ค่าที่ส่งมา หรือเวลาปัจจุบัน
        updatedAt: now,
        amount: expenseData.amount,
        category: expenseData.category,
        description: expenseData.description,
        type: expenseData.type,
        tags: expenseData.tags,
      };

      const command = new PutCommand({
        TableName: this.tableName,
        Item: expense,
      });

      await docClient.send(command);
      return expense;
    } catch (error) {
      console.error("DynamoDB createExpense error:", error);
      throw new Error("Failed to create expense");
    }
  }

  async updateExpense(
    userId: string,
    expenseId: string,
    updates: Partial<Omit<Expense, "id" | "userId" | "createdAt">>
  ): Promise<Expense> {
    try {
      const now = new Date().toISOString();

      // Build update expression dynamically
      const updateExpressions: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};
      const expressionAttributeNames: Record<string, string> = {};

      Object.keys(updates).forEach((key, index) => {
        if (key !== "id" && key !== "userId" && key !== "createdAt") {
          updateExpressions.push(`#${key} = :val${index}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:val${index}`] =
            updates[key as keyof typeof updates];
        }
      });

      updateExpressions.push("#updatedAt = :updatedAt");
      expressionAttributeNames["#updatedAt"] = "updatedAt";
      expressionAttributeValues[":updatedAt"] = now;

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          userId,
          id: expenseId,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      });

      const result = await docClient.send(command);
      return result.Attributes as Expense;
    } catch (error) {
      console.error("DynamoDB updateExpense error:", error);
      throw new Error("Failed to update expense");
    }
  }

  async deleteExpense(userId: string, expenseId: string): Promise<void> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: {
          userId,
          id: expenseId,
        },
      });

      await docClient.send(command);
    } catch (error) {
      console.error("DynamoDB deleteExpense error:", error);
      throw new Error("Failed to delete expense");
    }
  }

  async getExpenseById(
    userId: string,
    expenseId: string
  ): Promise<Expense | null> {
    try {
      const expenses = await this.getExpenses(userId);
      return expenses.find((expense) => expense.id === expenseId) || null;
    } catch (error) {
      console.error("DynamoDB getExpenseById error:", error);
      throw new Error("Failed to fetch expense");
    }
  }

  async getExpenseSummary(
    userId: string,
    filters?: ExpenseFilters
  ): Promise<{
    totalCount: number;
    totalAmount: number;
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    categoryBreakdown: Record<string, number>;
    averageAmount: number;
  }> {
    try {
      const expenses = await this.getExpenses(userId, filters);

      const totalAmount = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      const totalIncome = expenses
        .filter((e) => e.type === "income")
        .reduce((sum, e) => sum + e.amount, 0);

      const totalExpense = expenses
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + e.amount, 0);

      const categoryBreakdown = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalCount: expenses.length,
        totalAmount,
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        categoryBreakdown,
        averageAmount: expenses.length > 0 ? totalAmount / expenses.length : 0,
      };
    } catch (error) {
      console.error("DynamoDB getExpenseSummary error:", error);
      throw new Error("Failed to calculate expense summary");
    }
  }
}
