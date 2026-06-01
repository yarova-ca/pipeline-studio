package routes

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	chiauth "github.com/yarova-ca/16-chi/internal/auth"
	"github.com/yarova-ca/16-chi/internal/db"
)

// RegisterUsers mounts all /users routes on the provided router.
func RegisterUsers(r chi.Router) {
	r.Route("/users", func(r chi.Router) {
		r.Use(chiauth.RequireAuth)
		r.Get("/me/items", handleListItems)
		r.Post("/me/items", handleCreateItem)
		r.Get("/me/items/{id}", handleGetItem)
		r.Put("/me/items/{id}", handleUpdateItem)
		r.Delete("/me/items/{id}", handleDeleteItem)
	})
}

func handleListItems(w http.ResponseWriter, r *http.Request) {
	claims := chiauth.GetClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}

	database := db.GetDB()
	var items []db.Item
	if err := database.Where("user_id = ?", claims.UserID).Find(&items).Error; err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "database error"})
		return
	}
	if items == nil {
		items = []db.Item{}
	}
	writeJSON(w, http.StatusOK, items)
}

func handleCreateItem(w http.ResponseWriter, r *http.Request) {
	claims := chiauth.GetClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}

	var body struct {
		Title       string `json:"title"`
		Description string `json:"description"`
	}
	if err := decodeBody(r, &body); err != nil || body.Title == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title is required"})
		return
	}

	item := db.Item{Title: body.Title, Description: body.Description, UserID: claims.UserID}
	database := db.GetDB()
	if err := database.Create(&item).Error; err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "database error"})
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func handleGetItem(w http.ResponseWriter, r *http.Request) {
	claims := chiauth.GetClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}

	id := chi.URLParam(r, "id")
	database := db.GetDB()
	var item db.Item
	if err := database.Where("id = ? AND user_id = ?", id, claims.UserID).First(&item).Error; err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "item not found"})
		return
	}
	writeJSON(w, http.StatusOK, item)
}

func handleUpdateItem(w http.ResponseWriter, r *http.Request) {
	claims := chiauth.GetClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}

	id := chi.URLParam(r, "id")
	database := db.GetDB()
	var item db.Item
	if err := database.Where("id = ? AND user_id = ?", id, claims.UserID).First(&item).Error; err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "item not found"})
		return
	}

	var body struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
	}
	if err := decodeBody(r, &body); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
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
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "database error"})
			return
		}
	}
	writeJSON(w, http.StatusOK, item)
}

func handleDeleteItem(w http.ResponseWriter, r *http.Request) {
	claims := chiauth.GetClaims(r)
	if claims == nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
		return
	}

	id := chi.URLParam(r, "id")
	database := db.GetDB()
	result := database.Where("id = ? AND user_id = ?", id, claims.UserID).Delete(&db.Item{})
	if result.Error != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "database error"})
		return
	}
	if result.RowsAffected == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "item not found"})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func decodeBody(r *http.Request, v interface{}) error {
	return json.NewDecoder(r.Body).Decode(v)
}
