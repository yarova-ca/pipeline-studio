# ─────────────────────────────────────────────────────────────────────────
# Framework: 12 Native Android — Kotlin Jetpack Compose 2.0
# Pattern:   CI-only — no Docker image is built for this framework.
# Output:    APK / AAB (Android App Bundle)
#
# This framework produces a native platform artifact, not a container image.
# The workflow YAML (workflow-templates/12-kotlin-jetpack.yml) handles the build
# entirely within GitHub Actions runners — no Dockerfile is required.
#
# If you need to wrap the artifact in a container (e.g. for internal testing
# infrastructure), use a base image such as debian:12-slim and COPY the
# artifact in. That is non-standard and not covered by the pipeline templates.
# ─────────────────────────────────────────────────────────────────────────
