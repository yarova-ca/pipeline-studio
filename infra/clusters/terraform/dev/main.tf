# Dev cluster — all 105 services with minimal resources for development.
# 1 replica per service. Debug logging on. Kyverno in audit mode.
# Cost optimisation: use spot/preemptible nodes where possible.

terraform {
  required_version = ">= 1.6"
  backend "s3" {}
}

variable "cloud"          { type = string; description = "eks | gke | aks | openshift" }
variable "region"         { type = string; default = "us-east-1" }
variable "environment"    { type = string; default = "dev" }
variable "gke_project_id" { type = string; default = "" }

module "dev_eks" {
  count  = var.cloud == "eks" ? 1 : 0
  source = "../modules/eks"

  cluster_name       = "pipeline-dev"
  region             = var.region
  node_instance_type = "t3.large"  # 2 vCPU, 8GB — sufficient for 105 small services
  min_nodes          = 2
  max_nodes          = 5
  desired_nodes      = 3
  environment        = var.environment
}

module "dev_gke" {
  count  = var.cloud == "gke" ? 1 : 0
  source = "../modules/gke"

  cluster_name = "pipeline-dev"
  project_id   = var.gke_project_id
  region       = var.region
  environment  = var.environment
}

module "dev_aks" {
  count  = var.cloud == "aks" ? 1 : 0
  source = "../modules/aks"

  cluster_name        = "pipeline-dev"
  resource_group_name = "pipeline-dev-rg"
  location            = var.region
  node_vm_size        = "Standard_D4s_v3"
  min_nodes           = 2
  max_nodes           = 5
  environment         = var.environment
}
