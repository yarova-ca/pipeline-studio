# Canada Industry Schema

**What this covers:** Canada-specific variant of 06-industry-schema — all 73 industries mapped to Canadian regulators, compliance laws, and geographic hubs.

**When to read:** When a pipeline is configured for a Canadian customer or any industry in a Canadian jurisdiction.

---

## Relationship to 06-industry-schema

06 defines the global schema.

This doc applies that schema to Canada.

Column names are identical.
Column values use Canadian law, Canadian regulators, and Canadian data classifications.

---

## Scope

| Dimension | Count |
|---|---|
| Industries | 73 |
| Verticals | 16 (same as 06) |
| Provinces/territories | 13 |
| Major industry hubs | 14 |
| Columns per row | 10 |

---

## Provinces and Territories

| Code | Jurisdiction | Type | Primary privacy regulator |
|---|---|---|---|
| BC | British Columbia | Province | OIPC BC — BC PIPA + FOIPPA |
| AB | Alberta | Province | OIPC AB — AB PIPA + FOIP |
| SK | Saskatchewan | Province | OIPC SK — HIPA + LAFOIP |
| MB | Manitoba | Province | OIPC MB — PHIA + FIPPA |
| ON | Ontario | Province | IPC Ontario — PHIPA + MFIPPA |
| QC | Quebec | Province | CAI — Law 25 + LPRPSP |
| NB | New Brunswick | Province | OIPC NB — PPIPNB + RTIPNB |
| NS | Nova Scotia | Province | OIPC NS — PIIDPA + FOIPOP |
| PE | Prince Edward Island | Province | OIPC PEI — FOIPP |
| NL | Newfoundland & Labrador | Province | OIPC NL — ATIPPA |
| YT | Yukon | Territory | OIPC YT — ATIPP Act |
| NT | Northwest Territories | Territory | ATIPP NWT — ATIPP Act |
| NU | Nunavut | Territory | ATIPP Nunavut — ATIPP Act |

---

## Major Industry Hubs

| Hub | Province | Specialization |
|---|---|---|
| Toronto | ON | Fintech, AI, enterprise tech, healthcare |
| Waterloo Region | ON | AI, quantum computing, cybersecurity, SaaS |
| Ottawa | ON | Federal gov tech, defense, cybersecurity |
| Kingston | ON | Defense research, academia |
| Montreal | QC | AI/ML, aerospace, gaming, fintech |
| Quebec City | QC | Insurance, government tech |
| Halifax | NS | Ocean tech, defense, cybersecurity |
| Fredericton | NB | Cybersecurity, government SaaS |
| Vancouver | BC | Tech, film/VFX, green energy, biotech |
| Victoria | BC | Government tech, defense, ocean science |
| Calgary | AB | Energy tech, fintech, cleantech |
| Edmonton | AB | AI, health tech, energy |
| Saskatoon | SK | AgriTech, biotech, nuclear tech |
| Winnipeg | MB | Aerospace, agriculture, manufacturing |

---

## Column Schema (Canadian Variant)

Same 10 columns as 06.

Values use Canadian sources in every column.

| # | Column | What it captures (Canadian context) |
|---|---|---|
| 1 | Industry | Name of the industry |
| 2 | Vertical | Parent group — same 16 verticals as 06 |
| 3 | Mandatory compliance | Canadian laws: PIPEDA, OSFI, FINTRAC, Health Canada, CRTC, CNSC, etc. |
| 4 | Optional compliance | Best-practice standards: SOC 2, ISO 27001, CSA STAR |
| 5 | Regulator | Canadian authority: OSFI, OPC, CRTC, Health Canada, CNSC, etc. |
| 6 | Data sensitivity | Canadian classifications: PII, PHI, PCI, Protected A/B/C, Secret, OCAP® |
| 7 | Pipeline stages affected | Stages that get extra controls for this industry |
| 8 | Framework notes | Canadian-specific restrictions or requirements |
| 9 | Key security requirements | Top security requirements for this industry in Canada |
| 10 | Audit requirements | Canadian retention periods and audit trail obligations |

---

## Canadian-Specific Tags

Tags appear in column 3 (Mandatory compliance) and column 6 (Data sensitivity).

| Tag | Meaning |
|---|---|
| GC PBMM | Federal cloud workload requires Protected B, Medium Integrity, Medium Availability |
| Protected B | Data classification Protected B or above under Government of Canada standards |
| Secret | Data classification Secret or Top Secret |
| OCAP® | First Nations data sovereignty — Ownership, Control, Access, Possession principles apply |

---

## Key Canadian Laws Referenced

| Law / Standard | Regulator | Sector |
|---|---|---|
| PIPEDA | OPC | Privacy — federal baseline |
| Law 25 (QC) | CAI | Privacy — Quebec, stricter than PIPEDA |
| BC PIPA | OIPC BC | Privacy — BC private sector |
| PHIPA | IPC Ontario | Health privacy — Ontario |
| Privacy Act | OPC | Federal government personal data |
| Bank Act | OSFI | Banking |
| PCMLTFA | FINTRAC | AML/ATF |
| CASL | CRTC | Anti-spam |
| Telecommunications Act | CRTC | Telecom/broadcast |
| Broadcasting Act | CRTC | Broadcast |
| Online Streaming Act (C-11) | CRTC | Streaming platforms |
| Online News Act (C-18) | Heritage Canada | News publishers |
| AIDA (Bill C-27) | ISED (proposed) | AI systems |
| Nuclear Safety and Control Act | CNSC | Nuclear |
| Railway Safety Act | Transport Canada | Rail |
| Safe Food for Canadians Act | CFIA | Food safety |
| ITSG-33 | TBS/CCCS | Federal IT security |
| GC PBMM | TBS | Federal cloud |
| Security of Information Act | DND/CSE | Defense/intelligence |
| OCAP® principles | FNIGC | Indigenous data sovereignty |

---

## Industry List by Vertical

### Financial Services (8)
1. Retail Banking
2. Investment Banking
3. Life Insurance
4. P&C Insurance
5. Asset Management
6. Fintech & Neobanks
7. Credit Unions
8. Payments Processing

### Healthcare & Life Sciences (8)
9. Hospitals & Health Systems
10. Provincial Health Insurance
11. Pharmaceutical
12. Biotech & Life Sciences Research
13. Medical Devices
14. Clinical Diagnostics & Labs
15. Telehealth & Digital Health
16. Long-term Care & Home Care

### Government & Public Sector (6)
17. Federal Government
18. Provincial Government
19. Municipal Government
20. Crown Corporations
21. Public Safety & Law Enforcement
22. Justice & Courts

### Defense & Intelligence (5)
23. Canadian Armed Forces
24. CSE (Signals Intelligence)
25. CSIS (Domestic Intelligence)
26. Defense Contractors
27. DRDC (Defence Research)

### Energy & Environment (6)
28. Oil & Gas (Upstream)
29. Pipelines & Midstream
30. Electricity & Utilities
31. Nuclear Energy
32. Renewables & Cleantech
33. Mining & Resources

### Technology (5)
34. Software & SaaS
35. AI & ML Platforms
36. Cloud Services
37. Cybersecurity
38. Hardware & Semiconductor

### Telecommunications (4)
39. Wireless Carriers (MNO)
40. Internet Service Providers
41. Broadcasting & Cable
42. Satellite Communications

### Retail & Commerce (3)
43. Grocery & Food Retail
44. E-Commerce & Marketplace
45. General Retail

### Manufacturing & Industrial (4)
46. Automotive Manufacturing
47. Aerospace & Aviation
48. Food Processing & Manufacturing
49. Industrial Equipment & Heavy Mfg

### Media & Entertainment (4)
50. Broadcasting (TV & Radio)
51. Video Gaming
52. Film & TV Production
53. Digital Media & Publishing

### Education (3)
54. Universities & Research
55. K-12 Schools
56. Online Learning & EdTech

### Transportation & Logistics (5)
57. Air Transport
58. Rail Transport
59. Trucking & Logistics
60. Marine, Ports & Shipping
61. Urban & Public Transit

### Real Estate & Construction (3)
62. Residential Real Estate
63. Commercial Real Estate
64. Property Management

### Agriculture (3)
65. Crop Farming & Grain
66. Livestock & Aquaculture
67. AgriTech & Precision Ag

### Legal & Professional Services (3)
68. Law Firms
69. Accounting, Audit & Tax
70. Management Consulting

### Non-profit & Social (3)
71. Registered Charities
72. Healthcare Charities
73. Indigenous Community Services

---

## Example Row — Hospitals & Health Systems

| Column | Value |
|---|---|
| Industry | Hospitals & Health Systems |
| Vertical | Healthcare & Life Sciences |
| Mandatory compliance | PHIPA (ON) · HIA (AB) · PIPA (BC) · Provincial equivalents · Health Canada |
| Optional compliance | SOC 2 · ISO 27001 · CAN/CIOSC 103-1 |
| Regulator | Provincial health ministries · provincial OIPCs |
| Data sensitivity | PHI · PII |
| Pipeline stages affected | Build · SAST · DAST · Sign · Deploy · Monitor |
| Framework notes | Data must stay within the province for patient records. PHIPA (ON) is the most stringent provincial law. Federal hospitals follow PIPEDA additionally. |
| Key security requirements | PHI encryption at rest and in transit · access controls per circle of care · breach notification within 24 hr (PHIPA) · medical device integration security |
| Audit requirements | Patient records 10 yr · Breach log indefinitely · Access logs 2 yr |
