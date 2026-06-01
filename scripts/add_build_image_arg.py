#!/usr/bin/env python3
"""Add BUILD_IMAGE ARG to all service Dockerfiles.

Transformation for ubuntu-build groups (01-27):
  FROM ubuntu:24.04 AS build      → FROM ubuntu:24.04 AS base-ubuntu
  <SDK install RUN/ENV commands>    (stay with base-ubuntu)
  WORKDIR /app                    → insert multi-stage block, then WORKDIR

Transformation for SDK-build groups (28/29/30):
  <syntax line>
  FROM <sdk> AS build             → add base-ubuntu + base-sdk + base-custom stages
                                    then FROM base-${BUILD_IMAGE} AS build
"""
import os
import re
from pathlib import Path

SERVICES_DIR = Path("/mnt/c/Users/RohithY/yarova/service-starters/services")

# ── Per-language config ─────────────────────────────────────────────────────
# Each entry: (ubuntu_run_lines, ubuntu_env_line, sdk_image, sdk_alpine_image)
# ubuntu_env_line: None if no ENV needed in base-ubuntu
# sdk_alpine_image: None if not available

LANG = {
    "node": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \\",
            " && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \\",
            " && apt-get install -y nodejs \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        None,
        "node:22-bookworm-slim",
        "node:22-alpine",
    ),
    "python": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends python3.12 python3-pip python3-venv \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        None,
        "python:3.12-slim-bookworm",
        "python:3.12-alpine",
    ),
    "go123": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \\",
            " && wget -q https://go.dev/dl/go1.23.4.linux-amd64.tar.gz \\",
            " && tar -C /usr/local -xzf go1.23.4.linux-amd64.tar.gz \\",
            " && rm go1.23.4.linux-amd64.tar.gz \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        'ENV PATH="/usr/local/go/bin:$PATH"',
        "golang:1.23-bookworm",
        "golang:1.23-alpine",
    ),
    "go122": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates \\",
            " && wget -q https://go.dev/dl/go1.22.12.linux-amd64.tar.gz \\",
            " && tar -C /usr/local -xzf go1.22.12.linux-amd64.tar.gz \\",
            " && rm go1.22.12.linux-amd64.tar.gz \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        'ENV PATH="/usr/local/go/bin:$PATH"',
        "golang:1.22-bookworm",
        "golang:1.22-alpine",
    ),
    "java_maven": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends maven openjdk-21-jdk \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        None,
        "eclipse-temurin:21-jdk-bookworm",
        "eclipse-temurin:21-jdk-alpine",
    ),
    "kotlin_gradle": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        None,
        "eclipse-temurin:21-jdk-bookworm",
        "eclipse-temurin:21-jdk-alpine",
    ),
    "scala": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk curl \\",
            " && curl -fL https://github.com/sbt/sbt/releases/download/v1.10.5/sbt-1.10.5.tgz | tar -xz -C /usr/local \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        'ENV PATH="/usr/local/sbt/bin:$PATH"',
        "sbtscala/scala-sbt:eclipse-temurin-21_1.10.11_3.6.4",
        None,  # No alpine SBT image
    ),
    "clojure": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends openjdk-21-jdk curl \\",
            " && curl -fL https://raw.githubusercontent.com/technomancy/leiningen/stable/bin/lein > /usr/local/bin/lein \\",
            " && chmod +x /usr/local/bin/lein \\",
            " && lein version \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        None,
        "clojure:tools-deps-bookworm",
        None,  # No official Clojure alpine
    ),
    "dotnet9": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends wget apt-transport-https \\",
            " && wget -q https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb \\",
            " && dpkg -i packages-microsoft-prod.deb \\",
            " && apt-get update && apt-get install -y dotnet-sdk-9.0 \\",
            " && rm -rf /var/lib/apt/lists/* packages-microsoft-prod.deb",
        ],
        None,
        "mcr.microsoft.com/dotnet/sdk:9.0",
        "mcr.microsoft.com/dotnet/sdk:9.0-alpine",
    ),
    "dotnet8": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends wget apt-transport-https \\",
            " && wget -q https://packages.microsoft.com/config/ubuntu/24.04/packages-microsoft-prod.deb \\",
            " && dpkg -i packages-microsoft-prod.deb \\",
            " && apt-get update && apt-get install -y dotnet-sdk-8.0 \\",
            " && rm -rf /var/lib/apt/lists/* packages-microsoft-prod.deb",
        ],
        None,
        "mcr.microsoft.com/dotnet/sdk:8.0-bookworm-slim",
        "mcr.microsoft.com/dotnet/sdk:8.0-alpine",
    ),
    "rust183": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends curl build-essential musl-tools ca-certificates \\",
            " && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \\",
            " && . /root/.cargo/env \\",
            " && rustup target add x86_64-unknown-linux-musl \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        'ENV PATH="/root/.cargo/bin:$PATH"',
        "rust:1.83-bookworm",
        "rust:1.83-alpine",
    ),
    "rust178": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends curl build-essential musl-tools ca-certificates \\",
            " && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y \\",
            " && . /root/.cargo/env \\",
            " && rustup target add x86_64-unknown-linux-musl \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        'ENV PATH="/root/.cargo/bin:$PATH"',
        "rust:1.78-bookworm",
        "rust:1.78-alpine",
    ),
    "elixir_apt": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends erlang elixir \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        None,
        "hexpm/elixir:1.17-erlang-27-debian-bookworm-slim",
        None,  # NIFs fail on musl
    ),
    "elixir_sdk": (
        # 30-ws-elixir currently uses elixir:1.16-otp-26-slim
        # base-ubuntu installs the apt equivalent
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends erlang elixir \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        None,
        "elixir:1.16-otp-26-slim",
        None,  # NIFs fail on musl
    ),
    "ruby": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends ruby ruby-dev build-essential \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        None,
        "ruby:3.3-bookworm",
        "ruby:3.3-alpine",
    ),
    "php_cli": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends php8.3 php8.3-cli php8.3-mbstring php8.3-xml curl \\",
            " && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        None,
        "php:8.3-cli-bookworm",
        "php:8.3-cli-alpine",
    ),
    "php_fpm": (
        # 28-php-grpc uses php:8.3-fpm-bookworm
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends php8.3 php8.3-cli php8.3-mbstring php8.3-xml php8.3-fpm curl \\",
            " && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        None,
        "php:8.3-fpm-bookworm",
        "php:8.3-fpm-alpine",
    ),
    "swift6": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends wget clang libicu-dev libssl-dev \\",
            " && wget -q https://download.swift.org/swift-6.0.3-release/ubuntu2404/swift-6.0.3-RELEASE/swift-6.0.3-RELEASE-ubuntu24.04.tar.gz \\",
            " && tar -xzf swift-6.0.3-RELEASE-ubuntu24.04.tar.gz -C /usr \\",
            " && mv /usr/swift-6.0.3-RELEASE-ubuntu24.04 /usr/swift \\",
            " && rm swift-6.0.3-RELEASE-ubuntu24.04.tar.gz \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        'ENV PATH="/usr/swift/usr/bin:$PATH"',
        "swift:6.0-bookworm",
        None,  # No official Alpine Swift
    ),
    "swift510": (
        [
            "RUN apt-get update && apt-get install -y --no-install-recommends wget clang libicu-dev libssl-dev \\",
            " && wget -q https://download.swift.org/swift-5.10-release/ubuntu2404/swift-5.10-RELEASE/swift-5.10-RELEASE-ubuntu24.04.tar.gz \\",
            " && tar -xzf swift-5.10-RELEASE-ubuntu24.04.tar.gz -C /usr \\",
            " && mv /usr/swift-5.10-RELEASE-ubuntu24.04 /usr/swift \\",
            " && rm swift-5.10-RELEASE-ubuntu24.04.tar.gz \\",
            " && rm -rf /var/lib/apt/lists/*",
        ],
        'ENV PATH="/usr/swift/usr/bin:$PATH"',
        "swift:5.10-bookworm",
        None,
    ),
    "cpp": (
        # C++ has no extra SDK — just apt packages for cmake/clang (already in ubuntu)
        # base-ubuntu installs cmake and compiler deps
        None,  # No extra RUN needed — cmake/clang are in ubuntu build already
        None,
        "debian:bookworm",
        None,  # Alpine musl breaks glibc C++ binaries
    ),
}

# ── Directory → language mapping ────────────────────────────────────────────
def get_lang(dirname: str) -> str | None:
    """Return language config key for a service directory name."""
    # Exact matches first
    exact = {
        "28-go-grpc": "go122", "29-gqlgen": "go122", "30-ws-go": "go122",
        "28-kotlin-grpc": "kotlin_gradle",
        "28-dotnet-grpc": "dotnet8", "29-hot-chocolate": "dotnet8", "30-ws-dotnet": "dotnet8",
        "28-rust-grpc": "rust178", "29-async-graphql": "rust178", "30-ws-rust": "rust178",
        "28-node-grpc": "node", "29-apollo": "node", "29-graphql-yoga": "node", "30-ws-node": "node",
        "28-python-grpc": "python", "29-strawberry": "python", "30-ws-python": "python",
        "28-java-grpc": "java_maven", "29-spring-graphql": "java_maven", "30-ws-java": "java_maven",
        "28-ruby-grpc": "ruby", "29-graphql-ruby": "ruby", "30-ws-ruby": "ruby",
        "28-php-grpc": "php_fpm",
        "28-swift-grpc": "swift510",
        "30-ws-elixir": "elixir_sdk",
        "29-graphql-ruby": "ruby",
    }
    if dirname in exact:
        return exact[dirname]

    prefix = dirname[:3]
    prefix_map = {
        "01-": "node", "02-": "node", "03-": "node", "04-": "node",
        "05-": "node", "07-": "node", "08-": "node", "13-": "node", "14-": "node",
        "15-": "python",
        "16-": "go123",
        "17-": "java_maven",
        "18-": "kotlin_gradle",
        "19-": "dotnet9",
        "20-": "rust183",
        "21-": "elixir_apt",
        "22-": "ruby",
        "23-": "php_cli",
        "24-": "swift6",
        "25-": "scala",
        "26-": "clojure",
        "27-": "cpp",
    }
    return prefix_map.get(prefix)


def build_base_stages_block(lang_key: str) -> str:
    """Return the multi-stage selection block for a given language."""
    ubuntu_runs, ubuntu_env, sdk_img, sdk_alpine_img = LANG[lang_key]
    lines = []

    if sdk_img:
        lines.append(f"FROM {sdk_img} AS base-sdk")

    if sdk_alpine_img:
        lines.append(f"FROM {sdk_alpine_img} AS base-sdk-alpine")

    lines.append("FROM ${BUILD_BASE} AS base-custom")
    lines.append("")
    lines.append("FROM base-${BUILD_IMAGE} AS build")
    return "\n".join(lines)


def build_full_ubuntu_block(lang_key: str) -> str:
    """Return the complete base-ubuntu stage for SDK-based Dockerfiles."""
    ubuntu_runs, ubuntu_env, sdk_img, sdk_alpine_img = LANG[lang_key]
    lines = ["FROM ubuntu:24.04 AS base-ubuntu"]
    if ubuntu_runs:
        lines.extend(ubuntu_runs)
    if ubuntu_env:
        lines.append(ubuntu_env)
    return "\n".join(lines)


def transform_ubuntu_dockerfile(content: str, lang_key: str) -> str:
    """Transform a Dockerfile that currently uses ubuntu:24.04 AS build."""
    lines = content.split("\n")
    out = []
    i = 0

    # Step 1: inject ARGs after the # syntax line (line 0)
    syntax_inserted = False
    build_found = False
    workdir_inserted = False

    while i < len(lines):
        line = lines[i]

        # After # syntax line, insert ARGs
        if not syntax_inserted and line.startswith("# syntax="):
            out.append(line)
            out.append("ARG BUILD_IMAGE=ubuntu")
            out.append("ARG BUILD_BASE=ubuntu:24.04")
            syntax_inserted = True
            i += 1
            continue

        # Rename the ubuntu build stage
        if not build_found and re.match(r"^FROM ubuntu:24\.04 AS build\s*$", line):
            out.append("FROM ubuntu:24.04 AS base-ubuntu")
            build_found = True
            i += 1
            continue

        # After build stage started, find first WORKDIR and insert multi-stage block
        if build_found and not workdir_inserted and line.startswith("WORKDIR "):
            # Insert the multi-stage selection block
            out.append("")
            _, ubuntu_env, sdk_img, sdk_alpine_img = LANG[lang_key]
            if sdk_img:
                out.append(f"FROM {sdk_img} AS base-sdk")
            if sdk_alpine_img:
                out.append(f"FROM {sdk_alpine_img} AS base-sdk-alpine")
            out.append("FROM ${BUILD_BASE} AS base-custom")
            out.append("")
            out.append("FROM base-${BUILD_IMAGE} AS build")
            workdir_inserted = True
            out.append(line)
            i += 1
            continue

        out.append(line)
        i += 1

    return "\n".join(out)


def transform_sdk_dockerfile(content: str, lang_key: str) -> str:
    """Transform a Dockerfile that currently uses a SDK image AS build."""
    ubuntu_runs, ubuntu_env, sdk_img, sdk_alpine_img = LANG[lang_key]
    lines = content.split("\n")
    out = []
    i = 0
    build_replaced = False

    while i < len(lines):
        line = lines[i]

        # After # syntax line, inject ARGs + base-ubuntu block + base stages
        if not build_replaced and line.startswith("# syntax="):
            out.append(line)
            out.append("ARG BUILD_IMAGE=ubuntu")
            out.append("ARG BUILD_BASE=ubuntu:24.04")
            out.append("")
            # base-ubuntu stage
            out.append("FROM ubuntu:24.04 AS base-ubuntu")
            if ubuntu_runs:
                out.extend(ubuntu_runs)
            if ubuntu_env:
                out.append(ubuntu_env)
            out.append("")
            # base-sdk and optional base-sdk-alpine
            if sdk_img:
                out.append(f"FROM {sdk_img} AS base-sdk")
            if sdk_alpine_img:
                out.append(f"FROM {sdk_alpine_img} AS base-sdk-alpine")
            out.append("FROM ${BUILD_BASE} AS base-custom")
            out.append("")
            i += 1
            continue

        # Replace SDK build FROM with ARG-based FROM
        sdk_from_pattern = re.compile(r"^FROM \S+ AS build\s*$")
        if not build_replaced and sdk_from_pattern.match(line):
            out.append("FROM base-${BUILD_IMAGE} AS build")
            build_replaced = True
            i += 1
            continue

        out.append(line)
        i += 1

    return "\n".join(out)


def process_dockerfile(path: Path, dirname: str) -> bool:
    """Process one Dockerfile. Returns True if modified."""
    lang_key = get_lang(dirname)
    if lang_key is None:
        print(f"  SKIP: {dirname} — no language mapping")
        return False

    content = path.read_text()

    # Already processed?
    if "ARG BUILD_IMAGE=" in content:
        print(f"  SKIP: {dirname} — already has BUILD_IMAGE ARG")
        return False

    # Determine which transformer to use
    if "FROM ubuntu:24.04 AS build" in content:
        new_content = transform_ubuntu_dockerfile(content, lang_key)
        transform_type = "ubuntu"
    else:
        # SDK-based build (28/29/30)
        new_content = transform_sdk_dockerfile(content, lang_key)
        transform_type = "sdk"

    if new_content == content:
        print(f"  WARN: {dirname} — no change made (check manually)")
        return False

    path.write_text(new_content)
    print(f"  OK [{transform_type}]: {dirname}")
    return True


def main():
    modified = 0
    skipped = 0
    warned = 0

    for service_dir in sorted(SERVICES_DIR.iterdir()):
        if not service_dir.is_dir():
            continue
        dockerfile = service_dir / "Dockerfile"
        if not dockerfile.exists():
            continue

        dirname = service_dir.name
        result = process_dockerfile(dockerfile, dirname)
        if result:
            modified += 1
        else:
            skipped += 1

    print(f"\nDone: {modified} modified, {skipped} skipped")


if __name__ == "__main__":
    main()
