apiVersion: v1
baseDomain: ${base_domain}
metadata:
  name: ${cluster_name}
compute:
  - architecture: amd64
    hyperthreading: Enabled
    name: worker
%{ if instance_type != "" && platform != "none" ~}
    platform:
      ${platform}:
        type: ${instance_type}
%{ else ~}
    platform: {}
%{ endif ~}
    replicas: ${worker_replicas}
controlPlane:
  architecture: amd64
  hyperthreading: Enabled
  name: master
  platform: {}
  replicas: ${control_plane_replicas}
platform:
%{ if platform == "none" ~}
  none: {}
%{ else ~}
  ${platform}:
    region: ${region}
%{ endif ~}
pullSecret: '${pull_secret}'
sshKey: |
  ${ssh_key}
