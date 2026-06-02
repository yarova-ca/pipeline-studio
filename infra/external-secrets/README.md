# External Secrets Operator

## Why ESO instead of plain Kubernetes Secrets

Plain Kubernetes Secrets: base64-encoded values stored in etcd.
etcd is NOT encrypted at rest by default on most clusters.
Any user with etcd read access can decode all secrets.

ESO pulls secrets from an encrypted external store at runtime.
The source of truth is in AWS Secrets Manager / Vault (encrypted, audited, rotatable).
The K8s Secret is a temporary projection that ESO refreshes on schedule.

## Install

helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system --create-namespace

## Secret rotation

When a secret is rotated in AWS Secrets Manager:
ESO detects the change (polls every 1h by default, or webhook-triggered).
ESO updates the Kubernetes Secret automatically.
Running pods pick up the new value on next restart or via mounted Secret watch.
