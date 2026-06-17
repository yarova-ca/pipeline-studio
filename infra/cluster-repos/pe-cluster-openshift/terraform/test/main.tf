# Test spoke — mirrors prod config for accurate pre-prod testing.
# 2 replicas per service. Production-like resource limits.
# OpenShift-only repo: this workspace calls the openshift module directly.

terraform {
  required_version = ">= 1.6"
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

module "test" {
  source = "../modules/openshift"

  cluster_name = "pipeline-test"
  base_domain  = var.base_domain
  pull_secret  = var.pull_secret
  ssh_key      = var.ssh_key
  platform     = var.platform
  region       = var.region
  environment  = "test"

  control_plane_replicas = 3
  worker_replicas        = 5
  instance_type          = "m5.2xlarge" # 8 vCPU, 32GB — prod-like sizing
}

output "kubeconfig_command" {
  value = module.test.kubeconfig_command
}

output "api_url" {
  value = module.test.api_url
}

output "console_url" {
  value = module.test.console_url
}
