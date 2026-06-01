require "faye/websocket"
require "json"

Faye::WebSocket.load_adapter("rack")

class App
  def call(env)
    if Faye::WebSocket.websocket?(env)
      ws = Faye::WebSocket.new(env)
      ws.on(:message) { |e| ws.send(JSON.generate({ echo: e.data })) }
      ws.rack_response
    elsif env["PATH_INFO"].start_with?("/health")
      [200, { "Content-Type" => "application/json" }, ['{"status":"ok","version":"1.0.0"}']]
    else
      [404, {}, ["Not Found"]]
    end
  end
end
