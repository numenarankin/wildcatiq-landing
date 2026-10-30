> ## Documentation Index
> Fetch the complete documentation index at: https://docs.snitcher.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Update a custom field definition



## OpenAPI

````yaml https://app.snitcher.com/api/docs?api-docs.json patch /v1/workspaces/{workspaceUuid}/custom-fields/{key}
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
  /v1/workspaces/{workspaceUuid}/custom-fields/{key}:
    patch:
      tags:
        - Custom Fields
      summary: Update a custom field definition
      operationId: 1fbaac83d80065c38e0a450f2ba82446
      parameters:
        - name: workspaceUuid
          in: path
          description: The UUID of the workspace
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
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateCustomFieldRequest'
      responses:
        '200':
          description: The updated custom field definition
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CustomField'
        '403':
          description: >-
            The field is read-only, including research fields managed by
            Snitcher in this workspace
        '404':
          description: The custom field does not exist
      security:
        - Snitcher bearer token: []
components:
  schemas:
    UpdateCustomFieldRequest:
      title: Update Custom Field Request
      description: Request body for updating a custom field definition
      properties:
        name:
          description: The human-readable name of the field
          type: string
          maxLength: 255
          example: Industry
          nullable: true
        description:
          type: string
          maxLength: 1000
          example: The primary industry of the company.
          nullable: true
        visible_in_spotter:
          description: >-
            Expose this field's values in the Spotter API response. Omitted or
            null leaves the current setting unchanged; exposed values become
            readable on your website by any script that can access the Spotter
            response.
          type: boolean
          example: false
          nullable: true
        field_rules:
          type: array
          items:
            required:
              - type
            properties:
              type:
                description: The rule type
                type: string
              config:
                type: object
                nullable: true
            type: object
          nullable: true
        options:
          type: array
          items:
            required:
              - key
              - label
            properties:
              key:
                type: string
                maxLength: 255
                example: technology
              label:
                type: string
                maxLength: 255
                example: Technology
              color:
                type: string
                maxLength: 50
                example: '#FF0000'
                nullable: true
            type: object
          nullable: true
      type: object
    CustomField:
      title: Custom Field
      description: A custom field definition for organisations
      properties:
        identifier:
          description: The unique identifier of the field
          type: string
          example: industry
        key:
          description: The machine-readable key of the field
          type: string
          example: industry
        name:
          description: The human-readable name of the field
          type: string
          example: Industry
        entity_type:
          description: The entity type the field belongs to
          type: string
          example: organisation
        type:
          description: The data type of the field
          type: string
          example: text
        description:
          type: string
          example: The primary industry of the company.
          nullable: true
        group:
          description: The group the field belongs to
          type: string
          example: custom
        is_visible:
          type: boolean
          example: true
        source:
          description: The source of the field
          type: string
          example: manual
        rules:
          type: array
          items:
            type: object
        is_system:
          type: boolean
          example: false
        options:
          type: array
          items:
            type: object
        visible_in_spotter:
          description: Whether this field's values are exposed in the Spotter API response
          type: boolean
          example: false
      type: object
  securitySchemes:
    Snitcher bearer token:
      type: http
      description: Enter your personal access token (PAT) to authenticate
      bearerFormat: JWT
      scheme: bearer

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.