# Hub cluster — runs ArgoCD and management tools only.
# No user services (14-express etc.) ever run on this cluster.
# Why dedicated hub: if a spoke is overloaded, the hub stays available for management.
#
# OpenShift-only repo: this workspace calls the openshift module directly.

terraform {
  required_version = ">= 1.12"

  # State backend. Configure via -backend-config flags at init time, e.g.:
  #   terraform init -backend-config="bucket=..." -backend-config="key=clusters/hub/terraform.tfstate"
  # For `terraform init -backend=false` (CI validation) this block is ignored.
  backend "s3" {}
}

variable "cluster_name" {
  type    = string
  default = "pipeline-hub"
}

variable "base_domain" {
  type        = string
  description = "Base domain, e.g. yarova.ca."
}

variable "pull_secret" {
  type        = string
  sensitive   = true
  description = "Red Hat pull secret JSON."
}

variable "ssh_key" {
  type        = string
  description = "SSH public key for node access."
}

variable "platform" {
  type    = string
  default = "aws"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

module "hub" {
  source = "../modules/openshift"

  cluster_name = var.cluster_name
  base_domain  = var.base_domain
  pull_secret  = var.pull_secret
  ssh_key      = var.ssh_key
  platform     = var.platform
  region       = var.region
  environment  = "hub"

  # Hub is small: 3 masters for HA, 2 workers (ArgoCD + management tools only).
  control_plane_replicas = 3
  worker_replicas        = 2
}

output "kubeconfig_command" {
  value = module.hub.kubeconfig_command
}

output "api_url" {
  value = module.hub.api_url
}

output "console_url" {
  value = module.hub.console_url
}
