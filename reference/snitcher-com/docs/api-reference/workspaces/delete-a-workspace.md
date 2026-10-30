> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Delete a workspace



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json delete /v1/workspaces/{uuid}
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
    delete:
      tags:
        - Workspaces
      summary: Delete a workspace
      operationId: 63457e8e20c1fd12f8d8c4f5308ed8ec
      parameters:
        - name: uuid
          in: path
          description: UUID of the workspace
          required: true
          schema:
            type: string
            format: uuid
            example: 550e8400-e29b-41d4-a716-446655440000
      responses:
        '200':
          description: Workspace deleted
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                  message:
                    type: string
                    example: Workspace deleted
                type: object
        '401':
          description: Unauthorized
        '404':
          description: Workspace not found
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