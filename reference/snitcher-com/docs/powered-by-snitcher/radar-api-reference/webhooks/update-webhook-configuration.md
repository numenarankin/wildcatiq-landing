> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Update webhook configuration



## OpenAPI

````yaml https://app.snitcher.com/api/radar/docs?api-radar-docs.json patch /radar/operator/v1/webhooks
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
    patch:
      tags:
        - Webhooks
      summary: Update webhook configuration
      operationId: 2ec6db4c3a09373a53157dbe557580e3
      requestBody:
        description: Webhook configuration parameters
        required: true
        content:
          application/json:
            schema:
              properties:
                delivery:
                  description: Webhook delivery configuration
                  properties:
                    webhook_url:
                      description: URL to send webhook events to
                      type: string
                      example: https://example.com/webhook
                    webhook_secret:
                      description: Secret used to sign webhook payloads
                      type: string
                      example: my-little-secret
                  type: object
                event_aggregation:
                  description: >-
                    Delivery mode. `per_session` (recommended) groups all events
                    of a session into one payload sent after the session ends.
                    `per_event` pushes each event in near real-time. `per_event`
                    is not available while identifications are enabled.
                  type: string
                  enum:
                    - per_event
                    - per_session
                  example: per_session
              type: object
      responses:
        '200':
          description: Webhook configuration updated successfully
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
                  message:
                    type: string
                    example: Webhook configuration updated successfully
                type: object
        '403':
          description: You don't have permission to do this
        '422':
          description: Validation error
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