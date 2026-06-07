package active

import (
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func Apply(r *gin.Engine) {
	gin.SetMode(gin.ReleaseMode)
	os.Setenv("NO_EGRESS", "true") //nolint:errcheck
	r.Use(func(c *gin.Context) {
		slog.Info("cmmc_audit",
			"actor", c.GetHeader("X-User-ID"),
			"action", c.Request.Method,
			"resource", c.Request.URL.Path,
			"ts", time.Now().UTC().Format(time.RFC3339),
		)
		if strings.HasPrefix(c.Request.URL.Path, "/debug") {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
		c.Next()
	})
}
