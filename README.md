# Serverless Expense Tracker - Backend API

> A production-ready serverless expense tracking application built on AWS cloud infrastructure, demonstrating modern cloud-native architecture, Infrastructure as Code (IaC), and DevOps best practices.

## 📊 Architecture Diagram

<!-- Add your architecture diagram image here -->

![Serverless Architecture](./docs/Serverless.jpg)

---

## 🎯 Project Overview

This is the backend API for a full-stack serverless expense tracking application. The system allows users to securely manage their personal finances by tracking income and expenses with features like categorization, filtering, and financial summaries. The entire infrastructure is provisioned using Terraform and follows AWS Well-Architected Framework principles.

**Frontend Repository:** [ExpensesSeverless-frontend-Amplify](https://github.com/inornnut01/ExpensesSeverless-frontend-Amplify.git)

### Key Highlights

- ✅ **Fully Serverless Architecture** - Zero server management, automatic scaling, pay-per-use pricing
- ✅ **Infrastructure as Code (IaC)** - Complete AWS infrastructure provisioned via Terraform
- ✅ **Secure Authentication** - Amazon Cognito integration with JWT token validation
- ✅ **RESTful API Design** - Well-structured API endpoints with proper HTTP methods and status codes
- ✅ **Type Safety** - Written in TypeScript for enhanced code quality and developer experience
- ✅ **Comprehensive Testing** - Unit tests with Jest covering Lambda handlers, services, and utilities
- ✅ **CI/CD Ready** - Automated frontend deployment via AWS Amplify
- ✅ **Cost-Effective** - Serverless architecture minimizes operational costs

---

## 🏗️ Technology Stack

### AWS Services

- **AWS Lambda** - Serverless compute for API endpoints (Node.js 22.x)
- **Amazon API Gateway** - RESTful API management with CORS support
- **Amazon DynamoDB** - NoSQL database for expense data storage
- **Amazon Cognito** - User authentication and authorization
- **AWS Amplify** - Frontend hosting and continuous deployment
- **IAM** - Fine-grained access control and security policies

### Backend Technologies

- **TypeScript** - Primary development language
- **Node.js 22.x** - Runtime environment
- **AWS SDK v3** - Modern AWS service integration
- **Jest** - Testing framework with coverage reports

### Infrastructure & DevOps

- **Terraform** - Infrastructure as Code (IaC) for reproducible deployments
- **GitHub** - Version control and source code management

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── expenses/              # Lambda function handlers
│   │   ├── createExpense.ts   # POST - Create new expense
│   │   ├── getExpenses.ts     # GET - Retrieve expenses with filters
│   │   ├── updateExpense.ts   # PUT - Update existing expense
│   │   └── deleteExpense.ts   # DELETE - Remove expense
│   │
│   ├── services/              # Business logic layer
│   │   └── expenses.service.ts
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── authHelper.ts      # Cognito JWT validation
│   │   ├── dynamoClient.ts    # DynamoDB client configuration
│   │   └── response.ts        # Standardized API responses
│   │
│   ├── test/                  # Comprehensive test suite
│   │   └── *.test.ts          # Unit tests for all components
│   │
│   └── dist/                  # Compiled JavaScript output
│
├── infrastructure/            # Terraform IaC configurations
│   ├── Lambda.tf              # Lambda functions & layers
│   ├── API_Gateway.tf         # API Gateway configuration
│   ├── Dynamodb.tf            # DynamoDB table definitions
│   ├── CognitoUserPool.tf     # Cognito user pool setup
│   ├── Amplify.tf             # Frontend hosting config
│   ├── provider.tf            # AWS provider configuration
│   ├── variable.tf            # Input variables
│   ├── outputs.tf             # Output values
│   └── SETUP.md               # Detailed deployment guide
│
├── package.json               # Dependencies and scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 🏗️ Lambda Architecture & Build Process

### ES Modules (.mjs) Implementation

This project uses **ES Modules** (`.mjs` files) for Lambda functions instead of CommonJS, providing:

- ✅ Modern JavaScript syntax with native `import/export`
- ✅ Better tree-shaking and smaller bundle sizes
- ✅ Improved performance with Node.js 22.x runtime
- ✅ Cleaner dependency management

**Build Process:**

```bash
TypeScript (.ts) → Compiled to ES Modules (.mjs) → Deployed to Lambda
```

### Lambda Layer Architecture

To optimize deployment and reduce function sizes, shared code is organized using **AWS Lambda Layers**:

```
Lambda Layer: expenses-shared-layer-v2
└── nodejs/                          # Standard Node.js layer structure
    ├── node_modules/                # AWS SDK v3 and dependencies
    ├── services/
    │   └── expenses.service.js      # Business logic service
    └── utils/
        ├── authHelper.js            # Authentication utilities
        ├── dynamoClient.js          # DynamoDB client
        └── response.js              # API response formatters
```

**Layer Benefits:**

- 📦 **Smaller Function Sizes** - Shared code is deployed once in the layer
- ⚡ **Faster Deployments** - Only update functions when handler logic changes
- 🔄 **Code Reusability** - Common utilities shared across all Lambda functions
- 💰 **Cost Optimization** - Reduced storage and deployment time

### Lambda Layer Path Structure

Lambda functions import shared code using the standard Lambda layer path:

```javascript
// Lambda function handler (createExpense.mjs)
import { ExpensesService } from "/opt/nodejs/services/expenses.service.js";
import { authHelper } from "/opt/nodejs/utils/authHelper.js";
import { successResponse, errorResponse } from "/opt/nodejs/utils/response.js";
```

**Important Paths:**

- `/opt/nodejs/` - AWS Lambda standard mount point for Node.js layers
- All layer content is automatically available at this path during execution
- No additional configuration needed - AWS handles the mounting

### Deployed Structure

```
AWS Lambda Function
├── Handler: createExpense.mjs (your code)
└── Layer: /opt/nodejs/ (shared code - mounted automatically)
    ├── node_modules/@aws-sdk/...
    ├── services/expenses.service.js
    └── utils/*.js
```

### Build Commands

```bash
# Install dependencies
cd src && npm install

# Compile TypeScript to ES Modules
npm run build

# Output structure after build:
src/dist/
├── expenses/
│   ├── createExpense.mjs      # Lambda handlers (ES modules)
│   ├── getExpenses.mjs
│   ├── updateExpense.mjs
│   └── deleteExpense.mjs
└── nodejs/                     # Layer structure
    ├── services/
    ├── utils/
    └── node_modules/
```

---

## 🚀 API Endpoints

All endpoints require authentication via Cognito JWT token in the `Authorization` header.

| Method   | Endpoint                       | Description                                | Authentication |
| -------- | ------------------------------ | ------------------------------------------ | -------------- |
| `POST`   | `/expenses/create`             | Create a new expense/income entry          | Required       |
| `GET`    | `/expenses/get`                | Retrieve expenses with filters and summary | Required       |
| `PUT`    | `/expenses/update/{expenseId}` | Update an existing expense                 | Required       |
| `DELETE` | `/expenses/delete/{expenseId}` | Delete an expense                          | Required       |

**Response includes:**

- Array of expense records
- Financial summary (total income, total expenses, balance)
- Category breakdown

---

## 🔧 Features

### Core Functionality

- **CRUD Operations** - Full create, read, update, delete for expense records
- **Income & Expense Tracking** - Support for both income and expense types
- **Categorization** - Flexible category system for expense organization
- **Tagging System** - Optional tags for advanced filtering
- **Date Filtering** - Query expenses by date range
- **Financial Summaries** - Automatic calculation of totals, averages, and breakdowns

### Security Features

- **Amazon Cognito Integration** - Industry-standard authentication
- **JWT Token Validation** - Secure API access with token verification
- **User Isolation** - Each user can only access their own expense data
- **IAM Roles** - Least-privilege access policies for Lambda functions
- **CORS Configuration** - Controlled cross-origin resource sharing

### Data Management

- **DynamoDB Single Table Design** - Efficient NoSQL data modeling
- **Composite Keys** - userId + expenseId for fast queries
- **Automatic Timestamps** - createdAt and updatedAt tracking
- **Type Validation** - Input validation at Lambda handler level

---

## ⚙️ Setup & Deployment

### Prerequisites

- AWS Account with appropriate permissions
- [Terraform](https://www.terraform.io/downloads) (v1.0+)
- [Node.js](https://nodejs.org/) (v18+)
- [AWS CLI](https://aws.amazon.com/cli/) configured
- GitHub Personal Access Token (for Amplify deployment)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**

   ```bash
   cd src
   npm install
   ```

3. **Build TypeScript code**

   ```bash
   npm run build
   ```

4. **Deploy infrastructure with Terraform**

   ```bash
   cd ../infrastructure

   # Initialize Terraform
   terraform init

   # Review planned changes
   terraform plan

   # Deploy to AWS
   terraform apply
   ```

5. **Configure environment variables**
   - Copy the Terraform outputs (API Gateway URL, Cognito Pool ID, etc.)
   - Update frontend `.env` file with backend endpoints

### Detailed Setup Instructions

For comprehensive deployment instructions, including GitHub token setup and troubleshooting, see:
**[infrastructure/SETUP.md](./infrastructure/SETUP.md)**

---

## 🧪 Testing

The project includes a comprehensive test suite covering Lambda handlers, services, and utility functions.

### Run Tests

```bash
cd src

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

- **Lambda Handlers** - createExpense, getExpenses, updateExpense, deleteExpense
- **Services** - ExpensesService business logic
- **Utilities** - Authentication helpers, DynamoDB client, response formatters

---

## 🔐 Security Best Practices

This project implements several security best practices:

1. **Authentication & Authorization**

   - Cognito user pools for secure user management
   - JWT token validation on every API request
   - User-specific data isolation

2. **Infrastructure Security**

   - IAM roles with least-privilege principles
   - Encrypted DynamoDB table
   - VPC integration ready (can be enabled)

3. **Code Security**

   - Environment variables for sensitive configuration
   - No hardcoded credentials
   - `.gitignore` protects sensitive files

4. **API Security**
   - CORS configuration
   - Input validation and sanitization
   - Proper HTTP status codes and error messages

---

## 📈 Scalability & Performance

- **Auto-scaling** - Lambda automatically scales with demand
- **DynamoDB On-Demand** - Automatically handles traffic spikes
- **Efficient Queries** - Optimized DynamoDB key design for fast lookups
- **Lambda Layers** - Shared dependencies reduce function size
- **Cold Start Optimization** - Modern runtime (Node.js 22.x) for faster initialization

---

## 💡 What I Learned / Technical Achievements

This project demonstrates proficiency in:

- ☑️ **Cloud Architecture** - Designing and implementing serverless applications on AWS
- ☑️ **Infrastructure as Code** - Managing cloud resources with Terraform
- ☑️ **Lambda Optimization** - Using Lambda Layers for code reusability and reduced deployment sizes
- ☑️ **Modern JavaScript** - Implementing ES Modules (.mjs) in Node.js Lambda runtime
- ☑️ **API Development** - Building RESTful APIs with proper design patterns
- ☑️ **Database Design** - DynamoDB single-table design and optimization
- ☑️ **Authentication Systems** - Implementing secure JWT-based authentication
- ☑️ **TypeScript Development** - Type-safe backend development with ES Module compilation
- ☑️ **Testing Practices** - Writing maintainable unit tests
- ☑️ **DevOps Practices** - CI/CD pipeline setup with AWS Amplify
- ☑️ **Security Implementation** - Following AWS security best practices

---

## 🚧 Future Enhancements

Potential improvements for production deployment:

- [ ] Add API rate limiting with AWS WAF
- [ ] Implement request/response caching with API Gateway
- [ ] Add CloudWatch dashboards for monitoring
- [ ] Set up AWS X-Ray for distributed tracing
- [ ] Implement automated backup strategy for DynamoDB
- [ ] Add integration tests with AWS SAM
- [ ] Implement blue/green deployment strategy
- [ ] Add expense analytics and reporting features
- [ ] Implement multi-currency support
- [ ] Add export functionality (CSV, PDF)

---

## 📚 Additional Resources

- **Frontend Repository**: [ExpensesSeverless-frontend-Amplify](https://github.com/inornnut01/ExpensesSeverless-frontend-Amplify.git)
- **Detailed Setup Guide**: [infrastructure/SETUP.md](./infrastructure/SETUP.md)
- **AWS Lambda Documentation**: https://docs.aws.amazon.com/lambda/
- **Terraform AWS Provider**: https://registry.terraform.io/providers/hashicorp/aws/

---

## 📝 License

This project is created for educational and portfolio purposes.

---

## 👨‍💻 About This Project

This project was developed to demonstrate cloud engineering capabilities and understanding of modern serverless architecture patterns. It showcases the ability to design, implement, and deploy production-ready applications on AWS infrastructure.

**Technical Skills Demonstrated:**

- AWS Cloud Services (Lambda, API Gateway, DynamoDB, Cognito, Amplify)
- Lambda Layers & Optimization Techniques
- Infrastructure as Code (Terraform)
- Backend Development (TypeScript, Node.js with ES Modules)
- RESTful API Design
- Serverless Architecture Patterns
- Authentication & Security (JWT, Cognito)
- Testing & Quality Assurance
- DevOps & CI/CD

---

Built with ☁️ AWS Serverless Technologies
