# Hub cluster — runs ArgoCD and management tools only.
# No user services (14-express etc.) ever run on this cluster.
# Why dedicated hub: if prod cluster is overloaded, hub remains available for management.

terraform {
  required_version = ">= 1.6"
  backend "s3" {
    # Configure in terraform.tfvars or via -backend-config flags.
    # bucket = "your-terraform-state-bucket"
    # key    = "clusters/hub/terraform.tfstate"
    # region = "us-east-1"
  }
}

variable "cloud"         { type = string; description = "eks | gke | aks | openshift" }
variable "cluster_name"  { type = string; default = "pipeline-hub" }
variable "environment"   { type = string; default = "hub" }
variable "region"        { type = string; default = "us-central1" }
variable "gke_project_id" { type = string; default = "" }

# GKE (recommended for hub: Autopilot = zero node management)
module "hub_gke" {
  count  = var.cloud == "gke" ? 1 : 0
  source = "../modules/gke"

  cluster_name = var.cluster_name
  project_id   = var.gke_project_id
  region       = var.region
  environment  = var.environment
}

# EKS alternative
module "hub_eks" {
  count  = var.cloud == "eks" ? 1 : 0
  source = "../modules/eks"

  cluster_name       = var.cluster_name
  region             = var.region
  node_instance_type = "t3.medium"
  min_nodes          = 2
  max_nodes          = 4
  desired_nodes      = 2
  environment        = var.environment
}

output "kubeconfig_command" {
  value = var.cloud == "gke" ? module.hub_gke[0].kubeconfig_command : (
    var.cloud == "eks" ? module.hub_eks[0].kubeconfig_command : "See module output"
  )
}
