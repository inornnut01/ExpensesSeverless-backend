# Amplify App
resource "aws_amplify_app" "expenses_frontend" {
  name       = "expenses-tracker-frontend"
  repository = var.github_repository

  # OAuth token for GitHub
  access_token = var.github_token

  # Environment variables 
  environment_variables = {
    VITE_API_BASE_URL            = "${aws_api_gateway_stage.production.invoke_url}/expenses"
    VITE_AWS_USER_POOL_ID        = aws_cognito_user_pool.expenses_user_pool.id
    VITE_AWS_USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.expenses_client.id
    VITE_AWS_REGION              = var.aws_region
  }

  # Build settings
  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  # Custom rules for SPA routing
  custom_rule {
    source = "/<*>"
    status = "404"
    target = "/index.html"
  }

  tags = {
    Name = "Serverless Expenses Frontend"
  }
}

# Amplify Branch (main/production)
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.expenses_frontend.id
  branch_name = "main"

  enable_auto_build = true

  framework = "React"
  stage     = "PRODUCTION"
}

# Webhook for triggering deployments
resource "aws_amplify_webhook" "main" {
  app_id      = aws_amplify_app.expenses_frontend.id
  branch_name = aws_amplify_branch.main.branch_name
  description = "Trigger deployment"
}

# Trigger initial deployment
resource "null_resource" "trigger_amplify_build" {
  depends_on = [aws_amplify_branch.main, aws_amplify_webhook.main]

  provisioner "local-exec" {
    command = "curl -X POST -d {} '${aws_amplify_webhook.main.url}' -H 'Content-Type:application/json'"
  }

  # Trigger on any change to environment variables
  triggers = {
    api_url      = aws_api_gateway_stage.production.invoke_url
    user_pool_id = aws_cognito_user_pool.expenses_user_pool.id
    client_id    = aws_cognito_user_pool_client.expenses_client.id
  }
}


