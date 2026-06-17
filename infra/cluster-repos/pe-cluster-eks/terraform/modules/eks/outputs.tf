# Outputs consumed by env workspaces and platform scripts.

output "cluster_name" {
  description = "EKS cluster name."
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS API server endpoint."
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 CA cert for the cluster API server."
  value       = module.eks.cluster_certificate_authority_data
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN used by all IRSA roles."
  value       = module.eks.oidc_provider_arn
}

output "vpc_id" {
  description = "VPC the cluster runs in."
  value       = module.vpc.vpc_id
}

output "eso_irsa_role_arn" {
  description = "IAM role ARN to annotate on the ESO ServiceAccount."
  value       = module.eso_irsa.arn # v6 renamed output iam_role_arn -> arn
}

output "argocd_irsa_role_arn" {
  description = "IAM role ARN to annotate on the ArgoCD application-controller ServiceAccount."
  value       = module.argocd_irsa.arn # v6 renamed output iam_role_arn -> arn
}

output "kubeconfig_command" {
  description = "Run this to add the cluster to your local kubeconfig."
  value       = "aws eks update-kubeconfig --name ${var.cluster_name} --region ${var.region}"
}
