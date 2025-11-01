terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Optional: Terraform state backend (แนะนำสำหรับ production)
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "expense-tracker/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

