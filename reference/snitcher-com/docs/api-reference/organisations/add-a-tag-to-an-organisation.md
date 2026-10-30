> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Add a tag to an organisation



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json post /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}/tags
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
  /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}/tags:
    post:
      tags:
        - Organisations
      summary: Add a tag to an organisation
      operationId: 31a8ba6fa4956a561d9813768ca735be
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
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TagRequest'
      responses:
        '201':
          description: The tag was added to the organisation
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                type: object
        '400':
          description: The tag does not exist
      security:
        - Snitcher bearer token: []
components:
  schemas:
    TagRequest:
      title: Tag Request
      description: Request parameters for creating a tag
      properties:
        tag_name:
          description: The name of the tag
          type: string
          example: Tag Name
      type: object
  securitySchemes:
    Snitcher bearer token:
      type: http
      description: Enter your personal access token (PAT) to authenticate
      bearerFormat: JWT
      scheme: bearer

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.