> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Generate a tracking script



## OpenAPI

````yaml https://app.snitcher.com/api/radar/docs?api-radar-docs.json post /radar/operator/v1/tracking-scripts
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
  /radar/operator/v1/tracking-scripts:
    post:
      tags:
        - Tracking scripts
      summary: Generate a tracking script
      operationId: 8846ecf4073b2d61f30f8a2e54b6db25
      requestBody:
        description: Tracking script generation parameters
        required: true
        content:
          application/json:
            schema:
              required:
                - internal_identifier
              properties:
                internal_identifier:
                  description: >-
                    The identifier for the tracking script as used in your
                    system. Should be unique for every generated tracking script
                  type: string
                  example: my-tracking-script
                description:
                  description: A description for the tracking script
                  type: string
                  example: This is a tracking script for my website
                domains:
                  description: >-
                    Domains to whitelist for this tracking script. Only traffic
                    from these domains (and their subdomains) is accepted.
                  type: array
                  items:
                    type: string
                    example: example.com
              type: object
      responses:
        '200':
          description: Tracking script generated successfully
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/TrackingScript_TrackingScript'
                type: object
        '422':
          description: The identifier is already in use
      security:
        - Snitcher bearer token: []
components:
  schemas:
    TrackingScript_TrackingScript:
      required:
        - tracking_script_id
        - internal_identifier
        - active
      properties:
        tracking_script_id:
          type: string
        internal_identifier:
          type: string
        description:
          type: string
          nullable: true
        active:
          type: boolean
        domains:
          type: array
          items:
            type: string
            example: example.com
      type: object
  securitySchemes:
    Snitcher bearer token:
      type: http
      description: Enter your personal access token (PAT) to authenticate
      bearerFormat: JWT
      scheme: bearer

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.