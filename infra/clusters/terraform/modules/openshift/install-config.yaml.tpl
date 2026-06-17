apiVersion: v1
baseDomain: ${base_domain}
metadata:
  name: ${cluster_name}
compute:
  - architecture: amd64
    hyperthreading: Enabled
    name: worker
    platform: {}
    replicas: 3
controlPlane:
  architecture: amd64
  hyperthreading: Enabled
  name: master
  platform: {}
  replicas: 3
platform:
  ${platform}:
    region: ${region}
pullSecret: '${pull_secret}'
sshKey: |
  ${ssh_key}
