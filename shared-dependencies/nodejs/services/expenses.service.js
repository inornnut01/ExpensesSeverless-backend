import {
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAMES } from "../utils/dynamoClient.js";
export class ExpensesService {
  constructor() {
    this.tableName = TABLE_NAMES.EXPENSES;
  }
  async getExpenses(userId, filters) {
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
      let expenses = result.Items || [];
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
  async createExpense(userId, expenseData) {
    try {
      const now = new Date().toISOString();
      const expense = {
        id: `expense-${Date.now()}`,
        userId,
        createdAt: now,
        updatedAt: now,
        ...expenseData,
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
  async updateExpense(userId, expenseId, updates) {
    try {
      const now = new Date().toISOString();
      // Build update expression dynamically
      const updateExpressions = [];
      const expressionAttributeValues = {};
      const expressionAttributeNames = {};
      Object.keys(updates).forEach((key, index) => {
        if (key !== "id" && key !== "userId" && key !== "createdAt") {
          updateExpressions.push(`#${key} = :val${index}`);
          expressionAttributeNames[`#${key}`] = key;
          expressionAttributeValues[`:val${index}`] = updates[key];
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
      return result.Attributes;
    } catch (error) {
      console.error("DynamoDB updateExpense error:", error);
      throw new Error("Failed to update expense");
    }
  }
  async deleteExpense(userId, expenseId) {
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
  async getExpenseById(userId, expenseId) {
    try {
      const expenses = await this.getExpenses(userId);
      return expenses.find((expense) => expense.id === expenseId) || null;
    } catch (error) {
      console.error("DynamoDB getExpenseById error:", error);
      throw new Error("Failed to fetch expense");
    }
  }
  async getExpenseSummary(userId, filters) {
    try {
      const expenses = await this.getExpenses(userId, filters);
      const totalAmount = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const categoryBreakdown = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {});
      return {
        totalCount: expenses.length,
        totalAmount,
        categoryBreakdown,
        averageAmount: expenses.length > 0 ? totalAmount / expenses.length : 0,
      };
    } catch (error) {
      console.error("DynamoDB getExpenseSummary error:", error);
      throw new Error("Failed to calculate expense summary");
    }
  }
}
