#!/usr/bin/env python3
"""Phase E — seed the integrations dimension.

NET-NEW: no legacy/source data exists for integrations. Everything here is
realistic-but-seeded and marked sourceType=net-new in provenance, so the founder
audits/corrects it. Replace with real data when a source is provided.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
N = os.path.join(ROOT, "web", "graph", "nodes")
PROV = os.path.join(ROOT, "web", "graph", "provenance")

GATEWAYS = [
    {"id": "kong", "name": "Kong", "kind": "api-gateway", "notes": "OSS + enterprise; plugin auth, rate limiting, mTLS."},
    {"id": "apigee", "name": "Google Apigee", "kind": "api-gateway", "notes": "Enterprise API mgmt; OAuth2, quotas, analytics."},
    {"id": "aws-api-gateway", "name": "AWS API Gateway", "kind": "api-gateway", "notes": "Managed; IAM/Cognito auth, WAF, usage plans."},
    {"id": "azure-apim", "name": "Azure API Management", "kind": "api-gateway", "notes": "Managed; AAD/OAuth2, products, policies."},
    {"id": "nginx-gateway", "name": "NGINX Gateway", "kind": "api-gateway", "notes": "Ingress-level; JWT auth, mTLS, rate limit."},
]

# vertical id -> list of integrations (externalSystem, category, auth, gateway, tools, dataFlow)
SEED = {
    "financial-services": [
        ("Salesforce Financial Services Cloud", "CRM", "oauth2", "apigee", ["MuleSoft", "Salesforce Connect"], "customer + KYC records"),
        ("Plaid", "open-banking", "oauth2", "apigee", ["Plaid Link", "webhooks"], "account + transaction data"),
        ("Interac e-Transfer", "payments", "mtls", "kong", ["ISO 20022", "webhooks"], "payment instructions"),
        ("Temenos / Finastra core banking", "core-banking", "mtls", "kong", ["ISO 8583", "ISO 20022"], "ledger + accounts"),
    ],
    "healthcare-and-life-sciences": [
        ("Epic / Cerner EHR", "EHR", "oauth2", "kong", ["SMART on FHIR", "HL7v2", "FHIR R4"], "patient records (PHI)"),
        ("Health Gateway (BC)", "patient-portal", "oidc", "kong", ["FHIR R4"], "immunization + labs"),
        ("DICOM imaging (PACS)", "imaging", "mtls", "nginx-gateway", ["DICOMweb"], "medical images"),
    ],
    "government-and-public-sector": [
        ("Sign-In Canada / GCKey", "identity", "oidc", "azure-apim", ["SAML 2.0", "OIDC"], "citizen identity assertions"),
        ("ServiceNow", "ITSM", "oauth2", "azure-apim", ["REST", "MID server"], "case + service records"),
        ("Canada Post / GC Notify", "messaging", "apikey", "azure-apim", ["REST"], "notifications"),
    ],
    "defense-and-intelligence": [
        ("DND identity (PKI/CAC)", "identity", "mtls", "kong", ["x.509", "PKI"], "personnel credentials"),
        ("SIEM (Splunk/Elastic)", "security", "apikey", "kong", ["syslog", "CEF"], "audit + telemetry"),
    ],
    "energy-and-environment": [
        ("OSIsoft PI / AVEVA", "scada-historian", "mtls", "kong", ["OPC-UA"], "grid telemetry"),
        ("Salesforce Energy & Utilities Cloud", "CRM", "oauth2", "apigee", ["MuleSoft"], "customer + meter data"),
    ],
    "technology": [
        ("Salesforce / HubSpot CRM", "CRM", "oauth2", "aws-api-gateway", ["REST", "webhooks"], "leads + accounts"),
        ("Stripe", "payments", "apikey", "aws-api-gateway", ["REST", "webhooks"], "billing + subscriptions"),
        ("Segment / Snowflake", "analytics", "oauth2", "aws-api-gateway", ["REST", "CDC"], "product events"),
    ],
    "telecommunications": [
        ("Amdocs / Netcracker BSS", "billing", "mtls", "apigee", ["TMF Open API"], "subscriber + billing"),
        ("Salesforce Communications Cloud", "CRM", "oauth2", "apigee", ["MuleSoft"], "customer records"),
    ],
    "retail-and-commerce": [
        ("Shopify", "ecommerce", "oauth2", "aws-api-gateway", ["REST", "GraphQL", "webhooks"], "orders + catalog"),
        ("Stripe / Adyen", "payments", "apikey", "aws-api-gateway", ["REST", "webhooks"], "payments (PCI)"),
        ("SAP / Oracle ERP", "ERP", "oauth2", "azure-apim", ["OData", "IDoc"], "inventory + fulfillment"),
    ],
    "manufacturing-and-industrial": [
        ("SAP S/4HANA ERP", "ERP", "oauth2", "azure-apim", ["OData", "IDoc"], "production + supply chain"),
        ("MES (Siemens Opcenter)", "mes", "mtls", "kong", ["OPC-UA", "MQTT"], "shop-floor telemetry"),
    ],
    "media-and-entertainment": [
        ("Salesforce Marketing Cloud", "CRM", "oauth2", "aws-api-gateway", ["REST"], "audience + campaigns"),
        ("Stripe / Recurly", "payments", "apikey", "aws-api-gateway", ["REST", "webhooks"], "subscriptions"),
    ],
    "education": [
        ("Canvas / Brightspace LMS", "LMS", "oauth2", "azure-apim", ["LTI 1.3", "REST"], "courses + grades"),
        ("Ellucian / PeopleSoft SIS", "SIS", "oauth2", "azure-apim", ["REST", "SOAP"], "student records"),
    ],
    "transportation-and-logistics": [
        ("Project44 / FourKites", "visibility", "apikey", "aws-api-gateway", ["REST", "EDI"], "shipment tracking"),
        ("SAP TM / Oracle OTM", "TMS", "oauth2", "azure-apim", ["OData", "EDI"], "freight + routing"),
    ],
    "real-estate-and-construction": [
        ("Procore", "construction-mgmt", "oauth2", "aws-api-gateway", ["REST", "webhooks"], "projects + RFIs"),
        ("Yardi / MRI", "property-mgmt", "oauth2", "azure-apim", ["REST", "SOAP"], "leases + tenants"),
    ],
    "agriculture": [
        ("John Deere Operations Center", "farm-mgmt", "oauth2", "aws-api-gateway", ["REST"], "field + machine data"),
        ("Climate FieldView", "precision-ag", "oauth2", "aws-api-gateway", ["REST"], "agronomic data"),
    ],
    "legal-and-professional-services": [
        ("Salesforce / Clio", "CRM-practice", "oauth2", "aws-api-gateway", ["REST"], "matters + clients"),
        ("DocuSign", "e-signature", "oauth2", "aws-api-gateway", ["REST", "webhooks"], "signed documents"),
    ],
    "non-profit-and-social": [
        ("Salesforce Nonprofit Cloud", "CRM", "oauth2", "aws-api-gateway", ["REST"], "donors + programs"),
        ("Stripe / Blackbaud", "donations", "apikey", "aws-api-gateway", ["REST", "webhooks"], "donations"),
    ],
}


def main():
    integrations, prov = [], {}
    for vid, items in SEED.items():
        for (system, cat, auth, gw, tools, flow) in items:
            iid = re.sub(r"[^a-z0-9]+", "-", f"{vid}-{system}".lower()).strip("-")
            integrations.append({
                "id": iid, "name": system, "label": system, "category": cat,
                "verticalId": vid, "externalSystem": system, "authOption": auth,
                "apiGateway": gw, "tools": tools, "dataFlow": flow, "sourceType": "net-new",
            })
            prov[f"integrations.json#{iid}"] = {
                "source": "seeded — no legacy source exists for integrations",
                "sourceType": "net-new", "confidence": "low"}

    json.dump(integrations, open(os.path.join(N, "integrations.json"), "w"), indent=2)
    json.dump(GATEWAYS, open(os.path.join(N, "apiGateways.json"), "w"), indent=2)
    for g in GATEWAYS:
        prov[f"apiGateways.json#{g['id']}"] = {"source": "seeded common gateways", "sourceType": "net-new", "confidence": "medium"}
    json.dump(prov, open(os.path.join(PROV, "integrations.json"), "w"), indent=2)
    print(f"integrations: {len(integrations)} across {len(SEED)} verticals")
    print(f"apiGateways: {len(GATEWAYS)}")


if __name__ == "__main__":
    main()
