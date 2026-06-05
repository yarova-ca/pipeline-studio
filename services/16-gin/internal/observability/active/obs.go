package active

import (
	"context"
	"github.com/gin-gonic/gin"
)

func Init(r *gin.Engine) func(context.Context) error {
	return func(context.Context) error { return nil }
}
