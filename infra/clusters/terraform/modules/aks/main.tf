# AKS (Azure Kubernetes Service) module.
# Managed Identity: Azure's equivalent of IRSA — no static credentials needed.
# VMSS: Virtual Machine Scale Sets — node autoscaling on Azure.

terraform {
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.0" }
  }
}

variable "cluster_name"        { type = string }
variable "resource_group_name" { type = string }
variable "location"            { type = string }
variable "kubernetes_version"  { type = string; default = "1.31" }
variable "node_vm_size"        { type = string }
variable "min_nodes"           { type = number; default = 1 }
variable "max_nodes"           { type = number }
variable "environment"         { type = string }

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Platform    = "pipeline-studio"
  }
}

resource "azurerm_kubernetes_cluster" "main" {
  name                = var.cluster_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = var.cluster_name
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name                = "system"
    vm_size             = var.node_vm_size
    enable_auto_scaling = true
    min_count           = var.min_nodes
    max_count           = var.max_nodes
    os_disk_type        = "Managed"
    type                = "VirtualMachineScaleSets"  # VMSS for autoscaling
  }

  # Managed Identity: no service principal credentials to rotate
  identity { type = "SystemAssigned" }

  # OIDC issuer: required for Workload Identity Federation (Azure's ESO integration)
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  network_profile {
    network_plugin    = "azure"
    load_balancer_sku = "standard"
  }

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Platform    = "pipeline-studio"
  }
}

output "cluster_name"       { value = azurerm_kubernetes_cluster.main.name }
output "kube_config"        { value = azurerm_kubernetes_cluster.main.kube_config_raw; sensitive = true }
output "kubeconfig_command" {
  value = "az aks get-credentials --resource-group ${var.resource_group_name} --name ${var.cluster_name}"
}
