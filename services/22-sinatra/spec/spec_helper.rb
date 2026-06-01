require 'rack/test'
require_relative '../app'

module RSpecMixin
  include Rack::Test::Methods
  def app = Sinatra::Application
end

RSpec.configure { |c| c.include RSpecMixin }
