> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Update a tracking script



## OpenAPI

````yaml https://app.snitcher.com/api/radar/docs?api-radar-docs.json patch /radar/operator/v1/tracking-scripts/{trackingScriptId}
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
  /radar/operator/v1/tracking-scripts/{trackingScriptId}:
    patch:
      tags:
        - Tracking scripts
      summary: Update a tracking script
      operationId: 1e50fc0ce822553556979db1ec0122e5
      parameters:
        - name: trackingScriptId
          in: path
          description: The ID of the tracking script to update
          required: true
          schema:
            type: string
            example: '12345'
      requestBody:
        description: >-
          Tracking script update parameters. Provide at least one of active or
          domains; omitted fields are left unchanged.
        required: true
        content:
          application/json:
            schema:
              properties:
                active:
                  description: Boolean to deactivate or reactivate the tracking script
                  type: boolean
                  example: 'false'
                domains:
                  description: >-
                    Replaces the domains whitelisted for this tracking script.
                    Only traffic from these domains (and their subdomains) is
                    accepted. An empty array or null removes the restriction.
                  type: array
                  items:
                    type: string
                    example: example.com
                  nullable: true
              type: object
      responses:
        '200':
          description: Tracking script updated successfully
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
          description: A domain is not valid, or neither active nor domains was provided
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