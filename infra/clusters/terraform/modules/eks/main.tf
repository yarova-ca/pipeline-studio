# EKS (Elastic Kubernetes Service — AWS managed Kubernetes) module.
# Creates: VPC, EKS cluster, managed node group, IRSA for ESO and ArgoCD.
# IRSA: IAM Roles for Service Accounts — lets pods call AWS APIs without static keys.

terraform {
  required_providers {
    aws  = { source = "hashicorp/aws",  version = "~> 5.0" }
    tls  = { source = "hashicorp/tls",  version = "~> 4.0" }
    helm = { source = "hashicorp/helm", version = "~> 2.0" }
  }
}

variable "cluster_name"       { type = string }
variable "region"             { type = string }
variable "kubernetes_version" { type = string; default = "1.31" }
variable "node_instance_type" { type = string }
variable "min_nodes"          { type = number; default = 1 }
variable "max_nodes"          { type = number }
variable "desired_nodes"      { type = number }
variable "environment"        { type = string }

data "aws_availability_zones" "available" {}

# VPC for the cluster
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.cluster_name}-vpc"
  cidr = "10.0.0.0/16"

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "prod"  # prod uses HA NAT
  enable_dns_hostnames = true

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Platform    = "pipeline-studio"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# EKS cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = var.kubernetes_version

  cluster_endpoint_public_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Enable IRSA (required for ESO, ArgoCD, Karpenter)
  enable_irsa = true

  eks_managed_node_groups = {
    main = {
      instance_types = [var.node_instance_type]
      min_size       = var.min_nodes
      max_size       = var.max_nodes
      desired_size   = var.desired_nodes

      labels = {
        Environment = var.environment
        NodeGroup   = "main"
      }
    }
  }

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Platform    = "pipeline-studio"
  }
}

output "cluster_name"      { value = module.eks.cluster_name }
output "cluster_endpoint"  { value = module.eks.cluster_endpoint }
output "oidc_provider_arn" { value = module.eks.oidc_provider_arn }
output "kubeconfig_command" {
  value = "aws eks update-kubeconfig --name ${var.cluster_name} --region ${var.region}"
}
