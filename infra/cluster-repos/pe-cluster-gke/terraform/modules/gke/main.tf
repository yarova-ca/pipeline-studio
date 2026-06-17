# GKE (Google Kubernetes Engine) module — Autopilot mode.
# Autopilot: Google fully manages node sizing, scaling, patching, and security.
# Workload Identity: pods authenticate to GCP APIs via K8s service accounts — no static keys.
#
# Creates:
#   - One GKE Autopilot cluster (VPC-native, private nodes).
#   - Workload Identity pool bound to the cluster.
#   - GCP service accounts + IAM bindings for ESO and ArgoCD.
#
# Required Google APIs (enable before apply):
#   container.googleapis.com, compute.googleapis.com,
#   iam.googleapis.com, secretmanager.googleapis.com.

terraform {
  required_version = ">= 1.6"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "cluster_name" {
  type        = string
  description = "Name of the GKE cluster (e.g. pipeline-hub, pipeline-dev)."
}

variable "project_id" {
  type        = string
  description = "GCP project ID that owns the cluster."
}

variable "region" {
  type        = string
  description = "GCP region for the regional Autopilot cluster (e.g. us-central1)."
}

variable "environment" {
  type        = string
  description = "Environment label: hub | dev | test | prod."
}

variable "release_channel" {
  type        = string
  default     = "REGULAR"
  description = "GKE release channel: RAPID | REGULAR | STABLE."
}

variable "master_ipv4_cidr_block" {
  type        = string
  default     = "172.16.0.0/28"
  description = "RFC1918 /28 for the private control plane. Must not overlap node/pod ranges."
}

variable "enable_eso_workload_identity" {
  type        = bool
  default     = true
  description = "When true: create a GCP SA for External Secrets Operator with Secret Manager access."
}

variable "enable_argocd_workload_identity" {
  type        = bool
  default     = true
  description = "When true (hub only): create a GCP SA for ArgoCD with container.viewer access."
}

# ── GKE Autopilot cluster ───────────────────────────────────────────────────
resource "google_container_cluster" "main" {
  name     = var.cluster_name
  location = var.region
  project  = var.project_id

  # Autopilot: node management handled by GKE — no node pool configuration needed.
  # Why Autopilot: zero node management overhead; bills per pod request; auto security.
  enable_autopilot = true

  # Release channel: REGULAR balances stability with timely security patches.
  release_channel {
    channel = var.release_channel
  }

  # Workload Identity: lets pods authenticate to GCP APIs using K8s service accounts.
  # Workload pool format is fixed by GCP: <project>.svc.id.goog.
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Private cluster: nodes have no public IP. Control plane reachable for kubectl/CI.
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false # control plane endpoint stays public for CI access
    master_ipv4_cidr_block  = var.master_ipv4_cidr_block
  }

  # VPC-native cluster. Empty block lets GKE auto-allocate pod/service ranges.
  ip_allocation_policy {}

  # Autopilot enforces a hardened security posture by default.
  # Shielded nodes verify node boot integrity; cannot be disabled on Autopilot.

  resource_labels = {
    environment = var.environment
    managed-by  = "terraform"
    platform    = "pipeline-studio"
  }

  # Deletion protection on for prod; off elsewhere so dev/test can be torn down.
  deletion_protection = var.environment == "prod"
}

# ── External Secrets Operator — GCP service account + Workload Identity ──────
# ESO syncs secrets from GCP Secret Manager into Kubernetes Secret objects.
# The K8s SA "external-secrets" in namespace "external-secrets-system"
# impersonates this GCP SA via Workload Identity — no static key files.
resource "google_service_account" "eso" {
  count        = var.enable_eso_workload_identity ? 1 : 0
  account_id   = "${var.cluster_name}-eso"
  display_name = "External Secrets Operator (${var.cluster_name})"
  project      = var.project_id
}

resource "google_project_iam_member" "eso_secret_accessor" {
  count   = var.enable_eso_workload_identity ? 1 : 0
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.eso[0].email}"
}

resource "google_service_account_iam_member" "eso_workload_identity" {
  count              = var.enable_eso_workload_identity ? 1 : 0
  service_account_id = google_service_account.eso[0].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[external-secrets-system/external-secrets]"
}

# ── ArgoCD — GCP service account + Workload Identity (hub only) ──────────────
# ArgoCD reads cluster/image metadata. container.viewer is least-privilege read.
resource "google_service_account" "argocd" {
  count        = var.enable_argocd_workload_identity ? 1 : 0
  account_id   = "${var.cluster_name}-argocd"
  display_name = "ArgoCD (${var.cluster_name})"
  project      = var.project_id
}

resource "google_project_iam_member" "argocd_container_viewer" {
  count   = var.enable_argocd_workload_identity ? 1 : 0
  project = var.project_id
  role    = "roles/container.viewer"
  member  = "serviceAccount:${google_service_account.argocd[0].email}"
}

resource "google_service_account_iam_member" "argocd_workload_identity" {
  count              = var.enable_argocd_workload_identity ? 1 : 0
  service_account_id = google_service_account.argocd[0].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[argocd/argocd-application-controller]"
}

# ── Outputs ──────────────────────────────────────────────────────────────────
output "cluster_name" {
  value       = google_container_cluster.main.name
  description = "Name of the created GKE cluster."
}

output "cluster_endpoint" {
  value       = google_container_cluster.main.endpoint
  description = "Control plane endpoint (IP) for the cluster."
  sensitive   = true
}

output "cluster_ca_certificate" {
  value       = google_container_cluster.main.master_auth[0].cluster_ca_certificate
  description = "Base64 CA cert for the cluster control plane."
  sensitive   = true
}

output "workload_pool" {
  value       = google_container_cluster.main.workload_identity_config[0].workload_pool
  description = "Workload Identity pool bound to the cluster."
}

output "eso_service_account_email" {
  value       = var.enable_eso_workload_identity ? google_service_account.eso[0].email : ""
  description = "GCP SA email for ESO. Annotate the K8s SA with this."
}

output "argocd_service_account_email" {
  value       = var.enable_argocd_workload_identity ? google_service_account.argocd[0].email : ""
  description = "GCP SA email for ArgoCD. Annotate the K8s SA with this."
}

output "kubeconfig_command" {
  value       = "gcloud container clusters get-credentials ${var.cluster_name} --region ${var.region} --project ${var.project_id}"
  description = "Command to fetch kubeconfig for this cluster."
}
