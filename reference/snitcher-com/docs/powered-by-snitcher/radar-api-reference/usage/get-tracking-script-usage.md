> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Get tracking script usage

> Returns usage data for tracking scripts in the workspace



## OpenAPI

````yaml https://app.snitcher.com/api/radar/docs?api-radar-docs.json get /radar/operator/v1/usage
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
  /radar/operator/v1/usage:
    get:
      tags:
        - Usage
      summary: Get tracking script usage
      description: Returns usage data for tracking scripts in the workspace
      operationId: 85826461a124aa9e3380bcc85a1d0bcf
      parameters:
        - name: date
          in: query
          description: >-
            Optional date (Y-m-d) to get usage for the cycle active on that
            date. If not provided, returns usage for the current cycle.
          required: false
          schema:
            type: string
            format: date
            example: '2025-10-15'
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
                        description: Start date of the usage cycle
                        type: string
                        format: date-time
                        example: '2023-01-01T00:00:00+00:00'
                      usageCycleTo:
                        description: End date of the usage cycle
                        type: string
                        format: date-time
                        example: '2023-01-31T23:59:59+00:00'
                      eventUsage:
                        description: Total number of events used
                        type: integer
                        example: 12345
                      trackingScriptUsages:
                        description: Usage data for each tracking script
                        type: array
                        items:
                          properties:
                            trackingScriptId:
                              description: ID of the tracking script
                              type: string
                              example: '12345'
                            eventUsage:
                              description: Number of events used by this tracking script
                              type: integer
                              example: 5678
                          type: object
                    type: object
                type: object
        '403':
          description: You don't have permission to do this
        '422':
          description: Invalid date format
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