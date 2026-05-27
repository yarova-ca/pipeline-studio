# Industry Schema

## How industries connect to other catalogs

Framework catalog → industry does NOT restrict frameworks.
Any framework runs in any industry.
Exception: compliance may require FIPS-140-2 — affects some runtimes.

Pipeline tool catalog → industry DOES change the pipeline.
Industry → auto-selects compliance standard.
Compliance → adds extra controls at specific pipeline stages.
Those stages generate different files with those controls included.

---

## Columns — every industry table row

| Column | What it captures |
|---|---|
| Industry | Name |
| Vertical | Parent group |
| Mandatory compliance | Legally required standards |
| Optional compliance | Best practice standards |
| Regulatory body | Who enforces the rules |
| Data sensitivity | PII / PHI / PCI / Classified / Public |
| Pipeline stages affected | Which stages get extra controls |
| Framework notes | Any compliance-driven framework restrictions |
| Key security requirements | Top requirements specific to this industry |
| Audit requirements | Log retention period, audit trail needs |

---

## Industries — complete list in order

### Financial Services
1. Banking — Retail / Commercial / Investment
2. Fintech / Payments
3. Insurance
4. Capital Markets / Trading
5. Wealth Management
6. Cryptocurrency / Web3
7. Lending / Credit

### Healthcare & Life Sciences
8. Healthcare / Hospitals
9. Health Insurance / Payers
10. Pharma / Biotech
11. Medical Devices
12. Mental Health / Telehealth
13. Clinical Research / CRO

### Government & Public Sector
14. Federal Government
15. State / Local Government
16. Public Safety / Law Enforcement
17. Justice / Courts

### Defense & Intelligence
18. Defense / Military
19. Aerospace
20. Intelligence / National Security
21. Space

### Energy & Environment
22. Oil & Gas
23. Utilities / Power Grid
24. Renewables / CleanTech
25. Nuclear
26. Water / Wastewater
27. Mining

### Technology
28. SaaS / Cloud Software
29. AI / ML Platforms
30. Cybersecurity
31. Semiconductor / Hardware
32. Developer Tools / Platforms

### Telecommunications
33. Telecom / Carriers
34. Satellite
35. ISP / Broadband
36. 5G / Wireless

### Retail & Commerce
37. Retail / E-commerce
38. Supply Chain / Logistics
39. Wholesale / Distribution
40. Food & Beverage
41. Fashion / Apparel

### Manufacturing & Industrial
42. Automotive
43. Electronics / Consumer Hardware
44. Industrial / Heavy Manufacturing
45. Chemical
46. Pharma Manufacturing

### Media & Entertainment
47. Media / Publishing
48. Gaming
49. Streaming / OTT
50. Social Media
51. Sports / Events
52. Music

### Education
53. K-12
54. Higher Education
55. EdTech / Online Learning
56. Corporate Training

### Transportation & Logistics
57. Airlines / Aviation
58. Shipping / Maritime
59. Rail
60. Trucking / Fleet
61. Ride-sharing / Mobility
62. Last-mile Delivery

### Real Estate & Construction
63. Commercial Real Estate
64. Residential Real Estate
65. PropTech
66. Construction / Engineering

### Agriculture
67. AgTech
68. Food Production
69. Precision Agriculture

### Legal & Professional Services
70. Legal / LegalTech
71. Consulting
72. Accounting / Audit

### Non-profit & Social
73. Non-profit / NGO
74. Social Enterprise

---

## Example row — Healthcare / Hospitals

| Column | Value |
|---|---|
| Industry | Healthcare / Hospitals |
| Vertical | Healthcare & Life Sciences |
| Mandatory compliance | HIPAA |
| Optional compliance | HITRUST, SOC 2, ISO 27001 |
| Regulatory body | HHS / OCR |
| Data sensitivity | PHI (Protected Health Information) |
| Pipeline stages affected | Secrets scan, Container scan, Sign, SBOM generate + attest, DAST |
| Framework notes | None — all frameworks permitted |
| Key security requirements | PHI encryption at rest + transit, audit logs, BAA required |
| Audit requirements | 6-year log retention minimum |
