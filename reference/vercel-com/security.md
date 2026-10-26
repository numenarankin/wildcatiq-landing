---
source: https://vercel.com/security
fetched: 2026-10-26
note: FAQ question text is rendered in accordion triggers that the capture flattened; questions below are reconstructed from the answers and the page summary
---

# Vercel - Security product page reference

## Structure
- Umbrella product page with three anchored sub-sections, about 9 sections: hero, 3-card jump nav (Vercel Firewall / Web Application Firewall / Workspace Security, each with anchor links), "Trusted by security teams" logo strip, Firewall block (3 sub-features plus a live dashboard mockup), BotID block with a 9-line code sample, WAF block (Managed Rulesets, Custom WAF Rules), Workspace Security block (4 controls), compliance badge row, 16-question FAQ accordion, closing CTA with a trial offer.
- Depth: each sub-feature is a bold one-liner plus one sentence; the FAQ is where the substance lives (certifications, encryption, backups, pen testing, subprocessors, bug bounty), with answers of 1 to 5 sentences.
- Copy to screenshots: 22 images plus a large inline firewall dashboard mockup (traffic counts, alerts, rules); about 50% copy.
- Uses anchor jump-nav, a code block, and an accordion FAQ; no tabs.
- Hand-off: "Learn more" to /security/web-application-firewall and /botid, "Add WAF rules now" to a template, docs links per control (team access, deployment protection, audit log, directory sync), security.vercel.com trust portal.

## Title and meta
- Title: Security - Vercel
- Meta description: Vercel is trusted by the best enterprise teams with dynamic, transparent, and customizable security.

## Hero
- Headline: Security that scales with you.
- Subhead: Purpose-built for secure development, Vercel allows you to build, deploy, and protect applications with our suite of security features.
- CTA: Get a Demo
- Jump cards: Vercel Firewall: Resilient edge protection (#infrastructure-security); Web Application Firewall: Secure application traffic (#application-security); Workspace Security: Trusted access management (#workspace-security)
- Logo strip: Trusted by security teams.

## Section: Vercel Firewall. Automatic protections. Free for all users.
- The Vercel Firewall provides system-wide protections to secure your apps at scale.
- Links: Read the Vercel Firewall docs; Visit your firewall
- Global protection: Edge-localized protection. L3/L4 protection at every edge location. Your site stays protected without adding latency.
- DDoS mitigation: Automatic DDoS Mitigation for all plans. Embedded bot management and protection against traffic abuse.
- Challenge Mode: Protect your site when under attack. Prevent malicious traffic by showing a verification challenge for visitors in real-time.
- Dashboard mockup: Firewall is active, All systems normal; Bot Protection Active; All Traffic 1.0M, Allowed 950.8k, Denied 3.0k, Challenged 15.0k, Logged 45.0k; Alerts (DDoS Attack 3h ago resolved, 5h ago active); Rules (Log Next.js prefetch infinite loop 2.0M, Log-only /api 473.0k, DDoS Mitigation 288.7k, Log-only / 112.0k); example rules "Challenge user agents that look like bots", "Deny traffic from Germany"

## Section: BotID. The invisible bot detection engine.
- BotID is fast, reliable, and built for both your users and developers. No CAPTCHAs, API keys, or fine-tuning required.
- Code sample: import { checkBotId } from 'botid/server'; const { isBot } = await checkBotId(); if (isBot) return 403 "Access Denied"; else 200 "Success!"
- CTA: Learn more (/botid)

## Section: Web Application Firewall. Customized application security. Instantly deployed at scale.
- Vercel's Web Application Firewall allows customers to create custom rules to log, block, challenge, or rate limit L7 traffic.
- CTAs: Learn more (/security/web-application-firewall), Add WAF rules now (/templates/vercel-firewall)
- Utilize our observability dashboard to make informed security decisions. (tabs in mockup: Observability, Managed Rulesets, Custom WAF Rules; Challenge mode / Configure)
- Managed Rulesets: Activate Vercel's managed rulesets to protect against top priority risks, including OWASP Top 10.
- Custom WAF Rules: Create and enforce rules unique to your business with IP blocking, rate limiting, and more.

## Section: Workspace Security. Right access. Right roles.
- Protect deployments and workspaces with workspace security controls. Link: Read about secure team access
- Role-based Access Control: Assign roles to give team members the permissions they need to work on your projects.
- Deployment Protection: Secure your Vercel project's preview and production URLs with fine-grained access control.
- Audit Logs (Enterprise): Track and analyze your team members' activity. Accessed by team members with the owner role.
- Directory Sync (Enterprise): Manage your organization's memberships by integrating with third-party identity providers.

## Section: Compliance badges
- ISO 27001, SOC 2, PCI DSS, HIPAA, GDPR, DPF

## Section: Frequently asked questions. (16 items)
- DDoS protection: Yes. Vercel Enterprise customers are covered by two forms of DDoS protection. Our systems can automatically detect and block malicious attacks on customer sites. For significantly larger, distributed attacks, we work closely with the customer to ensure your site(s) stay online. The combination of automated prevention and direct communication from Vercel Support or your Vercel account representative helps ensure your site is resilient to attacks.
- SOC 2: Yes, Vercel has a SOC 2 Type 2 attestation. Contact us for more details or to access the report.
- GDPR / EU data: Yes. For more information, see our Privacy Policy. No data is stored permanently inside EU regions. Static assets and Serverless Functions responses can be cached in EU regions, but it is ephemeral. Vercel provides a Data Processing Addendum (DPA) which describe our Technical and Organizational Security Measures.
- ISO 27001: Yes, Vercel is ISO 27001:2022 certified.
- TISAX: Yes, Vercel has completed TISAX Assessment Level 2 to serve the automotive industry. Customers can access results directly through the ENX portal. Assessment ID: AMR06H-1; Scope ID: SYN3TM.
- DPF: Yes, Vercel is certified under the DPF. Our public listing is available at dataprivacyframework.gov/list.
- HIPAA: Vercel supports HIPAA compliance for enterprise customers. Our HIPAA report is available upon request at security.vercel.com.
- PCI: Yes, Vercel has a SAQ-D Attestation of Compliance for Service Providers and a SAQ-A Attestation of Compliance for Merchants based on PCI DSS v4.0.
- Deployment protection: Yes. Vercel offers flexible access options. Any plan has access to Deployment Protection which include Vercel Authentication and Shareable Links (Hobby plan limited to 1 link per account), and Deployment Protection Exceptions. Pro and Enterprise teams can also require a password to view a deployment with Password Protection.
- Encryption: Yes. Data is encrypted at rest (AES-256) and in transit (HTTPS / TLS), including sensitive information like access tokens and secrets.
- Backups: Yes. Our current backup interval is every two hours and each backup is persisted for 30 days. Automatic backups are taken without affecting the performance or availability of the database operations. All the backups are stored separately in a storage service, and those backups are globally replicated for resiliency against regional disasters. If a database instance is deleted, all associated backups are also automatically deleted. Backups are periodically tested by the Vercel engineering team.
- Infrastructure: The Vercel CDN & deployment platform primarily uses Amazon Web Services (AWS). In the case of an AWS outage, our network is resilient to regional downtime. Vercel will automatically route traffic to the nearest available edge.
- Segregation: Enterprise Teams on Vercel have their own build infrastructure ensuring isolation from Hobby/Pro accounts on Vercel.
- Penetration testing: Yes. Vercel conducts regular penetration testing with third-party experts. In addition to our annual penetration tests, we consistently perform targeted assessments on an ongoing basis. We also implement daily code reviews, static analysis checks, and dependency scanning at the code level. Our cloud security posture management platform (CSPM) facilitates workload vulnerability scanning. Pro and Enterprise customers can request access to our latest annual penetration testing reports.
- Subprocessors: Yes, a list of our current subprocessors can be found on our subprocessors page.
- Bug bounty: Yes. Vercel has a public HackerOne bug bounty program that rewards researchers for finding and reporting security vulnerabilities.
- OWASP Top 10: Yes. Vercel offers managed rulesets, including one specifically designed to protect against the OWASP Top 10 risks. This feature is available on Enterprise plans.

## Closing CTA
- Ready to deploy? Start building with a free account. Speak to an expert for your Pro or Enterprise needs. CTAs: Start Deploying, Talk to an Expert
- Trial Vercel with higher execution, increased app bandwidth, Speed Insights, team features, and more. CTA: Request a Trial

## Social proof
- Logo strip ("Trusted by security teams."), 6 compliance badges. No quotes or stats.

## Cross-links
- Body: /security/web-application-firewall, /botid, /templates/vercel-firewall, /docs/vercel-firewall, /docs/vercel-firewall/ddos-mitigation, /docs/attack-challenge-mode, /docs/accounts/team-members-and-roles, /docs/security/secure-team-access, /docs/security/deployment-protection, /docs/observability/audit-log, /docs/security/directory-sync, /docs/security, /docs/cdn, /legal/privacy-notice, /legal/dpa, security.vercel.com, hackerone.com/vercel.
- Footer: full Vercel product footer (Security column: WAF, Bot Management, BotID).
