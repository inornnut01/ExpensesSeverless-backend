variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "api_gateway_stage" {
  description = "API Gateway stage"
  type        = string
  default     = "production"
}

variable "aws_dynamodb_table" {
  description = "AWS DynamoDB table"
  type        = string
  default     = "expenses-table"
}