> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# List custom field values for an organisation



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json get /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}/custom-fields
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
  /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}/custom-fields:
    get:
      tags:
        - Custom Field Values
      summary: List custom field values for an organisation
      operationId: 2ff65831122638ad0ce60cc7c179f6a3
      parameters:
        - name: workspaceUuid
          in: path
          description: The UUID of the workspace
          required: true
          schema:
            type: string
            format: uuid
            example: 550e8400-e29b-41d4-a716-446655440000
        - name: organisationUuid
          in: path
          description: The UUID of the organisation
          required: true
          schema:
            type: string
            format: uuid
            example: 550e8400-e29b-41d4-a716-446655440000
      responses:
        '200':
          description: A list of custom field values
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
                      $ref: '#/components/schemas/CustomFieldValue'
                type: object
      security:
        - Snitcher bearer token: []
components:
  schemas:
    CustomFieldValue:
      title: Custom Field Value
      description: A custom field value set on an organisation
      properties:
        field_identifier:
          description: The identifier of the field
          type: string
          example: industry
        field_key:
          description: The machine-readable key of the field
          type: string
          example: industry
        field_type:
          description: The data type of the field
          type: string
          example: text
        value:
          description: The value of the field
          example: Technology
        source:
          description: The source of the value
          type: string
          example: manual
        updated_at:
          type: string
          format: date-time
          example: '2024-01-01T00:00:00Z'
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