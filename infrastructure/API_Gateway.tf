resource "aws_api_gateway_rest_api" "expenses_api" {
  name        = "expenses-api"
  description = "API Gateway for expenses serverless app"
}

# /expenses resource
resource "aws_api_gateway_resource" "expenses" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  parent_id   = aws_api_gateway_rest_api.expenses_api.root_resource_id
  path_part   = "expenses"
}

# /expenses/create resource
resource "aws_api_gateway_resource" "create_expenses" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  parent_id   = aws_api_gateway_resource.expenses.id
  path_part   = "create"
}

# OPTIONS method for CORS
resource "aws_api_gateway_method" "create_expense_options" {
  rest_api_id   = aws_api_gateway_rest_api.expenses_api.id
  resource_id   = aws_api_gateway_resource.create_expenses.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "create_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.create_expenses.id
  http_method = aws_api_gateway_method.create_expense_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "create_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.create_expenses.id
  http_method = aws_api_gateway_method.create_expense_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "create_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.create_expenses.id
  http_method = aws_api_gateway_method.create_expense_options.http_method
  status_code = aws_api_gateway_method_response.create_expense_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# POST method for creating expense
resource "aws_api_gateway_method" "create_expense_post" {
  rest_api_id   = aws_api_gateway_rest_api.expenses_api.id
  resource_id   = aws_api_gateway_resource.create_expenses.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "create_expense_post" {
  rest_api_id             = aws_api_gateway_rest_api.expenses_api.id
  resource_id             = aws_api_gateway_resource.create_expenses.id
  http_method             = aws_api_gateway_method.create_expense_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_create_expense.lambda_function_invoke_arn
}

# Lambda permission for API Gateway to invoke createExpense
resource "aws_lambda_permission" "api_gateway_invoke_create_expense" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_create_expense.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.expenses_api.execution_arn}/*/*"
}

/************************** GET ************************/
# /expenses/get resource
resource "aws_api_gateway_resource" "get_expenses" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  parent_id   = aws_api_gateway_resource.expenses.id
  path_part   = "get"
}

# OPTIONS method for CORS
resource "aws_api_gateway_method" "get_expense_options" {
  rest_api_id   = aws_api_gateway_rest_api.expenses_api.id
  resource_id   = aws_api_gateway_resource.get_expenses.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.get_expenses.id
  http_method = aws_api_gateway_method.get_expense_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "get_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.get_expenses.id
  http_method = aws_api_gateway_method.get_expense_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "get_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.get_expenses.id
  http_method = aws_api_gateway_method.get_expense_options.http_method
  status_code = aws_api_gateway_method_response.get_expense_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# GET method for retrieving expenses
resource "aws_api_gateway_method" "get_expense_get" {
  rest_api_id   = aws_api_gateway_rest_api.expenses_api.id
  resource_id   = aws_api_gateway_resource.get_expenses.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_expense_get" {
  rest_api_id             = aws_api_gateway_rest_api.expenses_api.id
  resource_id             = aws_api_gateway_resource.get_expenses.id
  http_method             = aws_api_gateway_method.get_expense_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_get_expenses.lambda_function_invoke_arn
}

# Lambda permission for API Gateway to invoke getExpenses
resource "aws_lambda_permission" "api_gateway_invoke_get_expenses" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_get_expenses.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.expenses_api.execution_arn}/*/*"
}

/************************** UPDATE ************************/
# /expenses/update resource
resource "aws_api_gateway_resource" "update_expenses" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  parent_id   = aws_api_gateway_resource.expenses.id
  path_part   = "update"
}

# OPTIONS method for CORS
resource "aws_api_gateway_method" "update_expense_options" {
  rest_api_id   = aws_api_gateway_rest_api.expenses_api.id
  resource_id   = aws_api_gateway_resource.update_expenses.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "update_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.update_expenses.id
  http_method = aws_api_gateway_method.update_expense_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "update_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.update_expenses.id
  http_method = aws_api_gateway_method.update_expense_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "update_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.update_expenses.id
  http_method = aws_api_gateway_method.update_expense_options.http_method
  status_code = aws_api_gateway_method_response.update_expense_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'PUT,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# PUT method for updating expense
resource "aws_api_gateway_method" "update_expense_put" {
  rest_api_id   = aws_api_gateway_rest_api.expenses_api.id
  resource_id   = aws_api_gateway_resource.update_expenses.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "update_expense_put" {
  rest_api_id             = aws_api_gateway_rest_api.expenses_api.id
  resource_id             = aws_api_gateway_resource.update_expenses.id
  http_method             = aws_api_gateway_method.update_expense_put.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_update_expense.lambda_function_invoke_arn
}

# Lambda permission for API Gateway to invoke updateExpense
resource "aws_lambda_permission" "api_gateway_invoke_update_expense" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_update_expense.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.expenses_api.execution_arn}/*/*"
}

/************************** DELETE ************************/
# /expenses/delete resource
resource "aws_api_gateway_resource" "delete_expenses" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  parent_id   = aws_api_gateway_resource.expenses.id
  path_part   = "delete"
}

# OPTIONS method for CORS
resource "aws_api_gateway_method" "delete_expense_options" {
  rest_api_id   = aws_api_gateway_rest_api.expenses_api.id
  resource_id   = aws_api_gateway_resource.delete_expenses.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "delete_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.delete_expenses.id
  http_method = aws_api_gateway_method.delete_expense_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "delete_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.delete_expenses.id
  http_method = aws_api_gateway_method.delete_expense_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "delete_expense_options" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id
  resource_id = aws_api_gateway_resource.delete_expenses.id
  http_method = aws_api_gateway_method.delete_expense_options.http_method
  status_code = aws_api_gateway_method_response.delete_expense_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# DELETE method for deleting expense
resource "aws_api_gateway_method" "delete_expense_delete" {
  rest_api_id   = aws_api_gateway_rest_api.expenses_api.id
  resource_id   = aws_api_gateway_resource.delete_expenses.id
  http_method   = "DELETE"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "delete_expense_delete" {
  rest_api_id             = aws_api_gateway_rest_api.expenses_api.id
  resource_id             = aws_api_gateway_resource.delete_expenses.id
  http_method             = aws_api_gateway_method.delete_expense_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = module.lambda_delete_expense.lambda_function_invoke_arn
}

# Lambda permission for API Gateway to invoke deleteExpense
resource "aws_lambda_permission" "api_gateway_invoke_delete_expense" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = module.lambda_delete_expense.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.expenses_api.execution_arn}/*/*"
}

/************************** DEPLOYMENT ************************/
# API Gateway Deployment
resource "aws_api_gateway_deployment" "expenses_api" {
  rest_api_id = aws_api_gateway_rest_api.expenses_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.expenses.id,
      aws_api_gateway_resource.create_expenses.id,
      aws_api_gateway_resource.get_expenses.id,
      aws_api_gateway_resource.update_expenses.id,
      aws_api_gateway_resource.delete_expenses.id,
      aws_api_gateway_method.create_expense_post.id,
      aws_api_gateway_method.get_expense_get.id,
      aws_api_gateway_method.update_expense_put.id,
      aws_api_gateway_method.delete_expense_delete.id,
      aws_api_gateway_integration.create_expense_post.id,
      aws_api_gateway_integration.get_expense_get.id,
      aws_api_gateway_integration.update_expense_put.id,
      aws_api_gateway_integration.delete_expense_delete.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.create_expense_post,
    aws_api_gateway_integration.get_expense_get,
    aws_api_gateway_integration.update_expense_put,
    aws_api_gateway_integration.delete_expense_delete,
  ]
}

# API Gateway Stage
resource "aws_api_gateway_stage" "production" {
  deployment_id = aws_api_gateway_deployment.expenses_api.id
  rest_api_id   = aws_api_gateway_rest_api.expenses_api.id
  stage_name    = "production"
}
