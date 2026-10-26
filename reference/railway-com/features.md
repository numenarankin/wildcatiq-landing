---
source: https://railway.com/features
fetched: 2026-10-26
note: the requested single-feature URLs (/deployments, /observability, /networking, /databases, /functions) return 404; this page is Railway's one consolidated feature catalog and the homepage pillars link here
---

# Railway - Platform features page reference

## Structure
- One long feature catalog, 8 sections: hero (H1 + one-line subhead), six pillar sections (Build and deploy, Network and connect, Scale and grow, Monitor and observe, Evolve and collaborate, Security and compliance), a 4-quote "Trusted by the best in business" strip, and a closing CTA. Each pillar is a grid of 4 to 8 feature cards; every card is a feature name, one explanatory sentence, and 2 to 3 spec chips (numbers, limits, supported options), with an icon image.
- Depth: uniform and shallow per feature, deep in aggregate: 36 feature cards, each with hard specs (5 TB volumes, 100,000+ IOPS, 48 vCPU per replica, 50 replicas, 90-day log retention, 4 regions, 2,000+ templates). One italic footnote per pillar adds a platform-level fact (Railpack/Dockerfile, edge encryption, enterprise vCPU ceiling, enterprise tier unlocks).
- Copy to screenshots: 64 icon images, no product screenshots; essentially all copy.
- No tabs, no accordion, no FAQ. Hand-off: footnotes link to railpack.com; the nav (Product / Developers / Enterprise / Company / Pricing) and footer (Features, Mobile app, Pricing, Agents, Sandboxes, Changelog, Templates) carry cross-links; feature cards are not individually linked.

## Title and meta
- Title: Features | Railway
- Meta description: Railway brings an unparalleled developer experience to infrastructure. Let's tour the features.

## Hero
- Headline: Platform features
- Subhead: Railway brings an unparalleled developer experience to infrastructure. Let's tour the features.

## Section: Build and deploy
- Services: Deploy any container image as a service, just specify the source. (Docker image, GitHub repository, Local repository)
- Databases: Spin-up any database, with built-in backups. (PostgreSQL, MySQL, MongoDB, Redis)
- Volumes: Attach and mount high-performance persistent storage volumes. (Up to 5 TB of storage, 100,000+ IOPS, Disk usage metrics)
- Cron jobs: Configure a job to run on a fixed schedule. (Atomic to 5-minute intervals, Programmable via crontab expression)
- Templates: Deploy arbitrarily complex collections of services, databases, etc. (2,000+ templates, Sharable, Customizable)
- Variables: Manage secrets and environment variables across the stack. (Service variables, Shared variables, Reference variables)
- Footnote: Railway uses Railpack or your Dockerfile to build and deploy your code.

## Section: Network and connect
- Public networking: Expose your application to the public internet. (Up to 10 Gbps of transfer speed, Free Railway domain for all services)
- Private networking: Connect colocated services securely with high-speed internal networking. (Up to 100 Gbps of transfer speed, Multiple IPv6 protocols)
- TCP proxy: Send traffic to services that don't support HTTP. (L4 load balancing support, Configurable port)
- Custom domains: Use the domain of your choice for your application. (Support for wildcard domains, Unlimited custom domains)
- X.509 certificate management: Managed TLS certificate creation for all domains. (3-click setup, Automatic renewal)
- HTTP proxy: Terminates TLS close to your users and protects your app. (L4 and L7 load balancing support, DDoS protections)
- Footnote: Railway automatically encrypts all traffic from the edge to your applications.

## Section: Scale and grow
- Vertical scaling: Scale-up CPU and Memory automatically based on workload. (Up to 48 vCPU per replica, Up to 48 GB Memory per replica)
- Horizontal scaling: Add machines to handle more traffic and workloads smoothly. (Up to 50 replicas per service, Automatic load balancing)
- Global scaling: Deploy your application to any of 4 regions around the world. (United States (East, West), Europe (West), Southeast Asia)
- Footnote: Enterprise class users can configure up to 2,400 vCPU and 2.4 TB Memory per service.

## Section: Monitor and observe
- Build / deploy logs: Filter, query, forward, and share build and deployment logs. (Retention up to 90 days, Support for JSON structured logs)
- Configurable dashboards: Monitor and set alerts for resource usage and performance. (CPU, RAM, disk, network; Drag-and-drop customization)
- Distributed tracing: Follow requests from Railway's edge through every service. (Automatic instrumentation, Works with any OpenTelemetry SDK)
- Healthcheck endpoint: Customize how Railway determines deployments. (Custom configuration, Configurable timeouts)
- Usage limits: Set limits to manage resource spend on Railway. (Hard and soft limits, Email alerts)
- Configurable alerts: Get notified when metrics cross a threshold. (Emails, Slack, Discord, webhooks; Low urgency, high urgency)

## Section: Evolve and collaborate
- Environments: Isolate the entire stack and introduce changes safely. (Unlimited environments, Selective deployments, Sync and stage changes)
- PR environments: Temporary environments that tear down when merged. (Automatic create and delete, GitHub branch deploys, Preview deploys)
- Rollbacks: Revert a deployment with a single click. (Restore previous successful state, Redeploy or restart, Configurable restart policy)
- API: Connect with the same API that powers the Railway console. (100+ methods, Powered by GraphQL)
- CLI: Orchestrate applications from the command line. (25+ commands, Powered by Rust)
- Config as code: Manage configuration easily from a TOML or JSON file. (Upstream UI settings, Manage deployments)

## Section: Security and compliance
- SSO: Single sign-on authentication for seamless team access. (SAML authentication, Team management)
- Audit logs: Track all changes and user actions with comprehensive audit logs. (User activity tracking, Event history)
- Bring your own cloud: Deploy Railway within your existing security-hardened cloud environment. (Deploy in your VPC, Use cloud credits)
- Zero-trust networking: Secure private networking with zero-trust principles. (Encrypted connections, No manual firewall configuration)
- Support SLOs: Exceptional support for reliable uptime and performance. (24/7 support, Contractual SLAs)
- Dedicated VMs: Isolated cloud burst resources in any public cloud region. (Resource isolation, Dedicated hosts)
- Footnote: Enterprise tier unlocks SSO, audit logs, BYOC, and dedicated VMs.

## Section: Trusted by the best in business
- Paul O'Carroll, Founder & CEO at Arcol: "Railway is where we host all of our backend services along with our databases. It's been an integral part of our infrastructure since the very beginning."
- Daniel Lobaton, CTO at G2X: "G2X is mission critical for several thousand users. We handle 5M requests/day, spiking at 6000 RPM, with ease on Railway."
- Kartik Aggarwal, Tech Lead at Bilt: "Railway was the fastest, essentially giving us the most seamless, no config system. We just connected to our GitHub project and then Railpack automatically identified Node.js projects."
- Gordon MacMaster, Founding Engineer at Vendora: "We spent 13 hours trying to get our backend up in Vercel, and on Railway we deployed in 5 minutes."

## Closing CTA
- Ready to get started? Join 2M+ developers deploying applications on Railway

## Social proof
- 4 named customer quotes; "2M+ developers" stat; no logo wall.

## Cross-links
- Body: railpack.com.
- Nav: Product, Developers, Enterprise, Company, Pricing. Footer product column: Features, Mobile app (/mobile), Pricing, Agents (/agents), Sandboxes (/sandboxes), Changelog, Templates (/deploy), Template kickback; Compare: Heroku (/heroku), Render, Fly.io, Vercel (docs comparisons).
