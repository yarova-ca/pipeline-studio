# JSON structured logging via lograge.
# Emits one JSON object per request to stdout instead of Rails multi-line output.
# Each line includes: method, path, status, duration, timestamp.

Rails.application.configure do
  config.lograge.enabled = true
  config.lograge.formatter = Lograge::Formatters::Json.new
  config.lograge.base_controller_class = "ActionController::API"
  config.lograge.custom_options = lambda do |event|
    {
      time: Time.now.utc.iso8601(3),
      request_id: event.payload[:headers]&.dig("action_dispatch.request_id"),
    }.compact
  end
end
