# Prod cluster — full production spec.
# 3+ replicas per service. Autoscaling on. Strict Kyverno policies.
# Multi-zone node distribution for high availability.

terraform {
  required_version = ">= 1.12"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.77" # latest 4.x as of 2026-06; no 5.x GA yet
    }
  }
  backend "azurerm" {
    # resource_group_name  = "pipeline-tfstate-rg"
    # storage_account_name = "pipelinetfstate"
    # container_name       = "tfstate"
    # key                  = "clusters/prod.tfstate"
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

variable "subscription_id" {
  type        = string
  default     = null
  description = "Azure subscription ID. Falls back to ARM_SUBSCRIPTION_ID env var when null."
}

variable "location" {
  type    = string
  default = "eastus"
}

variable "environment" {
  type    = string
  default = "prod"
}

module "prod" {
  source = "../modules/aks"

  cluster_name        = "pipeline-prod"
  resource_group_name = "pipeline-prod-rg"
  location            = var.location
  node_vm_size        = "Standard_D8s_v3" # 8 vCPU, 32GB
  min_nodes           = 5
  max_nodes           = 50
  environment         = var.environment
}

output "kubeconfig_command" {
  value = module.prod.kubeconfig_command
}

output "oidc_issuer_url" {
  value = module.prod.oidc_issuer_url
}
