> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Get an organisation



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json get /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}
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
  /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}:
    get:
      tags:
        - Organisations
      summary: Get an organisation
      operationId: fcde6a037495a5125926648e48245aa2
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
          description: The organisation
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    allOf:
                      - $ref: '#/components/schemas/Organisation_Organisation'
                      - properties:
                          custom_fields:
                            description: >-
                              Map of the organisation's custom fields: field key
                              to value in its natural JSON type (text/select as
                              string, number as number, checkbox as boolean,
                              multi-select as array of strings, dates as ISO
                              strings). Only present when the workspace has
                              custom fields enabled and the organisation has at
                              least one value.
                            type: object
                            example:
                              custom_text_field: Fresh bananas quarterly
                              custom_date_field: '2026-08-01'
                            additionalProperties: true
                        type: object
                type: object
      security:
        - Snitcher bearer token: []
components:
  schemas:
    Organisation_Organisation:
      required:
        - uuid
        - name
        - website
        - first_seen
        - last_seen
        - profiles
        - tags
        - segments
      properties:
        uuid:
          type: string
          format: uuid
          example: 550e8400-e29b-41d4-a716-446655440000
        unique_visitor_count:
          description: >-
            Unique tracked visitors currently attributed to this company in this
            workspace. Counts non-merged identities, independent of date filters
            and tracking-event retention. Hiding a visitor does not remove its
            attribution.
          type: integer
          minimum: 0
          example: 7
        name:
          type: string
          example: Pirate Inc.
        website:
          type: string
          example: https://pirateinc.com
        first_seen:
          type: string
          format: date-time
          example: '2021-01-01T00:00:00Z'
        last_seen:
          type: string
          format: date-time
          example: '2021-01-01T00:00:00Z'
        logo:
          type: string
          example: https://pirateinc.com/logo.png
          nullable: true
        address:
          $ref: '#/components/schemas/Value_Address'
        founded:
          type: number
          example: '2000'
          nullable: true
        size:
          $ref: '#/components/schemas/Organisation_EmployeeRange'
        industry:
          type: string
          example: Piracy
          nullable: true
        phone:
          type: string
          example: +49 123 4567890
          nullable: true
        email:
          type: string
          example: john@example.org
          nullable: true
        profiles:
          type: array
          items:
            $ref: '#/components/schemas/Organisation_SocialProfile'
        tags:
          type: array
          items:
            type: string
        segments:
          type: array
          items:
            $ref: '#/components/schemas/Organisation_Segment'
        total_pageviews:
          type: integer
          example: 42
          nullable: true
        total_time_on_site:
          type: string
          example: '1:02:05'
          nullable: true
        visitor_locations:
          type: array
          items:
            type: string
          example:
            - Amsterdam, NL
      type: object
    Value_Address:
      required:
        - street
        - address
        - full_address
        - city
        - state
      properties:
        street:
          type: string
          example: Hollywood Blvd
        street_number:
          type: string
          example: '123'
          nullable: true
        postal_code:
          type: string
          example: '90028'
          nullable: true
        address:
          type: string
          example: Hollywood Blvd 123
        full_address:
          type: string
          example: Hollywood Blvd 123, Los Angeles, California, US
        city:
          type: string
          example: Los Angeles
        state:
          type: string
          example: California
        country:
          type: string
          example: US
          nullable: true
        latitude:
          type: number
          example: '34.0522'
          nullable: true
        longitude:
          type: number
          example: '-118.2437'
          nullable: true
      type: object
    Organisation_EmployeeRange:
      type: string
      enum:
        - 1-10 employees
        - 11-50 employees
        - 51-200 employees
        - 201-500 employees
        - 501-1000 employees
        - 1001-5000 employees
        - 5001-10,000 employees
        - 10,001+ employees
    Organisation_SocialProfile:
      required:
        - name
      properties:
        name:
          type: string
          example: Twitter
        handle:
          type: string
          example: '@pirateinc'
          nullable: true
        url:
          type: string
          example: https://twitter.com/pirateinc
          nullable: true
      type: object
    Organisation_Segment:
      required:
        - uuid
        - name
      properties:
        uuid:
          type: string
          format: uuid
          example: 550e8400-e29b-41d4-a716-446655440000
        name:
          type: string
          example: Hot leads
      type: object
  securitySchemes:
    Snitcher bearer token:
      type: http
      description: Enter your personal access token (PAT) to authenticate
      bearerFormat: JWT
      scheme: bearer

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.