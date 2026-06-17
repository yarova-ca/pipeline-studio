# OpenShift module — uses openshift-install CLI via Terraform null_resource.
# OpenShift: Red Hat's enterprise Kubernetes — includes built-in CI/CD, registry, OAuth.
# Why null_resource: openshift-install has no official Terraform provider.

terraform {
  required_providers {
    null  = { source = "hashicorp/null",  version = "~> 3.0" }
    local = { source = "hashicorp/local", version = "~> 2.0" }
  }
}

variable "cluster_name" { type = string }
variable "base_domain"  {
  type        = string
  description = "Base domain, e.g. yarova.ca — cluster will be at api.CLUSTER.BASE_DOMAIN"
}
variable "pull_secret"  {
  type        = string
  sensitive   = true
  description = "Red Hat pull secret from console.redhat.com"
}
variable "ssh_key"      {
  type        = string
  description = "SSH public key for cluster nodes"
}
variable "platform"     {
  type        = string
  default     = "aws"
  description = "aws | gcp | azure | none (bare-metal)"
}
variable "region"      { type = string }
variable "environment" { type = string }

resource "local_file" "install_config" {
  filename = "${path.module}/install-config.yaml"
  content  = templatefile("${path.module}/install-config.yaml.tpl", {
    cluster_name = var.cluster_name
    base_domain  = var.base_domain
    pull_secret  = var.pull_secret
    ssh_key      = var.ssh_key
    platform     = var.platform
    region       = var.region
  })
}

resource "null_resource" "create_cluster" {
  depends_on = [local_file.install_config]

  provisioner "local-exec" {
    command = <<-EOT
      mkdir -p ${path.module}/cluster-output
      cp ${path.module}/install-config.yaml ${path.module}/cluster-output/
      openshift-install create cluster \
        --dir ${path.module}/cluster-output \
        --log-level info
      echo "Cluster created. Kubeconfig at ${path.module}/cluster-output/auth/kubeconfig"
    EOT
  }
}

output "kubeconfig_path" {
  value = "${path.module}/cluster-output/auth/kubeconfig"
}
