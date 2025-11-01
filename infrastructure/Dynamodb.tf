module "expense_dynamodb_table" {
  source   = "terraform-aws-modules/dynamodb-table/aws"

  name     = "expenses-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "userId"
  range_key = "id"

  attributes = [
    {
      name = "userId"
      type = "S"
    },
    {
      name = "id"
      type = "S"
    }
  ]

  tags = {
    Name = "Serverless Expenses Table"
  }
}