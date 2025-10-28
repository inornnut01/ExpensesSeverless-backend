/** @type {import('jest').Config} */
export default {
  // กำหนด root directory สำหรับ Jest (เริ่มต้นจาก directory ที่มี jest.config.js)
  rootDir: ".",

  // ใช้ ts-jest เพื่อให้ Jest สามารถทำงานกับ TypeScript ได้
  preset: "ts-jest",

  // กำหนด environment ที่ใช้ในการรัน test (node สำหรับ backend)
  testEnvironment: "node",

  // กำหนด pattern สำหรับการหาไฟล์ test
  // Jest จะหาไฟล์ test ในโฟลเดอร์ test/ ที่ลงท้ายด้วย .test.ts หรือ .spec.ts
  testMatch: ["<rootDir>/test/**/*.test.ts", "<rootDir>/test/**/*.spec.ts"],

  // กำหนดว่าไฟล์ไหนควรถูกเปลี่ยนเป็น JavaScript ก่อนรัน test
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true, // เปิดใช้งาน ES Modules
      },
    ],
  },

  // กำหนด file extensions ที่ Jest จะรู้จัก
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // ตั้งค่าสำหรับ ES Modules
  extensionsToTreatAsEsm: [".ts"],

  // แก้ไขปัญหาการ import ที่มี .js extension ใน TypeScript
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  // กำหนดว่าจะให้แสดงผลลัพธ์อย่างไร
  verbose: true,

  // กำหนดไฟล์หรือโฟลเดอร์ที่ไม่ต้องการให้ Jest เข้าไปดู
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],

  // กำหนดว่าจะเก็บ coverage report หรือไม่
  collectCoverageFrom: [
    "expenses/**/*.ts",
    "services/**/*.ts",
    "utils/**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/dist/**",
  ],
};
