#!/usr/bin/env python3
# Generates per-service, device-filtered compliance profiles from the canonical catalog.
# Output: services/<svc>/compliance/profiles.json — JSON, so every language reads it
# with no naive YAML parsing (kills the comment-leak bug).
#
# Usage:
#   python3 catalog/generate.py            # all mapped services
#   python3 catalog/generate.py web-nextjs # one service
import json, sys, os
import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT = os.path.join(ROOT, 'catalog', 'compliance.yaml')

# Which device type each service maps to (drives per-device control filtering).
SERVICE_DEVICE = {
    'api-aspnet-core':'backend','api-axum':'backend','api-fastapi':'backend','api-gin':'backend',
    'api-ktor':'backend','api-laravel':'backend','api-nestjs':'backend','api-phoenix':'backend',
    'api-rails':'backend','api-spring-boot':'backend',
    'web-nextjs':'web-ssr','web-nuxt':'web-ssr','web-sveltekit':'web-ssr',
    'web-angular-ssr':'web-ssr','web-astro':'web-ssr',
    'edge-hono':'edge',
    'protocol-grpc':'protocol','protocol-ws-node':'protocol','protocol-graphql-yoga':'protocol',
}

# Split services = a client app + a backend-for-frontend (BFF). The BFF holds the
# real compliance surface, so its profiles.json goes under bff/compliance with a
# backend-grade device. The client carries no server-side compliance file.
SPLIT_SERVICE_DEVICE = {
    'web-react':'backend',       # the bff is a backend
    'mobile-expo':'mobile-bff',
    'mobile-flutter':'mobile-bff',
}

def load():
    with open(CAT) as f:
        return yaml.safe_load(f)

def resolve_for_device(cat, device):
    controls = cat['controls']
    regimes = cat['regimes']
    keys = [c for c in controls if device in controls[c]['applies_to']]
    meta = {c: {'label':controls[c]['label'],'type':controls[c]['type']} for c in keys}

    def profile(enforces):
        out = {}
        for c in keys:
            out[c] = enforces.get(c, controls[c]['default'])
        return out

    profiles = {'baseline': {
        'name':'Baseline (no industry lens)','priority':'global',
        'jurisdiction':'Safe general defaults','controls':profile({})
    }}
    for rid, r in regimes.items():
        profiles[rid] = {
            'name': r['name'], 'priority': r['priority'],
            'jurisdiction': r['jurisdiction'],
            'controls': profile(r.get('enforces') or {})
        }
    return {'device':device,'catalogVersion':cat['version'],
            'controlMeta':meta,'profiles':profiles}

def write_service(svc, device, cat):
    data = resolve_for_device(cat, device)
    out_dir = os.path.join(ROOT,'services',svc,'compliance')
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir,'profiles.json')
    with open(path,'w') as f:
        json.dump(data, f, indent=2)
    return path, len(data['profiles']), len(data['controlMeta'])

def write_split(svc, device, cat):
    data = resolve_for_device(cat, device)
    out_dir = os.path.join(ROOT,'services',svc,'bff','compliance')
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir,'profiles.json')
    with open(path,'w') as f:
        json.dump(data, f, indent=2)
    return path, len(data['profiles']), len(data['controlMeta'])

def main():
    cat = load()
    all_services = {**SERVICE_DEVICE, **SPLIT_SERVICE_DEVICE}
    targets = sys.argv[1:] or list(all_services.keys())
    for svc in targets:
        if svc in SPLIT_SERVICE_DEVICE:
            device = SPLIT_SERVICE_DEVICE[svc]
            path, nprof, nctrl = write_split(svc, device, cat)
            print(f"OK {svc:22} device={device:11} profiles={nprof} controls={nctrl} (bff/)")
            continue
        device = SERVICE_DEVICE.get(svc)
        if not device:
            print(f"SKIP {svc} — no device mapping"); continue
        path, nprof, nctrl = write_service(svc, device, cat)
        print(f"OK {svc:22} device={device:11} profiles={nprof} controls={nctrl}")

if __name__ == '__main__':
    main()
