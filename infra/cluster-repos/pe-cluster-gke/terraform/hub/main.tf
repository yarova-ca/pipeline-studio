# Hub cluster — runs ArgoCD and management tools only (GKE Autopilot).
# No user services (14-express etc.) ever run on this cluster.
# Why dedicated hub: if prod cluster is overloaded, hub remains available for management.

terraform {
  required_version = ">= 1.12"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
  backend "gcs" {
    # Configure via -backend-config flags at init time:
    #   -backend-config="bucket=YOUR-GCS-STATE-BUCKET"
    #   -backend-config="prefix=clusters/hub"
  }
}

variable "project_id" {
  type        = string
  description = "GCP project ID that owns the hub cluster."
}

variable "cluster_name" {
  type        = string
  default     = "pipeline-hub"
  description = "Name of the hub cluster."
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "GCP region for the hub cluster."
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "hub" {
  source = "../modules/gke"

  cluster_name = var.cluster_name
  project_id   = var.project_id
  region       = var.region
  environment  = "hub"

  # Hub runs ArgoCD: enable the ArgoCD Workload Identity SA here.
  enable_argocd_workload_identity = true
  enable_eso_workload_identity    = true
}

output "kubeconfig_command" {
  value       = module.hub.kubeconfig_command
  description = "Command to fetch kubeconfig for the hub cluster."
}

output "argocd_service_account_email" {
  value       = module.hub.argocd_service_account_email
  description = "GCP SA email to annotate the ArgoCD K8s service account."
}

output "eso_service_account_email" {
  value       = module.hub.eso_service_account_email
  description = "GCP SA email to annotate the ESO K8s service account."
}
