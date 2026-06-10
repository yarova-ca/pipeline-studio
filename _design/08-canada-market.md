# 08 — Canada Market Navigation

**What this covers:** 5 new market columns, 3 new sections, and all supporting data for 07-canada-schema.html.
**When to read:** Before adding market columns to 07-canada-schema.html, or before building any of the 3 new market sections.

---

## 1. Purpose

This document holds the design and real data for the market navigation expansion.

The expansion adds 5 new columns to the existing 73-industry table.
The expansion adds 3 new sections below the main table.

Three new sections:

- City × Vertical heatmap (14 hubs × 16 verticals)
- Certification ROI by vertical
- Immigration & credential pathway

No new taxonomy is invented.
All hubs, verticals, and regulators reuse names from 07-canada-schema.html.

---

## 2. Column Definitions — All 5 New Market Columns

### Column 3 — Primary Hubs

**What it holds:** Which of the 14 named hubs concentrate this industry.

Format: `Hub (T1), Hub (T2)` — T-tier references Column 4 definitions.

**Decision:** Use hub names from the existing 14-hub table in 07-canada-schema.html.

Rejected: Free-text city names not in the hub table.
Why rejected: Inconsistency creates lookup failures across the two tables.

Tradeoff accepted: Smaller cities outside the 14-hub list are excluded.
When no named hub applies: cell value is `–`.

---

### Column 4 — Employer Concentration

**What it holds:** Tier rating (T1–T4) describing who dominates hiring.

| Tier | Definition | Examples |
|---|---|---|
| T1 | 3+ major national or global employers active | RBC, Google, DND, Loblaws |
| T2 | 1–2 major employers plus an active SME cluster | One anchor + companies under 1,000 staff |
| T3 | SME-dominated — no single employer dominates | Mostly companies under 500 staff |
| T4 | Government-only or near-government market | Crown corps, DND, DFO, RCMP only |

Source: PSPC vendor lists, CBRE Scoring Tech Talent Canada 2025.
Last verified: May 2026.

---

### Column 5 — Talent Demand Signal

**What it holds:** Directional demand for DevSecOps-adjacent roles in this industry.

| Signal | Definition | Threshold |
|---|---|---|
| Hot | Postings growing >15% YoY. Active competition for candidates. | >15% YoY growth |
| Warm | Postings steady. Hiring ongoing, no shortage pressure. | 5–15% YoY growth |
| Flat | Postings stable. Replacement hiring only. | <5% change YoY |
| Declining | Postings falling. Contractions or offshoring underway. | Negative YoY |

Source: Job Bank Canada (NOC 21220, 21231), Robert Half Canada 2026 Hiring Intentions Report.
Last verified: May 2026.

Cybersecurity postings nationally: 2,448 unique positions, March 2025 – February 2026.
Cybersecurity posting growth in major Canadian cities: +18–22% YoY.
Source: Canadian Cybersecurity Network report, cybersecurityinfinity.com, May 2026.

---

### Column 6 — Median Wage Band (CA$)

**What it holds:** Annual salary range for DevSecOps-adjacent roles, mid-level only.

Mid-level definition: 3–7 years of experience.
Why mid-level only: Mid-level is the primary active hiring tier for DevSecOps roles in Canada.

| Level | National range | Source |
|---|---|---|
| Entry (0–2 yr) | CA$55k–CA$70k | Robert Half Canada 2026 |
| Mid (3–7 yr) | CA$80k–CA$120k | Robert Half Canada 2026 |
| Senior (8+ yr) | CA$120k–CA$180k | Robert Half Canada 2026 |

City adjustments (mid-level, relative to national average):

- Toronto: +8–15% above national average.
- Vancouver: +5–12% above national average.
- Montreal: At national average or slightly below.
- Calgary: At national average.
- Ottawa: At national average.

Source: Robert Half Canada 2026 IT & Tech Salary Guide.
Source: Glassdoor CA — Cloud Security Engineer, Toronto — CA$113,449 average (January 2026).
Last verified: May 2026.

---

### Column 7 — Entry Difficulty

**What it holds:** A 1–5 score for how hard it is to land a first DevSecOps-adjacent role.

| Score | Label | What drives it |
|---|---|---|
| 1 | Very easy | High junior role volume, no clearance, high employer count |
| 2 | Easy | Active junior hiring, competition low, clearance not required |
| 3 | Moderate | Mix of junior and senior postings, some specialization required |
| 4 | Hard | Mostly senior postings, high competition, or clearance required |
| 5 | Very hard | <5% of postings are junior, clearance mandatory, or tiny market |

Source: Job Bank Canada entry-role share data.
Last verified: May 2026.

Key data point: Entry-level cybersecurity roles = 5.4% of all security postings.
Period: March 2025 – February 2026.
Source: Canadian Cybersecurity Network.

When a vertical is cybersecurity-heavy: score is 4 or 5.
When a vertical is DevOps-heavy with less security: score is 2 or 3.

---

## 3. Employer Concentration Tier Definitions — Full Detail

### T1 — 3+ Major National or Global Employers Active

Definition: At least 3 employers with 1,000+ Canadian staff hire in this industry.
Pattern: Large enterprise DevSecOps teams, formal security programs, clearance often required.

Examples by vertical:

- Financial Services: RBC, TD, BMO, Scotiabank, CIBC, Desjardins.
- Technology: Google Canada, Microsoft, Amazon, Shopify, Telus Digital.
- Government & Public Sector: DND, SSC, CRA, CBSA, ESDC.

### T2 — 1–2 Major Employers Plus an SME Cluster

Definition: One or two large anchors, plus 5–15 active mid-size employers.
Pattern: Strong job concentration around one employer, but alternatives exist.

Examples:

- Energy (Calgary): Enbridge, TC Energy as anchors; many mid-size operators.
- Defence (Ottawa): L3Harris, Thales, DRS as anchors; DND primes as SME clients.

### T3 — SME-Dominated

Definition: No single employer accounts for >20% of postings.
Pattern: Fragmented market, contract work common, generalist skills valued.

Examples:

- Legal & Professional Services.
- Agriculture & Food.
- Non-Profit & Associations.

### T4 — Government-Only or Near-Government

Definition: >80% of roles are federal, provincial, or Crown corporation.
Pattern: Security clearance often required. No private sector competition for same roles.

Examples:

- Defence (Kingston): RMC, DND Kingston as near-sole employers.
- Federal Government IT: SSC, GC departments only.

---

## 4. Worked Example — AI & ML Platforms

Industry: AI & ML Platforms
Vertical: Technology & Software

All 15 data columns shown.

| Column | # | Value |
|---|---|---|
| Industry | 1 | AI & ML Platforms |
| Vertical | 2 | Technology & Software |
| Primary hubs | 3 | Toronto (T1), Montréal (T1), Vancouver (T2), Waterloo (T2) |
| Employer concentration | 4 | T1 — Google Brain CA, Microsoft, Amazon, Shopify, Mila-cluster employers |
| Talent demand | 5 | Hot — cybersecurity + AI postings grew 18–22% YoY in major cities |
| Median wage band | 6 | CA$100k–CA$155k — Toronto/Montréal above national average |
| Entry difficulty | 7 | 4 — mostly senior postings, very high competition, no clearance |
| Mandatory compliance (CA) | 8 | PIPEDA · CPPA (Bill C-27 — proceeding) · CSE AI guidelines |
| Optional compliance | 9 | ISO 42001 · NIST AI RMF |
| Regulator (CA) | 10 | OPC · ISED |
| Data sensitivity | 11 | PII · Training data sets · Model weights |
| Framework notes | 12 | AIDA lapsed April 2025. CPPA in Parliament. ISO 42001 de facto standard for AI governance. |
| Pipeline stages affected | 13 | SCA, SAST, Secrets scan, Container scan, Sign, SBOM + attest, DAST |
| Key security requirements | 14 | Model supply chain integrity · Training data provenance · Inference API hardening |
| Audit requirements | 15 | 7-year logging (PIPEDA breach records). Model version audit trail mandatory. |

**Wage source:** Robert Half Canada 2026 (mid-level CA$80k–120k national) + Glassdoor CA (Toronto cloud security CA$113k avg, Jan 2026). Toronto and Montréal AI sector applies above-national premium per CBRE 2025.

**Demand source:** Canadian Cybersecurity Network, Robert Half Canada 2026 Hiring Intentions.

**Employer source:** Vector Institute, Mila, kovasys.com 2026 talent map.

Last verified: May 2026.

---

## 5. Hub × Vertical Heatmap

**What this section is:** A 14-hub × 16-vertical concentration table.

H = High — 3+ major employers, strong job density.
M = Medium — 1–2 major employers or active SME cluster.
L = Low — minimal presence, few postings.

| Hub | FinSvc | Health | Gov | Def | Energy | Tech | Telecom | Retail | Mfg | Media | Edu | Trans | RE | Agri | Legal | NPO |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Toronto | H | H | M | L | L | H | H | H | M | H | H | H | H | L | H | M |
| Waterloo | L | L | L | L | L | H | M | L | L | L | H | L | L | L | L | L |
| Ottawa | M | M | H | H | L | H | H | L | L | M | H | M | L | L | H | H |
| Kingston | L | L | M | H | L | L | L | L | L | L | M | L | L | L | L | L |
| Montréal | H | M | M | H | L | H | M | M | H | H | H | M | M | L | M | M |
| Quebec City | H | M | H | L | L | M | M | M | L | L | M | L | M | L | M | M |
| Halifax | L | M | H | H | M | M | M | L | L | L | M | H | L | L | M | M |
| Fredericton | L | L | H | L | L | M | L | L | L | L | M | L | L | L | L | M |
| Vancouver | M | H | M | M | M | H | M | H | L | H | H | H | H | L | M | M |
| Victoria | L | L | H | H | L | M | L | L | L | L | M | M | M | L | L | M |
| Calgary | M | M | M | L | H | M | M | M | M | L | M | H | H | H | M | L |
| Edmonton | L | H | H | L | H | M | L | L | H | L | H | M | M | M | L | M |
| Saskatoon | L | L | M | L | M | L | L | L | M | L | H | L | L | H | L | L |
| Winnipeg | L | M | M | M | L | L | M | M | H | L | M | H | L | H | L | M |

Column abbreviations:

| Abbrev | Full vertical name |
|---|---|
| FinSvc | Financial Services |
| Health | Healthcare |
| Gov | Government & Public Sector |
| Def | Defence & Intelligence |
| Energy | Energy & Utilities |
| Tech | Technology & Software |
| Telecom | Telecommunications |
| Retail | Retail & E-Commerce |
| Mfg | Manufacturing |
| Media | Media & Entertainment |
| Edu | Education |
| Trans | Transportation & Logistics |
| RE | Real Estate & Property |
| Agri | Agriculture & Food |
| Legal | Legal & Professional Services |
| NPO | Non-Profit & Associations |

Source: CBRE Scoring Tech Talent: Canada 2025, hub specialization data from 07-canada-schema.html.
Source: investcanada.ca, kovasys.com 2026 talent map.
Last verified: May 2026.

---

## 6. Certification ROI by Vertical

**What this section is:** Which certifications pay off most per vertical.

**Confidence note:** No verified Canadian government or recruiter study publishes cert-specific salary premiums by province as of May 2026. All premium estimates below are derived from recruiter reports, job posting salary differentials, and industry sources. Each row is marked with confidence level.

| Cert | Full name | Top verticals | Estimated CA$ premium | Confidence |
|---|---|---|---|---|
| CISSP | Certified Information Systems Security Professional | Finance, Gov, Defence, Health | +CA$15k–25k | Estimated |
| CCSP | Certified Cloud Security Professional | Tech, Finance, Health | +CA$10k–18k | Estimated |
| AWS Security Specialty | AWS Certified Security – Specialty | Tech, Finance, Retail | +CA$8k–15k | Estimated |
| AZ-500 | Microsoft Azure Security Engineer Associate | Gov (GC Azure), Tech | +CA$8k–12k | Estimated |
| CKS | Certified Kubernetes Security Specialist | Tech, Finance | +CA$12k–20k | Estimated |
| CISA | Certified Information Systems Auditor | Finance, Health, Gov | +CA$10k–18k | Estimated |
| OSCP | Offensive Security Certified Professional | Defence, Gov, Finance | +CA$15k–25k | Estimated |
| PCI DSS QSA | Payment Card Industry Qualified Security Assessor | Finance, Retail | +CA$20k–35k | Estimated |

**GC PBMM clarification:**

GC PBMM (Government of Canada Protected B, Medium integrity, Medium availability) is not a personal certification.
GC PBMM is a cloud architecture compliance framework.
When GC PBMM applies: it is a prerequisite for federal cloud contracts — not a credential an individual holds.
No salary premium applies to individuals for GC PBMM knowledge alone.

---

## 7. Immigration & Credential Pathway

### NOC Codes for DevSecOps Roles

| NOC Code | Title | Use when |
|---|---|---|
| 21220 | Cybersecurity Specialists | Role is 70%+ security focus (SOC, CISO, security analyst) |
| 21231 | Software Engineers and Designers | Role is DevSecOps, DevOps Engineer, Cloud Engineer |

Source: Statistics Canada NOC 2021 Version 1.0.
Source: ESDC NOC Explorer (noc.esdc.gc.ca).
Last verified: May 2026.

Primary code for DevSecOps: 21231.
When role tilts to security-primary over engineering: use 21220.

TEER level for both codes: TEER 1.
TEER 1 (Training, Education, Experience, and Responsibilities — level 1) means university degree required.

---

### Express Entry

| Draw type | Recent CRS cut-off | Notes |
|---|---|---|
| General (all programs) | 805 | Draw held May 25, 2026 |
| STEM category-based | 462–510 | 2025 range; category draws are primary tech pathway |

Source: IRCC Express Entry draw results, moving2canada.com.
Last verified: May 25, 2026.

**Job offer CRS points:**

Status as of March 2025: Job offer CRS points removed from the system.
Status as of March 13, 2026: IRCC announced plans to reintroduce job offer points.
Status as of May 2026: Reintroduction not yet in effect.

When applying via STEM category draw: CRS requirement is 462–510.
When applying via general draw: CRS requirement is 786–805.
Difference: ~300 CRS points lower via STEM category.
STEM category is the primary pathway for Canadian tech immigration as of May 2026.

---

### Provincial Nominee Programs (PNP)

Total PNP nominations in 2026: 91,500.
This is a 66% increase from 55,000 in 2025.
Why: Largest single-year PNP expansion in program history — federal immigration target increase.

Source: canxglobal.com, gofarglobal.com.
Last verified: May 2026.

| Province | Stream name | Processing time | Key constraint |
|---|---|---|---|
| BC | BC Tech Pilot | 2–3 months | 29 eligible tech occupations only. Draws held most Tuesdays. |
| Alberta | Accelerated Tech Pathway | ~1 month | Fastest processing in Canada as of May 2026. |
| Ontario | Employer Job Offer streams | 4–6 months | Express Entry-linked OINP streams suspended throughout 2025 and into 2026. |
| Saskatchewan | Priority sector nominations | Varies | Tech added as priority sector in 2026. 50% of provincial nominations reserved for 7 sectors. |

Source: immigcanada.com, libertyimmigration.ca, canxglobal.com.
Last verified: May 2026.

BC Tech Pilot processing time: 2–3 months (provincial stage only).
Why faster: Pilot stream has dedicated processing separate from general BC PNP queue.

Alberta Accelerated Tech Pathway: ~1 month.
Why faster: Alberta's accelerated stream bypasses standard provincial queue entirely.

Ontario OINP Express Entry streams: Suspended.
When OINP Express Entry streams suspended: Candidates must use Employer Job Offer streams instead.
When using Employer Job Offer: An Ontario employer must provide a qualifying job offer first.

---

## 8. Column Reordering Plan for 07-canada-schema.html

Current state: 10 data columns (c0 = index, c1–c10 = data).
Proposed state: 15 data columns (c0 = index, c1–c15 = data).

| New # | Column name | Status | Was |
|---|---|---|---|
| 0 | # (row index) | Existing — no change | c0 |
| 1 | Industry | Existing — no change | c1 |
| 2 | Vertical | Existing — no change | c2 |
| 3 | Primary hubs | New — market column | — |
| 4 | Employer concentration | New — market column | — |
| 5 | Talent demand signal | New — market column | — |
| 6 | Median wage band (CA$) | New — market column | — |
| 7 | Entry difficulty | New — market column | — |
| 8 | Mandatory compliance (CA) | Existing — moved | c3 |
| 9 | Optional compliance | Existing — moved | c4 |
| 10 | Regulator (CA) | Existing — moved | c5 |
| 11 | Data sensitivity | Existing — moved | c6 |
| 12 | Framework notes | Existing — moved | c8 |
| 13 | Pipeline stages affected | Existing — moved | c7 |
| 14 | Key security requirements | Existing — moved | c9 |
| 15 | Audit requirements | Existing — moved | c10 |

Page-meta line in 07-canada-schema.html currently reads: `10 columns per row`.
After implementation: update to `15 columns per row`.

Column definitions legend in 07-canada-schema.html: update from 10 entries to 15.

---

## 9. Data Sources

| Source | What it covers | Last verified |
|---|---|---|
| Robert Half Canada 2026 IT & Tech Salary Guide | Entry, mid, senior salary bands by role | May 2026 |
| Glassdoor CA — Cloud Security Engineer, Toronto | Toronto-specific avg: CA$113,449 | January 2026 |
| cybersecurityinfinity.com — 2026 Market Insights | City wage bands, demand trends | May 2026 |
| Job Bank Canada — NOC 21220, 21231 | Job prospects 2024–2033, posting volumes | May 2026 |
| Canadian Cybersecurity Network | 2,448 postings tracked Mar 2025–Feb 2026 | May 2026 |
| CBRE Scoring Tech Talent: Canada 2025 | Hub concentration, workforce size by city | May 2026 |
| kovasys.com — 2026 Talent Map | Largest tech hubs, North America ranking | May 2026 |
| IRCC Express Entry draw results | CRS cut-offs, STEM category ranges | May 25, 2026 |
| StatCan NOC 2021 v1.0 | NOC code definitions and TEER levels | May 2026 |
| canxglobal.com, gofarglobal.com | PNP 2026 allocation totals | May 2026 |
| immigcanada.com, libertyimmigration.ca | BC/AB/ON/SK PNP stream details | May 2026 |

**What is not in this document:**

- LinkedIn job count snapshots — stale within weeks.
- Individual company salary data (e.g., Google CA internal bands) — company data ≠ market data.
- IRCC points estimates for specific profiles — IRCC changes quarterly.
- NOC code tables inside 07-canada-schema.html main table — lives in this section only.
