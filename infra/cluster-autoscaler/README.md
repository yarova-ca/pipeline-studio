# Cluster Autoscaler

Cluster Autoscaler (CA): automatically adds/removes nodes when pods can't be scheduled or nodes are underutilized.

Why: without CA, when all nodes are full, new pods remain in Pending state indefinitely.

## AWS EKS — Cluster Autoscaler

Install:
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  -n kube-system \
  -f infra/cluster-autoscaler/values-aws.yaml

## GCP GKE — Native Autoscaler

GKE Autopilot: autoscaling is automatic (no manual config needed).
GKE Standard: enable via:
gcloud container clusters update CLUSTER_NAME \
  --enable-autoscaling --min-nodes=1 --max-nodes=10

## Alternative: Karpenter (AWS only, faster than CA)

Karpenter provisions individual EC2 instances in <30s vs CA's 2-3 min.
