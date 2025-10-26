# 💰 Serverless Expense Tracker API

Serverless REST API สำหรับจัดการรายจ่ายส่วนบุคคล ใช้ AWS Lambda, API Gateway, และ DynamoDB

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Client    │─────▶│ API Gateway  │─────▶│ Lambda Function │
│  (Postman)  │      │   REST API   │      │   + Layer       │
└─────────────┘      └──────────────┘      └────────┬────────┘
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │    DynamoDB     │
                                            │ Expenses Table  │
                                            └─────────────────┘
```

## 📁 Project Structure

```
backend 1/
├── functions/                    # Lambda Functions
│   ├── createExpense/           # POST /expenses
│   │   ├── index.js
│   │   └── package.json
│   ├── getExpenses/             # GET /expenses
│   │   ├── index.js
│   │   └── package.json
│   ├── updateExpense/           # PUT /expenses/{id}
│   │   ├── index.js
│   │   └── package.json
│   └── deleteExpense/           # DELETE /expenses/{id}
│       ├── index.js
│       └── package.json
│
├── layers/                      # Lambda Layers
│   └── shared-dependencies/     # Shared code & dependencies
│       ├── nodejs/
│       │   ├── node_modules/   # AWS SDK packages
│       │   ├── services/       # Business logic
│       │   │   └── expenses.service.js
│       │   └── utils/          # Utilities
│       │       ├── authHelper.js
│       │       ├── dynamoClient.js
│       │       └── response.js
│       └── package.json
│
├── serverless.yml               # Serverless Framework config
├── package.json
├── DEPLOYMENT_GUIDE.md          # 📖 คู่มือการ deploy
├── POSTMAN_COLLECTION.json      # 📮 Postman collection
└── README.md                    # ← คุณอยู่ที่นี่
```

## 🚀 Quick Start

### 1. Prerequisites

- ✅ Node.js v18.x หรือสูงกว่า
- ✅ AWS Account
- ✅ AWS CLI configured (`aws configure`)
- ✅ Serverless Framework (`npm install -g serverless`)

### 2. Installation

```bash
# เข้าไปในโฟลเดอร์ backend
cd "/Users/nutin-orn/Desktop/Project/Serverless_Expense_Tracker/backend 1"

# ติดตั้ง dependencies ของ root
npm install

# ติดตั้ง dependencies ของ Layer
cd layers/shared-dependencies
npm install
cd ../..
```

### 3. Deploy

```bash
# Deploy to AWS (dev environment)
serverless deploy --stage dev --region us-east-1

# หรือใช้ npm script
npm run deploy:dev
```

### 4. Test with Postman

1. Import `POSTMAN_COLLECTION.json` เข้า Postman
2. แก้ไข Collection variable `baseUrl` เป็น API endpoint ที่ได้จาก deploy
3. ทดสอบ API ตามลำดับ:
   - Create Expense
   - Get All Expenses
   - Update Expense
   - Delete Expense

📚 **อ่านเพิ่มเติม**: `DEPLOYMENT_GUIDE.md`

## 🔌 API Endpoints

| Method | Endpoint                           | Description      | Auth Header           |
| ------ | ---------------------------------- | ---------------- | --------------------- |
| POST   | `/expenses`                        | สร้างรายจ่ายใหม่ | `x-user-id: {userId}` |
| GET    | `/expenses`                        | ดูรายจ่ายทั้งหมด | `x-user-id: {userId}` |
| GET    | `/expenses?category=Food&limit=10` | ดูรายจ่ายแบบกรอง | `x-user-id: {userId}` |
| PUT    | `/expenses/{id}`                   | แก้ไขรายจ่าย     | `x-user-id: {userId}` |
| DELETE | `/expenses/{id}`                   | ลบรายจ่าย        | `x-user-id: {userId}` |

## 📝 Request/Response Examples

### Create Expense

**Request:**

```bash
POST /expenses
Headers:
  Content-Type: application/json
  x-user-id: test-user-123

Body:
{
  "amount": 250.50,
  "category": "Food",
  "description": "Lunch at restaurant",
  "tags": ["restaurant", "lunch"]
}
```

**Response (201):**

```json
{
  "statusCode": 201,
  "body": {
    "message": "Expense created successfully",
    "expense": {
      "id": "expense-1729681234567",
      "userId": "test-user-123",
      "amount": 250.5,
      "category": "Food",
      "description": "Lunch at restaurant",
      "tags": ["restaurant", "lunch"],
      "createdAt": "2025-10-23T10:00:00.000Z",
      "updatedAt": "2025-10-23T10:00:00.000Z"
    }
  }
}
```

### Get Expenses with Filters

**Request:**

```bash
GET /expenses?category=Food&startDate=2025-01-01&endDate=2025-12-31&limit=25
Headers:
  x-user-id: test-user-123
```

**Response (200):**

```json
{
  "statusCode": 200,
  "body": {
    "expenses": [
      {
        "id": "expense-1729681234567",
        "userId": "test-user-123",
        "amount": 250.5,
        "category": "Food",
        "description": "Lunch at restaurant",
        "tags": ["restaurant", "lunch"],
        "createdAt": "2025-10-23T10:00:00.000Z",
        "updatedAt": "2025-10-23T10:00:00.000Z"
      }
    ],
    "summary": {
      "totalCount": 1,
      "totalAmount": 250.5,
      "categoryBreakdown": {
        "Food": 250.5
      },
      "averageAmount": 250.5,
      "pagination": {
        "limit": 25,
        "hasMore": false
      }
    },
    "filters": {
      "startDate": "2025-01-01",
      "endDate": "2025-12-31",
      "category": "Food"
    }
  }
}
```

## 🗄️ DynamoDB Table Schema

**Table Name:** `expense-tracker-api-expenses-{stage}`

**Primary Key:**

- Partition Key: `userId` (String)
- Sort Key: `id` (String)

**Attributes:**

```javascript
{
  userId: "test-user-123",        // Partition Key
  id: "expense-1729681234567",    // Sort Key
  amount: 250.50,                 // Number
  category: "Food",               // String
  description: "Lunch",           // String
  tags: ["restaurant", "lunch"],  // Array
  createdAt: "2025-10-23T...",   // ISO 8601
  updatedAt: "2025-10-23T..."    // ISO 8601
}
```

**Global Secondary Index:**

- `UserIdCreatedAtIndex`: Query by userId + createdAt (for sorting by date)

## 🔐 Authentication

**Current:** Mock authentication using `x-user-id` header

**Production:**

- TODO: Implement AWS Cognito
- TODO: Implement JWT token validation
- TODO: Add proper authorization checks

## 🛠️ Development Commands

```bash
# Deploy
npm run deploy:dev              # Deploy to dev
npm run deploy:prod             # Deploy to production

# Logs
npm run logs:create             # View createExpense logs
npm run logs:get                # View getExpenses logs
npm run logs:update             # View updateExpense logs
npm run logs:delete             # View deleteExpense logs

# Info
npm run info                    # Get service information

# Remove
npm run remove                  # Remove all resources (⚠️ ระวัง!)
```

## 📊 AWS Services Used

| Service            | Purpose                | Cost                          |
| ------------------ | ---------------------- | ----------------------------- |
| **Lambda**         | Serverless compute     | Free tier: 1M requests/month  |
| **API Gateway**    | REST API               | Free tier: 1M API calls/month |
| **DynamoDB**       | NoSQL database         | Free tier: 25 GB storage      |
| **CloudWatch**     | Logs & monitoring      | Free tier: 5 GB logs          |
| **CloudFormation** | Infrastructure as Code | Free                          |

## 🔧 Configuration

### Environment Variables (ตั้งค่าอัตโนมัติใน `serverless.yml`)

```yaml
AWS_REGION: us-east-1
EXPENSES_TABLE_NAME: expense-tracker-api-expenses-dev
STAGE: dev
```

### IAM Permissions

Lambda functions มี permissions:

- ✅ DynamoDB: Query, Scan, GetItem, PutItem, UpdateItem, DeleteItem
- ✅ CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents

## 🐛 Troubleshooting

### ❌ "Unable to import module"

**แก้:** ตรวจสอบว่า Layer ติดตั้ง dependencies ครบ

```bash
cd layers/shared-dependencies
npm install
cd ../..
serverless deploy
```

### ❌ "User is not authorized"

**แก้:** Configure AWS credentials

```bash
aws configure
# ใส่ Access Key ID และ Secret Access Key
```

### ❌ CORS errors ใน browser

**แก้:** ตรวจสอบ CORS configuration ใน `serverless.yml`

### ❌ "Expense not found"

**แก้:** ตรวจสอบว่า `x-user-id` ตรงกับที่สร้าง expense ไว้

## 📈 Monitoring

### CloudWatch Logs

```bash
# Real-time logs
serverless logs -f createExpense -t

# หรือไปดูใน AWS Console
https://console.aws.amazon.com/cloudwatch/
```

### DynamoDB Console

```
https://console.aws.amazon.com/dynamodb/
→ Tables → expense-tracker-api-expenses-dev
```

### API Gateway Console

```
https://console.aws.amazon.com/apigateway/
→ APIs → expense-tracker-api-dev
```

## 🚨 Important Notes

1. **Billing**: ติดตาม AWS billing dashboard เพื่อดู costs
2. **Security**: อย่าใช้ `origin: '*'` ใน production
3. **Backup**: DynamoDB มี Point-in-Time Recovery enabled
4. **Limits**: Lambda timeout: 30s, Memory: 512MB (ปรับได้ใน serverless.yml)
5. **Authentication**: ปัจจุบันใช้ mock auth ควรเปลี่ยนก่อน production

## 📚 Documentation Links

- [Serverless Framework](https://www.serverless.com/framework/docs)
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [API Gateway](https://docs.aws.amazon.com/apigateway/)
- [DynamoDB](https://docs.aws.amazon.com/dynamodb/)

## 🎯 Next Steps

- [ ] Deploy to AWS
- [ ] Test with Postman
- [ ] Add real authentication (Cognito)
- [ ] Add input validation schemas
- [ ] Add rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Add unit tests
- [ ] Add CI/CD pipeline
- [ ] Integrate with frontend

## 👤 Author

Created for Serverless Expense Tracker Project

## 📄 License

MIT
