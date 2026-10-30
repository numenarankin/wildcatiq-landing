> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# List tracking scripts

> Returns a paginated list of tracking scripts for the given workspace. Filtering by description or internal identifier is supported.



## OpenAPI

````yaml https://app.snitcher.com/api/radar/docs?api-radar-docs.json get /radar/operator/v1/tracking-scripts
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
    get:
      tags:
        - Tracking scripts
      summary: List tracking scripts
      description: >-
        Returns a paginated list of tracking scripts for the given workspace.
        Filtering by description or internal identifier is supported.
      operationId: 1481129ca2be03190a5cf9840f5c88ad
      parameters:
        - name: description
          in: query
          description: Optional description filter
          required: false
          schema:
            type: string
            example: Homepage tracker
        - name: internal_identifier
          in: query
          description: Optional internal identifier filter
          required: false
          schema:
            type: string
            example: homepage-tracker
        - name: page
          in: query
          description: The page number for pagination
          required: false
          schema:
            type: integer
            example: 1
        - name: size
          in: query
          description: The number of trackingscripts per page (1-1000)
          required: false
          schema:
            type: integer
            maximum: 1000
            minimum: 1
            example: 10
      responses:
        '200':
          description: Tracking scripts retrieved successfully
          content:
            application/json:
              schema:
                type: object
                allOf:
                  - $ref: '#/components/schemas/Pagination'
                  - properties:
                      success:
                        type: boolean
                        example: true
                      data:
                        type: array
                        items:
                          $ref: '#/components/schemas/TrackingScript_TrackingScript'
                    type: object
        '403':
          description: You don't have permission to do this
      security:
        - Snitcher bearer token: []
components:
  schemas:
    Pagination:
      properties:
        current_page:
          type: integer
          example: 1
        last_page:
          type: integer
          example: 10
        per_page:
          type: integer
          example: 15
        total:
          type: integer
          example: 150
        next_page_url:
          type: string
          example: https://api.example.com/v1/workspaces?page=2
          nullable: true
        prev_page_url:
          type: string
          example: null
          nullable: true
        first_page_url:
          type: string
          example: https://api.example.com/v1/workspaces?page=1
          nullable: true
        last_page_url:
          type: string
          example: https://api.example.com/v1/workspaces?page=10
          nullable: true
        path:
          type: string
          example: https://api.example.com/v1/workspaces
          nullable: true
        from:
          type: integer
          example: 1
          nullable: true
        to:
          type: integer
          example: 15
          nullable: true
        data:
          type: array
          items: {}
      type: object
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