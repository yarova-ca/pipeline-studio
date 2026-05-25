// Compliance control → pipeline invariants that satisfy it. Used by the
// Compliance Why panel's coverage table. v1 had this in raw JS; here it's
// typed against ComplianceKey + InvariantId, so a stale reference is a
// compile error.

import type { ComplianceKey, ComplianceControl } from './types';

export const COMPLIANCE_CONTROL_MAP: Partial<Record<ComplianceKey, ComplianceControl[]>> = {
  pci: [
    { control: '6.4.4', title: 'Secure software development (SAST)',           satisfiedBy: ['I-4'] },
    { control: '6.5',   title: 'Common coding vulnerabilities addressed',     satisfiedBy: ['I-4'] },
    { control: '6.3.2', title: 'Inventory of all software components',        satisfiedBy: ['I-8', 'I-10'] },
    { control: '11.3',  title: 'Vulnerability scans',                         satisfiedBy: ['I-3', 'I-19'] },
    { control: '11.5',  title: 'Detect changes to critical files',            satisfiedBy: ['I-8', 'I-10', 'I-16'] },
    { control: '8.6.3', title: 'Strong cryptography for keys',                satisfiedBy: ['I-1', 'I-18'] }
  ],
  hipaa: [
    { control: '164.312(a)',     title: 'Access control',         satisfiedBy: ['I-1', 'I-18', 'I-17'] },
    { control: '164.312(c)',     title: 'Integrity controls',     satisfiedBy: ['I-8', 'I-10', 'I-16'] },
    { control: '164.312(e)',     title: 'Transmission security',  satisfiedBy: ['I-7', 'I-13'] },
    { control: '164.308(a)(1)',  title: 'Risk analysis',          satisfiedBy: ['I-3', 'I-4', 'I-5'] },
    { control: '164.308(a)(8)',  title: 'Evaluation',             satisfiedBy: ['I-9', 'I-19'] }
  ],
  soc2: [
    { control: 'CC6.1', title: 'Logical access controls',         satisfiedBy: ['I-1', 'I-18', 'I-17'] },
    { control: 'CC6.6', title: 'Encryption of data in transit',   satisfiedBy: ['I-13'] },
    { control: 'CC7.1', title: 'Detection of vulnerabilities',    satisfiedBy: ['I-3', 'I-4', 'I-5', 'I-19'] },
    { control: 'CC7.2', title: 'Detection of anomalies',          satisfiedBy: ['I-6', 'I-8', 'I-16'] },
    { control: 'CC8.1', title: 'Change management',               satisfiedBy: ['I-2', 'I-15', 'I-17', 'I-14'] }
  ],
  fedramp: [
    { control: 'AC-2',  title: 'Account management',              satisfiedBy: ['I-1', 'I-18'] },
    { control: 'CM-3',  title: 'Configuration change control',    satisfiedBy: ['I-2', 'I-15'] },
    { control: 'RA-5',  title: 'Vulnerability scanning',          satisfiedBy: ['I-3', 'I-19'] },
    { control: 'SI-2',  title: 'Flaw remediation',                satisfiedBy: ['I-3', 'I-19'] },
    { control: 'SI-7',  title: 'Software / firmware integrity',   satisfiedBy: ['I-8', 'I-10', 'I-16'] },
    { control: 'SC-13', title: 'Cryptographic protection',        satisfiedBy: ['I-1', 'I-13', 'I-18'] }
  ],
  gdpr: [
    { control: 'Art. 25', title: 'Data protection by design',     satisfiedBy: ['I-4', 'I-5', 'I-6'] },
    { control: 'Art. 32', title: 'Security of processing',        satisfiedBy: ['I-3', 'I-7', 'I-8'] }
  ],
  iso27001: [
    { control: 'A.8.25', title: 'Secure development lifecycle',   satisfiedBy: ['I-2', 'I-4', 'I-9'] },
    { control: 'A.8.28', title: 'Secure coding',                  satisfiedBy: ['I-4', 'I-5'] },
    { control: 'A.8.30', title: 'Outsourced development',         satisfiedBy: ['I-14', 'I-15', 'I-17'] },
    { control: 'A.5.23', title: 'Information security for cloud', satisfiedBy: ['I-1', 'I-13', 'I-18'] }
  ],
  cmmc: [
    { control: 'AC.L2-3.1.1',  title: 'Limit access to authorized users',     satisfiedBy: ['I-1', 'I-17', 'I-18'] },
    { control: 'CM.L2-3.4.3',  title: 'Track changes to system',              satisfiedBy: ['I-2', 'I-15'] },
    { control: 'SI.L2-3.14.1', title: 'Identify + correct flaws',             satisfiedBy: ['I-3', 'I-19'] },
    { control: 'SI.L2-3.14.2', title: 'Protection from malicious code',       satisfiedBy: ['I-4', 'I-6', 'I-8'] }
  ]
};
