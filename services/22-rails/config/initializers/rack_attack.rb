# Rate limiting via Rack::Attack — 100 requests per minute per IP.
# Health endpoints are exempt so k8s probes are never blocked.

class Rack::Attack
  # Health and docs endpoints are exempt from all rate limiting.
  safelist("allow health probes") do |req|
    req.path.start_with?("/health") || req.path.start_with?("/api-docs")
  end

  # 100 requests per minute per remote IP.
  throttle("req/ip", limit: 100, period: 60) do |req|
    req.ip
  end

  self.throttled_responder = lambda do |env|
    [
      429,
      { "Content-Type" => "application/json" },
      ['{"error":"Too many requests — try again in 60 seconds"}'],
    ]
  end
end
