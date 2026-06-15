package db

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents an authenticated user, created on first OAuth login.
type User struct {
	ID        string    `gorm:"type:text;primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Name      string    `gorm:"not null" json:"name"`
	APIKey    *string   `gorm:"uniqueIndex" json:"api_key,omitempty"`
	Provider  string    `gorm:"not null;default:'github'" json:"provider"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BeforeCreate sets a UUID primary key when none is provided.
func (u *User) BeforeCreate(_ *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

// Item belongs to a User and represents a user-owned resource.
type Item struct {
	ID          string    `gorm:"type:text;primaryKey" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	UserID      string    `gorm:"type:text;not null;index" json:"user_id"`
	User        User      `gorm:"foreignKey:UserID" json:"-"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// BeforeCreate sets a UUID primary key when none is provided.
func (i *Item) BeforeCreate(_ *gorm.DB) error {
	if i.ID == "" {
		i.ID = uuid.New().String()
	}
	return nil
}
