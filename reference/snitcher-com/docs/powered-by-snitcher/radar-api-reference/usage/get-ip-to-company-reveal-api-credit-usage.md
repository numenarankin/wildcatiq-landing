> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Get IP-to-Company (Reveal API) credit usage

> Returns billable IP-to-Company usage for the current billing cycle, per tracking script. A unit is a distinct successful (HTTP 200) de-anonymisation deduped per (tracking script, monthly window) — the exact figure billing charges a credit for. Operators reconcile this per cycle to know which lookups were billed.



## OpenAPI

````yaml https://app.snitcher.com/api/radar/docs?api-radar-docs.json get /radar/operator/v1/company/usage
openapi: 3.0.0
info:
  title: Radar API
  description: ''
  contact:
    email: info@snitcher.com
  version: 1.0.0
servers:
  - url: https://api.snitcher.com
    description: Production API
security: []
tags:
  - name: Tracking scripts
    description: Endpoints for tracking scripts
  - name: Company
    description: Endpoints for companies
  - name: Usage
    description: Endpoints for tracking script usage
  - name: Webhooks
    description: Endpoints for webhook settings
paths:
  /radar/operator/v1/company/usage:
    get:
      tags:
        - Usage
      summary: Get IP-to-Company (Reveal API) credit usage
      description: >-
        Returns billable IP-to-Company usage for the current billing cycle, per
        tracking script. A unit is a distinct successful (HTTP 200)
        de-anonymisation deduped per (tracking script, monthly window) — the
        exact figure billing charges a credit for. Operators reconcile this per
        cycle to know which lookups were billed.
      operationId: d090c9837ca90404efd04f45a188deff
      responses:
        '200':
          description: Usage data retrieved successfully
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    properties:
                      usageCycleFrom:
                        type: string
                        format: date-time
                        example: '2023-01-01T00:00:00+00:00'
                      usageCycleTo:
                        type: string
                        format: date-time
                        example: '2023-12-31T23:59:59+00:00'
                      revealUsage:
                        description: Total billed IP-to-Company credits this cycle
                        type: integer
                        example: 12345
                      trackingScriptUsages:
                        description: Billed IP-to-Company credits per tracking script
                        type: array
                        items:
                          properties:
                            trackingScriptId:
                              type: string
                              example: ro_abc123
                            revealUsage:
                              type: integer
                              example: 5678
                          type: object
                    type: object
                type: object
        '403':
          description: Workspace has no active Reveal API plan
      security:
        - Snitcher bearer token: []
components:
  securitySchemes:
    Snitcher bearer token:
      type: http
      description: Enter your personal access token (PAT) to authenticate
      bearerFormat: JWT
      scheme: bearer

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.