# API Gateway Outputs
output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "${aws_api_gateway_stage.production.invoke_url}/expenses"
}

output "api_gateway_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.expenses_api.id
}

# Cognito Outputs
output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.expenses_user_pool.id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.expenses_client.id
}

output "user_pool_endpoint" {
  description = "Cognito User Pool Endpoint"
  value       = aws_cognito_user_pool.expenses_user_pool.endpoint
}

output "user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.expenses_user_pool.arn
}

# DynamoDB Outputs
output "dynamodb_table_name" {
  description = "DynamoDB Table Name"
  value       = module.expense_dynamodb_table.dynamodb_table_id
}

output "dynamodb_table_arn" {
  description = "DynamoDB Table ARN"
  value       = module.expense_dynamodb_table.dynamodb_table_arn
}

# Lambda Outputs
output "lambda_layer_arn" {
  description = "Lambda Layer ARN"
  value       = module.lambda_layer_shared.lambda_layer_arn
}

output "lambda_create_expense_arn" {
  description = "Create Expense Lambda Function ARN"
  value       = module.lambda_create_expense.lambda_function_arn
}

output "lambda_get_expenses_arn" {
  description = "Get Expenses Lambda Function ARN"
  value       = module.lambda_get_expenses.lambda_function_arn
}

output "lambda_update_expense_arn" {
  description = "Update Expense Lambda Function ARN"
  value       = module.lambda_update_expense.lambda_function_arn
}

output "lambda_delete_expense_arn" {
  description = "Delete Expense Lambda Function ARN"
  value       = module.lambda_delete_expense.lambda_function_arn
}

