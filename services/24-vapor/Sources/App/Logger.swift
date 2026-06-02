import Logging
import Foundation

// Configure structured JSON logging for production
extension Logger {
    static func configure() {
        LoggingSystem.bootstrap { label in
            var handler = StreamLogHandler.standardOutput(label: label)
            handler.logLevel = .info
            return handler
        }
    }
}
