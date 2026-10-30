> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview of the sessions of an organisation



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json get /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}/sessions
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
  /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}/sessions:
    get:
      tags:
        - Sessions
      summary: Overview of the sessions of an organisation
      operationId: 71efed14b0d3aaf9caea94c0602c1e34
      parameters:
        - name: workspaceUuid
          in: path
          description: The UUID of the workspace
          required: true
          schema:
            type: string
            format: uuid
            example: 123e4567-e89b-12d3-a456-426614174000
        - name: organisationUuid
          in: path
          description: The UUID of the organisation
          required: true
          schema:
            type: string
            format: uuid
            example: 123e4567-e89b-12d3-a456-426614174000
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
          description: The number of sessions per page (1-1000)
          required: false
          schema:
            type: integer
            maximum: 1000
            minimum: 1
            example: 10
        - name: date
          in: query
          description: The specific date to filter sessions.
          required: false
          schema:
            type: string
            format: date
            example: '2025-03-01'
        - name: date_from
          in: query
          description: >-
            The start date for filtering sessions. Can only be used if `date` is
            not provided.
          required: false
          schema:
            type: string
            format: date
            example: '2025-03-01'
        - name: date_to
          in: query
          description: >-
            The end date for filtering sessions. Can only be used if `date` is
            not provided.
          required: false
          schema:
            type: string
            format: date
            example: '2025-03-10'
        - name: url
          in: query
          description: Filters sessions where the visited URL contains the given string.
          required: false
          schema:
            type: string
            example: checkout
        - name: referrer
          in: query
          description: Filters sessions where the referrer contains the given string.
          required: false
          schema:
            type: string
            example: google.com
        - name: visitor_uuid
          in: query
          description: >-
            Only include sessions of this visitor (client) ID — the
            `visitor_uuid` returned on every session, and the value the tracker
            sends as `anonymous_id`. Lets a client-side ID minted at conversion
            time be resolved back to the sessions, and therefore the
            organisation, it belongs to.
          required: false
          schema:
            type: string
            format: uuid
            example: 123e4567-e89b-12d3-a456-426614174000
      responses:
        '200':
          description: List of sessions
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
                          $ref: '#/components/schemas/Session'
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
    Session:
      title: Session
      description: A representation of a session
      properties:
        uuid:
          type: string
          format: uuid
          example: 123e4567-e89b-12d3-a456-426614174000
        organisation_uuid:
          type: string
          format: uuid
          example: 123e4567-e89b-12d3-a456-426614174000
        visitor_uuid:
          description: >-
            The visitor (client) ID of the browser this session belongs to, the
            same value the tracker sends as `anonymous_id` and Spotter returns.
            Stable per browser until its storage is cleared, and shared across
            every session of that visitor, so it can be joined against an ID
            minted client-side.
          type: string
          format: uuid
          example: 123e4567-e89b-12d3-a456-426614174000
        started_at:
          type: string
          format: date-time
          example: '2021-01-01T00:00:00Z'
        ended_at:
          type: string
          format: date-time
          example: '2021-01-01T00:00:00Z'
        location:
          $ref: '#/components/schemas/Location'
        browser:
          description: The browser used during the session
          type: string
          example: Chrome
          nullable: true
        referrer:
          description: The referring URL from which the session originated
          type: string
          example: https://google.com
          nullable: true
        device_type:
          description: The type of device used (e.g., desktop, mobile, tablet)
          type: string
          example: mobile
          nullable: true
        views:
          description: 'Deprecated: Use `events` instead. Only contains pageview events.'
          type: array
          items:
            properties:
              visited_at:
                type: string
                format: date-time
                example: '2021-01-01T00:00:00Z'
              time_on_page:
                type: integer
                example: 0
              url:
                type: string
                example: https://acme.com/page?foo=bar#baz
            type: object
          deprecated: true
        events:
          description: >-
            All tracking events in the session (pageviews, form submissions,
            custom events, clicks, downloads)
          type: array
          items:
            $ref: '#/components/schemas/SessionEvent'
      type: object
    Location:
      title: Location
      description: Representation of an location in API responses
      properties:
        country:
          description: Maps an Organisation object to an API response.
          type: string
          example: US
        state:
          type: string
          example: California
        city:
          type: string
          example: Los Angeles
        latitude:
          type: number
          example: 34.0522
        longitude:
          type: number
          example: -118.2437
      type: object
    SessionEvent:
      title: SessionEvent
      description: >-
        A tracking event within a session. Additional fields depend on
        event_type.
      properties:
        event_type:
          description: The type of event
          type: string
          enum:
            - pageview
            - form_submit
            - form_abandon
            - track
            - click
            - download
          example: pageview
        url:
          description: The URL where the event occurred
          type: string
          example: https://acme.com/pricing
        triggered_at:
          description: When the event was triggered
          type: string
          format: date-time
          example: '2021-01-01T00:00:00Z'
        time_on_page:
          description: Time spent on page in seconds (pageview only)
          type: integer
          example: 45
          nullable: true
        form_id:
          description: The form element ID (form_submit and form_abandon)
          type: string
          example: contact-form
          nullable: true
        form_name:
          description: The form name (form_submit and form_abandon)
          type: string
          example: Contact Form
          nullable: true
        time_spent:
          description: >-
            Seconds spent interacting with the form before leaving (form_abandon
            only)
          type: integer
          example: 54
          nullable: true
        fields:
          description: Form field values captured (form_submit and form_abandon)
          type: array
          items:
            properties:
              name:
                type: string
              value:
                type: string
            type: object
          nullable: true
        name:
          description: Event name (track, click, download only)
          type: string
          example: plan_selected
          nullable: true
        properties:
          description: Event properties (track, click, download only)
          type: array
          items:
            properties:
              name:
                type: string
              value:
                type: string
            type: object
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