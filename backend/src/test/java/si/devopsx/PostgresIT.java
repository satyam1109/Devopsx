package si.devopsx;

import java.net.URI;
import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import si.devopsx.content.ContentItem;
import si.devopsx.content.ContentService;
import si.devopsx.learning.LearningController;
import si.devopsx.media.MediaController;
import tools.jackson.databind.ObjectMapper;

/** Opt-in tests against a disposable real Postgres database, never the local H2 store. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {"app.seed.enabled=true", "server.servlet.session.cookie.secure=false",
        "app.cors.allowed-origins=https://app.example.com"})
@ActiveProfiles({"production", "render"})
class PostgresIT {
  @LocalServerPort int port;
  @Autowired JdbcTemplate db;
  @Autowired ContentService content;
  @Autowired LearningController learning;
  @Autowired MediaController media;
  @Autowired ObjectMapper json;

  @DynamicPropertySource
  static void database(DynamicPropertyRegistry properties) {
    String url = System.getenv("DEVOPSX_TEST_DATABASE_URL");
    if (url == null || !url.startsWith("jdbc:postgresql://127.0.0.1:")) {
      throw new IllegalStateException("Supply a disposable loopback DEVOPSX_TEST_DATABASE_URL");
    }
    properties.add("spring.datasource.url", () -> url);
    properties.add("spring.datasource.username", () -> System.getenv("DEVOPSX_TEST_DATABASE_USER"));
    properties.add("spring.datasource.password", () -> System.getenv("DEVOPSX_TEST_DATABASE_PASSWORD"));
  }

  @Test void migrationAndPublishedContentAreReady() {
    assertEquals(1, db.queryForObject(
        "SELECT COUNT(*) FROM flyway_schema_history WHERE version='1' AND success", Integer.class));
    assertFalse(content.published().isEmpty());
    assertTrue(content.published().stream().noneMatch(x -> x.id().equals("draft-lesson")));
  }

  @Test void contentCompletionPreferencesAndReviewsUsePostgresUpserts() {
    String title = "Postgres fixture " + UUID.randomUUID();
    var input = new ContentItem(null,"LESSON","models",List.of(),title,"Dummy fixture",
        "PUBLISHED",99,5,List.of(),List.of(new ContentItem.Block("body","paragraph",null,
        "Dummy body",null,null,null)),null,null,null,List.of(),null,List.of());
    var lesson = content.save(null,input);
    assertEquals(lesson.id(), content.save(lesson.id(),lesson).id());
    assertEquals(title, content.find(lesson.id()).title());
    learning.complete(lesson.id());
    learning.complete(lesson.id());
    assertEquals(1, db.queryForObject("SELECT COUNT(*) FROM completions WHERE lesson_id=?",
        Integer.class,lesson.id()));
    var preferences = Map.<String,Object>of("name","Postgres fixture","trackId","track-ai",
        "dailyGoal",15,"saved",List.of(lesson.id()),"onboarded",true);
    learning.preferences(preferences);
    learning.preferences(preferences);
    assertEquals("Postgres fixture",learning.preferences().get("name"));
    int before = db.queryForObject("SELECT COALESCE(MAX(repetitions),0) FROM reviews WHERE card_id='card-concept'",Integer.class);
    learning.review(new LearningController.Review("card-concept",3));
    learning.review(new LearningController.Review("card-concept",4));
    assertEquals(before+2,db.queryForObject("SELECT repetitions FROM reviews WHERE card_id='card-concept'",Integer.class));
  }

  @Test void imagesRoundTripThroughPostgresBytea() throws Exception {
    byte[] bytes = java.util.Base64.getDecoder().decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=");
    var uploaded = media.upload(new MockMultipartFile("file","fixture.png","image/png",bytes));
    assertArrayEquals(bytes,media.image(uploaded.get("id")).getBody());
    assertTrue(media.list().stream().anyMatch(x->x.get("id").equals(uploaded.get("id"))));
  }

  @Test void healthCorsAndProductionAccessAreEnforced() throws Exception {
    var client = HttpClient.newBuilder().cookieHandler(new CookieManager(null,CookiePolicy.ACCEPT_ALL)).build();
    String base = "http://127.0.0.1:"+port+"/api";
    var health = client.send(HttpRequest.newBuilder(URI.create(base+"/health")).GET().build(),HttpResponse.BodyHandlers.ofString());
    assertEquals(200,health.statusCode());
    assertEquals("UP",json.readTree(health.body()).get("status").asString());
    var allowed = client.send(HttpRequest.newBuilder(URI.create(base+"/catalog"))
        .header("Origin","https://app.example.com").GET().build(),HttpResponse.BodyHandlers.ofString());
    assertEquals(200,allowed.statusCode());
    assertEquals("https://app.example.com",allowed.headers().firstValue("Access-Control-Allow-Origin").orElseThrow());
    var denied = client.send(HttpRequest.newBuilder(URI.create(base+"/catalog"))
        .header("Origin","https://untrusted.example.com").GET().build(),HttpResponse.BodyHandlers.ofString());
    assertEquals(403,denied.statusCode());
    var session = client.send(HttpRequest.newBuilder(URI.create(base+"/session")).GET().build(),HttpResponse.BodyHandlers.ofString());
    assertFalse(json.readTree(session.body()).get("demo").asBoolean());
    String csrf = json.readTree(session.body()).get("csrfToken").asString();
    var switchRole = client.send(HttpRequest.newBuilder(URI.create(base+"/demo/session"))
        .header("Content-Type","application/json").header("X-CSRF-TOKEN",csrf)
        .POST(HttpRequest.BodyPublishers.ofString("{\"role\":\"ADMIN\"}")).build(),HttpResponse.BodyHandlers.ofString());
    assertEquals(404,switchRole.statusCode());
    for (String path : List.of("/admin/content","/admin/media","/progress","/preferences")) {
      assertEquals(401,client.send(HttpRequest.newBuilder(URI.create(base+path)).GET().build(),
          HttpResponse.BodyHandlers.ofString()).statusCode());
    }
  }
}
