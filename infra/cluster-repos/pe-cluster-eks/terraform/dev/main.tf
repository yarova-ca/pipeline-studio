# Dev spoke — all 105 services with minimal resources for development.
# 1 replica per service. Debug logging on. Kyverno in audit mode.
# Cost optimisation: smaller nodes, single NAT gateway.

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
    # -backend-config="key=clusters/dev/terraform.tfstate"
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
  default     = "dev"
}

module "dev" {
  source = "../modules/eks"

  cluster_name       = "pipeline-dev"
  region             = var.region
  node_instance_type = "t3.large" # 2 vCPU, 8GB — sufficient for 105 small services
  min_nodes          = 2
  max_nodes          = 5
  desired_nodes      = 3
  environment        = var.environment
}

output "kubeconfig_command" {
  value = module.dev.kubeconfig_command
}

output "eso_irsa_role_arn" {
  value = module.dev.eso_irsa_role_arn
}

output "argocd_irsa_role_arn" {
  value = module.dev.argocd_irsa_role_arn
}
