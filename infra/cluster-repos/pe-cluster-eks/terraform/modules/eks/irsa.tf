# IRSA — IAM Roles for Service Accounts.
# Binds a Kubernetes ServiceAccount to an IAM role via the cluster OIDC provider.
# Result: pods assume an IAM role with no static AWS keys stored in the cluster.

data "aws_caller_identity" "current" {}

# ── ESO IRSA role ───────────────────────────────────────────────────────────
# External Secrets Operator reads secrets from AWS Secrets Manager + SSM Parameter Store.
# This role grants read-only access to those stores.
module "eso_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "${var.cluster_name}-eso"

  # Built-in policy in the submodule granting Secrets Manager + SSM read access.
  attach_external_secrets_policy = true

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["${var.eso_namespace}:${var.eso_service_account}"]
    }
  }

  tags = local.common_tags
}

# ── ArgoCD IRSA role ────────────────────────────────────────────────────────
# ArgoCD application-controller needs ECR pull to reconcile image-based apps.
# Custom policy: ECR read-only across the account.
resource "aws_iam_policy" "argocd_ecr_read" {
  name        = "${var.cluster_name}-argocd-ecr-read"
  description = "Allow ArgoCD application-controller to pull image metadata from ECR."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRReadOnly"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:DescribeImages",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
        ]
        Resource = "*"
      },
    ]
  })

  tags = local.common_tags
}

module "argocd_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name        = "${var.cluster_name}-argocd"
  role_policy_arns = { ecr = aws_iam_policy.argocd_ecr_read.arn }

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["${var.argocd_namespace}:${var.argocd_service_account}"]
    }
  }

  tags = local.common_tags
}
