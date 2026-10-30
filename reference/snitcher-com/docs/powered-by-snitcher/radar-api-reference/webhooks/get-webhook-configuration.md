> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Get webhook configuration



## OpenAPI

````yaml https://app.snitcher.com/api/radar/docs?api-radar-docs.json get /radar/operator/v1/webhooks
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
  /radar/operator/v1/webhooks:
    get:
      tags:
        - Webhooks
      summary: Get webhook configuration
      operationId: dd7040c4fa7fd5e99f0bc189ff93c326
      responses:
        '200':
          description: Webhook configuration retrieved successfully
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
                      $ref: >-
                        #/components/schemas/IngestPipelineConfiguration_PipelineConfiguration
                type: object
        '403':
          description: You don't have permission to do this
      security:
        - Snitcher bearer token: []
components:
  schemas:
    IngestPipelineConfiguration_PipelineConfiguration:
      properties:
        delivery:
          $ref: '#/components/schemas/IngestPipelineConfiguration_Delivery'
        event_aggregation:
          description: >-
            Delivery mode. `per_session` groups all events of a session into one
            payload sent after the session ends; `per_event` pushes each event
            in near real-time.
          type: string
          enum:
            - per_event
            - per_session
          example: per_session
      type: object
    IngestPipelineConfiguration_Delivery:
      required:
        - webhook_url
      properties:
        webhook_url:
          type: string
        signature:
          type: string
          nullable: true
      type: object
  securitySchemes:
    Snitcher bearer token:
      type: http
      description: Enter your personal access token (PAT) to authenticate
      bearerFormat: JWT
      scheme: bearer

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.