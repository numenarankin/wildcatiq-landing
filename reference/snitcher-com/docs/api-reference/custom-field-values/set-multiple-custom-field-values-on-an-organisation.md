> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Set multiple custom field values on an organisation

> Set one or more custom field values in a single request (at most 50 per request). Unknown field keys are created automatically, with their type inferred from the value — so an integration does not have to pre-create fields. Values are validated against each field's type, and for select/status/multi-select fields against the field's defined options; an unusable value, an off-list option, or a bad key returns a 422 naming the offending key. Validation covers the whole payload before anything is written, so a rejected key never leaves earlier keys half-applied. Every value must be non-empty: sending an empty array does not clear a multi-select — use the DELETE custom-fields/{key} endpoint to remove a value.



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json patch /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}/custom-fields
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
  /v1/workspaces/{workspaceUuid}/organisations/{organisationUuid}/custom-fields:
    patch:
      tags:
        - Custom Field Values
      summary: Set multiple custom field values on an organisation
      description: >-
        Set one or more custom field values in a single request (at most 50 per
        request). Unknown field keys are created automatically, with their type
        inferred from the value — so an integration does not have to pre-create
        fields. Values are validated against each field's type, and for
        select/status/multi-select fields against the field's defined options;
        an unusable value, an off-list option, or a bad key returns a 422 naming
        the offending key. Validation covers the whole payload before anything
        is written, so a rejected key never leaves earlier keys half-applied.
        Every value must be non-empty: sending an empty array does not clear a
        multi-select — use the DELETE custom-fields/{key} endpoint to remove a
        value.
      operationId: e5fb2f188ed4aa818684c53ace53cc62
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
              $ref: '#/components/schemas/SetOrganisationCustomFieldValuesRequest'
      responses:
        '200':
          description: The custom field values that were set
          content:
            application/json:
              schema:
                properties:
                  success:
                    type: boolean
                    example: true
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/CustomFieldValue'
                type: object
        '404':
          description: The organisation does not exist
        '422':
          description: A field key or value was invalid
      security:
        - Snitcher bearer token: []
components:
  schemas:
    SetOrganisationCustomFieldValuesRequest:
      title: Set Organisation Custom Field Values Request
      required:
        - custom_fields
      properties:
        custom_fields:
          description: >-
            Map of field key to value (at most 50 keys per request). Unknown
            keys are created automatically, with their type inferred from the
            value. Every value must be non-empty — sending an empty array does
            not clear a multi-select; use the DELETE custom-fields/{key}
            endpoint to remove a value.
          type: object
          example:
            deal_size: 50000
            account_tier: enterprise
      type: object
    CustomFieldValue:
      title: Custom Field Value
      description: A custom field value set on an organisation
      properties:
        field_identifier:
          description: The identifier of the field
          type: string
          example: industry
        field_key:
          description: The machine-readable key of the field
          type: string
          example: industry
        field_type:
          description: The data type of the field
          type: string
          example: text
        value:
          description: The value of the field
          example: Technology
        source:
          description: The source of the value
          type: string
          example: manual
        updated_at:
          type: string
          format: date-time
          example: '2024-01-01T00:00:00Z'
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