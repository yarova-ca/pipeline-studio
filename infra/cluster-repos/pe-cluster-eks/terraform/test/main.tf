# Test spoke — mirrors prod config for accurate pre-prod testing.
# 2 replicas per service. Production-like resource limits.
# Same module as prod, different sizing.

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
    # -backend-config="key=clusters/test/terraform.tfstate"
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
  default     = "test"
}

module "test" {
  source = "../modules/eks"

  cluster_name       = "pipeline-test"
  region             = var.region
  node_instance_type = "m5.xlarge" # 4 vCPU, 16GB
  min_nodes          = 3
  max_nodes          = 10
  desired_nodes      = 5
  environment        = var.environment
}

output "kubeconfig_command" {
  value = module.test.kubeconfig_command
}

output "eso_irsa_role_arn" {
  value = module.test.eso_irsa_role_arn
}

output "argocd_irsa_role_arn" {
  value = module.test.argocd_irsa_role_arn
}
