# OpenShift module — drives the openshift-install CLI via Terraform.
# OpenShift: Red Hat's enterprise Kubernetes — includes built-in OAuth, registry, SCCs.
# Why null_resource: openshift-install has no official Terraform provider.
#
# At APPLY time this module requires (none needed for `terraform validate`):
#   - openshift-install binary on PATH (from mirror.openshift.com).
#   - A valid Red Hat pull secret (var.pull_secret).
#   - An SSH public key (var.ssh_key) for node access.
#   - Cloud credentials for the chosen platform (AWS/GCP/Azure env or none for bare-metal).

terraform {
  required_version = ">= 1.6"
  required_providers {
    null  = { source = "hashicorp/null", version = "~> 3.0" }
    local = { source = "hashicorp/local", version = "~> 2.0" }
  }
}

variable "cluster_name" {
  type        = string
  description = "Cluster name — becomes part of the API URL api.CLUSTER.BASE_DOMAIN."
}

variable "base_domain" {
  type        = string
  description = "Base domain, e.g. yarova.ca — cluster API will be at api.CLUSTER.BASE_DOMAIN."
}

variable "pull_secret" {
  type        = string
  sensitive   = true
  description = "Red Hat pull secret JSON from console.redhat.com/openshift/install/pull-secret."
}

variable "ssh_key" {
  type        = string
  description = "SSH public key for cluster node access (single line, e.g. ssh-ed25519 AAAA...)."
}

variable "platform" {
  type        = string
  default     = "aws"
  description = "Install platform: aws | gcp | azure | none (bare-metal / agent-based)."

  validation {
    condition     = contains(["aws", "gcp", "azure", "none"], var.platform)
    error_message = "platform must be one of: aws, gcp, azure, none."
  }
}

variable "region" {
  type        = string
  description = "Cloud region for the cluster (ignored when platform = none)."
}

variable "environment" {
  type        = string
  description = "Environment label: hub | dev | test | prod."
}

variable "control_plane_replicas" {
  type        = number
  default     = 3
  description = "Control-plane (master) node count. OpenShift requires 3 for HA."

  validation {
    condition     = var.control_plane_replicas == 1 || var.control_plane_replicas == 3
    error_message = "control_plane_replicas must be 1 (single-node) or 3 (HA)."
  }
}

variable "worker_replicas" {
  type        = number
  default     = 3
  description = "Worker (compute) node count."
}

variable "instance_type" {
  type        = string
  default     = ""
  description = "Cloud instance type for nodes. Empty = let openshift-install pick the platform default."
}

# Rendered install-config.yaml that openshift-install consumes.
resource "local_file" "install_config" {
  filename             = "${path.module}/cluster-output/install-config.yaml"
  file_permission      = "0600"
  directory_permission = "0700"
  content = templatefile("${path.module}/install-config.yaml.tpl", {
    cluster_name           = var.cluster_name
    base_domain            = var.base_domain
    pull_secret            = var.pull_secret
    ssh_key                = var.ssh_key
    platform               = var.platform
    region                 = var.region
    control_plane_replicas = var.control_plane_replicas
    worker_replicas        = var.worker_replicas
    instance_type          = var.instance_type
  })
}

# openshift-install consumes and DELETES the install-config.yaml in --dir, so we
# keep a pristine copy and feed a disposable copy into a sibling run directory.
resource "null_resource" "create_cluster" {
  depends_on = [local_file.install_config]

  triggers = {
    cluster_name = var.cluster_name
    config_hash  = local_file.install_config.content_sha256
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -euo pipefail
      command -v openshift-install >/dev/null 2>&1 || {
        echo "ERROR: openshift-install not found on PATH."
        echo "Download from https://mirror.openshift.com/pub/openshift-v4/clients/ocp/stable/"
        exit 1
      }
      RUN_DIR="${path.module}/cluster-output/run-${var.environment}"
      mkdir -p "$RUN_DIR"
      cp "${path.module}/cluster-output/install-config.yaml" "$RUN_DIR/install-config.yaml"
      openshift-install create cluster --dir "$RUN_DIR" --log-level info
      echo "Cluster created. Kubeconfig: $RUN_DIR/auth/kubeconfig"
    EOT
  }

  # Tear the cluster down with openshift-install on `terraform destroy`.
  provisioner "local-exec" {
    when    = destroy
    command = <<-EOT
      set -euo pipefail
      RUN_DIR="${path.module}/cluster-output/run-${self.triggers.cluster_name}"
      if command -v openshift-install >/dev/null 2>&1 && [ -d "$RUN_DIR" ]; then
        openshift-install destroy cluster --dir "$RUN_DIR" --log-level info
      else
        echo "Skip destroy: openshift-install missing or run dir absent."
      fi
    EOT
  }
}

output "kubeconfig_path" {
  value       = "${path.module}/cluster-output/run-${var.environment}/auth/kubeconfig"
  description = "Path to the generated kubeconfig after a successful apply."
}

output "kubeadmin_password_path" {
  value       = "${path.module}/cluster-output/run-${var.environment}/auth/kubeadmin-password"
  description = "Path to the initial kubeadmin password file."
}

output "api_url" {
  value       = "https://api.${var.cluster_name}.${var.base_domain}:6443"
  description = "Cluster API server URL."
}

output "console_url" {
  value       = "https://console-openshift-console.apps.${var.cluster_name}.${var.base_domain}"
  description = "OpenShift web console URL."
}

output "kubeconfig_command" {
  value       = "export KUBECONFIG=${path.module}/cluster-output/run-${var.environment}/auth/kubeconfig"
  description = "Command to load the cluster kubeconfig into the current shell."
}
