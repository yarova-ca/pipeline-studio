# Dev spoke cluster — all services with minimal resources for development (GKE Autopilot).
# 1 replica per service. Debug logging on. Kyverno in audit mode.
# Autopilot bills per pod request, so idle dev cost stays low automatically.

terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    # -backend-config="bucket=YOUR-GCS-STATE-BUCKET"
    # -backend-config="prefix=clusters/dev"
  }
}

variable "project_id" {
  type        = string
  description = "GCP project ID that owns the dev cluster."
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "GCP region for the dev cluster."
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "dev" {
  source = "../modules/gke"

  cluster_name = "pipeline-dev"
  project_id   = var.project_id
  region       = var.region
  environment  = "dev"

  # Spoke: no ArgoCD runs here (hub manages it). ESO still needed for secret sync.
  enable_argocd_workload_identity = false
  enable_eso_workload_identity    = true
}

output "kubeconfig_command" {
  value       = module.dev.kubeconfig_command
  description = "Command to fetch kubeconfig for the dev cluster."
}

output "eso_service_account_email" {
  value       = module.dev.eso_service_account_email
  description = "GCP SA email to annotate the ESO K8s service account."
}
