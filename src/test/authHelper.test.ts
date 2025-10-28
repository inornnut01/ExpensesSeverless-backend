import { AuthHelper } from "../utils/authHelper";
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { mockClient } from "aws-sdk-client-mock";

const cognitoMock = mockClient(CognitoIdentityProviderClient);

describe("AuthHelper", () => {
  let authHelper: AuthHelper;

  beforeEach(() => {
    jest.clearAllMocks();
    cognitoMock.reset();
    authHelper = new AuthHelper();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("validateCognitoToken", () => {
    it("should throw error when no authorization header is provided", async () => {
      await expect(authHelper.validateCognitoToken({})).rejects.toThrow(
        "No authorization header provided"
      );
    });

    it("should return AuthResult when token is valid", async () => {
      const token = "valid-token";
      const mockUserInfo = {
        Username: "test-user",
        UserAttributes: [{ Name: "email", Value: "test@example.com" }],
      };

      cognitoMock.on(GetUserCommand).resolves(mockUserInfo);

      const result = await authHelper.validateCognitoToken({
        Authorization: `Bearer ${token}`,
      });

      expect(result).toEqual({
        userId: "test-user",
        email: "test@example.com",
        username: "test-user",
      });
    });

    it("should throw error when token is invalid", async () => {
      cognitoMock.on(GetUserCommand).rejects(new Error("Invalid token"));

      await expect(
        authHelper.validateCognitoToken({
          Authorization: "Bearer invalid-token",
        })
      ).rejects.toThrow("Token validation failed: Invalid token");
    });

    it("should throw error when token is expired", async () => {
      cognitoMock.on(GetUserCommand).rejects(new Error("Expired token"));

      await expect(
        authHelper.validateCognitoToken({
          Authorization: "Bearer expired-token",
        })
      ).rejects.toThrow("Token validation failed: Expired token");
    });
  });
});
