> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Update the workspace's tracker features

> Turn form, click or download tracking on or off. Only the fields in the request change; the others keep their current value. The tracking script picks the change up on its next load.



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json patch /v1/workspaces/{workspaceUuid}/tracker-features
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
  /v1/workspaces/{workspaceUuid}/tracker-features:
    patch:
      tags:
        - Workspaces
      summary: Update the workspace's tracker features
      description: >-
        Turn form, click or download tracking on or off. Only the fields in the
        request change; the others keep their current value. The tracking script
        picks the change up on its next load.
      operationId: fdea821117459e5110ba2ed18aa1c1a5
      parameters:
        - name: workspaceUuid
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
                form_tracking:
                  type: boolean
                  example: true
                click_tracking:
                  type: boolean
                  example: true
                download_tracking:
                  type: boolean
                  example: false
              type: object
      responses:
        '200':
          description: Tracker features after the update
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    $ref: '#/components/schemas/TrackingScript_RadarFeatures'
                type: object
        '401':
          description: Unauthorized
        '404':
          description: Workspace not found, or it has no tracking script
        '422':
          description: Validation error
      security:
        - Snitcher bearer token: []
components:
  schemas:
    TrackingScript_RadarFeatures:
      required:
        - form_tracking
        - click_tracking
        - download_tracking
      properties:
        form_tracking:
          description: Capture form submissions and abandons
          type: boolean
          example: true
        click_tracking:
          description: Capture link clicks
          type: boolean
          example: true
        download_tracking:
          description: Capture file downloads
          type: boolean
          example: true
      type: object
  securitySchemes:
    Snitcher bearer token:
      type: http
      description: Enter your personal access token (PAT) to authenticate
      bearerFormat: JWT
      scheme: bearer

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.