# Prod spoke — full production spec.
# 3+ replicas per service. Autoscaling on. Strict Kyverno policies.
# Multi-AZ node distribution + HA NAT for high availability.

terraform {
  required_version = ">= 1.12"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    # -backend-config="bucket=YOUR-TF-STATE-BUCKET"
    # -backend-config="key=clusters/prod/terraform.tfstate"
    # -backend-config="region=us-east-1"
  }
}

provider "aws" {
  region = var.region
}

variable "region" {
  type        = string
  description = "AWS region."
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Environment tag."
  default     = "prod"
}

module "prod" {
  source = "../modules/eks"

  cluster_name       = "pipeline-prod"
  region             = var.region
  node_instance_type = "m5.2xlarge" # 8 vCPU, 32GB
  min_nodes          = 5
  max_nodes          = 50
  desired_nodes      = 10
  environment        = var.environment
}

output "kubeconfig_command" {
  value = module.prod.kubeconfig_command
}

output "eso_irsa_role_arn" {
  value = module.prod.eso_irsa_role_arn
}

output "argocd_irsa_role_arn" {
  value = module.prod.argocd_irsa_role_arn
}
