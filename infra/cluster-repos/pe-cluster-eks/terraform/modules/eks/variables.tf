# Input variables for the EKS module.
# Override per cluster in the env workspaces (hub/dev/test/prod).

variable "cluster_name" {
  type        = string
  description = "EKS cluster name. Also used as the VPC name prefix."
}

variable "region" {
  type        = string
  description = "AWS region the cluster runs in. Used only for the kubeconfig output command."
}

variable "kubernetes_version" {
  type        = string
  description = "EKS Kubernetes control plane version."
  default     = "1.31"
}

variable "node_instance_type" {
  type        = string
  description = "EC2 instance type for the managed node group."
}

variable "min_nodes" {
  type        = number
  description = "Minimum managed node group size."
  default     = 1
}

variable "max_nodes" {
  type        = number
  description = "Maximum managed node group size (autoscaler upper bound)."
}

variable "desired_nodes" {
  type        = number
  description = "Desired managed node group size at creation."
}

variable "environment" {
  type        = string
  description = "Environment tag: hub | dev | test | prod. Controls NAT HA."
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the cluster VPC."
  default     = "10.0.0.0/16"
}

variable "eso_namespace" {
  type        = string
  description = "Namespace the External Secrets Operator controller runs in."
  default     = "external-secrets-system"
}

variable "eso_service_account" {
  type        = string
  description = "ServiceAccount name the ESO controller uses (IRSA binds to this)."
  default     = "external-secrets"
}

variable "argocd_namespace" {
  type        = string
  description = "Namespace ArgoCD runs in (hub only). IRSA role created in all envs for parity."
  default     = "argocd"
}

variable "argocd_service_account" {
  type        = string
  description = "ServiceAccount ArgoCD application-controller uses (IRSA binds to this)."
  default     = "argocd-application-controller"
}

variable "tags" {
  type        = map(string)
  description = "Extra tags merged onto all resources."
  default     = {}
}
