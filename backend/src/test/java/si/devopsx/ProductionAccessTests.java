package si.devopsx;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.ObjectMapper;
import java.net.*;
import java.net.http.*;
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"spring.datasource.url=jdbc:h2:mem:closed-profile;DB_CLOSE_DELAY=-1"})
@ActiveProfiles("production")
class ProductionAccessTests {
 @LocalServerPort int port;
 @Autowired ObjectMapper json;
 @Test void demoRoleSwitchIsDisabledOutsideDemo()throws Exception {
  var client=HttpClient.newBuilder().cookieHandler(new CookieManager(null,CookiePolicy.ACCEPT_ALL)).build();var base="http://127.0.0.1:"+port+"/api";
  var session=client.send(HttpRequest.newBuilder(URI.create(base+"/session")).GET().build(),HttpResponse.BodyHandlers.ofString());var token=json.readTree(session.body()).get("csrfToken").asString();
  var result=client.send(HttpRequest.newBuilder(URI.create(base+"/demo/session")).header("Content-Type","application/json").header("X-CSRF-TOKEN",token).POST(HttpRequest.BodyPublishers.ofString("{\"role\":\"ADMIN\"}")).build(),HttpResponse.BodyHandlers.ofString());assertEquals(404,result.statusCode());
  assertEquals(401,client.send(HttpRequest.newBuilder(URI.create(base+"/admin/content")).GET().build(),HttpResponse.BodyHandlers.ofString()).statusCode());
 }
}
