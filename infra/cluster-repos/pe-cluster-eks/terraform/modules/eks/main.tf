# EKS (Elastic Kubernetes Service — AWS managed Kubernetes) module.
# Creates: VPC, EKS cluster, managed node group, IRSA roles for ESO + ArgoCD.
# IRSA: IAM Roles for Service Accounts — lets pods call AWS APIs without static keys.
#
# IRSA roles live in irsa.tf. Outputs live in outputs.tf. Providers in versions.tf.

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  common_tags = merge(
    {
      Environment = var.environment
      ManagedBy   = "terraform"
      Platform    = "pipeline-studio"
    },
    var.tags,
  )
}

# ── VPC for the cluster ─────────────────────────────────────────────────────
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.0"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  private_subnets = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i + 1)]
  public_subnets  = [for i in range(3) : cidrsubnet(var.vpc_cidr, 8, i + 101)]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "prod" # prod uses HA NAT (one per AZ)
  enable_dns_hostnames = true
  enable_dns_support   = true

  # Tags required by the AWS Load Balancer Controller and EKS subnet discovery.
  public_subnet_tags = {
    "kubernetes.io/role/elb"                    = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb"           = "1"
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }

  tags = merge(local.common_tags, {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  })
}

# ── EKS cluster + managed node group ────────────────────────────────────────
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  # v21 stripped the cluster_* prefix from these inputs:
  #   cluster_name -> name, cluster_version -> kubernetes_version,
  #   cluster_endpoint_public_access -> endpoint_public_access,
  #   cluster_addons -> addons.
  name               = var.cluster_name
  kubernetes_version = var.kubernetes_version

  endpoint_public_access = true

  # v21 default authentication_mode is API and cluster creator gets no
  # implicit admin. Grant the Terraform caller admin via an access entry so
  # the apply identity retains kubectl access (matches v20 behaviour).
  enable_cluster_creator_admin_permissions = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Enable IRSA — provisions the OIDC provider IRSA roles bind to.
  # Still supported on the root module in v21 (removal was Karpenter-only).
  enable_irsa = true

  # Core add-ons managed by EKS (cluster_addons -> addons in v21).
  addons = {
    coredns            = {}
    kube-proxy         = {}
    vpc-cni            = {}
    aws-ebs-csi-driver = {}
  }

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

  tags = local.common_tags
}
