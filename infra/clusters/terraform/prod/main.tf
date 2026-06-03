# Prod cluster — full production spec.
# 3+ replicas per service. Autoscaling on. Strict Kyverno policies.
# Multi-AZ node distribution for high availability.

terraform {
  required_version = ">= 1.6"
  backend "s3" {}
}

variable "cloud"          { type = string; description = "eks | gke | aks | openshift" }
variable "region"         { type = string; default = "us-east-1" }
variable "environment"    { type = string; default = "prod" }
variable "gke_project_id" { type = string; default = "" }

module "prod_eks" {
  count  = var.cloud == "eks" ? 1 : 0
  source = "../modules/eks"

  cluster_name       = "pipeline-prod"
  region             = var.region
  node_instance_type = "m5.2xlarge"  # 8 vCPU, 32GB
  min_nodes          = 5
  max_nodes          = 50
  desired_nodes      = 10
  environment        = var.environment
}

module "prod_gke" {
  count  = var.cloud == "gke" ? 1 : 0
  source = "../modules/gke"

  cluster_name = "pipeline-prod"
  project_id   = var.gke_project_id
  region       = var.region
  environment  = var.environment
}

module "prod_aks" {
  count  = var.cloud == "aks" ? 1 : 0
  source = "../modules/aks"

  cluster_name        = "pipeline-prod"
  resource_group_name = "pipeline-prod-rg"
  location            = var.region
  node_vm_size        = "Standard_D8s_v3"  # 8 vCPU, 32GB
  min_nodes           = 5
  max_nodes           = 50
  environment         = var.environment
}
