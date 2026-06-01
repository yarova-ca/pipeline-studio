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

func InitDB() error {
	var initErr error
	once.Do(func() {
		dsn := os.Getenv("DATABASE_URL")
		if dsn == "" {
			initErr = fmt.Errorf("DATABASE_URL env var is not set")
			return
		}
		logLevel := logger.Silent
		if os.Getenv("APP_ENV") != "production" {
			logLevel = logger.Warn
		}
		database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logLevel),
		})
		if err != nil {
			initErr = fmt.Errorf("opening db: %w", err)
			return
		}
		if err := database.AutoMigrate(&User{}, &Item{}); err != nil {
			initErr = fmt.Errorf("running AutoMigrate: %w", err)
			return
		}
		instance = database
	})
	return initErr
}

func GetDB() *gorm.DB {
	if instance == nil {
		panic("db: GetDB called before InitDB")
	}
	return instance
}

func SetDB(database *gorm.DB) {
	instance = database
	once = sync.Once{}
}
