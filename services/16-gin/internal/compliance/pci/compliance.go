package active

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

func Apply(r *gin.Engine) {
	for _, e := range os.Environ() {
		kv := strings.SplitN(e, "=", 2)
		k := strings.ToUpper(kv[0])
		if (strings.Contains(k, "SECRET") || strings.Contains(k, "KEY") || strings.Contains(k, "TOKEN") || strings.Contains(k, "PASS")) &&
			len(kv) == 2 && len(kv[1]) > 0 && len(kv[1]) < 16 {
			log.Fatalf("PCI: %s weak/plaintext secret", kv[0])
		}
	}
	r.Use(func(c *gin.Context) {
		if c.GetHeader("X-Forwarded-Proto") == "http" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "PCI: TLS required"})
			return
		}
		if strings.HasPrefix(c.Request.URL.Path, "/debug") || c.Request.URL.Path == "/metrics" {
			c.AbortWithStatus(http.StatusNotFound)
			return
		}
		c.Header("X-PCI-DSS", "enforced")
		c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		c.Next()
	})
}
