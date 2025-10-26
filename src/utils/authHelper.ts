import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export interface AuthResult {
  userId: string;
  email?: string;
  username?: string;
}

export class AuthHelper {
  private client: CognitoIdentityProviderClient;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || "us-east-1",
    });
  }

  async validateCognitoToken(headers: any): Promise<AuthResult> {
    const authHeader = headers.Authorization || headers.authorization;

    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      throw new Error("No token provided");
    }

    try {
      // Get user info from Cognito using access token directly
      const command = new GetUserCommand({
        AccessToken: token,
      });

      const userInfo = await this.client.send(command);

      // Extract user attributes
      const email = userInfo.UserAttributes?.find(
        (attr: any) => attr.Name === "email"
      )?.Value;
      const username = userInfo.Username;

      return {
        userId: userInfo.Username!, // Use username as userId
        email,
        username,
      };
    } catch (error) {
      console.error("Token validation error:", error);
      if (error instanceof Error) {
        throw new Error(`Token validation failed: ${error.message}`);
      }
      throw new Error("Token validation failed");
    }
  }

  // Mock auth for development (remove in production)
  validateAuthMock(headers: any): AuthResult {
    const authHeader = headers.Authorization || headers.authorization;

    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    return {
      userId: "user-123",
      email: "test@example.com",
      username: "testuser",
    };
  }
}

// Export singleton instance
export const authHelper = new AuthHelper();
