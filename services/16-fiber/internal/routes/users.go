package routes

import (
	"github.com/gofiber/fiber/v3"
	fiberauth "github.com/yarova-ca/16-fiber/internal/auth"
	"github.com/yarova-ca/16-fiber/internal/db"
)

// RegisterUsers mounts all /users routes on the provided Fiber app.
func RegisterUsers(app *fiber.App) {
	users := app.Group("/users", fiberauth.RequireAuth)
	users.Get("/me/items", handleListItems)
	users.Post("/me/items", handleCreateItem)
	users.Get("/me/items/:id", handleGetItem)
	users.Put("/me/items/:id", handleUpdateItem)
	users.Delete("/me/items/:id", handleDeleteItem)
}

func handleListItems(c fiber.Ctx) error {
	claims := fiberauth.GetClaims(c)
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "not authenticated"})
	}

	database := db.GetDB()
	var items []db.Item
	if err := database.Where("user_id = ?", claims.UserID).Find(&items).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
	}
	if items == nil {
		items = []db.Item{}
	}
	return c.JSON(items)
}

func handleCreateItem(c fiber.Ctx) error {
	claims := fiberauth.GetClaims(c)
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "not authenticated"})
	}

	var body struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	}
	if err := c.Bind().JSON(&body); err != nil || body.Title == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "title is required"})
	}

	item := db.Item{Title: body.Title, Description: body.Description, UserID: claims.UserID}
	database := db.GetDB()
	if err := database.Create(&item).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
	}
	return c.Status(fiber.StatusCreated).JSON(item)
}

func handleGetItem(c fiber.Ctx) error {
	claims := fiberauth.GetClaims(c)
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "not authenticated"})
	}

	id := c.Params("id")
	database := db.GetDB()
	var item db.Item
	if err := database.Where("id = ? AND user_id = ?", id, claims.UserID).First(&item).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "item not found"})
	}
	return c.JSON(item)
}

func handleUpdateItem(c fiber.Ctx) error {
	claims := fiberauth.GetClaims(c)
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "not authenticated"})
	}

	id := c.Params("id")
	database := db.GetDB()
	var item db.Item
	if err := database.Where("id = ? AND user_id = ?", id, claims.UserID).First(&item).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "item not found"})
	}

	var body struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
	}
	if err := c.Bind().JSON(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
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
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
		}
	}
	return c.JSON(item)
}

func handleDeleteItem(c fiber.Ctx) error {
	claims := fiberauth.GetClaims(c)
	if claims == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "not authenticated"})
	}

	id := c.Params("id")
	database := db.GetDB()
	result := database.Where("id = ? AND user_id = ?", id, claims.UserID).Delete(&db.Item{})
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "database error"})
	}
	if result.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "item not found"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
