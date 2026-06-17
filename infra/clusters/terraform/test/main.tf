# Test cluster — mirrors prod config for accurate pre-prod testing.
# 2 replicas per service. Production-like resource limits.
# Uses the same Terraform modules as prod, different sizing.

terraform {
  required_version = ">= 1.6"
  backend "s3" {}
}

variable "cloud"          { type = string; description = "eks | gke | aks | openshift" }
variable "region"         { type = string; default = "us-east-1" }
variable "environment"    { type = string; default = "test" }
variable "gke_project_id" { type = string; default = "" }

module "test_eks" {
  count  = var.cloud == "eks" ? 1 : 0
  source = "../modules/eks"

  cluster_name       = "pipeline-test"
  region             = var.region
  node_instance_type = "m5.xlarge"  # 4 vCPU, 16GB
  min_nodes          = 3
  max_nodes          = 10
  desired_nodes      = 5
  environment        = var.environment
}

module "test_gke" {
  count  = var.cloud == "gke" ? 1 : 0
  source = "../modules/gke"

  cluster_name = "pipeline-test"
  project_id   = var.gke_project_id
  region       = var.region
  environment  = var.environment
}

module "test_aks" {
  count  = var.cloud == "aks" ? 1 : 0
  source = "../modules/aks"

  cluster_name        = "pipeline-test"
  resource_group_name = "pipeline-test-rg"
  location            = var.region
  node_vm_size        = "Standard_D4s_v3"
  min_nodes           = 3
  max_nodes           = 10
  environment         = var.environment
}
