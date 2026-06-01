import org.scalatestplus.play._
import org.scalatestplus.play.guice._
import play.api.test._
import play.api.test.Helpers._

class HealthControllerSpec extends PlaySpec with GuiceOneAppPerTest {

  "HealthController" should {
    "return hello on GET /" in {
      val result = route(app, FakeRequest(GET, "/")).get
      status(result) mustBe OK
    }
    "return ok on GET /health" in {
      val result = route(app, FakeRequest(GET, "/health")).get
      status(result) mustBe OK
    }
    "return ok on GET /health/live" in {
      status(route(app, FakeRequest(GET, "/health/live")).get) mustBe OK
    }
    "return ok on GET /health/ready" in {
      status(route(app, FakeRequest(GET, "/health/ready")).get) mustBe OK
    }
  }
}
