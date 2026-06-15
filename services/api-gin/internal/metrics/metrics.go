package metrics

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var httpDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
	Name: "http_request_duration_seconds",
	Help: "HTTP request duration in seconds",
}, []string{"method", "path", "status"})

// Middleware records the duration of every request.
func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		httpDuration.WithLabelValues(c.Request.Method, c.FullPath(), strconv.Itoa(c.Writer.Status())).
			Observe(time.Since(start).Seconds())
	}
}

// Handler serves the Prometheus exposition format at /metrics.
func Handler() gin.HandlerFunc {
	h := promhttp.Handler()
	return func(c *gin.Context) { h.ServeHTTP(c.Writer, c.Request) }
}
