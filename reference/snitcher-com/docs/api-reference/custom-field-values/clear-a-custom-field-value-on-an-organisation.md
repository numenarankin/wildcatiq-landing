> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Clear a custom field value on an organisation



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json delete /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}/custom-fields/{key}
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
  /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}/custom-fields/{key}:
    delete:
      tags:
        - Custom Field Values
      summary: Clear a custom field value on an organisation
      operationId: c915d426004f1bde89475e7e2682f32b
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
        - name: key
          in: path
          description: The key of the custom field
          required: true
          schema:
            type: string
            example: industry
      responses:
        '204':
          description: The custom field value was cleared
        '403':
          description: >-
            The field is read-only, including research fields managed by
            Snitcher in this workspace
        '404':
          description: The custom field does not exist
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