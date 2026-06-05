package active

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func Apply(r *gin.Engine) {
	if os.Getenv("OPENSSL_FIPS") != "1" && os.Getenv("GOFIPS") != "1" {
		log.Fatal("FIPS: non-FIPS runtime — build with RUNTIME=fips")
	}
	gin.SetMode(gin.ReleaseMode)
}
