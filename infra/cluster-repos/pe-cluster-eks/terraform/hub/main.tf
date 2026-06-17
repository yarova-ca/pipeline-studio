# Hub cluster — runs ArgoCD and management tools only.
# No user services (14-express etc.) ever run on this cluster.
# Why dedicated hub: if prod cluster is overloaded, hub remains available for management.

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Configure via -backend-config flags at init time:
    #   -backend-config="bucket=YOUR-TF-STATE-BUCKET"
    #   -backend-config="key=clusters/hub/terraform.tfstate"
    #   -backend-config="region=us-east-1"
  }
}

provider "aws" {
  region = var.region
}

variable "cluster_name" {
  type        = string
  description = "Hub cluster name."
  default     = "pipeline-hub"
}

variable "environment" {
  type        = string
  description = "Environment tag."
  default     = "hub"
}

variable "region" {
  type        = string
  description = "AWS region."
  default     = "us-east-1"
}

module "hub" {
  source = "../modules/eks"

  cluster_name       = var.cluster_name
  region             = var.region
  node_instance_type = "t3.medium" # 2 vCPU, 4GB — ArgoCD + mgmt tools only
  min_nodes          = 2
  max_nodes          = 4
  desired_nodes      = 2
  environment        = var.environment
}

output "kubeconfig_command" {
  description = "Run this to add the hub cluster to your kubeconfig."
  value       = module.hub.kubeconfig_command
}

output "eso_irsa_role_arn" {
  value = module.hub.eso_irsa_role_arn
}

output "argocd_irsa_role_arn" {
  value = module.hub.argocd_irsa_role_arn
}
