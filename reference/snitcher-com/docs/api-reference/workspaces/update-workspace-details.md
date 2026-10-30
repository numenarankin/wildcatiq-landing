> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Update workspace details



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json patch /v1/workspaces/{uuid}
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
  /v1/workspaces/{uuid}:
    patch:
      tags:
        - Workspaces
      summary: Update workspace details
      operationId: b8a67cc1b1e2cbb51c0c8883753904cb
      parameters:
        - name: uuid
          in: path
          description: UUID of the workspace
          required: true
          schema:
            type: string
            format: uuid
            example: 550e8400-e29b-41d4-a716-446655440000
      requestBody:
        required: true
        content:
          application/json:
            schema:
              properties:
                usage_limit:
                  type: integer
                  example: 1000
              type: object
      responses:
        '200':
          description: Workspace details
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    $ref: '#/components/schemas/Workspace_Workspace'
                type: object
        '400':
          description: Invalid input
        '401':
          description: Unauthorized
        '404':
          description: Workspace not found
      security:
        - Snitcher bearer token: []
components:
  schemas:
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