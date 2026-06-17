# Provider requirements for the EKS module.
# tls: used by the IRSA OIDC thumbprint data source (terraform-aws-modules handles this internally too).

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}
