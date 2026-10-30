> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Get contacts for an organisation



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json get /v1/workspaces/{workspaceUuid}/contacts
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
  /v1/workspaces/{workspaceUuid}/contacts:
    get:
      tags:
        - Contacts
      summary: Get contacts for an organisation
      operationId: 34f1c3648b5916d18464df748bb6ac92
      parameters:
        - name: workspaceUuid
          in: path
          description: The UUID of the workspace
          required: true
          schema:
            type: string
            format: uuid
            example: 550e8400-e29b-41d4-a716-446655440000
        - name: domain
          in: query
          description: Either organisation_uuid or domain must be provided
          schema:
            type: string
            example: pirateinc.com
        - name: organisation_uuid
          in: query
          description: Either organisation_uuid or domain must be provided
          schema:
            type: string
            format: uuid
            example: 550e8400-e29b-41d4-a716-446655440000
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
          description: >-
            A paginated list of the contacts. Contacts are served from
            Snitcher's store; when a domain has not been looked up recently the
            lookup runs in the background and `refreshing` is true, meaning the
            list may still grow. Poll the same request until `refreshing` is
            false.
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
                      refreshing:
                        description: >-
                          Whether a contact lookup for this domain is still
                          running in the background.
                        type: boolean
                        example: false
                      data:
                        type: array
                        items:
                          $ref: '#/components/schemas/OrganisationContact'
                    type: object
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: false
                  message:
                    type: string
                    example: The domain or organisation_uuid must be provided
                type: object
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