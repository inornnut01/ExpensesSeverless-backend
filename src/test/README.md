# 📚 คู่มือการเขียนและรัน Test ด้วย Jest

## 🚀 การติดตั้ง Dependencies

ก่อนรัน test ครั้งแรก ต้องติดตั้ง dependencies ก่อน:

```bash
cd src
npm install
```

Dependencies ที่ติดตั้ง:

- **jest**: Test framework หลัก
- **ts-jest**: ทำให้ Jest ทำงานกับ TypeScript ได้
- **@types/jest**: TypeScript types สำหรับ Jest

## 🧪 วิธีการรัน Test

### 1. รัน Test ทั้งหมด

```bash
npm test
```

### 2. รัน Test แบบ Watch Mode (รัน test อัตโนมัติเมื่อมีการแก้ไขไฟล์)

```bash
npm run test:watch
```

### 3. รัน Test พร้อมดู Test Coverage

```bash
npm run test:coverage
```

Test coverage จะแสดง:

- % บรรทัดโค้ดที่ถูก test
- % functions ที่ถูก test
- % branches ที่ถูก test
- % statements ที่ถูก test

### 4. รัน Test เฉพาะไฟล์

```bash
npm test createExpense.test.ts
```

### 5. รัน Test ที่มีชื่อตรงกับ pattern

```bash
npm test -- --testNamePattern="authentication"
```

## 📁 โครงสร้างไฟล์

```
backend/
└── src/
    ├── expenses/
    │   └── createExpense.ts          # Lambda handler ที่ต้องการ test
    ├── services/
    │   └── expenses.service.ts       # Service layer
    ├── utils/
    │   ├── authHelper.ts            # Authentication helper
    │   └── response.ts              # Response utilities
    ├── test/
    │   ├── createExpense.test.ts    # Test file สำหรับ createExpense
    │   └── README.md                # ไฟล์นี้
    ├── jest.config.js               # Jest configuration
    └── package.json
```

## 🎯 หลักการเขียน Test

### 1. Arrange-Act-Assert (AAA) Pattern

```typescript
test("ควรทำอะไรบางอย่าง", async () => {
  // ARRANGE: เตรียมข้อมูลและ mock
  const mockData = { ... };
  jest.mocked(someDependency).mockResolvedValue(mockData);

  // ACT: เรียกใช้ function ที่ต้องการ test
  const result = await functionToTest(input);

  // ASSERT: ตรวจสอบผลลัพธ์
  expect(result).toBe(expectedValue);
});
```

### 2. การใช้ Jest Lifecycle Hooks

```typescript
describe("Test Suite", () => {
  beforeAll(() => {
    // รันครั้งเดียวก่อน test ทั้งหมดในกลุ่มนี้
  });

  beforeEach(() => {
    // รันก่อนแต่ละ test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // รันหลังแต่ละ test
    jest.restoreAllMocks();
  });

  afterAll(() => {
    // รันครั้งเดียวหลัง test ทั้งหมดในกลุ่มนี้
  });

  test("test case 1", () => { ... });
  test("test case 2", () => { ... });
});
```

### 3. การ Mock Dependencies

#### Mock Module ทั้งหมด

```typescript
jest.mock("../path/to/module");
```

#### Mock Function เฉพาะ

```typescript
const mockFn = jest.fn();
mockFn.mockResolvedValue("success"); // สำหรับ async function
mockFn.mockReturnValue("success"); // สำหรับ sync function
mockFn.mockRejectedValue(new Error("error")); // สำหรับ error
```

#### Mock Class

```typescript
jest.mocked(MyClass).mockImplementation(() => ({
  method1: jest.fn(),
  method2: jest.fn(),
}));
```

## 📊 Jest Matchers ที่ใช้บ่อย

### Equality Matchers

```typescript
expect(value).toBe(5); // Strict equality (===)
expect(obj).toEqual({ a: 1 }); // Deep equality
expect(value).not.toBe(3); // Negation
```

### Truthiness Matchers

```typescript
expect(value).toBeTruthy(); // เช็คว่าเป็น truthy
expect(value).toBeFalsy(); // เช็คว่าเป็น falsy
expect(value).toBeNull(); // เช็คว่าเป็น null
expect(value).toBeUndefined(); // เช็คว่าเป็น undefined
expect(value).toBeDefined(); // เช็คว่าไม่ใช่ undefined
```

### Number Matchers

```typescript
expect(num).toBeGreaterThan(3);
expect(num).toBeLessThan(5);
expect(num).toBeGreaterThanOrEqual(3.5);
expect(num).toBeLessThanOrEqual(4.5);
expect(float).toBeCloseTo(0.3); // สำหรับทศนิยม
```

### String Matchers

```typescript
expect(str).toMatch(/pattern/);
expect(str).toContain("substring");
```

### Array/Object Matchers

```typescript
expect(arr).toContain(item);
expect(obj).toHaveProperty("key");
expect(obj).toHaveProperty("key", value);
```

### Function Matchers

```typescript
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenLastCalledWith(arg1, arg2);
```

### Exception Matchers

```typescript
expect(() => fn()).toThrow();
expect(() => fn()).toThrow(Error);
expect(() => fn()).toThrow("error message");
expect(async () => await fn()).rejects.toThrow();
```

## 💡 Best Practices

### 1. ✅ DO - ควรทำ

- **เขียน test ที่อ่านง่าย**: ใช้ชื่อที่อธิบายได้ชัดเจน

  ```typescript
  test("ควร return error 400 เมื่อ amount เป็นค่าลบ", () => { ... });
  ```

- **Test behavior, not implementation**: Test ว่า function ทำอะไร ไม่ใช่ว่ามันทำงานอย่างไร

- **Mock external dependencies**: Mock database, API calls, AWS services

- **One assertion per test**: แต่ละ test ควรทดสอบเพียงสิ่งเดียว

- **Clear mocks between tests**: ใช้ `beforeEach()` และ `afterEach()`

### 2. ❌ DON'T - ไม่ควรทำ

- **อย่า test implementation details**: อย่า test ว่า private method ถูกเรียกหรือไม่

- **อย่าให้ test พึ่งพากัน**: แต่ละ test ควรรันได้อิสระ

- **อย่า hardcode values**: ใช้ constants หรือ helper functions

- **อย่า skip tests**: ถ้า test fail ให้แก้ไข อย่าใช้ `.skip()`

## 🎓 ตัวอย่างการเขียน Test Cases ที่ดี

### ✅ Good Example

```typescript
test("ควรสร้าง expense สำเร็จเมื่อข้อมูลถูกต้อง", async () => {
  // ARRANGE: เตรียมข้อมูล test ที่ชัดเจน
  const validExpenseData = {
    amount: 100,
    category: "Food",
    description: "Lunch",
    type: "expense",
  };

  const mockExpense = {
    id: "expense-123",
    userId: "user-123",
    ...validExpenseData,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  // Mock dependencies
  jest.mocked(authHelper.validateCognitoToken).mockResolvedValue({
    userId: "user-123",
  });

  const mockCreateExpense = jest.fn().mockResolvedValue(mockExpense);
  jest.mocked(ExpensesService).mockImplementation(() => ({
    createExpense: mockCreateExpense,
  }));

  // ACT: เรียกใช้ function
  const result = await handler(
    createMockEvent({
      body: JSON.stringify(validExpenseData),
    }),
    mockContext
  );

  // ASSERT: ตรวจสอบผลลัพธ์อย่างครอบคลุม
  expect(result.statusCode).toBe(201);
  expect(mockCreateExpense).toHaveBeenCalledWith(
    "user-123",
    expect.objectContaining({
      amount: 100,
      category: "Food",
    })
  );
});
```

### ❌ Bad Example

```typescript
test("test expense", async () => {
  // ชื่อ test ไม่ชัดเจน
  // ไม่มีการ mock dependencies
  // ไม่มี assertions ที่เพียงพอ

  const result = await handler(event, context);
  expect(result).toBeTruthy(); // assertion ที่ไม่มีความหมาย
});
```

## 🔍 การ Debug Tests

### 1. ใช้ console.log()

```typescript
test("debug test", () => {
  const result = someFunction();
  console.log("Result:", result); // จะแสดงใน terminal
  expect(result).toBe(expected);
});
```

### 2. ใช้ .only() เพื่อรันเฉพาะ test นั้น

```typescript
test.only("รัน test นี้อย่างเดียว", () => {
  // ...
});
```

### 3. ใช้ .skip() เพื่อข้าม test ชั่วคราว

```typescript
test.skip("ข้าม test นี้ไปก่อน", () => {
  // ...
});
```

### 4. ดู Mock Calls

```typescript
test("ดูว่า mock function ถูกเรียกอย่างไร", () => {
  mockFn(arg1, arg2);

  console.log(mockFn.mock.calls); // แสดงทุกครั้งที่ถูกเรียก
  console.log(mockFn.mock.calls[0]); // arguments ของการเรียกครั้งแรก
  console.log(mockFn.mock.results); // return values
});
```

## 📈 การดู Test Coverage

หลังจากรัน `npm run test:coverage` จะได้ไฟล์ report ใน `coverage/` folder:

```
coverage/
├── lcov-report/
│   └── index.html          # เปิดไฟล์นี้ใน browser เพื่อดู coverage report
├── coverage-summary.json
└── lcov.info
```

เป้าหมาย Coverage ที่ดี:

- **Statements**: >= 80%
- **Branches**: >= 80%
- **Functions**: >= 80%
- **Lines**: >= 80%

## 🎯 Test Cases ที่ควรเขียนสำหรับ createExpense

1. ✅ **Happy Path Tests**:

   - สร้าง expense สำเร็จ (type: expense)
   - สร้าง income สำเร็จ (type: income)
   - สร้างด้วย custom date
   - สร้างโดยไม่มี tags

2. ✅ **Validation Tests**:

   - Missing required fields
   - Invalid amount (not a number, negative)
   - Invalid category (empty string)
   - Invalid description (empty string)
   - Invalid type (not 'income' or 'expense')
   - Invalid date format

3. ✅ **Authentication Tests**:

   - Authentication failure
   - Missing authorization header

4. ✅ **HTTP Method Tests**:

   - CORS preflight (OPTIONS)
   - Invalid method (not POST)

5. ✅ **Error Handling Tests**:

   - Missing request body
   - Invalid JSON
   - Database errors
   - Service layer errors

6. ✅ **Edge Cases**:
   - Category/Description trimming
   - CORS headers in response

## 📚 Resources เพิ่มเติม

- [Jest Official Documentation](https://jestjs.io/docs/getting-started)
- [Jest Matchers Documentation](https://jestjs.io/docs/expect)
- [Testing Best Practices](https://testingjavascript.com/)
- [Unit Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🆘 การแก้ปัญหาที่เจอบ่อย

### ปัญหา: "Cannot find module"

**วิธีแก้**: ตรวจสอบ `moduleNameMapper` ใน `jest.config.js`

### ปัญหา: "SyntaxError: Cannot use import statement outside a module"

**วิธีแก้**: ใช้ `ts-jest` และตั้งค่า `extensionsToTreatAsEsm`

### ปัญหา: Mock ไม่ทำงาน

**วิธีแก้**:

1. ตรวจสอบว่าใช้ `jest.mock()` ถูกต้อง
2. ใช้ `jest.mocked()` สำหรับ TypeScript
3. เรียก `jest.clearAllMocks()` ใน `beforeEach()`

### ปัญหา: Test timeout

**วิธีแก้**: เพิ่ม timeout ใน test

```typescript
test("test name", async () => {
  // ...
}, 10000); // timeout 10 seconds
```

---

**Happy Testing! 🚀**

หากมีคำถามหรือปัญหา สามารถดูตัวอย่างใน `createExpense.test.ts` ได้เลยครับ
