# Hub cluster — runs ArgoCD and management tools only.
# No user services (14-express etc.) ever run on this cluster.
# Why dedicated hub: if prod cluster is overloaded, hub remains available for management.

terraform {
  required_version = ">= 1.6"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
  backend "azurerm" {
    # Configure via -backend-config flags or backend.hcl, e.g.:
    # resource_group_name  = "pipeline-tfstate-rg"
    # storage_account_name = "pipelinetfstate"
    # container_name       = "tfstate"
    # key                  = "clusters/hub.tfstate"
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

variable "cluster_name" {
  type    = string
  default = "pipeline-hub"
}

variable "environment" {
  type    = string
  default = "hub"
}

variable "location" {
  type    = string
  default = "eastus"
}

module "hub" {
  source = "../modules/aks"

  cluster_name        = var.cluster_name
  resource_group_name = "${var.cluster_name}-rg"
  location            = var.location
  node_vm_size        = "Standard_D2s_v3" # 2 vCPU, 8GB — ArgoCD + management tools only
  min_nodes           = 2
  max_nodes           = 4
  environment         = var.environment
}

output "kubeconfig_command" {
  value = module.hub.kubeconfig_command
}

output "oidc_issuer_url" {
  value = module.hub.oidc_issuer_url
}
