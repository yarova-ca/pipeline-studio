package active

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Apply(r *gin.Engine) {
	r.Use(func(c *gin.Context) {
		m := c.Request.Method
		if (m == "POST" || m == "PUT" || m == "PATCH") && c.GetHeader("X-Consent") != "granted" {
			c.AbortWithStatusJSON(http.StatusUnavailableForLegalReasons, gin.H{"error": "PIPEDA: consent required"})
			return
		}
		c.Header("X-Data-Residency", "CA")
		c.Next()
	})
}
