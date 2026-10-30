> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Delete a tracking script filter



## OpenAPI

````yaml https://app.snitcher.com/api/radar/docs?api-radar-docs.json delete /radar/operator/v1/tracking-scripts/{trackingScriptId}/filters/{filterUuid}
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
  /radar/operator/v1/tracking-scripts/{trackingScriptId}/filters/{filterUuid}:
    delete:
      tags:
        - Tracking scripts
      summary: Delete a tracking script filter
      operationId: c8a179586b309214b001a0d5cef22b41
      parameters:
        - name: trackingScriptId
          in: path
          description: The ID of the tracking script to delete a filter from
          required: true
          schema:
            type: string
            example: '12345'
        - name: filterUuid
          in: path
          description: The UUID of the filter to delete
          required: true
          schema:
            type: string
            format: uuid
            example: 550e8400-e29b-41d4-a716-446655440000
      responses:
        '200':
          description: Tracking script filter deleted successfully
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: Tracking script filter deleted successfully
                type: object
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