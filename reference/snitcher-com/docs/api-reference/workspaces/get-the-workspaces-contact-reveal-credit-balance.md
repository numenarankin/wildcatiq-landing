> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Get the workspace's contact reveal credit balance

> The credits available for revealing contact emails and phone numbers in the current billing cycle, how many have been used, and when the cycle resets. Agency partners can read this for each of their client workspaces.



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json get /v1/workspaces/{workspaceUuid}/contact-credits
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
  /v1/workspaces/{workspaceUuid}/contact-credits:
    get:
      tags:
        - Workspaces
      summary: Get the workspace's contact reveal credit balance
      description: >-
        The credits available for revealing contact emails and phone numbers in
        the current billing cycle, how many have been used, and when the cycle
        resets. Agency partners can read this for each of their client
        workspaces.
      operationId: 9811bea2355c538b822286bba3c523c1
      parameters:
        - name: workspaceUuid
          in: path
          description: UUID of the workspace
          required: true
          schema:
            type: string
            format: uuid
            example: 550e8400-e29b-41d4-a716-446655440000
      responses:
        '200':
          description: Contact credit balance
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    $ref: '#/components/schemas/Subscription_ContactCredits'
                type: object
        '401':
          description: Unauthorized
        '404':
          description: Workspace not found
      security:
        - Snitcher bearer token: []
components:
  schemas:
    Subscription_ContactCredits:
      required:
        - used
        - total
        - remaining
        - free_credits
        - email_credits_used
        - phone_credits_used
      properties:
        cycle_starts_at:
          type: string
          format: date-time
          example: '2026-09-09T00:00:00+00:00'
          nullable: true
        cycle_ends_at:
          description: When the cycle's usage resets
          type: string
          format: date-time
          example: '2026-10-09T00:00:00+00:00'
          nullable: true
        used:
          description: Credits consumed in the current cycle
          type: integer
          example: 100
        total:
          description: >-
            Credits available per cycle: the plan's free credits plus any
            purchased package
          type: integer
          example: 600
        remaining:
          type: integer
          example: 500
        package:
          oneOf:
            - $ref: '#/components/schemas/Subscription_ContactCreditsPackage'
          nullable: true
          description: >-
            The purchased credit package, or null when the workspace only has
            the credits included in its plan
        free_credits:
          description: Credits included in the plan each cycle
          type: integer
          example: 100
        email_credits_used:
          type: integer
          example: 60
        phone_credits_used:
          description: Phone reveals expressed in credits (a phone reveal costs 5 credits)
          type: integer
          example: 40
      type: object
    Subscription_ContactCreditsPackage:
      required:
        - status
        - plan
        - on_grace_period
      properties:
        status:
          description: Stripe subscription status of the package
          type: string
          example: active
        ends_at:
          description: When a cancelled package stops adding credits
          type: string
          format: date-time
          example: null
          nullable: true
        plan:
          $ref: '#/components/schemas/Subscription_ContactCreditsPlan'
        on_grace_period:
          type: boolean
          example: false
      type: object
    Subscription_ContactCreditsPlan:
      required:
        - currency
        - credits
        - period
      properties:
        currency:
          type: string
          example: eur
        credits:
          description: Credits the package adds per period
          type: integer
          example: 500
        period:
          type: string
          enum:
            - monthly
            - yearly
          example: monthly
      type: object
  securitySchemes:
    Snitcher bearer token:
      type: http
      description: Enter your personal access token (PAT) to authenticate
      bearerFormat: JWT
      scheme: bearer

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.