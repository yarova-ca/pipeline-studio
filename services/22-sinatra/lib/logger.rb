# Structured JSON logger for Ruby services
require 'logger'
require 'json'

module AppLogger
  def self.create
    logger = Logger.new($stdout)
    logger.formatter = proc do |severity, datetime, _progname, msg|
      JSON.generate({
        level: severity.downcase,
        timestamp: datetime.iso8601(3),
        message: msg.is_a?(String) ? msg : msg.inspect
      }) + "\n"
    end
    logger
  end

  LOGGER = create
end
