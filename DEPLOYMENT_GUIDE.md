# 🚀 Expense Tracker API - Deployment Guide

## 📋 Prerequisites

1. **AWS Account**

   - สมัคร AWS Account ที่ https://aws.amazon.com
   - TODO: เตรียม AWS Access Key ID และ Secret Access Key

2. **AWS CLI**

   ```bash
   # Install AWS CLI
   brew install awscli  # สำหรับ macOS

   # หรือ download จาก: https://aws.amazon.com/cli/
   ```

3. **Configure AWS Credentials**

   ```bash
   aws configure
   # TODO: กรอกข้อมูลต่อไปนี้:
   # AWS Access Key ID: YOUR_ACCESS_KEY
   # AWS Secret Access Key: YOUR_SECRET_KEY
   # Default region name: us-east-1 (หรือ ap-southeast-1 สำหรับ Singapore)
   # Default output format: json
   ```

4. **Node.js & npm**

   ```bash
   node --version  # ต้องเป็น v18.x ขึ้นไป
   npm --version
   ```

5. **Serverless Framework**
   ```bash
   npm install -g serverless
   serverless --version
   ```

## 📁 Project Structure

```
backend 1/
├── functions/              # Lambda functions
│   ├── createExpense/
│   ├── getExpenses/
│   ├── updateExpense/
│   └── deleteExpense/
├── layers/                 # Lambda layers
│   └── shared-dependencies/
├── serverless.yml          # Serverless configuration
└── package.json
```

## 🔧 Configuration

### 1. ตรวจสอบ `serverless.yml`

เปิดไฟล์ `serverless.yml` และปรับแต่งค่าต่อไปนี้:

```yaml
provider:
  region: us-east-1 # TODO: เปลี่ยนเป็น region ที่ต้องการ
  memorySize: 512 # TODO: ปรับตามความต้องการ
  timeout: 30 # TODO: ปรับตามความต้องการ
```

### 2. ติดตั้ง Dependencies สำหรับ Layer

```bash
cd layers/shared-dependencies
npm install
cd ../..
```

## 🚀 Deployment Steps

### 1. Deploy ครั้งแรก (Development)

```bash
# ติดตั้ง dependencies
npm install

# Deploy to AWS
serverless deploy --stage dev --region us-east-1
```

หรือใช้ shorthand:

```bash
npm run deploy:dev
```

### 2. Deploy to Production

```bash
serverless deploy --stage prod --region us-east-1
# หรือ
npm run deploy:prod
```

### 3. ตรวจสอบการ Deploy

หลังจาก deploy สำเร็จ จะได้ข้อมูล:

```
Service Information
service: expense-tracker-api
stage: dev
region: us-east-1
stack: expense-tracker-api-dev
api keys:
  None
endpoints:
  POST - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/expenses
  GET - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/expenses
  PUT - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/expenses/{id}
  DELETE - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/expenses/{id}
functions:
  createExpense: expense-tracker-api-createExpense-dev
  getExpenses: expense-tracker-api-getExpenses-dev
  updateExpense: expense-tracker-api-updateExpense-dev
  deleteExpense: expense-tracker-api-deleteExpense-dev
layers:
  sharedDependencies: arn:aws:lambda:us-east-1:xxxx:layer:expense-tracker-api-shared-dependencies-dev:1
```

## 🧪 Testing with Postman

### 1. เตรียม Base URL

```
Base URL: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
```

### 2. API Endpoints

#### 📝 Create Expense (POST)

```
Method: POST
URL: {{baseUrl}}/expenses
Headers:
  Content-Type: application/json
  x-user-id: test-user-123
Body (JSON):
{
  "amount": 250.50,
  "category": "Food",
  "description": "Lunch at restaurant",
  "tags": ["restaurant", "lunch"]
}
```

#### 📋 Get All Expenses (GET)

```
Method: GET
URL: {{baseUrl}}/expenses
Headers:
  x-user-id: test-user-123
Query Parameters (Optional):
  limit: 25
  startDate: 2025-01-01
  endDate: 2025-12-31
  category: Food
```

#### ✏️ Update Expense (PUT)

```
Method: PUT
URL: {{baseUrl}}/expenses/{expenseId}
Headers:
  Content-Type: application/json
  x-user-id: test-user-123
Body (JSON):
{
  "amount": 300.00,
  "category": "Transportation",
  "description": "Updated description"
}
```

#### 🗑️ Delete Expense (DELETE)

```
Method: DELETE
URL: {{baseUrl}}/expenses/{expenseId}
Headers:
  x-user-id: test-user-123
```

### 3. Expected Responses

#### Success Response (200/201):

```json
{
  "statusCode": 200,
  "body": {
    "message": "Success",
    "expense": {
      "id": "expense-1234567890",
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

#### Error Response (400/401/404/500):

```json
{
  "statusCode": 400,
  "body": {
    "error": "Error message here"
  }
}
```

## 📊 Monitoring & Debugging

### 1. View Logs

```bash
# Real-time logs สำหรับแต่ละ function
npm run logs:create
npm run logs:get
npm run logs:update
npm run logs:delete

# หรือใช้
serverless logs -f createExpense -t
```

### 2. Check Service Info

```bash
serverless info --stage dev
# หรือ
npm run info
```

### 3. AWS Console

- **Lambda**: https://console.aws.amazon.com/lambda
- **DynamoDB**: https://console.aws.amazon.com/dynamodb
- **API Gateway**: https://console.aws.amazon.com/apigateway
- **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch

## 🔒 IAM Permissions (สำหรับทีม)

ถ้าต้องการให้คนอื่นใน team deploy ได้ ต้องมี IAM permissions เหล่านี้:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PassRole",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🗑️ Remove/Delete Stack

```bash
# ลบทุกอย่างที่ deploy ไป (ระวัง! จะลบ database ด้วย)
serverless remove --stage dev
# หรือ
npm run remove
```

## 🐛 Troubleshooting

### Problem: "Unable to import module"

**Solution**: ตรวจสอบว่า Layer ถูก build และ dependencies ครบ

```bash
cd layers/shared-dependencies
npm install
cd ../..
serverless deploy
```

### Problem: "User is not authorized to perform"

**Solution**: ตรวจสอบ AWS credentials และ IAM permissions

### Problem: "Resource already exists"

**Solution**: เปลี่ยน service name หรือ stage ใน `serverless.yml`

### Problem: CORS errors

**Solution**: ตรวจสอบ CORS configuration ใน `serverless.yml` และส่ง headers ที่ถูกต้อง

## 📝 Important Notes

1. **Billing**: AWS จะคิดเงินตามการใช้งาน ติดตาม billing dashboard
2. **Security**: อย่าใช้ `origin: '*'` ใน production
3. **Backup**: DynamoDB มี Point-in-Time Recovery enabled
4. **Rate Limiting**: พิจารณาเพิ่ม API Gateway usage plans สำหรับ production
5. **Authentication**: ปัจจุบันใช้ mock authentication (x-user-id header) ควรเปลี่ยนเป็น AWS Cognito หรือ JWT ใน production

## 🔐 Security Checklist ก่อน Production

- [ ] เปลี่ยน CORS origin จาก '\*' เป็น specific domain
- [ ] เพิ่ม real authentication (Cognito/JWT)
- [ ] Enable API Gateway API Keys/Usage Plans
- [ ] Enable AWS WAF สำหรับ API Gateway
- [ ] เพิ่ม rate limiting
- [ ] Enable DynamoDB encryption at rest
- [ ] Review IAM policies (principle of least privilege)
- [ ] Enable CloudTrail logging
- [ ] Set up CloudWatch alarms
- [ ] Configure backup policy

## 📞 Support

ถ้ามีปัญหาในการ deploy ตรวจสอบ:

1. CloudWatch Logs ใน AWS Console
2. CloudFormation Events ใน AWS Console
3. Serverless Framework documentation: https://www.serverless.com/framework/docs
