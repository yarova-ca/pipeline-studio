package active

import (
	"context"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func Init(r *gin.Engine) func(context.Context) error {
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))
	return func(context.Context) error { return nil }
}
