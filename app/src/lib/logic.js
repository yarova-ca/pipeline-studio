// lib/logic.js — ALL pure logic, ported verbatim from the vanilla app.
// One source of truth: ctx.G (graph.json) + ctx.K (knowledge.json) + ctx.GEN (generators).
// No DOM. Surfaces (Guided/Flow/Library) render what these return.
let G=null,K=null,GEN=null;
export function initCtx(g,k,gen){G=g;K=k;GEN=gen;}
export const getG=()=>G, getK=()=>K;
export const stripTags=(s)=>String(s==null?"":s).replace(/<[^>]*>/g,"").trim();
const esc=(s)=>String(s==null?"":s); // Svelte escapes at render — keep data raw
export const nameById=(node,id)=>{const o=(G.nodes[node]||[]).find(x=>x.id===id);return o?(o.name||o.label||id):id;};
export const fwById=(id)=>(G.nodes.frameworks||[]).find(f=>f.id===id);
export const reqOfInd=(ind)=>ind?(G.nodes.industryRequirements||[]).find(r=>r.id===ind):null;
export const find=(node,id)=>(G.nodes[node]||[]).find(x=>x.id===id);
export const by=(arr,k)=>{const m={};(arr||[]).forEach(x=>{(m[x[k]]||=[]).push(x)});return m;};
// discipline classification — which engineering practice owns this step
function discipline(text){
  const t=String(text||'').toLowerCase();
  if(/sast|sca|codeql|secret|sign|cosign|sbom|trivy|iac|scan|compliance|vuln|license-scan/.test(t))return'DevSecOps';
  if(/observ|otel|metric|prom|slo|sla|incident|alert|notify|rollout|monitor/.test(t))return'SRE';
  return'DevOps';
}
function juriLine(rq){
  const J=K.jurisdictions||{};
  const groups={'Canada — federal':[], 'Provincial':[], 'If you serve the US':[], 'If you serve the EU':[], 'Global / contractual':[]};
  for(const id of (rq.requiredRegimeIds||[])){
    const j=J[id]||''; const name=nameById('complianceProfiles',id);
    if(/^Federal Canada/.test(j))groups['Canada — federal'].push(name);
    else if(/only —|only$|Québec only|Ontario only|Alberta only|British Columbia only/.test(j))groups['Provincial'].push(name.replace('-Quebec',''));
    else if(/^United States|^California/.test(j))groups['If you serve the US'].push(name);
    else if(/^European Union/.test(j))groups['If you serve the EU'].push(name);
    else groups['Global / contractual'].push(name);
  }
  return Object.entries(groups).filter(([,v])=>v.length)
    .map(([k,v])=>`<b>${k}:</b> ${v.join(', ')}`).join(' · ');
}
function oPlain(axis,id,fallback){const m=(K.optionPlain||{})[axis]||{};const e=m[id];return e?e[0]:fallback;}
function oScope(axis,id){const m=(K.optionPlain||{})[axis]||{};const e=m[id];return e?e[1]:'';}
const LANG_DEFPKG={ts:'pnpm',js:'pnpm',py:'uv',go:'gomod',rust:'cargo',java:'maven',kotlin:'gradle',php:'composer',ruby:'bundler',csharp:'gomod',elixir:'gomod'};
const LANG_ORM={ts:'orm-prisma',js:'orm-prisma',py:'orm-sqlalchemy',go:'orm-gorm',rust:'orm-sqlx'};
const LANG_HUMAN={ts:'TypeScript',js:'JavaScript',py:'Python',go:'Go',rust:'Rust',java:'Java',kotlin:'Kotlin',php:'PHP',ruby:'Ruby',csharp:'.NET',elixir:'Elixir'};

function langMatch(str,lang){const h=(LANG_HUMAN[lang]||lang||'').toLowerCase();const s=String(str||'').toLowerCase();
  if(lang==='ts'||lang==='js')return s.includes('javascript')||s.includes('typescript');
  if(!h)return false; return s.includes(h);}
const pkgsFor=(lang)=>(G.nodes.pkgBuildDeep||[]).filter(p=>p.kind==='pkg-mgr'&&langMatch(p.language,lang));
const buildToolsFor=(lang)=>(G.nodes.pkgBuildDeep||[]).filter(p=>p.kind==='build-tool'&&langMatch(p.language,lang));
const ormsFor=(lang)=>(G.nodes.ormDeep||[]).filter(o=>o.id==='orm-none'||(o.language||o.languages||[]).some(L=>langMatch(L,lang)));


const REGIME_TO_STD={'fips-140-3':['fips','fedramp'],'fedramp-mod':['fedramp'],'fedramp-high':['fedramp'],'pci-dss-4':['pci'],'hipaa':['hipaa'],'pipeda':['pipeda'],'soc2-typeii':['soc2'],'iso27001':['iso27001'],'cmmc-l2':['cmmc'],'nerc-cip':['nerccip']};
export function reqStds(s){const out=new Set();for(const id of (s.regimes||[])){(REGIME_TO_STD[id]||[]).forEach(x=>out.add(x));}return out;}
function axisValues(arg){const a=(G.nodes.buildAxes||[]).find(x=>x.arg===arg||x.id===arg);return a&&a.validValues?a.validValues:[];}

export function decisionsFor(s){
  const sh=(s.fw.shipped)||{}, ba=sh.buildArgs||{}, mw=sh.middleware||{};
  const stds=reqStds(s);
  const compByStd={}; (sh.shippedCompliance||[]).forEach(c=>compByStd[c.standard]=c);
  let rtForced=null, rtWhy='';
  for(const std of stds){const c=compByStd[std]; if(c&&c.buildArgs&&c.buildArgs.RUNTIME){rtForced=c.buildArgs.RUNTIME; rtWhy=std.toUpperCase()+' forces RUNTIME='+c.buildArgs.RUNTIME+' (services/'+(s.fw.serviceSlug||s.fw.id)+'/compliance/'+std+'.yaml).';}}
  const reqAuth=stds.has('pci')||stds.has('hipaa')||((s.rq?.requiredAuthIds||[]).length>0);
  const needAudit=stds.has('hipaa')||stds.has('pci');
  const needObs=stds.has('soc2')||stds.has('hipaa')||stds.has('pci')||stds.has('fedramp');
  const D={deps:[],build:[],compliance:[],ci:[],gitops:[],cluster:[],platform:[]};
  // dependencies
  D.deps.push({q:'Package manager',answer:nameById('pkgBuildDeep',s.pkg),options:(s.fw.pkgMgr||'').split(/[,/]+/).map(x=>x.trim()).filter(Boolean),verdict:s.pkgUser?'you':'set',why:'Frozen-lockfile install in CI.'});
  if(s.fw.buildTool)D.deps.push({q:'Build tool',answer:s.fw.buildTool,options:[],verdict:'set',why:''});
  // build / image
  if(ba.BUILD_IMAGE)D.build.push({q:'Build image (compile stage)',answer:ba.BUILD_IMAGE,options:axisValues('BUILD_IMAGE'),verdict:'set',why:'Builder layer — discarded from the final image.'});
  const rtAns=rtForced||ba.RUNTIME||s.base;
  D.build.push({q:'Runtime variant',answer:rtAns,options:sh.runtimeVariants||['alpine','fips'],verdict:rtForced?'forced':'set',why:rtForced?rtWhy:'Shipped default runtime base.',disc:rtForced?'DevSecOps':'DevOps'});
  const tgt=(rtAns==='fips')?'runtime-fips':'runtime';
  D.build.push({q:'Dockerfile target',answer:tgt,options:(sh.dockerfileTargets||[]).filter(t=>/^runtime|^base-(alpine|fips|slim)/.test(t)),verdict:rtForced?'forced':'set',why:'Final image stage built.'});
  // compliance
  for(const id of (s.regimes||[])){
    const std=(REGIME_TO_STD[id]||[])[0], c=std&&compByStd[std];
    D.compliance.push({q:nameById('complianceProfiles',id),answer:c?'profile shipped':'no shipped profile',options:[],verdict:c?'required':'gap',
      why:c?('Forces '+((c.buildArgs&&Object.keys(c.buildArgs).length)?Object.entries(c.buildArgs).map(([k,v])=>k+'='+v).join(', '):'controls only')+'. Controls: '+((c.requiredControls||[]).slice(0,4).join(', ')||'—')+'.'):'Needs a compliance profile.'});
  }
  // platform middleware
  D.platform.push({q:'Auth',answer:mw.auth?nameById('authDeep',s.auth):'none',options:(G.nodes.authDeep||[]).map(a=>a.name),verdict:mw.auth?(reqAuth?'required':'set'):(reqAuth?'gap':'off'),why:reqAuth?(mw.auth?'Required by compliance — present.':'Required by '+[...stds].join('/')+' — MISSING.'):'Auth middleware shipped.',disc:'DevSecOps'});
  D.platform.push({q:'Audit logging',answer:mw.audit?'on':'off',options:['on','off'],verdict:mw.audit?(needAudit?'required':'set'):(needAudit?'gap':'off'),why:needAudit?(mw.audit?'Required and present.':'HIPAA/PCI require immutable audit logs — OFF in this service.'):'Not enabled.',disc:'DevSecOps'});
  D.platform.push({q:'RBAC',answer:mw.rbac?'on':'off',options:['on','off'],verdict:mw.rbac?'set':'off',why:'Role-based access control middleware.',disc:'DevSecOps'});
  D.platform.push({q:'Circuit breaker',answer:mw.circuitBreaker?'on':'off',options:['on','off'],verdict:mw.circuitBreaker?'set':'off',why:'Resilience on downstream calls.',disc:'SRE'});
  D.platform.push({q:'Observability',answer:sh.observabilityDetected?'enabled (logs + metrics)':'none',options:(G.nodes.observabilityDeep||[]).map(o=>o.name),verdict:sh.observabilityDetected?(needObs?'required':'set'):(needObs?'gap':'off'),why:sh.observabilityDetected?'Detected: structured logs + Prometheus metrics.':(needObs?'Audit/telemetry required by compliance — none detected.':'None detected.'),disc:'SRE'});
  D.platform.push({q:'ORM / data layer',answer:sh.ormDetected?(sh.ormName||'detected'):'none (raw SQL / no DB)',options:(s.ormList||[]).map(o=>o.name),verdict:'set',why:'',disc:'DevOps'});
  // ci — the real shipped workflows
  for(const w of (sh.workflows||[]))D.ci.push({q:w.name||w.file,answer:'enabled',options:[],verdict:'set',why:(w.jobs||[]).length?'Jobs: '+(w.jobs||[]).join(', '):'',disc:discipline((w.name||'')+' '+(w.jobs||[]).join(' '))});
  // gitops / deploy
  if(sh.helm)D.gitops.push({q:'Helm values',answer:(sh.helmValuesFiles||[]).length+' env files',options:sh.helmValuesFiles||[],verdict:'set',why:'Per-environment values shipped.'});
  if(sh.kustomizeOverlays)D.gitops.push({q:'Kustomize overlays',answer:(sh.kustomizeOverlays||[]).join(' / '),options:sh.kustomizeOverlays,verdict:'set',why:'Per-environment patches.'});
  // cluster
  D.cluster.push({q:'Deploy cluster',answer:nameById('clusters',s.cluster),options:(G.nodes.clusters||[]).map(c=>c.name),verdict:s.clusterUser?'you':(s.clusterReq?'recommended':'set'),why:s.rq?(s.clusterReq?s.rq.name+' recommends it.':'Default cluster.'):'Default cluster.'});
  return D;
}


const SCAFFOLD={
  nextjs:'npx create-next-app@latest {app} --typescript --app --eslint',
  react:'npm create vite@latest {app} -- --template react-ts','react-vite':'npm create vite@latest {app} -- --template react-ts',
  vue:'npm create vue@latest {app}','vue-vite':'npm create vite@latest {app} -- --template vue-ts',
  angular:'npx -p @angular/cli ng new {app} --routing --style=scss',svelte:'npx sv create {app}',
  nuxt:'npx nuxi@latest init {app}',remix:'npx create-remix@latest {app}',astro:'npm create astro@latest {app}',
  solid:'npm create solid@latest {app}','solid-vite':'npm create vite@latest {app} -- --template solid-ts',
  qwik:'npm create qwik@latest {app}',gatsby:'npx create-gatsby@latest {app}','preact-vite':'npm create vite@latest {app} -- --template preact-ts',
  tanstack:'npm create @tanstack/router@latest {app}',fresh:'deno run -A -r https://fresh.deno.dev {app}',redwood:'npx create-redwood-app@latest {app}',
  'nodejs-express':'mkdir {app} && cd {app} && npm init -y && npm i express && npm i -D typescript @types/express tsx',
  'nodejs-fastify':'mkdir {app} && cd {app} && npm init -y && npm i fastify','nodejs-nest':'npx @nestjs/cli new {app}',
  'nodejs-hono':'npm create hono@latest {app}','nodejs-koa':'mkdir {app} && cd {app} && npm init -y && npm i koa',
  'python-fastapi':'mkdir {app} && cd {app} && python -m venv .venv && . .venv/bin/activate && pip install "fastapi[standard]"',
  'python-django':'pip install django && django-admin startproject {app}','python-flask':'mkdir {app} && cd {app} && python -m venv .venv && . .venv/bin/activate && pip install flask',
  'python-litestar':'mkdir {app} && cd {app} && pip install litestar uvicorn','python-starlette':'mkdir {app} && cd {app} && pip install starlette uvicorn',
  'go-gin':'mkdir {app} && cd {app} && go mod init {app} && go get github.com/gin-gonic/gin',
  'go-echo':'mkdir {app} && cd {app} && go mod init {app} && go get github.com/labstack/echo/v4',
  'go-fiber':'mkdir {app} && cd {app} && go mod init {app} && go get github.com/gofiber/fiber/v2',
  'go-chi':'mkdir {app} && cd {app} && go mod init {app} && go get github.com/go-chi/chi/v5','go-stdlib':'mkdir {app} && cd {app} && go mod init {app}',
  'rust-axum':'cargo new {app} && cd {app} && cargo add axum tokio --features tokio/full','rust-actix':'cargo new {app} && cd {app} && cargo add actix-web','rust-rocket':'cargo new {app} && cd {app} && cargo add rocket',
  'ruby-rails':'gem install rails && rails new {app} --api','ruby-sinatra':'mkdir {app} && cd {app} && bundle init && bundle add sinatra',
  'php-laravel':'composer create-project laravel/laravel {app}','php-symfony':'composer create-project symfony/skeleton {app}',
  'kotlin-ktor':'# Scaffold at start.ktor.io, or the IntelliJ Ktor plugin','elixir-phoenix':'mix archive.install hex phx_new && mix phx.new {app}','bun-elysia':'bun create elysia {app}',
};
const INSTALL={npm:'npm ci',pnpm:'pnpm install --frozen-lockfile',yarn:'yarn install --immutable',bun:'bun install --frozen-lockfile',pip:'pip install -r requirements.txt',poetry:'poetry install',uv:'uv sync --frozen',go:'go mod download',cargo:'cargo fetch',maven:'mvn -q dependency:resolve',gradle:'./gradlew dependencies',bundler:'bundle install',composer:'composer install --no-dev',dotnet:'dotnet restore'};
function scaffoldCmd(s, rs){
  const k=fwToKeys(s.fw), key=k.feKey!=='none'?k.feKey:k.beKey;
  let t=SCAFFOLD[key];
  if(!t){const g=LANG_GROUP[s.lang]||'nodejs'; t=SCAFFOLD[BE_LIST.find(x=>x.startsWith(g+'-'))]||SCAFFOLD['nodejs-express'];}
  t=t.replace(/\{app\}/g,s.fw.serviceSlug||'my-app');
  // bare npm-init templates follow the CHOSEN package manager — one tool, no mixed commands
  const pkg=(PKG_MAP[s.pkg]||s.pkg);
  if(/^(pnpm|yarn|bun)$/.test(pkg)){
    t=t.replace(/\bnpm init -y\b/g,pkg==='yarn'?'yarn init -y':pkg+' init')
       .replace(/\bnpm i -D\b/g,pkg==='yarn'?'yarn add -D':pkg+' add -D')
       .replace(/\bnpm i\b/g,pkg==='yarn'?'yarn add':pkg+' add');
  }
  return t;
}

export function commandsFor(s, rs){
  const app=s.fw.serviceSlug||'my-app', port=(s.tmpl&&s.tmpl.port)||'8080';
  const regMeta=(K.registries||[]).find(r=>r.id===(rs.registry||'ghcr'))||{};
  const regHost=regMeta.host||'ghcr.io/yarova-ca', regName=regMeta.name||'GHCR', regLogin=regMeta.login||'docker login';
  const stds=reqStds(s), shippedComp=(s.fw.shipped&&s.fw.shipped.shippedCompliance)||[], ba=(s.fw.shipped&&s.fw.shipped.buildArgs)||{};
  let rt=ba.RUNTIME||'alpine';
  for(const std of stds){const c=shippedComp.find(x=>x.standard===std); if(c&&c.buildArgs&&c.buildArgs.RUNTIME)rt=c.buildArgs.RUNTIME;}
  const tgt=rt==='fips'?'runtime-fips':'runtime';
  return {
    scaffold:[{label:'Scaffold the service',cmd:scaffoldCmd(s, rs),expect:'a new folder with the project files inside'}],
    deps:[{label:'Install dependencies (frozen lockfile)',cmd:INSTALL[(PKG_MAP[s.pkg]||s.pkg)]||'npm ci',expect:'packages install with zero version drift'}],
    docker:[{label:'Build the image',cmd:`docker build -t ${regHost}/${app}:dev --target ${tgt} .`,expect:'ends with: naming to '+regHost+'/'+app+':dev'},{label:'Run it locally',cmd:`docker run --rm -p ${port}:${port} ${regHost}/${app}:dev`,expect:'the app answers on http://localhost:'+port}],
    registry:[{label:'Log in to '+regName,cmd:regLogin,expect:'Login Succeeded'},{label:'Push the image',cmd:`docker push ${regHost}/${app}:$(git rev-parse --short HEAD)`,expect:'layers pushed; digest printed'},{label:'Sign it ('+(rs.signer||'cosign')+')',cmd:(rs.signer==='notation'?`notation sign ${regHost}/${app}@$DIGEST`:`cosign sign --yes ${regHost}/${app}@$DIGEST`),expect:'signature stored alongside the image'},{label:'Attach an SBOM ('+(rs.sbom||'syft')+')',cmd:(rs.sbom==='cdxgen'?'cdxgen -o sbom.cdx.json':rs.sbom==='trivy'?`trivy image --format spdx-json -o sbom.json ${regHost}/${app}:dev`:`syft ${regHost}/${app}:dev -o spdx-json > sbom.spdx.json`),expect:'an SBOM file — the ingredient list'}],
    gitops:[{label:'Helm — install / upgrade',cmd:`helm upgrade --install ${app} ./helm -n prod --create-namespace -f helm/values-prod.yaml`,expect:'STATUS: deployed'},{label:'Kustomize — render + apply',cmd:'kustomize build kustomize/overlays/prod | kubectl apply -f -',expect:'deployment.apps/'+app+' created'},{label:'Argo CD — register the app',cmd:`argocd app create ${app} --repo https://github.com/yarova-ca/${app}.git --path kustomize/overlays/prod --dest-server https://kubernetes.default.svc --dest-namespace prod --sync-policy automated`,expect:"application '"+app+"' created"}],
    cluster:[{label:'Point kubectl at the cluster',cmd:`kubectl config use-context ${s.cluster}`,expect:'Switched to context'},{label:'Verify the rollout',cmd:`kubectl rollout status deploy/${app} -n prod`,expect:'deployment "'+app+'" successfully rolled out'}],
  };
}

const FE_KEYS=new Set(['nextjs','react','vue','angular','svelte','nuxt','remix','react-vite','gatsby','vue-vite','astro','solid','solid-vite','qwik','tanstack','preact-vite','lit','redwood','fresh','mobile','mobile-expo']);
const BE_LIST=['nodejs-express','nodejs-fastify','nodejs-nest','nodejs-hono','nodejs-koa','python-fastapi','python-django','python-flask','python-litestar','python-starlette','java-spring','java-quarkus','java-micronaut','java-javalin','go-gin','go-echo','go-chi','go-stdlib','go-fiber','rust-axum','rust-actix','rust-rocket','rust-warp','ruby-rails','ruby-sinatra','php-laravel','php-symfony','php-slim','elixir-phoenix','elixir-live','kotlin-ktor','bun-elysia','deno-fresh-api','swift-vapor'];
const LANG_GROUP={ts:'nodejs',js:'nodejs',py:'python',go:'go',rust:'rust',java:'java',kotlin:'kotlin',php:'php',ruby:'ruby',elixir:'elixir',swift:'swift',csharp:'dotnet'};
function fwToKeys(fw){
  const short=(fw.id||'').replace(/^\d+-/,'');
  if(FE_KEYS.has(short))return{feKey:short,beKey:'none'};
  let be=BE_LIST.find(k=>k.split('-')[1]===short)||BE_LIST.find(k=>k.endsWith('-'+short));
  if(!be){const g=LANG_GROUP[fw.languageId]||'nodejs';be=BE_LIST.find(k=>k.startsWith(g+'-'))||'nodejs-express';}
  return{feKey:'none',beKey:be};
}

const PKG_MAP={gomod:'go'};
const REGIME_TO_COMP={'pci-dss-4':'pci','hipaa':'hipaa','fedramp-mod':'fedramp','fedramp-high':'fedramp','soc2-typeii':'soc2','gdpr':'gdpr','iso27001':'iso27001','cmmc-l2':'cmmc','nerc-cip':'nerccip','fips-140-3':'fedramp'};

function industryToCompliance(rq){
  if(!rq)return['none','none'];const ks=[];
  for(const id of (rq.requiredRegimeIds||[])){const c=REGIME_TO_COMP[id];if(c&&!ks.includes(c))ks.push(c);}
  return[ks[0]||'none',ks[1]||'none'];
}

export function buildConfig(s, rs){
  const k=fwToKeys(s.fw), comp=industryToCompliance(s.rq);
  return{feKey:k.feKey,beKey:k.beKey,ciKey:'github-actions',regKey:rs.registry||'ghcr',
    compliance:comp[0],compliance2:comp[1],industry:s.rq?s.rq.id:'',
    cd:'argocd',gitops:'same-repo',scanner:'trivy',signing:rs.signer||'cosign',sbom:rs.sbom||'syft',
    baseimage:s.base,pkgMgr:(PKG_MAP[s.pkg]||s.pkg),appName:s.fw.serviceSlug||s.fw.id,
    port:(s.tmpl&&s.tmpl.port)?String(s.tmpl.port):undefined};
}

export function genFiles(cfg){
  const safe=(fn)=>{try{const v=fn();return v==null?'':v;}catch(e){return '';}};
  return{
    dockerfile:safe(()=>GEN.generateDockerfile(cfg)),
    dockerignore:safe(()=>GEN.generateDockerIgnore(cfg)),
    prwf:safe(()=>GEN.generatePRWorkflow(cfg)),
    mainwf:safe(()=>GEN.generateMainWorkflow(cfg)),
    helm:safe(()=>GEN.generateHelmValues(cfg,'prod')),
    kbase:safe(()=>GEN.generateBaseKustomization(cfg)),
    kdeploy:safe(()=>GEN.generateBaseDeployment(cfg)),
    precommit:safe(()=>GEN.generatePreCommitConfig(cfg)),
    deploy:safe(()=>GEN.generateDeploy(cfg))||{},
  };
}

export function alertRulesYaml(s){
  const app=s.fw.serviceSlug||'app';
  return `# Prometheus alert rules — starter pack for ${app}
# Drop into your rule files; tune thresholds to your SLO.
groups:
- name: ${app}-golden-signals
  rules:
  - alert: HighErrorRate
    expr: sum(rate(http_requests_total{job="${app}",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="${app}"}[5m])) > 0.01
    for: 5m
    labels: {severity: page}
    annotations: {summary: ">1% of requests are failing for 5m"}
  - alert: HighLatencyP99
    expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job="${app}"}[5m])) by (le)) > 1
    for: 5m
    labels: {severity: page}
    annotations: {summary: "p99 latency above 1s for 5m"}
  - alert: PodCrashLooping
    expr: increase(kube_pod_container_status_restarts_total{namespace="prod",pod=~"${app}.*"}[10m]) > 3
    for: 0m
    labels: {severity: page}
    annotations: {summary: "pod restarting repeatedly"}
  - alert: DeploymentReplicasUnavailable
    expr: kube_deployment_status_replicas_unavailable{deployment="${app}",namespace="prod"} > 0
    for: 5m
    labels: {severity: ticket}
    annotations: {summary: "desired replicas not available for 5m"}
  - alert: PVCAlmostFull
    expr: kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes > 0.85
    for: 10m
    labels: {severity: ticket}
    annotations: {summary: "volume above 85% capacity"}
`;}
export function dashboardJson(s){
  const app=s.fw.serviceSlug||'app';
  const panel=(title,expr,x,y)=>({title,type:'timeseries',gridPos:{h:8,w:12,x,y},targets:[{expr,refId:'A'}]});
  return JSON.stringify({title:app+' — golden signals',uid:app+'-golden',tags:['yarova-studio','golden-signals'],time:{from:'now-6h',to:'now'},panels:[
    panel('Latency p99 (s)','histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job="'+app+'"}[5m])) by (le))',0,0),
    panel('Traffic (req/s)','sum(rate(http_requests_total{job="'+app+'"}[5m]))',12,0),
    panel('Errors (% 5xx)','100 * sum(rate(http_requests_total{job="'+app+'",status=~"5.."}[5m])) / sum(rate(http_requests_total{job="'+app+'"}[5m]))',0,8),
    panel('Saturation (CPU vs limit)','sum(rate(container_cpu_usage_seconds_total{pod=~"'+app+'.*"}[5m])) / sum(kube_pod_container_resource_limits{resource="cpu",pod=~"'+app+'.*"})',12,8)
  ]},null,2);}

export function firstSentence(t){t=stripTags(String(t||''));
  let i=-1,from=0;
  while(true){const j=t.indexOf('. ',from);if(j<0)break;
    const back=t.slice(Math.max(0,j-4),j+1);
    if(/(e\.g|i\.e|etc|vs|cf)\.$/.test(back)){from=j+2;continue;}
    i=j;break;}
  if(i>0&&i<150)return t.slice(0,i+1);
  if(t.length<=150)return t;
  const sp=t.lastIndexOf(' ',147);return t.slice(0,sp>60?sp:147)+'…';}


export function resolveStack(rs){
  const fw=fwById(rs.fw)||(G.nodes.frameworks||[])[0];
  const lang=fw.languageId;
  const rq=reqOfInd(rs.industry);
  const pkgList=pkgsFor(lang), pkgDef=LANG_DEFPKG[lang]||(pkgList[0]&&pkgList[0].id)||'npm';
  const pkg=rs.pkg||pkgDef;
  const btList=buildToolsFor(lang);
  const buildtool=rs.buildtool||(btList[0]&&btList[0].id)||null;
  const ormList=ormsFor(lang), ormDef=LANG_ORM[lang]||'orm-none';
  const orm=rs.orm||ormDef;
  const auth=rs.auth||(rq?.requiredAuthIds?.[0])||'auth-oauth2';
  const obs=rs.obs||(rq?.requiredObservabilityIds?.[0])||'observability-otel';
  const cluster=rs.cluster||(rq?.recommendedClusterIds?.[0])||'eks';
  const tmpl=(G.nodes.dockerfileTemplates||[]).find(t=>t.frameworkId===fw.id);
  let base,baseWhy,baseTag;
  if(rs.runtime){base=rs.runtime;baseWhy='Your choice of base image.';baseTag='you';}
  else if(rq?.recommendedRuntimeIds?.includes('fips')){base='fips';baseWhy=`${rq.name} requires FIPS-validated crypto — UBI9 FIPS base.`;baseTag='req';}
  else if(rq?.recommendedRuntimeIds?.length){base=rq.recommendedRuntimeIds[0];baseWhy=`${rq.name} recommends a ${base} base image.`;baseTag='req';}
  else{base=(G.nodes.runtimeDeep||[]).some(r=>r.id==='distroless')?'distroless':base;base=base||tmpl?.runtimeFrom||'distroless';baseWhy='Framework default base image.';baseTag='def';}
  const region=rs.region||'';
  return {fw,lang,rq,
    pkg,pkgUser:!!rs.pkg,pkgDef,pkgList,
    buildtool,btList,
    orm,ormUser:!!rs.orm,ormDef,ormList,
    auth,authUser:!!rs.auth,authReq:!!rq?.requiredAuthIds?.includes(auth),
    obs,obsUser:!!rs.obs,obsReq:!!rq?.requiredObservabilityIds?.includes(obs),
    cluster,clusterUser:!!rs.cluster,clusterReq:!!rq?.recommendedClusterIds?.includes(cluster),
    base,baseWhy,baseTag,tmpl,region,
    regimes:rq?.requiredRegimeIds||[],
    integ:rs.industry?(G.nodes.integrations||[]).filter(g=>g.verticalId===rs.industry):[]};
}

export function gOptions(axis, rs){
  const s=resolveStack(rs);
  if(axis==='industry')return (G.nodes.industryRequirements||[]).map(r=>({id:r.id,name:r.name,
    plain:(K.industryPlain||{})[r.id]||firstSentence((r.keyRisks||[])[0]||''),
    juri:juriLine(r)+`<div style="margin-top:6px"><b>the classic attack here:</b> ${esc(firstSentence((r.keyRisks||[])[0]||''))}</div>`,
    node:'industryRequirements', rec:false, req:false}));
  if(axis==='fw')return (G.nodes.frameworks||[]).map(f=>({id:f.id,name:f.name,
    plain:`${LANG_HUMAN[f.languageId]||f.languageId} · ${firstSentence(f.whenToUse||'')}`,
    node:'frameworks',rec:false}));
  if(axis==='pkg')return (G.nodes.pkgBuildDeep||[]).filter(p=>p.kind==='pkg-mgr'&&langMatch(p.language,s.lang)).map(p=>({id:p.id,name:p.name,
    plain:firstSentence(p.what||''),node:'pkgBuildDeep',rec:p.id===s.pkgDef}));
  if(axis==='auth'){const req=new Set(s.rq?.requiredAuthIds||[]);
    const recId=req.has('auth-all')?'auth-all':(s.rq?.requiredAuthIds||[])[0]||'auth-oidc';
    return [...(G.nodes.authDeep||[])].sort((a,b)=>(b.id===recId?2:(req.has(b.id)?1:0))-(a.id===recId?2:(req.has(a.id)?1:0)))
      .map(a=>({id:a.id,name:a.name,plain:oPlain('auth',a.id,firstSentence(a.what||'')),scope:oScope('auth',a.id),
        node:'authDeep',rec:a.id===recId,covered:req.has(a.id)&&a.id!==recId}));}
  if(axis==='orm')return ormsFor(s.lang).map(o=>({id:o.id,name:o.name,
    plain:oPlain('orm',o.id,firstSentence(o.what||'')),scope:oScope('orm',o.id),node:'ormDeep',rec:o.id===s.ormDef}));
  if(axis==='obs'){const req=new Set(s.rq?.requiredObservabilityIds||[]);
    const recId=(s.rq?.requiredObservabilityIds||[])[0]||'observability-otel';
    return [...(G.nodes.observabilityDeep||[])].sort((a,b)=>(b.id===recId?2:(req.has(b.id)?1:0))-(a.id===recId?2:(req.has(a.id)?1:0)))
      .map(o=>({id:o.id,name:o.name,plain:oPlain('obs',o.id,firstSentence(o.what||'')),scope:oScope('obs',o.id),
        node:'observabilityDeep',rec:o.id===recId,covered:req.has(o.id)&&o.id!==recId}));}
  if(axis==='runtime'){const req=new Set(s.rq?.recommendedRuntimeIds||[]);
    const recId=(s.rq?.recommendedRuntimeIds||[])[0]||'distroless';
    return [...(G.nodes.runtimeDeep||[])].sort((a,b)=>(b.id===recId?2:(req.has(b.id)?1:0))-(a.id===recId?2:(req.has(a.id)?1:0)))
      .map(r=>({id:r.id,name:r.name,plain:oPlain('runtime',r.id,r.baseOs||''),scope:oScope('runtime',r.id),
        node:'runtimeDeep',rec:r.id===recId,covered:req.has(r.id)&&r.id!==recId}));}
  if(axis==='registry')return (K.registries||[]).map(r=>({id:r.id,name:r.name,
    plain:r.pick||'',kjson:r,req:false,rec:r.id==='ghcr'}));
  if(axis==='signer')return (K.signers||[]).map(r=>({id:r.id,name:r.name,plain:r.pick||'',kjson:r,rec:r.id==='cosign'}));
  if(axis==='sbom')return (K.sbomTools||[]).map(r=>({id:r.id,name:r.name,plain:r.pick||'',kjson:r,rec:r.id==='syft'}));
  if(axis==='cluster'){const req=new Set(s.rq?.recommendedClusterIds||[]);
    const recId=(s.rq?.recommendedClusterIds||[])[0]||'eks';
    return [...(G.nodes.clusters||[])].sort((a,b)=>(b.id===recId?2:(req.has(b.id)?1:0))-(a.id===recId?2:(req.has(a.id)?1:0)))
      .map(c=>({id:c.id,name:c.name,plain:oPlain('cluster',c.id,c.cloud||''),scope:oScope('cluster',c.id),
        node:'clusters',rec:c.id===recId,covered:req.has(c.id)&&c.id!==recId}));}
  return [];
}

export const devOf=(f)=>{try{const d=f.device;return Array.isArray(d)?d[0]:String(d).replace(/[\[\]']/g,'');}catch(e){return ''}};
export function industryMatrixRows(kind, rs){
  return (G.nodes.industryRequirements||[]).map(r=>{
    let v='';
    if(kind==='regimes')v=(r.requiredRegimeIds||[]).length+' — '+(r.requiredRegimeIds||[]).slice(0,4).map(id=>nameById('complianceProfiles',id)).join(', ')+((r.requiredRegimeIds||[]).length>4?'…':'');
    if(kind==='auth')v=(r.requiredAuthIds||[]).map(id=>nameById('authDeep',id).split(' (')[0]).join(' · ');
    if(kind==='obs')v=(r.requiredObservabilityIds||[]).map(id=>nameById('observabilityDeep',id).split(' —')[0].split(' (')[0]).join(' · ');
    if(kind==='runtime')v=(r.recommendedRuntimeIds||[]).join(' · ');
    if(kind==='clusters')v=(r.recommendedClusterIds||[]).map(id=>nameById('clusters',id)).join(' · ');
    return {id:r.id,name:r.name,value:v||'—',sel:r.id===rs.industry};
  });
}

export const KFIELDS={
  pkgBuildDeep:[['what','what it is'],['lockfile','lockfile'],['speedNote','speed'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs'],['implementation','implementation']],
  runtimeDeep:[['what','what it is'],['baseOs','distro / kernel base'],['sizeMb','size (MB)'],['shell','shell'],['fipsCertified','FIPS validated'],['attackSurface','attack surface'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs'],['complianceFit','compliance fit'],['implementation','FROM line']],
  authDeep:[['what','what it is'],['howItWorks','how it works'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs'],['complianceFit','compliance fit'],['implementation','implementation']],
  observabilityDeep:[['what','what it is'],['pillars','pillars'],['cost','cost'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs'],['implementation','implementation']],
  ormDeep:[['what','what it is'],['typeSafety','type safety'],['perf','performance'],['migrations','migrations'],['whenToPick','pick when'],['whenNot','avoid when'],['tradeoffVs','trade-off vs'],['complianceNote','compliance note'],['implementation','implementation']],
  clusters:[['what','what it is'],['cloud','cloud'],['secretIdentity','workload identity'],['defaultStorageClass','storage class'],['tradeoff','trade-off'],['evidence','notes'],['whenToPick','pick when'],['whenNot','avoid when']],
  frameworks:[['renderingModes','rendering modes'],['hydration','hydration'],['runtimeTarget','runtime target'],['perf','performance'],['memory','memory'],['concurrency','concurrency'],['scaling','scaling'],['securityPosture','security posture'],['bundleSize','bundle size'],['ecosystem','ecosystem'],['whenToUse','when to use'],['whenNot','when NOT'],['tradeoff','trade-off'],['maintainedBy','maintained by'],['license','license'],['version','version']],
};

// ── Unified option model — ONE shape for every choosable thing, every surface ──
// Returns: {id,name,plain,scope,verdict,forYou,pickWhen,skipWhen,relevanceNote,detail,node}
// verdict: 'required' | 'recommended' | 'available' | 'irrelevant'
const AXIS_CFG={
  auth:    {node:'authDeep',           reqKey:'requiredAuthIds'},
  obs:     {node:'observabilityDeep',  reqKey:'requiredObservabilityIds'},
  runtime: {node:'runtimeDeep',        reqKey:'recommendedRuntimeIds'},
  cluster: {node:'clusters',           reqKey:'recommendedClusterIds'},
  orm:     {node:'ormDeep'},
  pkg:     {node:'pkgBuildDeep'},
  buildtool:{node:'pkgBuildDeep'},
  fw:      {node:'frameworks'},
  registry:{kjson:'registries', def:'ghcr'},
  signer:  {kjson:'signers',    def:'cosign'},
  sbom:    {kjson:'sbomTools',  def:'syft'},
};
const KJSON_DETAIL={
  registry:[['setup','setup'],['residency','data residency'],['host','registry host'],['login','login command']],
  signer:[['tradeoff','trade-off'],['command','command']],
  sbom:[['format','formats'],['command','command']],
};
const L2_KEYS=new Set(['what','whenToPick','whenNot','whenToUse','pick','avoid']);

function recIdFor(axis,s){
  const rq=s.rq;
  if(axis==='auth'){const req=new Set(rq?.requiredAuthIds||[]);return req.has('auth-all')?'auth-all':(rq?.requiredAuthIds||[])[0]||'auth-oidc';}
  if(axis==='obs')return (rq?.requiredObservabilityIds||[])[0]||'observability-otel';
  if(axis==='runtime')return (rq?.recommendedRuntimeIds||[])[0]||s.base||'distroless';
  if(axis==='cluster')return (rq?.recommendedClusterIds||[])[0]||'eks';
  if(axis==='orm')return s.ormDef;
  if(axis==='pkg')return s.pkgDef;
  if(axis==='buildtool')return (s.btList[0]&&s.btList[0].id)||null;
  if(AXIS_CFG[axis]?.def)return AXIS_CFG[axis].def;
  return null;
}
function langFitNote(axis,node,s){
  if(axis!=='orm'&&axis!=='pkg'&&axis!=='buildtool')return '';
  if(axis==='orm'&&node.id==='orm-none')return '';
  const human=LANG_HUMAN[s.lang]||s.lang;
  const langStr=node.language||(node.languages||[]).join('/')||'';
  return langMatch(langStr,s.lang)?` Works with ${human}.`:'';
}
export function optionModel(axis,id,rs,sIn){
  const s=sIn||resolveStack(rs);
  const cfg=AXIS_CFG[axis]||{};
  const rq=s.rq;
  let node,name,detail=[],pickWhen='',skipWhen='';
  if(cfg.kjson){
    node=(K[cfg.kjson]||[]).find(x=>x.id===id)||{};
    name=node.name||id;
    pickWhen=node.pick||''; skipWhen=(node.avoid&&node.avoid!=='—')?node.avoid:'';
    detail=(KJSON_DETAIL[axis]||[]).map(([k,l])=>[l,node[k]]).filter(([,v])=>v&&v!=='—');
  } else {
    node=find(cfg.node,id)||{};
    name=node.name||id;
    pickWhen=node.whenToPick||node.whenToUse||'';
    skipWhen=node.whenNot||'';
    detail=(KFIELDS[cfg.node]||[]).filter(([k])=>!L2_KEYS.has(k)).map(([k,l])=>[l,node[k]]).filter(([,v])=>v!=null&&v!=='');
  }
  let plain=oPlain(axis,id,'')||firstSentence(node.what||node.pick||node.whenToUse||'');
  const scope=oScope(axis,id);
  if(axis==='fw')plain=`${LANG_HUMAN[node.languageId]||node.languageId} · ${firstSentence(node.whenToUse||'')}`;

  const reqSet=new Set((cfg.reqKey&&rq?.[cfg.reqKey])||[]);
  const recId=recIdFor(axis,s);
  const relEntry=(K.relevance?.[axis]||{})[id];
  const multi=reqSet.size>1;
  // auth-all is the only TRUE superset bundle — it actually contains the other methods.
  // Every other multi list (obs/runtime/cluster, or auth without -all) is best-first ALTERNATIVES.
  const isBundle=multi&&recId==='auth-all'&&reqSet.has('auth-all');
  const recName=recId?(cfg.node?nameById(cfg.node,recId):recId).split(' (')[0]:'';
  // ONE option is the pick. Others in the rulebook read as "covered" (bundle) or "also a fit" (alternatives).
  let verdict='available';
  if(id===recId)verdict='recommended';
  else if(reqSet.has(id))verdict=isBundle?'covered':'alternative';
  else if(relEntry)verdict='irrelevant';

  const ind=rq?.name, fit=langFitNote(axis,node,s);
  let forYou;
  if(verdict==='recommended'){
    if(isBundle)forYou=`Pick this — it covers every rule ${ind} needs.${fit}`;
    else if(multi)forYou=`The strongest fit for ${ind}.${fit} → pick it.`;
    else if(reqSet.has(id))forYou=`${ind} requires this.${fit} → pick it.`;
    else forYou=ind?`Recommended for ${ind}.${fit}`:`A safe default for most builds.${fit}`;
  }
  else if(verdict==='covered')forYou=`Required by ${ind} — already inside the recommended pick.`;
  else if(verdict==='alternative')forYou=`Also accepted for ${ind} — ${recName} is the stronger default.${fit}`;
  else if(verdict==='irrelevant')forYou=relEntry.note;
  else forYou=ind?`Allowed — ${ind} doesn't require it.${fit}`:`Pick an industry to see if this is required.${fit}`;

  return {id,name,plain,scope,verdict,forYou,pickWhen,skipWhen,
    relevanceNote:verdict==='irrelevant'?relEntry.note:'',detail,node:cfg.node||null};
}
export const STAGES_BUILD=[
  ['who','1 · Who it’s for','#19C8A8'],
  ['fw','2 · Framework','#21CAA1'],
  ['scaffold','3 · Scaffold','#2ACD9A'],
  ['app','4 · Write the app','#33CF93'],
  ['local','5 · Local loop','#3CD18C'],
  ['image','6 · Containerize','#45D385'],
  ['pr','7 · PR gate','#4ED67E'],
  ['main','8 · Build → registry','#58D877'],
  ['declare','9 · Declare deploy','#62DA70'],
  ['cluster','10 · GitOps → cluster','#6CDC69'],
  ['observe','11 · Run + observe','#77DF62'],
  ['connect','12 · Connect','#82E15B'],
  ['signoff','13 · Sign-off','#8DE354'],
  ['update','14 · Update loop','#98E64E'],
  ['upgrade','15 · Upgrade','#A3E847'],
  ['protect','16 · Protect','#AEEA41'],
  ['respond','17 · Respond','#B9EC3B'],
  ['evolve','18 · Evolve & retire','#C6F24E'],
];
