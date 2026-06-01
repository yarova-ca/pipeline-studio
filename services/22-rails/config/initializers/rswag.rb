# rswag configuration — serves OpenAPI spec from swagger/v1/swagger.yaml.
# Swagger UI is at /api-docs.
# JSON spec is at /api-docs/v1/swagger.json.

Rswag::Ui.configure do |c|
  c.openapi_endpoint "/api-docs/v1/swagger.json", "Rails Service API v1"
end

Rswag::Api.configure do |c|
  c.openapi_root = Rails.root.join("swagger").to_s
end
