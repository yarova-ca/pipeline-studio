// Package logger provides structured JSON logging for Go services.
// Uses log/slog from the standard library (Go 1.21+).
// Why slog: built-in, no external dependency, JSON output parseable by all log aggregators.
package logger

import (
	"log/slog"
	"os"
)

// New creates a JSON logger writing to stdout.
func New() *slog.Logger {
	return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
}

// Default initialises the default slog logger with JSON output.
func Init() {
	slog.SetDefault(New())
}
