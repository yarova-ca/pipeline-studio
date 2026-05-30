#!/usr/bin/env python3
"""
Fix 3 issues across pipeline-studio HTML docs:
1. 01-framework-catalog: update 27→30 counts, add xref strips to all 30 group h2s
2. 15-version-registry: add #protocols sub-anchor, deep-link protocol badges
"""
import re

STUDIO = "/mnt/c/Users/RohithY/yarova/pipeline-studio"

# ── Anchor mapping: group number → (11 anchor, 13 anchor, 15 section)
ANCHORS = {
    1:  ("cat-ssr-hybrid",          "ssr-hybrid",        "frameworks"),
    2:  ("cat-csr-spa",             "csr-spa",           "frameworks"),
    3:  ("cat-ssg",                 "ssg",               "frameworks"),
    4:  ("cat-islands",             "islands",           "frameworks"),
    5:  ("cat-resumability",        "resumability",      "frameworks"),
    6:  ("cat-edge-rendering",      "edge-rendering",    "frameworks"),
    7:  ("cat-streaming-ssr",       "streaming-ssr",     "frameworks"),
    8:  ("cat-microfrontends",      "micro-frontends",   "frameworks"),
    9:  ("cat-cross-platform-js",   "cross-platform-js", "frameworks"),
    10: ("cat-cross-platform-native","cross-platform-nonjs","frameworks"),
    11: ("cat-native-ios",          "native-ios",        "frameworks"),
    12: ("cat-native-android",      "native-android",    "frameworks"),
    13: ("cat-pwa",                 "pwa",               "frameworks"),
    14: ("cat-node-deno-bun",       "node-backend",      "frameworks"),
    15: ("cat-python",              "python",            "frameworks"),
    16: ("cat-go",                  "go",                "frameworks"),
    17: ("cat-java",                "java",              "frameworks"),
    18: ("cat-kotlin",              "kotlin",            "frameworks"),
    19: ("cat-dotnet",              "dotnet",            "frameworks"),
    20: ("cat-rust",                "rust",              "frameworks"),
    21: ("cat-elixir",              "elixir",            "frameworks"),
    22: ("cat-ruby",                "ruby",              "frameworks"),
    23: ("cat-php",                 "php",               "frameworks"),
    24: ("cat-swift-server",        "swift-server",      "frameworks"),
    25: ("cat-scala",               "scala",             "frameworks"),
    26: ("cat-clojure",             "clojure",           "frameworks"),
    27: ("cat-cpp",                 "cpp",               "frameworks"),
    28: ("cat-grpc",                "grpc",              "protocols"),
    29: ("cat-graphql",             "graphql",           "protocols"),
    30: ("cat-websocket",           "websocket",         "protocols"),
}

XREF_CSS = """\
/* xref strip — cross-doc links after each group header */
.xref-strip{display:flex;align-items:center;gap:6px;margin:4px 0 8px;flex-wrap:wrap}
.xref-strip .xs-label{font-size:10px;color:var(--text-dim);flex-shrink:0}
.doc-badge{display:inline-block;font-size:10px;font-weight:700;padding:1px 6px;
  border-radius:3px;background:#dbeeff;color:var(--blue);border:1px solid #b6d7f5;
  text-decoration:none;white-space:nowrap}
.doc-badge:hover{background:#b6d7f5}
@media(prefers-color-scheme:dark){
  .doc-badge{background:#0d2744;border-color:#2d4a6a;color:#58a6ff}
  .doc-badge:hover{background:#1c3a5e}
}
"""

def xref_strip(grp_num):
    a11, a13, a15 = ANCHORS[grp_num]
    return (
        f'<div class="xref-strip">'
        f'<span class="xs-label">See also:</span>'
        f'<a href="11-dockerfile-catalog.html#{a11}" class="doc-badge">11 Dockerfiles</a>'
        f'<a href="13-pipeline-build-catalog.html#{a13}" class="doc-badge">13 Pipeline</a>'
        f'<a href="15-version-registry.html#{a15}" class="doc-badge">15 Versions</a>'
        f'</div>'
    )

# ══════════════════════════════════════════════════════════════════
# FIX 1: 01-framework-catalog.html
# ══════════════════════════════════════════════════════════════════
print("=== Fixing 01-framework-catalog.html ===")
with open(f"{STUDIO}/01-framework-catalog.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1a. Fix page-meta "27 categories" → "30 categories"
content = content.replace(
    "27 categories &nbsp;·&nbsp; 22 columns per category (18 shared + 4 category-specific) &nbsp;·&nbsp; all rows filled",
    "30 categories &nbsp;·&nbsp; 22 columns per category (18 shared + 4 category-specific) &nbsp;·&nbsp; all rows filled"
)

# 1b. Fix meta description
content = content.replace(
    '27-category framework catalog',
    '30-category framework catalog'
)

# 1c. Fix count chip "27" for categories
content = content.replace(
    '<div class="chip-num">27</div><div class="chip-label">Categories<br>(Frontend · Mobile · Backend)</div>',
    '<div class="chip-num">30</div><div class="chip-label">Categories<br>(Frontend · Mobile · Backend · Protocols)</div>'
)

# 1d. Inject xref CSS before </style>
if '.xref-strip' not in content:
    content = content.replace('</style>', XREF_CSS + '</style>', 1)
    print("  Injected xref CSS")

# 1e. Add xref strip after each group's cat-verified div
# Pattern: after <div class="cat-verified">...</div> that follows h2 id="cNN"
# We need to track which h2 we're after

lines = content.split('\n')
new_lines = []
current_grp = None

for i, line in enumerate(lines):
    new_lines.append(line)
    # Detect which group we're in
    h2_match = re.search(r'<h2 id="c(\d+)"', line)
    if h2_match:
        current_grp = int(h2_match.group(1))

    # After cat-verified, insert the xref strip (only once per group)
    if current_grp and 'class="cat-verified"' in line and '</div>' in line:
        # Check next line doesn't already have xref-strip
        next_line = lines[i+1] if i+1 < len(lines) else ""
        if 'xref-strip' not in next_line:
            new_lines.append(xref_strip(current_grp))
            print(f"  Added xref strip for group {current_grp}")
        current_grp = None  # reset — only inject once per group

content = '\n'.join(new_lines)

# Count how many xref strips were added
strip_count = content.count('class="xref-strip"')

with open(f"{STUDIO}/01-framework-catalog.html", "w", encoding="utf-8") as f:
    f.write(content)

print(f"  Done. {strip_count} xref strips total in file.")

# ══════════════════════════════════════════════════════════════════
# FIX 2: 15-version-registry.html — protocol deep links
# ══════════════════════════════════════════════════════════════════
print("\n=== Fixing 15-version-registry.html ===")

with open(f"{STUDIO}/15-version-registry.html", "r", encoding="utf-8") as f:
    content15 = f.read()

# 2a. Add a sub-section anchor before the gRPC rows
# Find "grpc-go" which is the first gRPC entry
PROTO_HEADER = '<h3 id="protocols" style="font-size:12px;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.05em;margin:16px 0 6px 0;padding-top:10px;border-top:1px solid var(--border)">Protocols — gRPC · GraphQL · WebSocket</h3>\n'

if 'id="protocols"' not in content15:
    # Insert before the grpc-go row
    content15 = content15.replace(
        '<tr><td style="font-weight:600;white-space:nowrap">grpc-go</td>',
        PROTO_HEADER + '<tr><td style="font-weight:600;white-space:nowrap">grpc-go</td>',
        1
    )
    print("  Added #protocols sub-anchor")

# 2b. Deep-link gRPC badges (01→#c28, 11→#cat-grpc, 13→#grpc)
GRPC_LIBS = [
    "grpc-go", "grpc-java", "grpcio", "@grpc/grpc-js",
    "grpc-dotnet", "tonic", "grpc-swift", "grpc-kotlin",
    "connect-go", "grpc-php"
]
GRAPHQL_LIBS = [
    "Apollo Server", "GraphQL Yoga", "Strawberry", "gqlgen",
    "Spring for GraphQL", "Hot Chocolate", "graphql-ruby", "async-graphql"
]
WS_LIBS = [
    "ws", "gorilla/websocket", "websockets (Python)", "Java-WebSocket",
    "tokio-tungstenite", "faye-websocket"
]

def fix_badges(html, lib_name, a01, a11, a13):
    """For a specific library row, fix the 3 badge hrefs to use deep anchors."""
    # Find the row for this library and update its badges
    # Pattern: td with font-weight:600 containing lib_name, followed by badges
    escaped_name = re.escape(lib_name)

    def replace_row_badges(m):
        row = m.group(0)
        # Replace badge hrefs
        row = row.replace(
            'href="01-framework-catalog.html" class="doc-badge">01<',
            f'href="01-framework-catalog.html#{a01}" class="doc-badge">01<'
        )
        row = row.replace(
            'href="11-dockerfile-catalog.html" class="doc-badge">11<',
            f'href="11-dockerfile-catalog.html#{a11}" class="doc-badge">11<'
        )
        row = row.replace(
            'href="13-pipeline-build-catalog.html" class="doc-badge">13<',
            f'href="13-pipeline-build-catalog.html#{a13}" class="doc-badge">13<'
        )
        return row

    # Match the full <tr>...</tr> containing this library name
    pattern = r'<tr><td[^>]*>' + escaped_name + r'</td>.*?</tr>'
    new_html, n = re.subn(pattern, replace_row_badges, html, count=1, flags=re.DOTALL)
    if n == 0:
        print(f"  WARNING: could not find row for '{lib_name}'")
    return new_html

for lib in GRPC_LIBS:
    content15 = fix_badges(content15, lib, "c28", "cat-grpc", "grpc")
    print(f"  Fixed gRPC badges: {lib}")

for lib in GRAPHQL_LIBS:
    content15 = fix_badges(content15, lib, "c29", "cat-graphql", "graphql")
    print(f"  Fixed GraphQL badges: {lib}")

for lib in WS_LIBS:
    content15 = fix_badges(content15, lib, "c30", "cat-websocket", "websocket")
    print(f"  Fixed WebSocket badges: {lib}")

with open(f"{STUDIO}/15-version-registry.html", "w", encoding="utf-8") as f:
    f.write(content15)

print("\nDone.")

# ══════════════════════════════════════════════════════════════════
# VERIFY
# ══════════════════════════════════════════════════════════════════
print("\n=== Verification ===")

with open(f"{STUDIO}/01-framework-catalog.html", "r") as f:
    c01 = f.read()
with open(f"{STUDIO}/15-version-registry.html", "r") as f:
    c15 = f.read()

print(f"01 — xref strips present: {c01.count('xref-strip')}")
print(f"01 — page-meta shows '30 categories': {'30 categories' in c01}")
print(f"01 — chip shows '30': {'>30<' in c01}")
print(f"15 — #protocols anchor present: {'id=\"protocols\"' in c15}")
print(f"15 — grpc deep link #c28: {'#c28' in c15}")
print(f"15 — graphql deep link #c29: {'#c29' in c15}")
print(f"15 — websocket deep link #c30: {'#c30' in c15}")
print(f"15 — grpc Dockerfile deep link #cat-grpc: {'#cat-grpc' in c15}")
print(f"15 — graphql pipeline deep link #graphql: {'#graphql' in c15}")
