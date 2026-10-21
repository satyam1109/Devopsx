package si.devopsx.web;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
  private final JdbcTemplate db;
  public HealthController(JdbcTemplate db) { this.db = db; }

  @GetMapping("/api/health")
  public ResponseEntity<Map<String,String>> health() {
    try {
      db.queryForObject("SELECT COUNT(*) FROM content_items", Integer.class);
      return ResponseEntity.ok().header("Cache-Control", "no-store").body(Map.of("status", "UP"));
    } catch (org.springframework.dao.DataAccessException ex) {
      return ResponseEntity.status(503).header("Cache-Control", "no-store").body(Map.of("status", "DOWN"));
    }
  }
}
