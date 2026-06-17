# Prod spoke cluster — full production spec (GKE Autopilot).
# 3+ replicas per service. Strict (enforce) Kyverno policies.
# Autopilot spreads pods across zones for regional high availability.
# Deletion protection is ON for prod (set in the module via environment == "prod").

terraform {
  required_version = ">= 1.12"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.0"
    }
  }
  backend "gcs" {
    # -backend-config="bucket=YOUR-GCS-STATE-BUCKET"
    # -backend-config="prefix=clusters/prod"
  }
}

variable "project_id" {
  type        = string
  description = "GCP project ID that owns the prod cluster."
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "GCP region for the prod cluster."
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "prod" {
  source = "../modules/gke"

  cluster_name = "pipeline-prod"
  project_id   = var.project_id
  region       = var.region
  environment  = "prod"

  enable_argocd_workload_identity = false
  enable_eso_workload_identity    = true
}

output "kubeconfig_command" {
  value       = module.prod.kubeconfig_command
  description = "Command to fetch kubeconfig for the prod cluster."
}

output "eso_service_account_email" {
  value       = module.prod.eso_service_account_email
  description = "GCP SA email to annotate the ESO K8s service account."
}
