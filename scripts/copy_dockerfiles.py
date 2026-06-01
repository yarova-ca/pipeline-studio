"""
Copy Dockerfiles from pipeline-studio into each service directory.
Patch CMD/ENTRYPOINT to match actual service source paths.
Also copy GitHub Actions workflow templates into each service.
"""
import os
import shutil
import re

PIPELINE = '/mnt/c/Users/RohithY/yarova/pipeline-studio'
SERVICES = '/mnt/c/Users/RohithY/yarova/service-starters/services'

# CI-only slugs — no Docker, no workflows
CI_ONLY = {
    '06-nextjs-edge', '06-hono-edge', '06-remix-cloudflare',
    '09-expo', '09-ionic', '09-react-native',
    '10-dotnet-maui', '10-flutter', '10-kmp',
    '11-objc-uikit', '11-swift-swiftui',
    '12-java-android', '12-kotlin-jetpack',
}

# Patches: slug → list of (old_str, new_str)
# Applied via str.replace — first match wins per pair
PATCHES = {
    # JSON array CMD: "main:app" is a quoted token — match the quoted string
    '15-fastapi': [
        ('"main:app"', '"src.main:app"'),
    ],
    '15-starlette': [
        ('"main:app"', '"src.main:app"'),
    ],
    '15-flask': [
        ('"app:app"', '"src.app:app"'),
    ],
    '15-django': [
        ('myproject.wsgi:application', 'config.wsgi:application'),
    ],
    '21-phoenix': [
        ('bin/myapp', 'bin/app'),
    ],
    # .NET: assembly name token in ENTRYPOINT array
    '19-minimal-apis': [
        ('"App.dll"', '"19-minimal-apis.dll"'),
    ],
    '19-aspnet-core': [
        ('"App.dll"', '"19-aspnet-core.dll"'),
    ],
    # Rust: binary name in COPY src path
    '20-axum': [
        ('release/app /app', 'release/20-axum /app'),
        ('release/app /usr/local/bin/app', 'release/20-axum /usr/local/bin/app'),
    ],
    '20-actix-web': [
        ('release/app /app', 'release/20-actix-web /app'),
        ('release/app /usr/local/bin/app', 'release/20-actix-web /usr/local/bin/app'),
    ],
}

DJANGO_WSGI = '''\
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
application = get_wsgi_application()
'''


def copy_dockerfile(slug):
    src = os.path.join(PIPELINE, 'dockerfiles', f'{slug}.dockerfile')
    dst = os.path.join(SERVICES, slug, 'Dockerfile')
    if not os.path.exists(src):
        return False, 'Dockerfile missing in pipeline-studio'

    with open(src) as f:
        content = f.read()

    for old, new in PATCHES.get(slug, []):
        content = content.replace(old, new)

    with open(dst, 'w') as f:
        f.write(content)
    return True, None


def copy_workflows(slug):
    src_dir = os.path.join(PIPELINE, 'workflow-templates', slug)
    dst_dir = os.path.join(SERVICES, slug, '.github', 'workflows')
    if not os.path.exists(src_dir):
        return False, 'workflow-templates dir missing in pipeline-studio'

    os.makedirs(dst_dir, exist_ok=True)
    for fname in os.listdir(src_dir):
        shutil.copy2(os.path.join(src_dir, fname), os.path.join(dst_dir, fname))
    return True, None


def add_django_wsgi():
    wsgi_path = os.path.join(SERVICES, '15-django', 'config', 'wsgi.py')
    if not os.path.exists(wsgi_path):
        with open(wsgi_path, 'w') as f:
            f.write(DJANGO_WSGI)
        print('  + added config/wsgi.py for 15-django')


def main():
    slugs = sorted(os.listdir(SERVICES))
    ok = []
    skipped = []
    failed = []

    for slug in slugs:
        if not os.path.isdir(os.path.join(SERVICES, slug)):
            continue

        if slug in CI_ONLY:
            skipped.append(slug)
            continue

        df_ok, df_err = copy_dockerfile(slug)
        wf_ok, wf_err = copy_workflows(slug)

        if df_ok and wf_ok:
            ok.append(slug)
            print(f'  ✓ {slug}')
        else:
            err = df_err or wf_err
            failed.append((slug, err))
            print(f'  ✗ {slug} — {err}')

    add_django_wsgi()

    print(f'\n✅ {len(ok)} services ready')
    print(f'⏭  {len(skipped)} CI-only (skipped)')
    if failed:
        print(f'❌ {len(failed)} failed:')
        for slug, err in failed:
            print(f'   {slug}: {err}')


if __name__ == '__main__':
    main()
