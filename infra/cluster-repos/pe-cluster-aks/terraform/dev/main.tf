# Dev cluster — all 105 services with minimal resources for development.
# 1 replica per service. Debug logging on. Kyverno in audit mode.

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
    # key                  = "clusters/dev.tfstate"
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
  default = "dev"
}

module "dev" {
  source = "../modules/aks"

  cluster_name        = "pipeline-dev"
  resource_group_name = "pipeline-dev-rg"
  location            = var.location
  node_vm_size        = "Standard_D4s_v3" # 4 vCPU, 16GB — sufficient for 105 small services
  min_nodes           = 2
  max_nodes           = 5
  environment         = var.environment
}

output "kubeconfig_command" {
  value = module.dev.kubeconfig_command
}

output "oidc_issuer_url" {
  value = module.dev.oidc_issuer_url
}
