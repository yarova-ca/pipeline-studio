package active

import "github.com/gin-gonic/gin"

func RequireAuth(c *gin.Context) { c.Next() }
