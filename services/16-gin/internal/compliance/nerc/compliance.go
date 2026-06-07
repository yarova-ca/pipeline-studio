package active

import (
	"os"

	"github.com/gin-gonic/gin"
)

func Apply(r *gin.Engine) {
	os.Setenv("NO_EGRESS", "true") //nolint:errcheck
	r.Use(func(c *gin.Context) {
		c.Header("X-OT-IT-Boundary", "enforced")
		c.Header("X-Network-Isolation", "on")
		c.Next()
	})
}
