#!/usr/bin/env python3
"""Add HEALTHCHECK instruction to every Dockerfile that lacks one."""
from pathlib import Path
import re

ROOT = Path(__file__).parent.parent
SERVICES = ROOT / "services"

def get_port(dockerfile: str) -> str:
    """Extract EXPOSE port from Dockerfile."""
    m = re.search(r'^EXPOSE\s+(\d+)', dockerfile, re.MULTILINE)
    return m.group(1) if m else "8080"

def get_healthcheck(lang: str, port: str) -> str:
    if lang == "node":
        return (f'HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\\n'
                f'  CMD node -e "require(\'http\').get(\'http://localhost:{port}/health/live\','
                f'(r)=>r.statusCode===200?process.exit(0):process.exit(1))" || exit 1')
    elif lang == "python":
        return (f'HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\\n'
                f'  CMD python -c "import urllib.request; urllib.request.urlopen(\'http://localhost:{port}/health/live\')" || exit 1')
    elif lang in ("go", "rust", "java", "kotlin", "dotnet", "ruby", "php", "elixir"):
        return (f'HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\\n'
                f'  CMD curl -f http://localhost:{port}/health/live || exit 1')
    else:
        return (f'HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\\n'
                f'  CMD curl -f http://localhost:{port}/health || exit 1')

def detect_lang(svc_dir: Path) -> str:
    if (svc_dir / "package.json").exists(): return "node"
    if (svc_dir / "requirements.txt").exists(): return "python"
    if (svc_dir / "go.mod").exists(): return "go"
    if list(svc_dir.glob("pom.xml")): return "java"
    if list(svc_dir.glob("build.gradle.kts")): return "kotlin"
    if list(svc_dir.glob("*.csproj")): return "dotnet"
    if (svc_dir / "Cargo.toml").exists(): return "rust"
    if (svc_dir / "Gemfile").exists(): return "ruby"
    if (svc_dir / "composer.json").exists(): return "php"
    if (svc_dir / "mix.exs").exists(): return "elixir"
    return "default"

count = 0
for svc in sorted(SERVICES.iterdir()):
    if not svc.is_dir(): continue
    df = svc / "Dockerfile"
    if not df.exists(): continue
    content = df.read_text()
    if "HEALTHCHECK" in content: continue
    port = get_port(content)
    lang = detect_lang(svc)
    hc = get_healthcheck(lang, port)
    # Insert HEALTHCHECK before the final CMD instruction
    new_content = re.sub(r'^(CMD .*)$', f'{hc}\n\n\\1', content, count=1, flags=re.MULTILINE)
    if new_content == content:
        # Fallback: append before last line
        lines = content.rstrip().split('\n')
        lines.insert(-1, '')
        lines.insert(-1, hc)
        new_content = '\n'.join(lines) + '\n'
    df.write_text(new_content)
    count += 1
    print(f"Added HEALTHCHECK ({lang}, port {port}): {svc.name}")

print(f"\nDone — {count} HEALTHCHECKs added")
