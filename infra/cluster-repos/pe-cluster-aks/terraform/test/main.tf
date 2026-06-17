# Test cluster — mirrors prod config for accurate pre-prod testing.
# 2 replicas per service. Production-like resource limits.

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
    # key                  = "clusters/test.tfstate"
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
  default = "test"
}

module "test" {
  source = "../modules/aks"

  cluster_name        = "pipeline-test"
  resource_group_name = "pipeline-test-rg"
  location            = var.location
  node_vm_size        = "Standard_D4s_v3" # 4 vCPU, 16GB
  min_nodes           = 3
  max_nodes           = 10
  environment         = var.environment
}

output "kubeconfig_command" {
  value = module.test.kubeconfig_command
}

output "oidc_issuer_url" {
  value = module.test.oidc_issuer_url
}
