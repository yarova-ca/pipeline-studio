# Provider requirements for the EKS module.
# tls: used by the IRSA OIDC thumbprint data source (terraform-aws-modules handles this internally too).

terraform {
  required_version = ">= 1.12" # eks module v21 needs >= 1.5.7; 1.12 already satisfies it

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0" # eks module v21 requires aws provider >= 6.0
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}
