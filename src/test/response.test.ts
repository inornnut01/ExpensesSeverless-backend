import {
  successResponse,
  errorResponse,
  corsResponse,
} from "../utils/response";

describe("Response Utilities", () => {
  describe("successResponse", () => {
    it("should return correct structure with CORS and Content-Type headers", () => {
      const data = { message: "Success", items: [1, 2, 3] };
      const result = successResponse(200, data);

      // Structure
      expect(result.statusCode).toBe(200);
      expect(result.body).toBe(JSON.stringify(data));
      expect(JSON.parse(result.body)).toEqual(data);

      // CORS Headers
      expect(result.headers?.["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.headers?.["Access-Control-Allow-Headers"]).toContain(
        "Authorization"
      );
      expect(result.headers?.["Access-Control-Allow-Methods"]).toContain("GET");

      // Content-Type
      expect(result.headers?.["Content-Type"]).toBe("application/json");
    });

    it("should handle different status codes and data types", () => {
      // Different status codes
      expect(successResponse(201, {}).statusCode).toBe(201);
      expect(successResponse(204, null).statusCode).toBe(204);

      // Array data
      const arrayData = [1, 2, 3];
      expect(JSON.parse(successResponse(200, arrayData).body)).toEqual(
        arrayData
      );
    });
  });

  describe("errorResponse", () => {
    it("should return error structure with CORS headers", () => {
      const message = "Something went wrong";
      const result = errorResponse(400, message);

      // Structure
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({ error: message });

      // CORS Headers
      expect(result.headers?.["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.headers?.["Content-Type"]).toBe("application/json");

      // CORS Methods header should be present for browser compatibility
      expect(result.headers?.["Access-Control-Allow-Methods"]).toContain("GET");
    });

    it("should handle different error status codes", () => {
      expect(errorResponse(401, "Unauthorized").statusCode).toBe(401);
      expect(errorResponse(404, "Not found").statusCode).toBe(404);
      expect(errorResponse(500, "Server error").statusCode).toBe(500);
    });
  });

  describe("corsResponse", () => {
    it("should return CORS preflight response with all required headers", () => {
      const result = corsResponse();

      expect(result.statusCode).toBe(200);
      expect(result.body).toBe("");

      // All CORS headers
      expect(result.headers?.["Access-Control-Allow-Origin"]).toBe("*");
      expect(result.headers?.["Access-Control-Allow-Headers"]).toContain(
        "Authorization"
      );
      expect(result.headers?.["Access-Control-Allow-Methods"]).toContain(
        "OPTIONS"
      );

      // Should not have Content-Type
      expect(result.headers?.["Content-Type"]).toBeUndefined();
    });
  });
});
