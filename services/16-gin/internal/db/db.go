package db

import (
	"fmt"
	"os"
	"sync"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	instance *gorm.DB
	once     sync.Once
)

// InitDB opens a GORM connection to DATABASE_URL and runs AutoMigrate.
// Returns an error if DATABASE_URL is unset or the connection fails.
func InitDB() error {
	var initErr error
	once.Do(func() {
		dsn := os.Getenv("DATABASE_URL")
		if dsn == "" {
			initErr = fmt.Errorf("DATABASE_URL env var is not set")
			return
		}

		logLevel := logger.Silent
		if os.Getenv("GIN_MODE") != "release" {
			logLevel = logger.Warn
		}

		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logLevel),
		})
		if err != nil {
			initErr = fmt.Errorf("opening db: %w", err)
			return
		}

		if err := db.AutoMigrate(&User{}, &Item{}); err != nil {
			initErr = fmt.Errorf("running AutoMigrate: %w", err)
			return
		}

		instance = db
	})
	return initErr
}

// GetDB returns the singleton *gorm.DB.
// Panics if InitDB has not been called — callers must call InitDB at startup.
func GetDB() *gorm.DB {
	if instance == nil {
		panic("db: GetDB called before InitDB — call InitDB at startup")
	}
	return instance
}

// GetDBOrNil returns the singleton *gorm.DB or nil if InitDB has not been called.
// Use this in code paths where a missing DB is a valid state (e.g. health checks
// in dev mode without DATABASE_URL set).
func GetDBOrNil() *gorm.DB {
	return instance
}

// SetDB replaces the singleton with the provided instance.
// Used in tests to inject a test database without touching the real DATABASE_URL.
func SetDB(db *gorm.DB) {
	instance = db
	once = sync.Once{} // reset so InitDB can be called again in tests if needed
}
