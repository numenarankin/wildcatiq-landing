> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Identify company for a session

> Returns company information for the current visitor's session when available. Provide a session UUID when you want to restrict lookup to a specific session.



## OpenAPI

````yaml https://app.snitcher.com/api/radar/docs?api-radar-docs.json post /radar/operator/v1/tracking-scripts/{trackingScriptId}/company/find
openapi: 3.0.0
info:
  title: Radar API
  description: ''
  contact:
    email: info@snitcher.com
  version: 1.0.0
servers:
  - url: https://api.snitcher.com
    description: Production API
security: []
tags:
  - name: Tracking scripts
    description: Endpoints for tracking scripts
  - name: Company
    description: Endpoints for companies
  - name: Usage
    description: Endpoints for tracking script usage
  - name: Webhooks
    description: Endpoints for webhook settings
paths:
  /radar/operator/v1/tracking-scripts/{trackingScriptId}/company/find:
    post:
      tags:
        - Company
      summary: Identify company for a session
      description: >-
        Returns company information for the current visitor's session when
        available. Provide a session UUID when you want to restrict lookup to a
        specific session.
      operationId: 73808f0078864d0751c33cd0e9a5c1dd
      parameters:
        - name: trackingScriptId
          in: path
          description: Tracking script ID
          required: true
          schema:
            type: string
            example: '12345'
      requestBody:
        description: Session context
        required: true
        content:
          application/json:
            schema:
              properties:
                session_uuid:
                  description: Lookup will be performed for this session UUID
                  type: string
                  format: uuid
                  example: 42b7c5e0-76c0-4f8d-9b7c-6b8e1a2d3f45
                  nullable: false
                since:
                  description: >-
                    Optional anchor date (ISO 8601, UTC). When provided, the
                    session lookup is scoped to events on that single calendar
                    day instead of the default last-2-days window — use it to
                    identify sessions older than 2 days. The date must not be in
                    the future or more than 30 days ago. Omit it to use the
                    default window.
                  type: string
                  format: date
                  example: '2026-05-11'
                  nullable: true
              type: object
      responses:
        '200':
          description: Company identified
          content:
            application/json:
              schema:
                required:
                  - ip
                  - domain
                  - type
                  - company
                  - geoIP
                properties:
                  ip:
                    type: string
                    example: 203.0.113.42
                  domain:
                    type: string
                    example: acme.com
                  type:
                    type: string
                    enum:
                      - business
                      - educational
                      - government
                    example: business
                  automation_detected:
                    description: >-
                      True when the session's own behaviour gave its browser
                      away as automation (its heartbeats ran ahead of the
                      clock). Such a session's network is not trusted for an
                      identification, so expect a 404 for it in most cases.
                    type: boolean
                    example: false
                  company:
                    required:
                      - name
                      - domain
                      - website
                      - industry
                      - founded_year
                      - employee_range
                      - annual_revenue
                      - total_funding
                      - location
                      - description
                      - phone
                      - geo
                      - profiles
                    properties:
                      name:
                        type: string
                        example: Acme Inc
                      domain:
                        type: string
                        example: acme.com
                      website:
                        type: string
                        example: https://www.acme.com
                      industry:
                        type: string
                        example: Software
                      founded_year:
                        type: string
                        example: '2012'
                        nullable: true
                      employee_range:
                        type: string
                        example: 51-200
                        nullable: true
                      annual_revenue:
                        type: string
                        example: $10M-$50M
                        nullable: true
                      total_funding:
                        type: string
                        example: $25M
                        nullable: true
                      location:
                        type: string
                        example: San Francisco, CA
                        nullable: true
                      description:
                        type: string
                        example: Acme builds widgets for modern teams.
                        nullable: true
                      phone:
                        type: string
                        example: +1 415 555 0100
                        nullable: true
                      geo:
                        properties:
                          country:
                            type: string
                            example: United States
                            nullable: true
                          country_code:
                            type: string
                            example: US
                            nullable: true
                          state:
                            type: string
                            example: California
                            nullable: true
                          state_code:
                            type: string
                            example: CA
                            nullable: true
                          postal_code:
                            type: string
                            example: '94107'
                            nullable: true
                          city:
                            type: string
                            example: San Francisco
                            nullable: true
                          street:
                            type: string
                            example: null
                            nullable: true
                          street_number:
                            type: string
                            example: null
                            nullable: true
                        type: object
                      profiles:
                        type: array
                        items:
                          type: string
                    type: object
                  geoIP:
                    properties:
                      country:
                        type: string
                        example: United States
                        nullable: true
                      country_code:
                        type: string
                        example: US
                        nullable: true
                      city:
                        type: string
                        example: San Francisco
                        nullable: true
                      state:
                        type: string
                        example: California
                        nullable: true
                    type: object
                type: object
        '401':
          description: Unauthorized
          content:
            application/json:
              schema:
                required:
                  - message
                properties:
                  message:
                    type: string
                    example: >-
                      Your subscription does not allow access to this endpoint.
                      Please contact support.
                type: object
        '404':
          description: Not found or ISP identified
          content:
            application/json:
              schema:
                oneOf:
                  - required:
                      - ip
                      - fuzzy
                      - domain
                      - type
                      - geoIP
                    properties:
                      ip:
                        type: string
                        example: 203.0.113.42
                      fuzzy:
                        type: boolean
                        example: false
                      domain:
                        type: string
                        example: example-isp.net
                      type:
                        type: string
                        example: isp
                      automation_detected:
                        description: >-
                          True when the session's own behaviour gave its browser
                          away as automation (its heartbeats ran ahead of the
                          clock), which is why no company is returned for it.
                        type: boolean
                        example: false
                      geoIP:
                        properties:
                          country:
                            type: string
                            example: United States
                          country_code:
                            type: string
                            example: US
                          city:
                            type: string
                            example: New York
                          state:
                            type: string
                            example: New York
                        type: object
                    type: object
                  - properties:
                      error:
                        type: string
                        example: not found
                    type: object
                  - description: >-
                      Session not yet ingested — poll again after retry_after
                      seconds
                    properties:
                      success:
                        type: boolean
                        example: false
                      message:
                        type: string
                        example: Session not found
                      retry_after:
                        type: integer
                        example: 5
                    type: object
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