> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Reveal an email for an organisation contact



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json put /v1/workspaces/{workspaceUuid}/contacts/{contactUuid}/reveal-email
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
  /v1/workspaces/{workspaceUuid}/contacts/{contactUuid}/reveal-email:
    put:
      tags:
        - Contacts
      summary: Reveal an email for an organisation contact
      operationId: 8f5dd491c593a4c25fecf18535e88852
      parameters:
        - name: workspaceUuid
          in: path
          description: The UUID of the workspace
          required: true
          schema:
            type: string
            format: uuid
            example: 550e8400-e29b-41d4-a716-446655440000
        - name: contactUuid
          in: path
          description: The UUID of the contact
          required: true
          schema:
            type: string
            format: uuid
            example: 550e8400-e29b-41d4-a716-446655440000
      responses:
        '200':
          description: The contact
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    $ref: '#/components/schemas/OrganisationContact'
                type: object
        '402':
          description: Out of email reveal credits for this billing period
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: Email reveal limit reached
                type: object
        '422':
          description: The contact UUID is malformed
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: 'Invalid UUID string: not-a-uuid'
                type: object
      security:
        - Snitcher bearer token: []
components:
  schemas:
    OrganisationContact:
      title: Organisation contact
      description: Representation of an organisation contact
      properties:
        uuid:
          description: Maps an Organisation contact object to an API response.
          type: string
          format: uuid
          example: 550e8400-e29b-41d4-a716-446655440000
        email:
          type: string
          example: john@pirateinc.com
        first_name:
          type: string
          example: John
        last_name:
          type: string
          example: Doe
        position:
          type: string
          example: CEO
        headline:
          type: string
          example: CEO at Pirate Inc.
        department:
          type: array
          items:
            type: string
          example:
            - IT
        seniority:
          type: string
          example: Senior
        linkedin_url:
          type: string
          example: https://linkedin.com/in/johndoe
        location:
          properties:
            city:
              type: string
              example: Amsterdam
            state:
              type: string
              example: North Holland
            country:
              type: string
              example: Netherlands
            country_code:
              type: string
              example: NL
          type: object
        profiles:
          type: array
          items:
            properties:
              name:
                type: string
                example: Twitter
              handle:
                type: string
                example: '@pirateinc'
              url:
                type: string
                example: https://twitter.com/pirateinc
            type: object
      type: object
  securitySchemes:
    Snitcher bearer token:
      type: http
      description: Enter your personal access token (PAT) to authenticate
      bearerFormat: JWT
      scheme: bearer

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.