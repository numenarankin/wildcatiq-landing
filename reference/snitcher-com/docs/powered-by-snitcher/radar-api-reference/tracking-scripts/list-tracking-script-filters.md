> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# List tracking script filters



## OpenAPI

````yaml https://app.snitcher.com/api/radar/docs?api-radar-docs.json get /radar/operator/v1/tracking-scripts/{trackingScriptId}/filters
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
  /radar/operator/v1/tracking-scripts/{trackingScriptId}/filters:
    get:
      tags:
        - Tracking scripts
      summary: List tracking script filters
      operationId: c9234c990873007f19faf362cc6b8fb8
      parameters:
        - name: trackingScriptId
          in: path
          description: The ID of the tracking script to list filters for
          required: true
          schema:
            type: string
            example: '12345'
      responses:
        '200':
          description: Tracking script filters retrieved successfully
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
                      $ref: '#/components/schemas/TrackingScript_TrackingScriptFilter'
                type: object
        '404':
          description: Tracking script not found
      security:
        - Snitcher bearer token: []
components:
  schemas:
    TrackingScript_TrackingScriptFilter:
      required:
        - uuid
        - filter_value
      properties:
        uuid:
          type: string
          format: uuid
        tracking_script_filter_field:
          $ref: '#/components/schemas/TrackingScript_TrackingScriptFilterField'
        tracking_script_filter_type:
          $ref: '#/components/schemas/TrackingScript_TrackingScriptFilterType'
        filter_value:
          type: string
      type: object
    TrackingScript_TrackingScriptFilterField:
      type: string
      enum:
        - country
        - url
    TrackingScript_TrackingScriptFilterType:
      type: string
      enum:
        - blacklist
        - whitelist
  securitySchemes:
    Snitcher bearer token:
      type: http
      description: Enter your personal access token (PAT) to authenticate
      bearerFormat: JWT
      scheme: bearer

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.