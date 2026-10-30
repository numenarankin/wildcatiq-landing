> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Get a single tracking script

> Returns a single tracking script by ID



## OpenAPI

````yaml https://app.snitcher.com/api/radar/docs?api-radar-docs.json get /radar/operator/v1/tracking-scripts/{trackingScriptId}
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
    get:
      tags:
        - Tracking scripts
      summary: Get a single tracking script
      description: Returns a single tracking script by ID
      operationId: 05691107840483c3e446df53f382f982
      parameters:
        - name: trackingScriptId
          in: path
          description: ID of the tracking script to retrieve
          required: true
          schema:
            type: string
            example: ro123abc
      responses:
        '200':
          description: Tracking script retrieved successfully
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: object
                    allOf:
                      - $ref: '#/components/schemas/TrackingScript_TrackingScript'
                      - properties:
                          filters:
                            type: array
                            items:
                              $ref: >-
                                #/components/schemas/TrackingScript_TrackingScriptFilter
                        type: object
                type: object
        '403':
          description: You don't have permission to do this
        '404':
          description: Tracking script not found
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