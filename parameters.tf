provider "aws" {
  region = "us-west-2"
}

locals {
   repo_name = "bradshaw-technical-challenge"
   env = "dev"
   tags = {
      owner = "marktb"
      repo  = "https://github.com/byu-oit-training/${local.repo_name}"
   }
}

 resource "aws_ssm_parameter" "DB_USR" {
   name  = "/${local.repo_name}/${local.env}/DB_USR"
   type  = "String"
   value = var.DB_USR
   tags  = local.tags
}

variable "DB_USR" {
   type = string
}

resource "aws_ssm_parameter" "DB_PWD" {
   name  = "/${local.repo_name}/${local.env}/DB_PWD"
   type  = "SecureString"
   value = var.DB_PWD
   tags  = local.tags
}

variable "DB_PWD" {
   type = string
}

resource "aws_ssm_parameter" "G_CLIENT_ID" {
   name  = "/${local.repo_name}/${local.env}/G_CLIENT_ID"
   type  = "SecureString"
   value = var.G_CLIENT_ID
   tags  = local.tags
}

variable "G_CLIENT_ID" {
   type = string
}

resource "aws_ssm_parameter" "G_CLIENT_SECRET" {
   name  = "/${local.repo_name}/${local.env}/G_CLIENT_SECRET"
   type  = "SecureString"
   value = var.G_CLIENT_SECRET
   tags  = local.tags
}

variable "G_CLIENT_SECRET" {
   type = string
}