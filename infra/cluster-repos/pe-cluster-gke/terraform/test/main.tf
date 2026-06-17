# Test spoke cluster — mirrors prod config for accurate pre-prod testing (GKE Autopilot).
# 2 replicas per service. Production-like resource limits. Kyverno in audit mode.

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
    # -backend-config="prefix=clusters/test"
  }
}

variable "project_id" {
  type        = string
  description = "GCP project ID that owns the test cluster."
}

variable "region" {
  type        = string
  default     = "us-central1"
  description = "GCP region for the test cluster."
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "test" {
  source = "../modules/gke"

  cluster_name = "pipeline-test"
  project_id   = var.project_id
  region       = var.region
  environment  = "test"

  enable_argocd_workload_identity = false
  enable_eso_workload_identity    = true
}

output "kubeconfig_command" {
  value       = module.test.kubeconfig_command
  description = "Command to fetch kubeconfig for the test cluster."
}

output "eso_service_account_email" {
  value       = module.test.eso_service_account_email
  description = "GCP SA email to annotate the ESO K8s service account."
}
