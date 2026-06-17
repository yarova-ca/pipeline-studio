require_relative 'boot'

require 'rails'
require 'active_model/railtie'
require 'active_record/railtie'
require 'action_controller/railtie'
require 'action_view/railtie'

Bundler.require(*Rails.groups)

module PipelineStudio
  class Application < Rails::Application
    config.load_defaults 8.1
    config.api_only = true

    # I-1: refuse to boot on missing or weak config.
    if ENV['JWT_SECRET'].to_s.length < 32
      abort('FATAL: JWT_SECRET must be set and at least 32 characters')
    end

    # I-17: security headers on every response.
    config.action_dispatch.default_headers = {
      'X-Frame-Options' => 'DENY',
      'X-Content-Type-Options' => 'nosniff',
      'Referrer-Policy' => 'strict-origin-when-cross-origin'
    }

    # I-13: Prometheus request metrics + a /metrics scrape endpoint.
    require 'prometheus/middleware/collector'
    require 'prometheus/middleware/exporter'
    config.middleware.use Prometheus::Middleware::Collector
    config.middleware.use Prometheus::Middleware::Exporter
  end
end
