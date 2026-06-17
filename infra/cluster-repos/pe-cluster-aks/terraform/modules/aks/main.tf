# AKS (Azure Kubernetes Service) module.
# Managed Identity: Azure's equivalent of IRSA — no static credentials needed.
# VMSS: Virtual Machine Scale Sets — node autoscaling on Azure.
# OIDC issuer + Workload Identity: lets pods federate to Azure AD (used by ESO).

terraform {
  required_version = ">= 1.6"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

variable "cluster_name" {
  type        = string
  description = "AKS cluster name and DNS prefix."
}

variable "resource_group_name" {
  type        = string
  description = "Resource group that holds the cluster."
}

variable "location" {
  type        = string
  description = "Azure region, e.g. eastus."
}

variable "kubernetes_version" {
  type        = string
  default     = "1.31"
  description = "Kubernetes minor version for the control plane and node pool."
}

variable "node_vm_size" {
  type        = string
  description = "VM SKU for the system node pool, e.g. Standard_D4s_v3."
}

variable "min_nodes" {
  type        = number
  default     = 1
  description = "Minimum nodes when autoscaling."
}

variable "max_nodes" {
  type        = number
  description = "Maximum nodes when autoscaling."
}

variable "environment" {
  type        = string
  description = "hub | dev | test | prod."
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Extra tags merged onto every resource."
}

locals {
  base_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Platform    = "pipeline-studio"
  }
  tags = merge(local.base_tags, var.tags)
}

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = local.tags
}

resource "azurerm_kubernetes_cluster" "main" {
  name                = var.cluster_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = var.cluster_name
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name                 = "system"
    vm_size              = var.node_vm_size
    auto_scaling_enabled = true
    min_count            = var.min_nodes
    max_count            = var.max_nodes
    os_disk_type         = "Managed"
    type                 = "VirtualMachineScaleSets" # VMSS for autoscaling

    upgrade_settings {
      max_surge = "33%"
    }
  }

  # Managed Identity: no service principal credentials to rotate.
  identity {
    type = "SystemAssigned"
  }

  # OIDC issuer: required for Workload Identity Federation (Azure's ESO integration).
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  # CSI driver that mounts secrets from Azure Key Vault (used by ESO + cert-manager).
  key_vault_secrets_provider {
    secret_rotation_enabled = true
  }

  network_profile {
    network_plugin    = "azure"
    network_policy    = "calico" # enforces Kubernetes NetworkPolicy (default-deny invariant).
    load_balancer_sku = "standard"
  }

  role_based_access_control_enabled = true

  tags = local.tags
}

output "cluster_name" {
  value = azurerm_kubernetes_cluster.main.name
}

output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "oidc_issuer_url" {
  description = "OIDC issuer URL for federated Workload Identity (ESO)."
  value       = azurerm_kubernetes_cluster.main.oidc_issuer_url
}

output "kubelet_identity_object_id" {
  description = "Object ID of the kubelet managed identity (grant Key Vault access to this)."
  value       = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
}

output "kube_config" {
  value     = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive = true
}

output "kubeconfig_command" {
  value = "az aks get-credentials --resource-group ${var.resource_group_name} --name ${var.cluster_name}"
}
