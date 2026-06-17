# Dev spoke — all services with minimal resources for development.
# 1 replica per service. Debug logging on. Kyverno in audit mode.
# OpenShift-only repo: this workspace calls the openshift module directly.

terraform {
  required_version = ">= 1.12"
  backend "s3" {}
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

module "dev" {
  source = "../modules/openshift"

  cluster_name = "pipeline-dev"
  base_domain  = var.base_domain
  pull_secret  = var.pull_secret
  ssh_key      = var.ssh_key
  platform     = var.platform
  region       = var.region
  environment  = "dev"

  control_plane_replicas = 3
  worker_replicas        = 3
  instance_type          = "m5.xlarge" # 4 vCPU, 16GB — dev sizing
}

output "kubeconfig_command" {
  value = module.dev.kubeconfig_command
}

output "api_url" {
  value = module.dev.api_url
}

output "console_url" {
  value = module.dev.console_url
}
