# GKE (Google Kubernetes Engine) module.
# Uses Autopilot mode: Google manages node sizing, scaling, and security automatically.
# Workload Identity: lets pods call GCP APIs without static service account keys.

terraform {
  required_providers {
    google = { source = "hashicorp/google", version = "~> 5.0" }
  }
}

variable "cluster_name" { type = string }
variable "project_id"   { type = string }
variable "region"       { type = string }
variable "environment"  { type = string }

resource "google_container_cluster" "main" {
  name     = var.cluster_name
  location = var.region
  project  = var.project_id

  # Autopilot: node management handled by GKE — no node pool configuration needed.
  # Why Autopilot: zero node management overhead; scales to zero when idle (saves cost).
  enable_autopilot = true

  # Workload Identity: lets pods authenticate to GCP APIs using K8s service accounts.
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Private cluster: nodes have no public IP (more secure)
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false  # control plane still publicly accessible
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  ip_allocation_policy {}  # required for VPC-native cluster

  resource_labels = {
    environment = var.environment
    managed-by  = "terraform"
    platform    = "pipeline-studio"
  }
}

output "cluster_name"      { value = google_container_cluster.main.name }
output "cluster_endpoint"  { value = google_container_cluster.main.endpoint }
output "kubeconfig_command" {
  value = "gcloud container clusters get-credentials ${var.cluster_name} --region ${var.region} --project ${var.project_id}"
}
