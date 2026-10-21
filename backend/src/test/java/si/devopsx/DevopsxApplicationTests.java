package si.devopsx;

import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ActiveProfiles;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;
import si.devopsx.content.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={"spring.datasource.url=jdbc:h2:mem:integration;DB_CLOSE_DELAY=-1"})
@ActiveProfiles("demo")
class DevopsxApplicationTests {
 @LocalServerPort int port;
 @Autowired ObjectMapper json;
 HttpClient client;String csrf;
 @BeforeEach void setup()throws Exception{client=HttpClient.newBuilder().cookieHandler(new CookieManager(null,CookiePolicy.ACCEPT_ALL)).build();csrf=parse(request("GET","/session",null,false)).get("csrfToken").asString();}
 HttpResponse<String> request(String method,String path,Object body,boolean token)throws Exception{
  var req=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api"+path));
  if(token)req.header("X-CSRF-TOKEN",csrf);
  if(body!=null)req.header("Content-Type","application/json");
  return client.send(req.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body))).build(),HttpResponse.BodyHandlers.ofString());
 }
 JsonNode parse(HttpResponse<String> r){return json.readTree(r.body());}
 void login(String role)throws Exception{assertEquals(200,request("POST","/demo/session",Map.of("role",role),true).statusCode());csrf=parse(request("GET","/session",null,false)).get("csrfToken").asString();}
 ContentItem item(String title,String kind,String parent,String status,List<ContentItem.Block> blocks){return new ContentItem(null,kind,parent,List.of(),title,"Integration test",status,0,5,List.of(),blocks,null,null,null,List.of(),null,List.of());}
 ContentItem create(ContentItem input)throws Exception{var r=request("POST","/admin/content",input,true);assertEquals(200,r.statusCode(),r.body());return json.readValue(r.body(),ContentItem.class);}
 @Test void enforcesAdminRoleAndCsrf()throws Exception{
  assertEquals(401,request("GET","/admin/content",null,false).statusCode());login("LEARNER");
  assertEquals(403,request("GET","/admin/content",null,false).statusCode());login("ADMIN");
  assertEquals(403,request("POST","/admin/content",item("Blocked","TRACK",null,"DRAFT",List.of()),false).statusCode());
  assertEquals(200,request("GET","/admin/content",null,false).statusCode());
 }
 @Test void publishesOneCanonicalLessonAndFiltersDraftAncestors()throws Exception{
  login("ADMIN");var topic=create(item("Draft parent","TOPIC","fundamentals","DRAFT",List.of()));
  var lesson=create(item("Canonical test lesson","LESSON",topic.id(),"PUBLISHED",List.of(new ContentItem.Block("paragraph","paragraph",null,"Sample body",null,null,null))));
  assertFalse(request("GET","/catalog",null,false).body().contains(lesson.id()));
  var published=new ContentItem(topic.id(),topic.kind(),topic.parentId(),topic.trackIds(),topic.title(),topic.summary(),"PUBLISHED",0,5,List.of(),List.of(),null,null,null,List.of(),null,List.of());
  assertEquals(200,request("PUT","/admin/content/"+topic.id(),published,true).statusCode());
  var catalog=request("GET","/catalog",null,false).body();assertTrue(catalog.contains(lesson.id()));
  assertEquals(409,request("DELETE","/admin/content/"+topic.id(),null,true).statusCode());
  login("LEARNER");assertEquals(200,request("PUT","/progress/lessons/"+lesson.id(),null,true).statusCode());assertEquals(200,request("PUT","/progress/lessons/"+lesson.id(),null,true).statusCode());
  var completed=parse(request("GET","/progress",null,false)).get("completed");int count=0;for(var x:completed)if(x.asString().equals(lesson.id()))count++;assertEquals(1,count);
  assertEquals(404,request("PUT","/progress/lessons/draft-lesson",null,true).statusCode());
 }
 @Test void validatesHierarchyLinksAndCardAnswers()throws Exception{
  login("ADMIN");assertEquals(400,request("POST","/admin/content",item("Wrong parent","LESSON","fundamentals","DRAFT",List.of()),true).statusCode());
  assertEquals(400,request("POST","/admin/content",item("Unsafe link","LESSON","models","DRAFT",List.of(new ContentItem.Block("bad","link","Bad",null,null,"javascript:alert(1)",null))),true).statusCode());
  assertEquals(400,request("POST","/admin/content",item("Empty published lesson","LESSON","models","PUBLISHED",List.of()),true).statusCode());
  var invalid=new ContentItem(null,"FLASHCARD","models-1",List.of(),"Bad answer","","PUBLISHED",0,0,List.of(),List.of(),"choice","Question","Answer",List.of("A","B"),4,List.of());
  assertEquals(400,request("POST","/admin/content",invalid,true).statusCode());
 }
 @Test void savesPreferencesAndSchedulesReviews()throws Exception{
  login("LEARNER");var prefs=Map.of("name","Demo learner","trackId","track-ai","dailyGoal",30,"saved",List.of("models-1"),"onboarded",true);
  assertEquals(200,request("PUT","/preferences",prefs,true).statusCode());assertEquals("Demo learner",parse(request("GET","/preferences",null,false)).get("name").asString());
  assertEquals(200,request("POST","/reviews",Map.of("cardId","card-choice","rating",3),true).statusCode());assertTrue(request("GET","/progress",null,false).body().contains("card-choice"));
  assertEquals(400,request("POST","/reviews",Map.of("cardId","card-choice","rating",5),true).statusCode());
 }
 @Test void acceptsImageRejectsSvgAndProtectsReferencedMedia()throws Exception{
  login("ADMIN");var bytes=Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=");
  var boundary="devopsx-test";var out=new java.io.ByteArrayOutputStream();out.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\"sample.png\"\r\nContent-Type: image/png\r\n\r\n").getBytes(StandardCharsets.UTF_8));out.write(bytes);out.write(("\r\n--"+boundary+"--\r\n").getBytes(StandardCharsets.UTF_8));
  var response=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/admin/media")).header("X-CSRF-TOKEN",csrf).header("Content-Type","multipart/form-data; boundary="+boundary).POST(HttpRequest.BodyPublishers.ofByteArray(out.toByteArray())).build(),HttpResponse.BodyHandlers.ofString());
  assertEquals(200,response.statusCode(),response.body());var image=parse(response);var url=image.get("url").asString();assertEquals(200,request("GET",url.substring(4),null,false).statusCode());
  create(item("Image reference","LESSON","models","DRAFT",List.of(new ContentItem.Block("img","image",null,null,null,url,"Sample"))));
  assertEquals(409,request("DELETE","/admin/media/"+image.get("id").asString(),null,true).statusCode());
  var svg=("--"+boundary+"\r\nContent-Disposition: form-data; name=\"file\"; filename=\"unsafe.svg\"\r\nContent-Type: image/svg+xml\r\n\r\n<svg/>\r\n--"+boundary+"--\r\n");
  var rejected=client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/admin/media")).header("X-CSRF-TOKEN",csrf).header("Content-Type","multipart/form-data; boundary="+boundary).POST(HttpRequest.BodyPublishers.ofString(svg)).build(),HttpResponse.BodyHandlers.ofString());assertEquals(400,rejected.statusCode());
 }
}
