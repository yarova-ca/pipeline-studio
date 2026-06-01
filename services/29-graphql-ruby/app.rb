require "graphql"
require "rack"

QueryType = GraphQL::ObjectType.define do
  name "Query"
  field :health, !types.String, resolve: ->(_obj, _args, _ctx) { "ok" }
end

Schema = GraphQL::Schema.define { query QueryType }

class App
  def call(env)
    req = Rack::Request.new(env)
    if req.path == "/graphql" && req.post?
      body = JSON.parse(req.body.read)
      result = Schema.execute(body["query"])
      [200, { "Content-Type" => "application/json" }, [result.to_json]]
    elsif req.path.start_with?("/health")
      [200, { "Content-Type" => "application/json" }, ['{"status":"ok"}']]
    else
      [404, {}, ["Not Found"]]
    end
  end
end

require "json"
run App.new
