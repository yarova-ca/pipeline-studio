package ca.yarova.graphql;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

@Controller
class GraphQlHealthController {
    @QueryMapping
    public String health() { return "ok"; }
}

@RestController
class HttpHealthController {
    @GetMapping("/health")
    public Map<String, String> health() { return Map.of("status", "ok", "version", "1.0.0"); }

    @GetMapping("/health/live")
    public Map<String, String> live() { return Map.of("status", "ok"); }

    @GetMapping("/health/ready")
    public Map<String, String> ready() { return Map.of("status", "ok"); }
}
