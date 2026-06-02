#!/usr/bin/env python3
"""
pin_base_images.py — Pin Dockerfile base image tags to immutable sha256 digests.

Why: tags like 'node:22-alpine' are mutable — Docker Hub overwrites them on patch releases.
A build today may pull a different image than yesterday, breaking reproducibility (SLSA L3).
Pinning to sha256 ensures every build uses the exact same bytes.

Usage:
  python3 scripts/pin_base_images.py --check-only   # List current digests
  python3 scripts/pin_base_images.py                 # Write BASE_IMAGE_DIGESTS.lock
"""

import subprocess
import re
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent

# Canonical base images used across all services
BASE_IMAGES = [
    "ubuntu:24.04",
    "node:22-alpine",
    "node:22-slim",
    "node:22-bookworm-slim",
    "registry.access.redhat.com/ubi9/nodejs-22-minimal",
    "python:3.12-slim",
    "python:3.12-alpine",
    "registry.access.redhat.com/ubi9/python-312",
    "golang:1.23-alpine",
    "golang:1.23-bookworm",
    "eclipse-temurin:21-jdk-jammy",
    "eclipse-temurin:21-jre-jammy",
    "eclipse-temurin:21-jre-alpine",
    "mcr.microsoft.com/dotnet/aspnet:9.0-alpine",
    "mcr.microsoft.com/dotnet/sdk:9.0",
    "rust:1.82-slim-bookworm",
    "ruby:3.3-alpine",
    "php:8.3-fpm-alpine",
]

def get_digest(image: str) -> str | None:
    try:
        result = subprocess.run(
            ["docker", "manifest", "inspect", "--verbose", image],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if isinstance(data, list):
                data = data[0]
            return data.get("Descriptor", {}).get("digest")
    except Exception as e:
        print(f"  WARN: could not fetch digest for {image}: {e}")
    return None

def main():
    lock = {}
    for image in BASE_IMAGES:
        print(f"Fetching digest: {image}")
        digest = get_digest(image)
        if digest:
            lock[image] = f"{image.split(':')[0]}:{image.split(':')[1]}@{digest}"
            print(f"  -> {digest}")
        else:
            lock[image] = None
            print(f"  -> FAILED (will use tag only)")

    lock_file = ROOT / "BASE_IMAGE_DIGESTS.lock"
    lock_file.write_text(json.dumps(lock, indent=2) + "\n")
    print(f"\nWritten to {lock_file}")
    print("\nTo use pinned digests in Dockerfiles, update FROM lines to include @sha256:...")
    print("Example: FROM node:22-alpine@sha256:abc123...")

if __name__ == "__main__":
    main()
