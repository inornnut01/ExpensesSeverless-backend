# Lambda Layer for shared dependencies
module "lambda_layer_shared" {
  source  = "terraform-aws-modules/lambda/aws"

  create_layer = true
  layer_name   = "expenses-shared-layer-v2"
  description  = "Shared dependencies for expense tracker functions"

  compatible_runtimes = ["nodejs22.x"]
  source_path         = [
    {
      path = "${path.module}/../src/dist/nodejs"
      prefix_in_zip = "nodejs"
    }
  ]
  architectures       = ["x86_64"]

  tags = {
    Name = "Serverless Expenses Layer"
  }
}

# Create Expense Lambda Function
module "lambda_create_expense" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "createExpense"
  description   = "Create expense function"
  handler       = "createExpense.handler"
  runtime       = "nodejs22.x"
  architectures = ["x86_64"]

  source_path = "../src/dist/expenses/createExpense.mjs"

  layers = [module.lambda_layer_shared.lambda_layer_arn]

  environment_variables = {
    EXPENSES_TABLE_NAME = var.aws_dynamodb_table
    NODE_OPTIONS        = "--enable-source-maps"
  }

  attach_policy_json = true
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem"
        ]
        Resource = module.expense_dynamodb_table.dynamodb_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = {
    Name = "Serverless Expenses"
  }
}

# Get Expenses Lambda Function
module "lambda_get_expenses" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "getExpenses"
  description   = "Get expenses function"
  handler       = "getExpenses.handler"
  runtime       = "nodejs22.x"
  architectures = ["x86_64"]

  source_path = "../src/dist/expenses/getExpenses.mjs"

  layers = [module.lambda_layer_shared.lambda_layer_arn]

  environment_variables = {
    EXPENSES_TABLE_NAME = var.aws_dynamodb_table
    NODE_OPTIONS        = "--enable-source-maps"
  }

  attach_policy_json = true
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem"
        ]
        Resource = module.expense_dynamodb_table.dynamodb_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = {
    Name = "Serverless Expenses"
  }
}

# Update Expense Lambda Function
module "lambda_update_expense" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "updateExpense"
  description   = "Update expense function"
  handler       = "updateExpense.handler"
  runtime       = "nodejs22.x"
  architectures = ["x86_64"]

  source_path = "../src/dist/expenses/updateExpense.mjs"

  layers = [module.lambda_layer_shared.lambda_layer_arn]

  environment_variables = {
    EXPENSES_TABLE_NAME = var.aws_dynamodb_table
    NODE_OPTIONS        = "--enable-source-maps"
  }

  attach_policy_json = true
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = module.expense_dynamodb_table.dynamodb_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = {
    Name = "Serverless Expenses"
  }
}

# Delete Expense Lambda Function
module "lambda_delete_expense" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "deleteExpense"
  description   = "Delete expense function"
  handler       = "deleteExpense.handler"
  runtime       = "nodejs22.x"
  architectures = ["x86_64"]

  source_path = "../src/dist/expenses/deleteExpense.mjs"

  layers = [module.lambda_layer_shared.lambda_layer_arn]

  environment_variables = {
    EXPENSES_TABLE_NAME = var.aws_dynamodb_table
    NODE_OPTIONS        = "--enable-source-maps"
  }

  attach_policy_json = true
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = module.expense_dynamodb_table.dynamodb_table_arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })

  tags = {
    Name = "Serverless Expenses"
  }
}