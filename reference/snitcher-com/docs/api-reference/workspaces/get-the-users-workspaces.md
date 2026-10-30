> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Get the user's workspaces



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json get /v1/workspaces
openapi: 3.0.0
info:
  title: Snitcher API
  description: >-
    Discovering leads or discovering our API. This page is all you need to do
    both!
  contact:
    email: info@snitcher.com
  version: 1.0.0
servers:
  - url: https://api.snitcher.com
    description: Production API
security: []
tags:
  - name: Workspaces
    description: >-
      Endpoints for managing workspaces, users and tags available in the
      workspace
  - name: Organisations
    description: Endpoints for organisations
  - name: Contacts
    description: Endpoints for organisation contacts
  - name: Sessions
    description: Endpoints for sessions
  - name: Custom Fields
    description: Endpoints for managing custom field definitions
  - name: Custom Field Values
    description: Endpoints for managing custom field values on organisations
  - name: Segments
    description: Endpoints for segments
  - name: User
    description: Endpoints for authenticated user information
paths:
  /v1/workspaces:
    get:
      tags:
        - Workspaces
      summary: Get the user's workspaces
      operationId: d181186b161c6baafaa8b23266b5e6b8
      parameters:
        - name: page
          in: query
          description: >-
            The page number for pagination. page × size may not exceed 25,000
            rows; narrow the listing with date_from and date_to instead of
            paging deeper.
          required: false
          schema:
            type: integer
            minimum: 1
            example: 1
        - name: size
          in: query
          description: The number of organisations per page (1-1000)
          required: false
          schema:
            type: integer
            maximum: 1000
            minimum: 1
            example: 10
      responses:
        '200':
          description: List of workspaces
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
                          $ref: '#/components/schemas/Workspace_Workspace'
                    type: object
        '401':
          description: Unauthorized
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
    Workspace_Workspace:
      required:
        - uuid
        - name
        - url
        - tracking_script_id
        - tracking_script_snippet
        - available_tags
      properties:
        uuid:
          type: string
          format: uuid
        name:
          type: string
          example: ACME Inc.
        url:
          type: string
          example: https://acme.com
        tracking_script_id:
          type: string
          example: s123456789
        tracking_script_snippet:
          type: string
          example: <script>...</script>
        available_tags:
          type: array
          items:
            type: string
          example:
            - marketing
            - design
        status:
          $ref: '#/components/schemas/Workspace_Status'
        usage_limit:
          type: number
          example: '1000'
          nullable: true
      type: object
    Workspace_Status:
      type: string
      enum:
        - active
        - inactive
        - on_trial
  securitySchemes:
    Snitcher bearer token:
      type: http
      description: Enter your personal access token (PAT) to authenticate
      bearerFormat: JWT
      scheme: bearer

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.