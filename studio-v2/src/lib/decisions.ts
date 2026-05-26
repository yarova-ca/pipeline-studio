// Decision definitions with full knowledge content — concepts, pick-when,
// avoid, tradeoff, cost per option. Single source of truth for the
// decision map and the why-panel.

import type { DecisionDef, DecisionId, StageId } from './types';

export const DECISION_DEFS: Record<DecisionId, DecisionDef> = {
  shape: {
    label: 'Service shape', icon: '🎯',
    concept: 'What kind of service is this? Shape decides whether the pipeline contains a Dockerfile, K8s manifests, CD steps, or skips them.',
    why: 'Shape is the first decision. It determines every downstream step: whether a Dockerfile is generated, whether CD manifests are needed, and whether container stages run at all.',
    skipWhen: 'Not skippable — shape drives the entire pipeline structure.',
    defaultVal: 'fullstack',
    options: [
      { value: 'fullstack', label: 'Full-stack web app', desc: 'Server-rendered HTML + client JS. Container pipeline. Example: Next.js, Rails, Phoenix.', pickWhen: 'You need server-side rendering, API routes in the same repo, or real-time features.', avoid: 'Avoid when the backend and frontend teams are completely separate — consider separate-repo shape instead.', tradeoff: 'vs SPA: full-stack has server rendering (better SEO, faster LCP); SPA is simpler to deploy as static files.', cost: 'Container hosting cost. Runtime image ~20-80MB.' },
      { value: 'frontend', label: 'Frontend SPA', desc: 'Single-page app. nginx serves static files. Needs a separate backend.', pickWhen: 'You have a separate backend API and the frontend is purely a browser app.', avoid: "Avoid when SEO matters — SPAs are not crawled well by search engines without SSR.", tradeoff: 'vs full-stack: SPA is simpler to deploy (static CDN); full-stack has server rendering.', cost: 'Static hosting ~$0-5/month (CDN). Or container with nginx.' },
      { value: 'backend', label: 'Backend API', desc: 'No UI. Container serves JSON to clients. Example: FastAPI, gin.', pickWhen: 'Building an API-only service. No HTML to render.', avoid: 'Avoid when you need a UI — add a frontend framework or use full-stack.', tradeoff: 'vs full-stack: backend-only is simpler (no frontend build step); full-stack bundles everything.', cost: 'Container hosting. Runtime image 10-100MB depending on language.' },
      { value: 'ssg', label: 'Static site (SSG)', desc: 'HTML built at build time. Container with nginx. No runtime server.', pickWhen: 'Content is known at build time — docs, marketing, blogs.', avoid: 'Avoid for apps with user-specific or frequently changing content.', tradeoff: 'vs full-stack: SSG has no runtime server (zero server CVEs); full-stack can serve dynamic content.', cost: 'Static hosting ~$0. Or container with nginx.' },
      { value: 'mobile', label: 'Mobile app', desc: 'No container. App store build. Pipeline covers test + sign + upload.', pickWhen: 'Building iOS or Android apps. No container image produced.', avoid: 'Avoid if you need a web presence — add a separate web app.', tradeoff: 'vs web: mobile has native UI access; web app is one codebase for all platforms.', cost: 'EAS Build credits. App store developer accounts.' },
      { value: 'library', label: 'Library / package', desc: 'No deploy. Publish to npm/PyPI/crates. Pipeline covers test + sign + publish.', pickWhen: 'Building a reusable package consumed by other projects.', avoid: 'Avoid if you need to serve traffic — libraries have no runtime.', tradeoff: 'vs backend: library has no deployment cost; backend runs permanently and costs money.', cost: 'Package registry hosting — npm/PyPI are free.' }
    ]
  },

  ide: {
    label: 'IDE security hints', icon: '💡',
    concept: 'Real-time security feedback as developer types. Cheapest fix point — before commit.',
    why: 'Catches security issues as you type — before commit, before CI. Issues found in IDE cost 0 CI minutes to fix. Every minute of CI time costs money; IDE catches are free.',
    skipWhen: 'Team uses terminal-only editors (vim, emacs) with no plugin ecosystem.',
    defaultVal: 'snyk',
    options: [
      { value: 'snyk', label: 'Snyk IDE plugin', desc: 'VS Code + JetBrains. Dep + container + IaC. Free tier + commercial.', caps: ['Real-time CVE scan in deps', 'Container image scan', 'IaC scan (Dockerfile, K8s YAML)', 'License compliance'], pickWhen: 'You want one tool covering deps + container + IaC in the IDE.', avoid: 'Avoid on free tier with >5 devs — 200 test/month limit hit fast.', tradeoff: 'vs Semgrep: Snyk finds CVEs in packages; Semgrep finds security patterns in source code. Both cover different attack surfaces.', cost: 'Free: 200 tests/month. Team: $98/dev/year.' },
      { value: 'semgrep', label: 'Semgrep VS Code', desc: 'Static analysis. ~2000 rules. Custom rule support.', caps: ['2000+ security rules', 'Custom rule writing', 'OWASP Top 10 patterns', 'Multi-language'], pickWhen: 'You want source-code security patterns — SQL injection, XSS, command injection.', avoid: 'Avoid if you only need CVE-in-dependency scanning — Semgrep does not check package CVEs.', tradeoff: 'vs Snyk: Semgrep finds logic-level bugs; Snyk finds known CVEs. Use both for full coverage.', cost: 'Free community rules. Pro: $40/dev/month.' },
      { value: 'sonarlint', label: 'SonarLint', desc: 'SonarSource quality + security. Hooks to SonarQube/SonarCloud.', caps: ['Quality gates', 'Security hotspots', 'Connected mode with SonarQube/SonarCloud', 'Java/C# deep analysis'], pickWhen: 'Team already pays for SonarQube or SonarCloud — connected mode syncs rules.', avoid: 'Avoid if no SonarQube server — standalone SonarLint has limited rule coverage vs Semgrep.', tradeoff: 'vs Semgrep: SonarLint is better for quality (code smells, duplication); Semgrep is better for security rules.', cost: 'Free standalone. SonarCloud: $10/dev/month.' },
      { value: 'codeql', label: 'GitHub Copilot Security', desc: 'CodeQL-powered. GitHub Advanced Security tier.', caps: ['Deep interprocedural data-flow analysis', 'CodeQL queries', 'GitHub Advanced Security integration'], pickWhen: 'Team has GitHub Advanced Security license and needs deep multi-file vulnerability analysis.', avoid: 'Avoid for real-time feedback — CodeQL is slow (3-8 min per scan), not suitable for keystroke-level hints.', tradeoff: 'vs Semgrep: CodeQL finds complex multi-file bugs; Semgrep finds single-file patterns. CodeQL is more powerful but slower.', cost: 'Requires GitHub Advanced Security: $49/dev/month.' },
      { value: 'none', label: 'None (skip)', desc: 'Pipeline still catches in CI. Slower fix cycle.', caps: ['No IDE security feedback'], pickWhen: 'Never the right choice for a security-conscious pipeline.', avoid: 'Avoid — CI still catches issues but the fix cycle is 5-15 minutes longer per issue.', tradeoff: 'Choosing none means every security issue discovered in CI requires a full commit-push-wait-fix cycle.', cost: '$0 tooling, but higher developer time cost per finding.' }
    ]
  },

  precommit: {
    label: 'Pre-commit framework', icon: '🪝',
    concept: 'Hook framework that runs checks before git commit. Blocks bad commits locally.',
    why: 'Blocks bad commits at the source — before they reach remote. Same hooks run in CI to catch --no-verify bypasses.',
    skipWhen: 'Only skip if team has a policy against local tooling and relies entirely on CI gate.',
    defaultVal: 'precommit',
    options: [
      { value: 'precommit', label: 'pre-commit (Python-based)', desc: 'Default. Multi-language. Largest hook ecosystem.', caps: ['200+ hooks on pre-commit.com', 'Runs in isolated virtualenv per hook', 'Multi-language', 'Most widely adopted'], pickWhen: 'Any project — pre-commit is the default choice. Largest hook ecosystem by far.', avoid: 'Avoid only if team resists Python dependency or uses Windows without WSL (setup friction).', tradeoff: 'vs Husky: pre-commit runs hooks in isolated envs (no conflicts); Husky runs npm scripts (simpler but JS-only ecosystem).', cost: 'Free. Python required.' },
      { value: 'husky', label: 'Husky (Node)', desc: 'JS/TS projects. Lightweight. Runs npm scripts.', caps: ['Zero config for JS/TS', 'Runs npm scripts as hooks', '5MB install'], pickWhen: 'JS/TS-only project and team wants no Python dependency.', avoid: 'Avoid for polyglot repos — Husky only runs npm scripts, not arbitrary commands cleanly.', tradeoff: 'vs pre-commit: Husky is simpler for pure JS; pre-commit handles Go, Python, Ruby, Java hooks equally.', cost: 'Free. Node.js required.' },
      { value: 'lefthook', label: 'Lefthook (Go-based, fast)', desc: 'Go binary. Parallel execution. YAML config.', caps: ['Parallel hook execution', 'Go binary — no runtime dependency', 'YAML config', 'Fastest runner'], pickWhen: 'Large repo where hooks are slow — Lefthook runs them in parallel.', avoid: 'Avoid if you rely on pre-commit.com hook registry — Lefthook has no equivalent marketplace.', tradeoff: 'vs pre-commit: Lefthook is faster (parallel); pre-commit has a larger hook library.', cost: 'Free. Single Go binary.' },
      { value: 'overcommit', label: 'Overcommit (Ruby)', desc: 'Rails-friendly. Mature.', caps: ['Ruby-native hooks', 'Mature', 'Built-in checks for Rails conventions'], pickWhen: 'Ruby/Rails project already using the Ruby toolchain.', avoid: 'Avoid for non-Ruby projects — overcommit adds Ruby dependency for no gain.', tradeoff: 'vs pre-commit: overcommit is better for Rails-specific checks; pre-commit is better for everything else.', cost: 'Free. Ruby required.' },
      { value: 'none', label: 'None (skip)', desc: 'CI still re-runs hooks. Local feedback is slower.', caps: ['No local commit gate'], pickWhen: 'Never the preferred choice.', avoid: 'Avoid — the same CI hooks take 5-10 extra minutes per fix when not caught locally.', tradeoff: 'CI catches the same issues but every finding requires a full push-wait-fix loop.', cost: '$0 tooling, higher fix cost per finding.' }
    ]
  },

  localsecret: {
    label: 'Local secret scan', icon: '🕵️',
    concept: 'Pre-commit hook that scans for committed secrets. Stops credential leaks before they reach remote.',
    why: 'Prevents credentials committed to git — even if deleted later, the secret exists in git history forever and is exploitable. A committed secret MUST be rotated immediately — deletion does not help.',
    skipWhen: 'Never skip — CI runs this same check but a secret committed even once is already in history.',
    defaultVal: 'gitleaks',
    options: [
      { value: 'gitleaks', label: 'Gitleaks', desc: '150+ patterns. Fast. SARIF output. Best of breed.', caps: ['150+ credential patterns', 'Regex + entropy detection', 'SARIF output', '<5s scan time', 'Most widely adopted'], pickWhen: 'Default choice for any project. Fastest and most adopted.', avoid: 'Avoid if you need live verification that the found secret actually works — Gitleaks only pattern-matches, does not verify.', tradeoff: 'vs TruffleHog: Gitleaks is faster; TruffleHog live-verifies secrets against the issuing API (confirms exploitability).', cost: 'Free. Open source.' },
      { value: 'trufflehog', label: 'TruffleHog', desc: 'Live-verifies leaked secrets. Slower. More accurate.', caps: ['Live secret verification against APIs', 'Detects active vs rotated secrets', 'GitHub/GitLab/S3 scanning'], pickWhen: 'High security requirement — you want to know if a found secret is still active, not just pattern-matched.', avoid: 'Avoid in fast CI — TruffleHog verification takes 30s+ vs Gitleaks 5s.', tradeoff: 'vs Gitleaks: TruffleHog confirms exploitability; Gitleaks just pattern-matches. More accurate, slower.', cost: 'Free. Open source.' },
      { value: 'gitsecrets', label: 'git-secrets (AWS)', desc: 'AWS-focused. Lightweight. Simpler ruleset.', caps: ['AWS credential patterns', 'Pre-commit integration', 'Simple setup'], pickWhen: 'AWS-only project and team wants simplest possible setup.', avoid: 'Avoid for general use — only ~10 patterns vs Gitleaks 150+.', tradeoff: 'vs Gitleaks: git-secrets is simpler but covers far fewer secret types. Gitleaks is strictly better for general use.', cost: 'Free. Open source.' },
      { value: 'detect', label: 'detect-secrets (Yelp)', desc: 'Baseline approach. Audit workflow for false positives.', caps: ['Baseline approach — track known-allowed patterns', 'Audit workflow for false positive management', '22 detector types'], pickWhen: 'Large existing codebase with many existing false positives — baseline lets you ignore known findings.', avoid: 'Avoid for greenfield projects — baseline setup adds friction without benefit when starting clean.', tradeoff: 'vs Gitleaks: detect-secrets manages false positives better; Gitleaks blocks harder with fewer configuration options.', cost: 'Free. Python required.' },
      { value: 'none', label: 'None', desc: 'CI still catches secrets, but only after they reach remote.', caps: ['No local secret scan'], pickWhen: 'Never the right choice.', avoid: 'Avoid — even with CI scanning, a secret committed to a shared branch is already in remote history.', tradeoff: 'CI catches secrets but only after they reach the remote. At that point rotation is mandatory.', cost: '$0 tooling, potentially very high incident cost.' }
    ]
  },

  fe: {
    label: 'Frontend framework', icon: '🌐',
    concept: 'UI framework — what users see in the browser. Decides Dockerfile build command, test command, and runtime image.',
    why: 'Frontend choice drives the builder image (Node version), install command, build command, test command, and whether you need a separate server (SSR) or can serve static files (SPA/SSG).',
    selectId: 'sel-frontend',
    defaultVal: 'nextjs'
  },

  be: {
    label: 'Backend framework', icon: '⚙️',
    concept: 'Server / API code. None means frontend-only mode. Full-stack frameworks already include server code.',
    why: 'Backend choice drives: language runtime in the container, base image, port, health check path, and whether the Dockerfile has a multi-stage build.',
    selectId: 'sel-backend',
    defaultVal: 'none'
  },

  pkg: {
    label: 'Package manager', icon: '📦',
    concept: 'Installs dependencies. Lockfile decides reproducibility. Each has its own CI cache key.',
    selectId: 'sel-pkgmgr',
    defaultVal: 'npm'
  },

  ci: {
    label: 'CI system', icon: '🔧',
    concept: 'Runs every stage in the pipeline. Different YAML syntax + different OIDC story for keyless signing.',
    why: 'The CI system choice affects: YAML syntax, OIDC signing support (keyless vs token), runner cost, marketplace availability, and whether self-hosted runners are needed.',
    skipWhen: 'Not skippable — no CI means no pipeline.',
    selectId: 'sel-ci',
    defaultVal: 'github-actions',
    options: [
      { value: 'github-actions', label: 'GitHub Actions', desc: 'Native OIDC for all major registries. Largest marketplace. 2000 min/month free.', caps: ['Native OIDC for GHCR/ECR/GAR/ACR — no stored secrets', '2000 min/month free on public repos', 'Largest action marketplace', 'Matrix builds', 'GitHub-hosted and self-hosted runners'], pickWhen: 'Project is on GitHub. Default choice — best OIDC integration, largest ecosystem.', avoid: 'Avoid if self-hosted on-prem is mandatory (air-gapped environments).', tradeoff: 'vs CircleCI: GitHub Actions has better OIDC and marketplace; CircleCI has faster Docker Layer Caching and more granular resource classes.', cost: '2000 min/month free. Team: $4/extra 1000 min.' },
      { value: 'gitlab-ci', label: 'GitLab CI', desc: 'Built into GitLab. 400 min/month free. Auto DevOps templates.', caps: ['Built into GitLab', 'Shared runners free (400 min/month)', 'Built-in container registry', 'Auto DevOps templates'], pickWhen: 'Project is already on GitLab — no reason to add a second CI system.', avoid: 'Avoid if project is on GitHub — double toolchain with no benefit.', tradeoff: 'vs GitHub Actions: GitLab CI has better built-in registry integration; GitHub Actions has a larger marketplace.', cost: 'Free tier: 400 min/month. Premium: $29/user/month.' },
      { value: 'jenkins', label: 'Jenkins', desc: 'Self-hosted. No per-minute cost. 1800+ plugins.', caps: ['Self-hosted — full control', 'No per-minute cost', 'Massive plugin ecosystem (1800+ plugins)', 'On-prem support'], pickWhen: 'Air-gapped environment, on-prem mandate, or existing Jenkins investment.', avoid: 'Avoid for new projects — Jenkins requires significant ops burden (updates, plugins, security patches).', tradeoff: 'vs GitHub Actions: Jenkins has no per-minute cost and is on-prem; GitHub Actions is managed and requires no ops.', cost: 'Free software. Infrastructure cost only.' },
      { value: 'azdo', label: 'Azure DevOps', desc: 'Microsoft-native. 1800 min/month free. Good for .NET.', caps: ['Microsoft-native', '1800 min/month free (public projects)', 'Excellent .NET support', 'Azure integration'], pickWhen: 'Microsoft shop already using Azure and .NET — AzDO integrates tightly with Azure services.', avoid: 'Avoid for GitHub-hosted projects — adds account management overhead.', tradeoff: 'vs GitHub Actions: AzDO has better Azure integration; GitHub Actions has a larger open-source ecosystem.', cost: '1800 min/month free. Additional: $40/parallel job/month.' },
      { value: 'circleci', label: 'CircleCI', desc: 'Best Docker layer caching. 6000 min/month free.', caps: ['Docker Layer Caching built-in', 'Fastest caching in industry', 'Resource classes (small to GPU)', 'Orbs marketplace'], pickWhen: 'Build speed is critical — Docker Layer Caching reduces container build time by 60-80%.', avoid: 'Avoid if team is already on GitHub Actions and has no performance problem — switching adds migration cost.', tradeoff: 'vs GitHub Actions: CircleCI is faster for large Docker builds; GitHub Actions has better OIDC and marketplace depth.', cost: 'Free: 6000 min/month. Performance: $15/user/month.' },
      { value: 'tekton', label: 'Tekton', desc: 'K8s-native pipelines. Tasks run as Pods. CNCF.', caps: ['K8s-native — pipelines are Custom Resources', 'Tasks run as Kubernetes Pods', 'CNCF graduated project', 'Integrates with Tekton Chains for supply chain security'], pickWhen: 'Running inside Kubernetes — Tekton pipelines are K8s CRDs.', avoid: 'Avoid outside Kubernetes — Tekton requires a K8s cluster to run.', tradeoff: 'vs GitHub Actions: Tekton is K8s-native and self-hosted; GitHub Actions is managed and simpler to start.', cost: 'Free. K8s cluster infrastructure cost only.' }
    ]
  },

  reg: {
    label: 'Container registry', icon: '🏪',
    concept: 'Stores the signed image. Each has different auth (OIDC vs token), different tag immutability.',
    why: 'Registry choice affects: auth method (OIDC = no stored secrets vs token = rotation required), pull rate limits, tag immutability, and whether the registry is co-located with your cluster.',
    skipWhen: 'Not skippable — every containerised service needs a registry.',
    selectId: 'sel-reg',
    defaultVal: 'ghcr',
    options: [
      { value: 'ghcr', label: 'GHCR', desc: 'Free with GitHub. OIDC via GITHUB_TOKEN — zero setup. No stored secrets.', caps: ['Free with GitHub', 'OIDC via GITHUB_TOKEN — zero setup', 'No pull rate limits within GitHub Actions', 'Tag immutability', 'Package visibility follows repo visibility'], pickWhen: 'Project is on GitHub. Default choice — zero cost, zero auth setup.', avoid: 'Avoid if company policy requires a specific cloud vendor registry (ECR/GAR/ACR).', tradeoff: 'vs ECR: GHCR is free and simpler; ECR integrates with AWS IAM policies and ECS task roles natively.', cost: 'Free for public. Private: included in GitHub plan.' },
      { value: 'ecr', label: 'ECR (AWS)', desc: 'AWS-native. OIDC via aws-actions. ECR pull-through cache.', caps: ['AWS native', 'Free 500MB/month per account', 'OIDC via aws-actions/configure-aws-credentials', 'Lifecycle policies', 'ECR pull-through cache'], pickWhen: 'Deploying to AWS ECS or EKS — IAM role for task automatically gets pull permission.', avoid: 'Avoid if not on AWS — ECR adds IAM complexity without benefit outside AWS.', tradeoff: 'vs GHCR: ECR integrates with AWS IAM and ECS natively; GHCR is simpler and free but requires extra auth when pulling from ECS.', cost: 'Free 500MB/month. $0.10/GB/month after.' },
      { value: 'gar', label: 'GAR (GCP)', desc: 'GCP-native. Built-in vuln scanning on push. Workload Identity Federation.', caps: ['GCP native', 'Multi-region replication', 'Built-in vulnerability scanning (on push)', 'OIDC via google-github-actions', 'Fine-grained IAM'], pickWhen: 'Deploying to GCP Cloud Run or GKE — Workload Identity Federation gives pods automatic pull access.', avoid: 'Avoid if not on GCP — cross-cloud pull adds latency and egress cost.', tradeoff: 'vs GHCR: GAR has built-in vulnerability scanning on push; GHCR requires a separate scan step.', cost: 'Free 0.5GB/month. $0.10/GB/month after. Scan: $0.26/image.' },
      { value: 'acr', label: 'ACR (Azure)', desc: 'Azure-native. Federated credential. Geo-replication. Content Trust.', caps: ['Azure native', 'OIDC via azure/login + federated identity', 'Geo-replication', 'Quarantine policy', 'Content Trust (signing)'], pickWhen: 'Deploying to AKS or Azure Container Apps — managed identity gives pods automatic pull access.', avoid: 'Avoid if not on Azure — cross-cloud pull adds latency and egress cost.', tradeoff: 'vs GHCR: ACR has better Azure IAM integration; GHCR is simpler and free.', cost: 'Basic: $0.167/day. Standard: $0.667/day. Premium: $1.667/day.' },
      { value: 'dockerhub', label: 'Docker Hub', desc: 'Largest public image ecosystem. Requires stored token (no OIDC).', caps: ['Largest public image ecosystem', 'Global CDN pull', 'Webhooks'], pickWhen: 'Distributing a public open-source image — Docker Hub is where developers look first.', avoid: 'Avoid for private production images — rate limits (100 pulls/6h anonymous, 200/6h free), and stored token required (no OIDC).', tradeoff: 'vs GHCR: Docker Hub is better for public distribution; GHCR is better for private production images (OIDC, free private).', cost: 'Free public. Pro (private): $7/user/month.' },
      { value: 'jfrog', label: 'JFrog', desc: 'Universal artifact repository. On-prem + cloud.', caps: ['Universal artifact repo (Docker, npm, Maven, PyPI, Helm, etc.)', 'Built-in security scanning (Xray)', 'On-prem + cloud'], pickWhen: 'Enterprise already paying for JFrog Artifactory — single tool for all artifact types.', avoid: 'Avoid as first registry choice — adds cost and complexity without benefit over GHCR.', tradeoff: 'vs GHCR: JFrog supports all artifact types in one tool; GHCR is container-only but free and simpler.', cost: 'Cloud: from $98/month. Enterprise: contact sales.' },
      { value: 'harbor', label: 'Harbor', desc: 'Self-hosted. Built-in scanning + signing. CNCF graduated.', caps: ['Self-hosted', 'Built-in Trivy scanning', 'Content Trust signing', 'RBAC', 'Replication'], pickWhen: 'On-prem mandate with air-gapped cluster — Harbor runs inside your network.', avoid: 'Avoid for cloud-native teams — Harbor requires infrastructure to run and maintain.', tradeoff: 'vs GHCR: Harbor is self-hosted (no data leaves network); GHCR is managed and free.', cost: 'Free software. Infrastructure cost only.' },
      { value: 'nexus', label: 'Nexus', desc: 'Sonatype Nexus. Enterprise artifact management.', caps: ['Universal artifact management', 'Hosted, proxy, and group repos', 'Lifecycle scanning via Sonatype'], pickWhen: 'Team already uses Sonatype Nexus for Maven/npm artifacts.', avoid: 'Avoid as standalone container registry — Nexus adds overhead without benefit over GHCR.', tradeoff: 'vs GHCR: Nexus manages all artifact types in one server; GHCR is container-only but free.', cost: 'Free OSS. Pro: $120/year.' },
      { value: 'quay', label: 'Quay.io', desc: 'Red Hat Quay. Best for OpenShift clusters.', caps: ['Red Hat native', 'Robot accounts', 'Vulnerability scanning', 'OpenShift registry integration'], pickWhen: 'Running on OpenShift — Quay integrates with OpenShift auth and image streams.', avoid: 'Avoid outside Red Hat ecosystem — no OIDC support, requires stored token.', tradeoff: 'vs GHCR: Quay is better for OpenShift; GHCR is simpler and free.', cost: 'Free public. Quay.io team: contact sales. On-prem: Red Hat subscription.' },
      { value: 'ttlsh', label: 'ttl.sh (ephemeral)', desc: 'Images expire after 24h. Testing only. No auth required.', caps: ['No auth required', 'Images expire automatically (1h–24h)', 'Anonymous push/pull'], pickWhen: 'Testing the pipeline itself without a permanent registry. Images expire automatically.', avoid: 'Avoid for any production use — images expire after 24h.', tradeoff: 'vs GHCR: ttl.sh requires zero setup; GHCR keeps images permanently.', cost: 'Free. No account needed.' }
    ]
  },

  cd: {
    label: 'CD tool', icon: '🚀',
    concept: 'Continuous Delivery tool. Reads image digest, applies K8s manifests, watches rollout.',
    why: 'CD tool choice drives GitOps vs push-based deployment, drift detection, and multi-cluster support. Wrong choice here means either manual deploys or undetected config drift in production.',
    skipWhen: 'Skip only for library/mobile shapes — no deployment target.',
    defaultVal: 'argocd',
    options: [
      { value: 'argocd', label: 'ArgoCD', desc: 'GitOps pull. K8s-native. Multi-cluster. Most popular.', caps: ['GitOps pull model', 'ApplicationSet for multi-cluster', 'Auto drift detection and sync', 'Web UI + CLI', 'RBAC per application', 'Most widely adopted GitOps tool'], pickWhen: 'K8s deployment with GitOps. Default choice for new K8s services.', avoid: 'Avoid for non-K8s targets (serverless, VMs) — ArgoCD is K8s-only.', tradeoff: 'vs Flux: ArgoCD has a UI and ApplicationSet for multi-cluster; Flux is lighter and has better native Helm support.', cost: 'Free. Open source. CNCF graduated.' },
      { value: 'flux', label: 'Flux', desc: 'GitOps pull. Lightweight. Better Helm controller. No UI.', caps: ['GitOps pull model', 'Lightweight — no UI', 'Better Helm controller', 'CNCF graduated', 'Multi-tenancy via Flux tenants'], pickWhen: 'Helm-heavy deployment or team prefers CLI-only GitOps without a UI.', avoid: 'Avoid if you need a visual dashboard to debug sync status — Flux has no built-in UI.', tradeoff: 'vs ArgoCD: Flux is lighter and has a better Helm controller; ArgoCD has a UI and simpler multi-cluster setup via ApplicationSet.', cost: 'Free. Open source.' },
      { value: 'spinnaker', label: 'Spinnaker', desc: 'Enterprise multi-cloud push. Stage-graph pipelines. Netflix-origin.', caps: ['Multi-cloud push model', 'Stage-graph pipelines', 'Manual approval stages', 'Canary analysis (Kayenta)', 'Netflix-origin'], pickWhen: 'Multi-cloud deployments (AWS + GCP + Azure in one pipeline) with complex approval workflows.', avoid: 'Avoid for standard K8s — Spinnaker is heavy (needs its own K8s cluster to run) and complex to maintain.', tradeoff: 'vs ArgoCD: Spinnaker supports multi-cloud and complex approval stages; ArgoCD is K8s-only but simpler.', cost: 'Free. But requires ~6 pods of infrastructure.' },
      { value: 'helm', label: 'Helm (manual)', desc: 'Imperative. No GitOps. Good for bootstrapping.', caps: ['Imperative deploy', 'No GitOps', 'Helm chart templating', 'Simple for one-off deploys'], pickWhen: 'Simple deploy without GitOps, or bootstrapping before setting up ArgoCD/Flux.', avoid: 'Avoid for production — Helm alone has no drift detection, no auto-sync, no audit trail.', tradeoff: 'vs ArgoCD: Helm is simpler to start; ArgoCD adds drift detection and GitOps audit trail.', cost: 'Free. Open source.' },
      { value: 'jenkinsx', label: 'Jenkins X', desc: 'Cloud-native Jenkins for K8s. Preview environments.', caps: ['K8s-native Jenkins', 'Preview environments per PR', 'ChatOps via Lighthouse', 'Tekton pipelines underneath'], pickWhen: 'Existing Jenkins org moving to K8s — Jenkins X bridges the two worlds.', avoid: 'Avoid if starting fresh — ArgoCD/Flux are simpler for greenfield K8s GitOps.', tradeoff: 'vs ArgoCD: Jenkins X adds PR preview environments; ArgoCD is simpler for production-only GitOps.', cost: 'Free. K8s infrastructure cost.' }
    ]
  },

  gitops: {
    label: 'GitOps repo layout', icon: '📂',
    concept: 'Where K8s manifests live. Same app repo (deploy/ subtree) or a separate config repo (most common at scale).',
    why: "GitOps layout determines whether your CI commits to one repo or two, and how ArgoCD/Flux watches your manifests. Wrong layout creates 'manifest drift' — prod running what's not in git.",
    defaultVal: 'same-repo',
    options: [
      { value: 'same-repo', label: 'Same repo (deploy/ subtree)', desc: 'Manifests live alongside source. ArgoCD watches THIS repo at path deploy/overlays/<env>.', pickWhen: 'Small to medium team. Monorepo. Simpler — one PR changes code + manifests together.', avoid: 'Avoid when platform and app teams are separate — they would both need write access to the same repo.', tradeoff: 'vs separate-repo: Same-repo is simpler; separate-repo enables independent app/platform ownership at scale.', cost: 'No extra repos. One GitHub Actions workflow.' },
      { value: 'separate-repo', label: 'Separate config repo', desc: 'App repo builds + pushes image. CI opens a PR in a separate config repo to bump image tag.', pickWhen: 'Large team where platform team owns manifests independently. Best at scale.', avoid: "Avoid for small teams — managing two repos for one service adds overhead without benefit.", tradeoff: 'vs same-repo: Separate-repo enables independent ownership; same-repo is simpler for small teams.', cost: 'Extra GitHub repo. CI writes to two repos — needs cross-repo token.' },
      { value: 'push', label: 'Push deploy (no GitOps)', desc: 'CI runs helm upgrade or kubectl apply directly. No drift detection.', pickWhen: 'Prototypes or single-environment services where GitOps overhead is not worth it.', avoid: "Avoid for production — push deploy has no drift detection, no audit trail, and no rollback visibility.", tradeoff: 'vs GitOps: Push is simpler to start; GitOps adds drift detection and rollback visibility.', cost: 'No GitOps infra cost. But higher ops risk.' }
    ]
  },

  baseimage: {
    label: 'Container base image', icon: '🐳',
    concept: 'Foundation layer. Smaller base = smaller attack surface. Distroless has no shell.',
    why: 'The container base image sets the attack surface for every CVE scanner run. A smaller base = fewer packages = fewer CVEs = faster scans = fewer false positives. Wrong choice here means failing CVE scans in every release.',
    skipWhen: 'Not skippable for container shapes.',
    defaultVal: 'distroless',
    options: [
      { value: 'distroless', label: 'Distroless (gcr.io/distroless)', desc: 'No shell. No package manager. Smallest attack surface. Google-maintained.', caps: ['No shell', 'No package manager', 'No apt/apk', '~20MB smaller than Alpine', 'Google-maintained', 'Lowest CVE count'], pickWhen: 'Production container for Go, Java, Node, Python — use distroless for the runtime stage.', avoid: 'Avoid for build stage — distroless has no build tools. Always use multi-stage build (builder=full image, runtime=distroless).', tradeoff: 'vs Alpine: Distroless has lower CVE count and no shell (harder to exploit); Alpine has apk for debugging but more CVEs.', cost: 'Free. GCR hosted.' },
      { value: 'alpine', label: 'Alpine Linux', desc: '~5MB. musl libc. apk for debugging. More CVEs than distroless.', caps: ['~5MB base', 'apk package manager', 'BusyBox shell', 'Widely understood'], pickWhen: 'Build stage only, or when you need apk for debugging in staging. Not for prod runtime.', avoid: 'Avoid for production runtime — Alpine has musl libc which causes glibc compatibility issues for some binaries.', tradeoff: 'vs Distroless: Alpine is more debuggable (has shell); Distroless has lower attack surface and CVE count.', cost: 'Free.' },
      { value: 'ubuntu', label: 'Ubuntu slim', desc: '~75MB. apt available. Familiar. Highest CVE count.', caps: ['apt package manager', '75MB base', 'Familiar', 'Most CVEs of the set'], pickWhen: 'Development/debugging only. Never for production runtime.', avoid: 'Avoid for production — Ubuntu slim has the highest CVE count of all options and a shell that can be exploited.', tradeoff: 'vs Distroless: Ubuntu has more CVEs, a shell, and apt — easier to debug but much larger attack surface.', cost: 'Free.' },
      { value: 'chainguard', label: 'Chainguard Images', desc: 'Wolfi-based. Signed by default. CVE-zero focus. glibc compatible.', caps: ['Zero-CVE focus', 'Wolfi-based (glibc compatible)', 'Signed by default', 'Daily rebuilds', 'Free images + paid enterprise with SLAs'], pickWhen: 'Compliance environments where zero-CVE image is required by policy (SOC 2, FedRAMP).', avoid: 'Avoid if your runtime is not in Chainguard catalog — not every language runtime has a Chainguard variant.', tradeoff: 'vs Distroless: Chainguard has glibc compatibility and more language variants; Distroless has longer Google track record.', cost: 'Free images. Enterprise SLA: contact sales.' },
      { value: 'scratch', label: 'scratch (empty base)', desc: 'Zero bytes. For static binaries only (Go, Rust).', caps: ['Zero bytes base', 'No OS packages = zero CVEs', 'Static binary only', 'No shell, no nothing'], pickWhen: 'Statically compiled Go or Rust binary. Build with CGO_ENABLED=0.', avoid: 'Avoid for any dynamically linked binary — scratch has no libc, no CA certs, no timezone data.', tradeoff: 'vs Distroless: scratch is smaller; distroless has CA certs, timezone data, and a non-root user.', cost: 'Free.' },
      { value: 'rhel-ubi', label: 'Red Hat UBI', desc: 'Universal Base Image. Enterprise-friendly. OpenShift preferred.', caps: ['Red Hat Universal Base Image', 'Runs on OpenShift without UBI exemptions', 'RHEL-compatible toolchain', 'Enterprise support available'], pickWhen: 'Running on OpenShift or in a regulated environment that requires Red Hat-certified images.', avoid: 'Avoid outside Red Hat ecosystem — UBI is larger and slower than Distroless without ecosystem benefit.', tradeoff: 'vs Distroless: UBI has more packages (larger attack surface); Distroless is smaller and has fewer CVEs.', cost: 'Free. Red Hat support subscription optional.' }
    ]
  },

  sbom: {
    label: 'SBOM generator', icon: '📋',
    concept: 'SBOM (Software Bill of Materials) — complete list of every library and OS package inside your container image. Required for CVE tracking and compliance.',
    why: 'SBOM is now required by US Executive Order 14028, FedRAMP, and many enterprise procurement processes. Without an SBOM you cannot answer "are we affected by this CVE?"',
    skipWhen: 'Never skip for production — even if not legally required, SBOM is how you answer CVE queries in <5 minutes.',
    defaultVal: 'syft',
    options: [
      { value: 'syft', label: 'Syft (Anchore)', desc: 'SPDX + CycloneDX. Best language coverage. Default choice.', caps: ['SPDX + CycloneDX output formats', 'Best language coverage (27 ecosystems)', 'JSON + text formats', 'Pairs with Grype for CVE scanning'], pickWhen: 'Default choice. Best package coverage — catches Go, Rust, Python, Java, Node, Ruby in one scan.', avoid: 'Avoid pairing with Trivy for CVE scanning — Syft + Grype is the natural pair; Trivy does both.', tradeoff: 'vs Trivy SBOM: Syft has better package coverage; Trivy SBOM is one binary for both SBOM + CVE scan.', cost: 'Free. Open source.' },
      { value: 'trivy', label: 'Trivy SBOM', desc: 'Same binary as CVE scanner. One tool for both SBOM + scan.', caps: ['Same binary as CVE scanner', 'SPDX + CycloneDX output', 'One tool eliminates version mismatch', 'Fast'], pickWhen: 'You are already using Trivy for CVE scanning — use the same binary for SBOM to avoid tool sprawl.', avoid: "Avoid if Syft's broader language coverage is needed — Trivy has fewer ecosystems.", tradeoff: 'vs Syft: Trivy is one binary for both SBOM + CVE scan; Syft has broader language coverage.', cost: 'Free. Open source.' },
      { value: 'cyclonedx', label: 'cyclonedx-cli', desc: 'OWASP CycloneDX-native. Best CycloneDX compliance.', caps: ['OWASP CycloneDX-native', 'JSON + XML output', 'VEX (Vulnerability Exploitability eXchange) support', 'Best for CycloneDX-strict environments'], pickWhen: 'Compliance requires CycloneDX format specifically — regulators sometimes specify format.', avoid: "Avoid for general use — Syft produces CycloneDX too, with broader language coverage.", tradeoff: 'vs Syft: cyclonedx-cli is CycloneDX-native; Syft supports both SPDX and CycloneDX.', cost: 'Free. Open source.' },
      { value: 'in-toto', label: 'in-toto attestation', desc: 'SLSA-style metadata. More than just SBOM.', caps: ['SLSA supply chain attestation', 'Layout-driven signing', 'Broader than SBOM — covers build provenance', 'GitHub Attestations support'], pickWhen: 'SLSA Level 3+ requirement — in-toto proves HOW the artifact was built, not just what is in it.', avoid: "Avoid if you only need an SBOM — in-toto is broader but more complex.", tradeoff: 'vs Syft: in-toto provides provenance attestation; Syft provides package inventory. Both serve different compliance needs.', cost: 'Free. Open source.' }
    ]
  },

  scanner: {
    label: 'CVE scanner', icon: '🛡️',
    concept: 'Scans image layers for CVEs (known security holes). CRITICAL/HIGH severity findings block the build.',
    why: 'Image scanning catches vulnerabilities in OS packages and language runtimes BEFORE the image is signed and deployed. Skipping this means shipping images with known exploitable CVEs.',
    skipWhen: 'Never skip for production container shapes.',
    defaultVal: 'trivy',
    options: [
      { value: 'trivy', label: 'Trivy (Aqua)', desc: 'Free. NVD + OSV + GHSA. SARIF output. Most popular.', caps: ['Free', 'NVD + OSV + GHSA databases', 'SARIF output', 'Scans OS + language packages', 'Most popular open-source scanner'], pickWhen: 'Default choice for any project. Fastest, most accurate, free.', avoid: "Avoid as replacement for Snyk if you need commercial support or fix advice in the scanner itself.", tradeoff: 'vs Grype: Trivy has more databases (NVD+OSV+GHSA); Grype pairs naturally with Syft SBOM.', cost: 'Free. Open source.' },
      { value: 'grype', label: 'Grype (Anchore)', desc: 'Pairs with Syft SBOM. CLI-first. NVD + OSV.', caps: ['Pairs with Syft SBOM natively', 'NVD + OSV databases', 'JSON + SARIF output', 'Anchore-maintained'], pickWhen: 'You are already using Syft for SBOM — Grype reads the Syft SBOM directly without re-scanning.', avoid: "Avoid if not using Syft — Trivy is simpler as a standalone scanner.", tradeoff: 'vs Trivy: Grype pairs naturally with Syft; Trivy is more widely deployed with more database sources.', cost: 'Free. Open source.' },
      { value: 'snyk', label: 'Snyk Container', desc: 'Commercial. Best fix advice. Subscribes to private vuln feed.', caps: ['Private vulnerability feed (finds issues before NVD)', 'Best fix advice (specific package version to upgrade)', 'Commercial support', 'Integrates with Snyk IDE plugin'], pickWhen: 'Commercial security team that needs fix advice, private vuln feed, and SLA on false positives.', avoid: "Avoid on free tier for large teams — 200 test/month limit hit quickly.", tradeoff: 'vs Trivy: Snyk has private vuln feed and better fix advice; Trivy is free and has no per-scan cost.', cost: 'Free: 200 tests/month. Team: $98/dev/year.' },
      { value: 'anchore', label: 'Anchore Enterprise', desc: 'Compliance-heavy. Policy engine. Commercial.', caps: ['Policy engine for compliance gates', 'DISA STIG mappings', 'CIS benchmark checks', 'Commercial enterprise support'], pickWhen: 'FedRAMP, DISA STIG, or CIS benchmark compliance is mandated — Anchore maps CVEs to compliance controls.', avoid: 'Avoid for standard projects — Anchore adds significant complexity without benefit over Trivy.', tradeoff: 'vs Trivy: Anchore has compliance policy engine; Trivy is simpler and free.', cost: 'Commercial. Contact sales.' },
      { value: 'clair', label: 'Clair (Quay)', desc: 'Static analysis. Red Hat-friendly. Quay-native.', caps: ['Red Hat CVE database integration', 'Quay.io native integration', 'RHEL/UBI image support', 'REST API'], pickWhen: 'Running Quay.io registry — Clair integrates natively.', avoid: "Avoid outside Quay ecosystem — Trivy has better database coverage.", tradeoff: 'vs Trivy: Clair has better Red Hat/RHEL CVE data; Trivy has broader database coverage across all distros.', cost: 'Free. Open source.' },
      { value: 'prisma', label: 'Prisma Cloud (Palo Alto)', desc: 'Commercial. Combines container + runtime + IaC.', caps: ['Container + runtime + IaC in one commercial platform', 'Twistlock heritage', 'Runtime behavioral analysis', 'Commercial support + threat intelligence'], pickWhen: 'Enterprise buying a full CNAPP (Cloud-Native Application Protection Platform) in one vendor.', avoid: 'Avoid for container scanning alone — Trivy is free and just as accurate without the CNAPP overhead.', tradeoff: 'vs Trivy: Prisma Cloud covers runtime and IaC in one platform; Trivy is free and focused on container scanning.', cost: 'Commercial. Contact sales.' }
    ]
  },

  signing: {
    label: 'Image signing', icon: '🔐',
    concept: 'Cryptographic signature on the image. Verifies provenance and blocks tampering. Keyless signing uses OIDC — no stored CI password needed.',
    why: 'Image signing creates a tamper-evident seal. Without signing, anyone with registry push access can swap the image and production would run malicious code. Keyless signing via OIDC means no keys to rotate or leak.',
    skipWhen: 'Never skip for production — unsigned images cannot be verified at deploy time.',
    defaultVal: 'cosign',
    options: [
      { value: 'cosign', label: 'Sigstore cosign (keyless)', desc: 'OIDC-keyless. Rekor transparency log. Default for new pipelines.', caps: ['OIDC keyless signing — no stored keys', 'Rekor transparency log for public audit', 'SLSA Level 3 provenance', 'GitHub Actions + OIDC native integration', 'Most widely adopted for K8s'], pickWhen: 'Default choice. Keyless OIDC signing — no keys to store, rotate, or leak.', avoid: "Avoid if your cluster admission policy requires Notary v2 — cosign and Notary use different signature formats.", tradeoff: 'vs Notary v2: cosign is simpler and keyless; Notary v2 is the OCI standard and supported by more registries.', cost: 'Free. Sigstore is open source.' },
      { value: 'notary2', label: 'Notary v2 (CNCF)', desc: 'OCI native. Vendor-neutral CNCF standard. Newer.', caps: ['OCI native signature standard', 'CNCF project', 'Supported by ACR, ECR, GAR natively', 'Vendor-neutral format'], pickWhen: 'Enterprise requiring OCI-standard signatures supported by all major cloud registries.', avoid: "Avoid for new projects — cosign's keyless OIDC is simpler and just as secure.", tradeoff: 'vs cosign: Notary v2 is the OCI standard; cosign is more widely deployed today with OIDC keyless support.', cost: 'Free. Open source.' },
      { value: 'dct', label: 'Docker Content Trust', desc: 'Legacy Notary v1. Avoid for new pipelines.', caps: ['Notary v1 signature format', 'Docker Engine native support', 'Trust server required'], pickWhen: 'Only if you have existing DCT infrastructure from Docker Trusted Registry era.', avoid: 'Avoid for new pipelines — DCT is Notary v1 (legacy). Use cosign or Notary v2 instead.', tradeoff: 'vs cosign: DCT is the old approach requiring a Notary trust server; cosign is keyless and serverless.', cost: 'Free. Requires a Notary trust server.' },
      { value: 'in-toto', label: 'in-toto attestations', desc: 'SLSA-compatible layout-driven signing. Broader provenance.', caps: ['SLSA provenance attestation', 'Build metadata signed with each step', 'GitHub Attestations API support', 'Broader than image signing'], pickWhen: 'SLSA Level 3+ requirement — proves the full build chain, not just the final image.', avoid: "Avoid for simple image signing — in-toto is more complex than cosign for the same compliance result.", tradeoff: 'vs cosign: in-toto proves the whole build chain; cosign signs the final image only.', cost: 'Free. Open source.' }
    ]
  },

  cloud: {
    label: 'Cloud target', icon: '☁️',
    concept: 'Cluster cloud provider. Decides login YAML, IAM trust policy, regional concerns.',
    why: 'Cloud choice determines which OIDC provider to trust, which IAM mechanism to use, and which managed K8s service your manifests target.',
    defaultVal: 'aws',
    options: [
      { value: 'aws', label: 'AWS (EKS / ECS / Fargate)', desc: 'IAM OIDC for ECR. EKS the K8s flavor.', pickWhen: 'Org is AWS-native. EKS + ECR + IAM roles for service accounts is the standard.', avoid: 'Avoid mixing AWS compute with GCP or Azure auth — cross-cloud identity adds complexity.', tradeoff: 'vs GCP: AWS has larger instance variety; GCP has simpler pricing.', cost: 'EKS: $0.10/cluster/hour + EC2 node cost.' },
      { value: 'gcp', label: 'GCP (GKE / Cloud Run)', desc: 'Workload Identity Federation. Cloud Run is serverless containers.', pickWhen: 'Org is GCP-native. GKE + GAR + Workload Identity is the standard.', avoid: 'Avoid mixing GCP compute with AWS or Azure auth.', tradeoff: 'vs AWS: GCP has simpler Workload Identity; AWS has larger ecosystem.', cost: 'GKE Autopilot: $0.10/cluster/hour + pod resource cost.' },
      { value: 'azure', label: 'Azure (AKS / Container Apps)', desc: 'Federated credential. Container Apps is the serverless flavor.', pickWhen: 'Microsoft-native org. AKS + ACR + Managed Identity is the standard.', avoid: 'Avoid mixing Azure compute with AWS or GCP auth.', tradeoff: 'vs AWS: Azure has better .NET support; AWS has larger instance selection.', cost: 'AKS: free control plane. VM node cost.' },
      { value: 'k8s-self', label: 'On-prem Kubernetes', desc: 'Self-managed cluster. Harbor + Argo common.', pickWhen: 'Air-gapped requirement or data sovereignty prevents cloud.', avoid: 'Avoid if cloud is permitted — self-managed K8s adds significant ops overhead.', tradeoff: 'vs EKS: On-prem has no per-cluster cost; EKS is managed (updates, patches handled by AWS).', cost: 'Infrastructure-only. High ops cost.' },
      { value: 'fly', label: 'Fly.io', desc: 'Per-region edge containers. Firecracker microVMs.', pickWhen: 'Global low-latency apps where running near users matters. Good for hobby to small production.', avoid: 'Avoid for enterprise workloads requiring SOC 2 / FedRAMP compliance.', tradeoff: 'vs EKS: Fly is simpler to deploy; EKS has enterprise compliance support.', cost: 'From $0.02/VM/hour.' },
      { value: 'cloudrun', label: 'Google Cloud Run', desc: 'Serverless containers. Scale-to-zero.', pickWhen: 'Variable traffic that includes periods of zero activity — Cloud Run scales to zero.', avoid: 'Avoid for stateful workloads — Cloud Run is stateless containers only.', tradeoff: 'vs GKE: Cloud Run is serverless (scale-to-zero); GKE is always-on.', cost: 'Pay per request. First 2M requests/month free.' }
    ]
  },

  promotion: {
    label: 'Promotion strategy', icon: '🚦',
    concept: 'How traffic shifts to the new version during a deploy.',
    why: 'Promotion strategy determines how quickly bad releases reach users and how quickly they can be rolled back. Wrong strategy can cause production outages affecting all users at once.',
    defaultVal: 'canary',
    options: [
      { value: 'canary', label: 'Canary (Argo Rollouts)', desc: '5% → 25% → 100% with auto-rollback on error spike.', pickWhen: 'Production service with real user traffic — canary limits blast radius to a small percentage of users.', avoid: 'Avoid if you have < 10 req/s — canary needs enough traffic for statistically significant error rate.', tradeoff: 'vs blue/green: Canary uses less resources (one environment); blue/green has instant rollback.', cost: 'Argo Rollouts: free. Same infrastructure cost as rolling update.' },
      { value: 'bluegreen', label: 'Blue / green', desc: 'Two environments. Switch traffic all at once. 2× resource cost.', pickWhen: 'Need instant rollback ability — switch traffic back to blue instantly if green fails.', avoid: 'Avoid if 2× infrastructure cost is not acceptable.', tradeoff: 'vs canary: Blue/green has instant rollback; canary uses half the resources.', cost: '2× node cost during cutover. Short window of doubled cost.' },
      { value: 'rolling', label: 'Rolling update (K8s default)', desc: 'Replace pods gradually. No traffic-split mesh needed.', pickWhen: 'Simple service with no specialized traffic-splitting needs. K8s default.', avoid: 'Avoid when instant rollback is required — rolling rollback takes time.', tradeoff: 'vs canary: Rolling is simpler (K8s default); canary requires Argo Rollouts but gives traffic-split control.', cost: 'No additional cost. K8s built-in.' },
      { value: 'recreate', label: 'Recreate (downtime)', desc: 'Stop all old, start all new. Downtime acceptable.', pickWhen: 'Dev/staging or batch workloads where downtime is acceptable.', avoid: 'Avoid for production user-facing services — causes downtime for every deploy.', tradeoff: 'vs rolling: Recreate causes downtime; rolling deploys without downtime.', cost: 'No additional cost. K8s built-in.' },
      { value: 'flagger', label: 'Flagger (Flux ecosystem)', desc: 'Service-mesh canary. Istio/Linkerd-based.', pickWhen: 'Using Flux + Istio/Linkerd — Flagger integrates natively with Flux and service meshes.', avoid: 'Avoid without a service mesh — Flagger requires Istio or Linkerd to split traffic.', tradeoff: 'vs Argo Rollouts: Flagger pairs with Flux; Argo Rollouts pairs with ArgoCD.', cost: 'Free. Service mesh cost (Istio/Linkerd).' },
      { value: 'shadow', label: 'Shadow / dark launch', desc: 'Send copies of prod traffic to new version. No user impact.', pickWhen: 'Testing a new version against real production traffic without any user exposure.', avoid: 'Avoid as the primary deploy strategy — shadow launches still require a cutover eventually.', tradeoff: 'vs canary: Shadow has zero user impact; canary affects a small percentage of users.', cost: '2× compute during shadow period.' }
    ]
  },

  industry: {
    label: 'Industry sector', icon: '🏢',
    concept: 'Sector context. Drives the typical compliance framework, SLA, traffic class.',
    why: 'Industry determines what compliance frameworks auditors expect, what SLAs are contractual, and what security controls are legally required.',
    selectId: 'sel-industry',
    defaultVal: 'none'
  },

  compliance: {
    label: 'Compliance framework', icon: '📜',
    concept: 'Audit framework. Each pipeline stage maps to a control ID.',
    why: 'Compliance framework determines which pipeline controls map to which auditor control IDs. Selecting a framework surfaces only the stages that count toward that audit.',
    selectId: 'sel-compliance',
    defaultVal: 'none'
  }
};

/** Decisions whose pick is essential for a working pipeline → Required badge. */
export const DECISION_REQUIRED: ReadonlySet<DecisionId> = new Set([
  'fe', 'be', 'ci', 'reg', 'cd', 'gitops', 'scanner', 'signing', 'baseimage'
]);
/** Decisions that have a 'none' / auto fallback → Optional badge. */
export const DECISION_OPTIONAL: ReadonlySet<DecisionId> = new Set([
  'ide', 'precommit', 'localsecret', 'pkg', 'sbom', 'cloud', 'promotion', 'industry', 'compliance'
]);

export const DECISION_AFFECTS_NODES: Record<DecisionId, StageId[]> = {
  ide:               ['l1'],
  precommit:         ['l2'],
  localsecret:       ['l4'],
  fe:                ['s6pr', 's6main'],
  be:                ['s6pr', 's6main'],
  pkg:               ['s2', 's2m', 's6pr', 's6main'],
  ci:                ['s0', 's1'],
  reg:               ['s6main', 's13'],
  cd:                ['p1', 'p2', 'p3', 'p4', 's14'],
  gitops:            ['p1', 'p2', 'p3', 'p4', 's14'],
  baseimage:         ['s6pr', 's6main'],
  sbom:              ['s8apr', 's8a'],
  scanner:           ['s7pr', 's7main'],
  signing:           ['s8b', 's14'],
  cloud:             ['p1'],
  promotion:         ['p2', 'p3', 'p4'],
  industry:          ['s8b', 's10', 's14'],
  compliance:        ['s8b', 's10', 's14']
};

// Tool pick-when help strings (short) for dropdown tooltips
export const OPTION_HELP: Record<string, Record<string, string>> = {
  frontend: {
    'nextjs':       'Hybrid SSR/SSG with built-in API routes. Pick when you need server-rendered React + APIs in one repo.',
    'remix':        'SSR-only, web-standards-first React. Pick when you want forms/loaders without client state libs.',
    'react-vite':   'Pure SPA. Pick when SEO does not matter and the frontend hits an existing API.',
    'gatsby':       'Static-site React. Pick when content is mostly known at build time (blogs, docs).',
    'nuxt':         'Vue equivalent of Next.js. Pick when your team standardised on Vue.',
    'vue-vite':     'Vue SPA. Pick for an internal dashboard or admin tool.',
    'angular':      'Enterprise SPA framework. Pick when DI + RxJS + strict TypeScript are non-negotiable.',
    'svelte':       'Compiled SSR/SPA. Pick when bundle size matters most (mobile-web).',
    'astro':        'Islands architecture (mostly static + tiny interactive bits). Pick for content sites that need partial hydration.',
    'solid':        'Fine-grained reactivity SSR. Pick for high-performance full-stack apps.',
    'solid-vite':   'SolidJS SPA. Pick for reactive UI without virtual DOM overhead.',
    'qwik':         'Resumable SSR — zero JS hydration penalty. Pick for content-heavy sites needing instant load.',
    'tanstack':     'Type-safe full-stack router. Pick when TypeScript end-to-end safety is the priority.',
    'mobile-expo':  'Managed React Native via Expo. Container stages skipped — output is APK/IPA.',
    'mobile':       'Bare React Native. Container stages skipped.',
    'none':         'Backend-only repo. No frontend Dockerfile produced.'
  },
  backend: {
    'none':             'Frontend-only repo. No backend Dockerfile produced.',
    'nodejs-express':   'Battle-tested Node API. Pick when you need the largest middleware ecosystem.',
    'nodejs-fastify':   'High-throughput Node API. Pick when p95 latency matters.',
    'nodejs-nest':      'Opinionated Angular-style Node. Pick for large teams that want DI + structure.',
    'nodejs-hono':      'Ultra-light Node API. Pick for edge runtimes (Cloudflare Workers, Deno Deploy).',
    'nodejs-koa':       'Minimal middleware-based Node. Pick as Express without callbacks.',
    'python-fastapi':   'Async Python with OpenAPI built in. Pick for ML-backed APIs.',
    'python-django':    'Batteries-included Python. Pick when you want admin + ORM + auth from day one.',
    'python-flask':     'Minimal Python. Pick for a single-purpose microservice.',
    'python-litestar':  'Modern async Python. Pick when you would have picked FastAPI but want DI built in.',
    'go-gin':           'Most popular Go web framework. Pick for performance + simple routing.',
    'go-echo':          'High-perf Go alternative to gin. Pick if you prefer echo idioms.',
    'go-chi':           'stdlib-flavored Go router. Pick when you want minimal framework lock-in.',
    'go-fiber':         'Express-inspired Go. Pick for the fastest raw HTTP throughput.',
    'go-stdlib':        'Zero deps — Go net/http only. Pick for the smallest attack surface.',
    'java-spring':      'Enterprise Java standard. Pick for regulated environments with Java skills.',
    'java-quarkus':     'Native-image Java. Pick when you need fast startup (serverless).',
    'java-micronaut':   'AOT-compiled Java. Pick when memory matters more than ecosystem breadth.',
    'kotlin-ktor':      'Kotlin coroutines-native async server. Pick for Kotlin-first teams.',
    'dotnet-webapi':    '.NET enterprise API. Pick for Microsoft shops.',
    'dotnet-minimal':   '.NET minimal-API style. Pick for a small service in a .NET-native org.',
    'rust-axum':        'tokio-based Rust web. Pick when you need maximum perf + memory safety.',
    'rust-actix':       'actor-model Rust web. Pick for high-concurrency message processing.',
    'rust-rocket':      'Macro-driven Rust web. Pick for Rust beginners wanting Rails-like DX.',
    'rust-warp':        'Filter-composition Rust web. Pick for composable middleware chains.',
    'elixir-phoenix':   'BEAM concurrency Phoenix API. Pick for 2M+ concurrent WebSocket connections.',
    'ruby-rails':       'Convention-over-config Rails. Pick when developer velocity > raw perf.',
    'ruby-sinatra':     'Tiny Ruby microservice. Pick when Rails would be overkill.',
    'php-laravel':      'PHP framework with rich tooling. Pick for content/CMS-like apps.',
    'php-symfony':      'Enterprise PHP. Pick for large PHP codebases needing structure.',
    'php-slim':         'Microframework PHP. Pick for a single endpoint or webhook.'
  }
};
