package routes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	ginauth "github.com/yarova-ca/16-gin/internal/auth"
	"github.com/yarova-ca/16-gin/internal/db"
)

// RegisterUsers mounts all /users routes on the provided engine.
// All routes require authentication via RequireAuth middleware.
func RegisterUsers(r *gin.Engine) {
	users := r.Group("/users", ginauth.RequireAuth)
	{
		users.GET("/me/items", handleListItems)
		users.POST("/me/items", handleCreateItem)
		users.GET("/me/items/:id", handleGetItem)
		users.PUT("/me/items/:id", handleUpdateItem)
		users.DELETE("/me/items/:id", handleDeleteItem)
	}
}

// handleListItems returns paginated items belonging to the authenticated user.
// Query params: limit (1–100, default 20), offset (≥0, default 0).
func handleListItems(c *gin.Context) {
	claims := ginauth.GetClaims(c)
	if claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil || limit < 1 || limit > 100 {
		limit = 20
	}
	offset, err := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if err != nil || offset < 0 {
		offset = 0
	}

	database := db.GetDB()
	var items []db.Item
	var total int64

	database.Model(&db.Item{}).Where("user_id = ?", claims.UserID).Count(&total)
	if err := database.Where("user_id = ?", claims.UserID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items":  items,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// handleCreateItem creates a new item for the authenticated user.
// title is required; description is optional.
func handleCreateItem(c *gin.Context) {
	claims := ginauth.GetClaims(c)
	if claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	var body struct {
		Title       string  `json:"title" binding:"required,min=1,max=500"`
		Description *string `json:"description" binding:"omitempty,max=2000"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required and must be 1–500 characters"})
		return
	}

	description := ""
	if body.Description != nil {
		description = *body.Description
	}
	item := db.Item{
		Title:       body.Title,
		Description: description,
		UserID:      claims.UserID,
	}

	database := db.GetDB()
	if err := database.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusCreated, item)
}

// handleGetItem returns a single item by ID, scoped to the authenticated user.
func handleGetItem(c *gin.Context) {
	claims := ginauth.GetClaims(c)
	if claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	id := c.Param("id")
	database := db.GetDB()
	var item db.Item
	if err := database.Where("id = ? AND user_id = ?", id, claims.UserID).First(&item).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
		return
	}

	c.JSON(http.StatusOK, item)
}

// handleUpdateItem updates title and/or description for a user-owned item.
func handleUpdateItem(c *gin.Context) {
	claims := ginauth.GetClaims(c)
	if claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	id := c.Param("id")
	database := db.GetDB()
	var item db.Item
	if err := database.Where("id = ? AND user_id = ?", id, claims.UserID).First(&item).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
		return
	}

	var body struct {
		Title       *string `json:"title" binding:"omitempty,min=1,max=500"`
		Description *string `json:"description" binding:"omitempty,max=2000"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	updates := map[string]interface{}{}
	if body.Title != nil {
		updates["title"] = *body.Title
	}
	if body.Description != nil {
		updates["description"] = *body.Description
	}

	if len(updates) > 0 {
		if err := database.Model(&item).Updates(updates).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
			return
		}
	}

	c.JSON(http.StatusOK, item)
}

// handleDeleteItem deletes a user-owned item and returns 204 No Content.
func handleDeleteItem(c *gin.Context) {
	claims := ginauth.GetClaims(c)
	if claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	id := c.Param("id")
	database := db.GetDB()
	result := database.Where("id = ? AND user_id = ?", id, claims.UserID).Delete(&db.Item{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
		return
	}

	c.Status(http.StatusNoContent)
}
