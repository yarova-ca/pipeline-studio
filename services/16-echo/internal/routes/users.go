package routes

import (
	"net/http"

	"github.com/labstack/echo/v4"
	echoauth "github.com/yarova-ca/16-echo/internal/auth"
	"github.com/yarova-ca/16-echo/internal/db"
)

// RegisterUsers mounts all /users routes on the provided Echo instance.
func RegisterUsers(e *echo.Echo) {
	g := e.Group("/users", echoauth.RequireAuth)
	g.GET("/me/items", handleListItems)
	g.POST("/me/items", handleCreateItem)
	g.GET("/me/items/:id", handleGetItem)
	g.PUT("/me/items/:id", handleUpdateItem)
	g.DELETE("/me/items/:id", handleDeleteItem)
}

func handleListItems(c echo.Context) error {
	claims := echoauth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
	}

	database := db.GetDB()
	var items []db.Item
	if err := database.Where("user_id = ?", claims.UserID).Find(&items).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "database error"})
	}
	if items == nil {
		items = []db.Item{}
	}
	return c.JSON(http.StatusOK, items)
}

func handleCreateItem(c echo.Context) error {
	claims := echoauth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
	}

	var body struct {
		Title       string `json:"title" form:"title"`
		Description string `json:"description" form:"description"`
	}
	if err := c.Bind(&body); err != nil || body.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "title is required"})
	}

	item := db.Item{Title: body.Title, Description: body.Description, UserID: claims.UserID}
	database := db.GetDB()
	if err := database.Create(&item).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "database error"})
	}
	return c.JSON(http.StatusCreated, item)
}

func handleGetItem(c echo.Context) error {
	claims := echoauth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
	}

	id := c.Param("id")
	database := db.GetDB()
	var item db.Item
	if err := database.Where("id = ? AND user_id = ?", id, claims.UserID).First(&item).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "item not found"})
	}
	return c.JSON(http.StatusOK, item)
}

func handleUpdateItem(c echo.Context) error {
	claims := echoauth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
	}

	id := c.Param("id")
	database := db.GetDB()
	var item db.Item
	if err := database.Where("id = ? AND user_id = ?", id, claims.UserID).First(&item).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "item not found"})
	}

	var body struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
	}
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
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
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "database error"})
		}
	}
	return c.JSON(http.StatusOK, item)
}

func handleDeleteItem(c echo.Context) error {
	claims := echoauth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
	}

	id := c.Param("id")
	database := db.GetDB()
	result := database.Where("id = ? AND user_id = ?", id, claims.UserID).Delete(&db.Item{})
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "database error"})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "item not found"})
	}
	return c.NoContent(http.StatusNoContent)
}
