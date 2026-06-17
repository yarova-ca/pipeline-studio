#!/usr/bin/env python3
# Emits per-service integrations/integrations.json from the canonical axis catalog.
# Each integration carries the auth pattern + the config keys the developer fills in
# + a placeholder example endpoint. One repo can connect to every listed system.
#
# Usage: python3 catalog/gen_integrations.py [service ...]   (default: all)
import json, os, sys, yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Config keys the developer must fill, derived from the auth pattern.
AUTH_CONFIG = {
    'oidc':    ['ISSUER_URL', 'CLIENT_ID', 'CLIENT_SECRET', 'REDIRECT_URI'],
    'oauth2':  ['TOKEN_URL', 'CLIENT_ID', 'CLIENT_SECRET', 'SCOPES'],
    'api-key': ['BASE_URL', 'API_KEY'],
    'mtls':    ['BASE_URL', 'CLIENT_CERT_PATH', 'CLIENT_KEY_PATH', 'CA_CERT_PATH'],
}

# Same service->device map idea, but integrations apply to anything with a server.
from importlib import import_module
sys.path.insert(0, os.path.join(ROOT, 'catalog'))
gen = import_module('generate')
SERVERFUL = {**gen.SERVICE_DEVICE}             # backend / web-ssr / edge / protocol
SPLIT = gen.SPLIT_SERVICE_DEVICE               # bff path

def enrich(item):
    auth = item.get('auth', 'api-key')
    env_prefix = item['id'].replace('int-', '').replace('-', '_').upper()
    keys = [f"{env_prefix}_{k}" for k in AUTH_CONFIG.get(auth, ['BASE_URL', 'API_KEY'])]
    return {
        'id': item['id'], 'name': item['name'], 'category': item['category'],
        'auth': auth, 'config_keys': keys,
        'example_endpoint': f"/integrations/{item['id'].replace('int-', '')}/example",
        'verticals': item.get('verticals', ['all']),
        'status': 'placeholder',  # client stub + example call; fill config to activate
    }

def manifest(axes):
    return {
        'version': 1,
        'note': 'Fill the config_keys in your env to activate an integration. '
                'Each ships a placeholder client + example endpoint.',
        'canada': [enrich(i) for i in axes['integrations_canada']],
        'common': [enrich(i) for i in axes['integrations_common']],
    }

def main():
    axes = yaml.safe_load(open(os.path.join(ROOT, 'catalog', 'axes.yaml')))
    data = manifest(axes)
    targets = sys.argv[1:] or list(SERVERFUL.keys()) + list(SPLIT.keys())
    for svc in targets:
        sub = 'bff/integrations' if svc in SPLIT else 'integrations'
        out_dir = os.path.join(ROOT, 'services', svc, sub)
        os.makedirs(out_dir, exist_ok=True)
        with open(os.path.join(out_dir, 'integrations.json'), 'w') as f:
            json.dump(data, f, indent=2)
        print(f"OK {svc:22} {sub}/integrations.json  ({len(data['canada'])} CA + {len(data['common'])} common)")

if __name__ == '__main__':
    main()
