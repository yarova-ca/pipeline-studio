class HealthController < ActionController::API
  def hello
    render json: { message: 'Hello from Rails 8.0', framework: '22-rails', version: '1.0.0' }
  end

  def health
    render json: { status: 'ok', version: '1.0.0' }
  end

  def liveness
    render json: { status: 'ok' }
  end

  def readiness
    render json: { status: 'ok' }
  end
end
