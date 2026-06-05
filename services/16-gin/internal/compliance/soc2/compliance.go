package active

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

func Apply(r *gin.Engine) {
	gin.SetMode(gin.ReleaseMode)
	r.Use(func(c *gin.Context) {
		slog.Info("soc2_audit",
			"actor", c.GetHeader("X-User-ID"),
			"action", c.Request.Method,
			"resource", c.Request.URL.Path,
			"ts", time.Now().UTC().Format(time.RFC3339),
		)
		c.Next()
	})
}
