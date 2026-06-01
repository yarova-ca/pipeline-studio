#!/usr/bin/env python3
"""Add .dockerignore to every service directory that lacks one."""
from pathlib import Path
import json

ROOT = Path(__file__).parent.parent
SERVICES = ROOT / "services"

DOCKERIGNORE_BY_LANG = {
    "node": """\
node_modules/
.git/
.env
.env.local
dist/
build/
coverage/
.next/
.nuxt/
tests/
*.test.ts
*.spec.ts
""",
    "python": """\
__pycache__/
.pytest_cache/
.venv/
venv/
env/
.git/
.env
*.pyc
*.pyo
*.pyd
.coverage
htmlcov/
.mypy_cache/
dist/
build/
""",
    "go": """\
.git/
.env
vendor/
*_test.go
*.test
""",
    "java": """\
.git/
.env
target/
*.class
*.jar
.gradle/
build/
""",
    "kotlin": """\
.git/
.env
build/
.gradle/
*.class
""",
    "dotnet": """\
.git/
.env
bin/
obj/
*.user
.vs/
""",
    "rust": """\
.git/
.env
target/
""",
    "ruby": """\
.git/
.env
vendor/bundle/
.bundle/
log/
tmp/
""",
    "php": """\
.git/
.env
vendor/
""",
    "elixir": """\
.git/
.env
_build/
deps/
""",
    "default": """\
.git/
.env
""",
}

def detect_lang(svc_dir: Path) -> str:
    if (svc_dir / "package.json").exists(): return "node"
    if (svc_dir / "requirements.txt").exists() or (svc_dir / "pyproject.toml").exists(): return "python"
    if (svc_dir / "go.mod").exists(): return "go"
    if list(svc_dir.glob("pom.xml")): return "java"
    if list(svc_dir.glob("build.gradle.kts")) or list(svc_dir.glob("build.gradle")): return "kotlin"
    if list(svc_dir.glob("*.csproj")): return "dotnet"
    if (svc_dir / "Cargo.toml").exists(): return "rust"
    if (svc_dir / "Gemfile").exists(): return "ruby"
    if (svc_dir / "composer.json").exists(): return "php"
    if (svc_dir / "mix.exs").exists(): return "elixir"
    return "default"

count = 0
for svc in sorted(SERVICES.iterdir()):
    if not svc.is_dir(): continue
    di = svc / ".dockerignore"
    if di.exists(): continue
    lang = detect_lang(svc)
    content = DOCKERIGNORE_BY_LANG.get(lang, DOCKERIGNORE_BY_LANG["default"])
    di.write_text(content)
    count += 1
    print(f"Created .dockerignore ({lang}): {svc.name}")

print(f"\nDone — {count} .dockerignore files created")
