package si.devopsx.content;

import java.util.*;
import java.net.URI;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;

@Service
public class ContentService implements CommandLineRunner {
  private final JdbcTemplate db;
  private final ObjectMapper json;
  public ContentService(JdbcTemplate db, ObjectMapper json) { this.db=db;this.json=json; }
  public void run(String... args) throws Exception {
    if(db.queryForObject("SELECT COUNT(*) FROM content_items",Integer.class)==0) {
      var seed=json.readValue(new ClassPathResource("seed.json").getInputStream(),ContentItem[].class);
      for(var item:seed) store(item);
    }
  }
  public List<ContentItem> all() {
    return db.query("SELECT payload FROM content_items",(rs,n)->json.readValue(rs.getString(1),ContentItem.class))
      .stream().sorted(Comparator.comparingInt(ContentItem::position).thenComparing(ContentItem::title)).toList();
  }
  public ContentItem find(String id) { return all().stream().filter(x->x.id().equals(id)).findFirst().orElseThrow(()->error(404,"Content not found")); }
  public List<ContentItem> published() {
    var items=all();var map=new HashMap<String,ContentItem>();items.forEach(x->map.put(x.id(),x));
    return items.stream().filter(x->visible(x,map,new HashSet<>())).toList();
  }
  private boolean visible(ContentItem x, Map<String,ContentItem> map, Set<String> seen) {
    if(x==null||!"PUBLISHED".equals(x.status())||!seen.add(x.id()))return false;
    if("TRACK".equals(x.kind()))return true;
    if("CONCEPT".equals(x.kind()))return x.trackIds()!=null&&x.trackIds().stream().anyMatch(id->visible(map.get(id),map,new HashSet<>(seen)));
    return visible(map.get(x.parentId()),map,seen);
  }
  public ContentItem save(String id,ContentItem input) {
    if(id!=null) {var old=find(id); if(!old.kind().equals(input.kind()))throw error(400,"Content type cannot be changed");}
    var item=input.withId(id==null?UUID.randomUUID().toString():id);
    validate(item);store(item);return item;
  }
  private void store(ContentItem x) { db.update("MERGE INTO content_items KEY(id) VALUES (?,?)",x.id(),json.writeValueAsString(x)); }
  private void validate(ContentItem x) {
    if(x.title()==null||x.title().isBlank()||x.title().length()>160)throw error(400,"A title of 1–160 characters is required");
    if(!Set.of("TRACK","CONCEPT","TOPIC","LESSON","FLASHCARD").contains(Objects.toString(x.kind(),"")))throw error(400,"Unknown content type");
    if(!Set.of("DRAFT","PUBLISHED","ARCHIVED").contains(Objects.toString(x.status(),"")))throw error(400,"Choose a valid publishing status");
    if(x.position()<0||x.minutes()<0||x.minutes()>240)throw error(400,"Order and reading time must be valid positive values");
    if("TRACK".equals(x.kind())&&x.parentId()!=null&&!x.parentId().isBlank())throw error(400,"Tracks cannot have a parent");
    if("CONCEPT".equals(x.kind())) {
      if(x.trackIds()==null||x.trackIds().isEmpty())throw error(400,"Select at least one track");
      for(var t:x.trackIds())if(!"TRACK".equals(find(t).kind()))throw error(400,"Invalid track");
    } else if(!"TRACK".equals(x.kind())) {
      var expected=Map.of("TOPIC","CONCEPT","LESSON","TOPIC","FLASHCARD","LESSON").get(x.kind());
      if(x.parentId()==null||!expected.equals(find(x.parentId()).kind()))throw error(400,"Choose a valid parent "+expected.toLowerCase());
    }
    if(x.blocks()!=null)for(var b:x.blocks()) {
      if(!Set.of("paragraph","heading","callout","bullets","code","image","link").contains(Objects.toString(b.type(),"")))throw error(400,"Unknown lesson block type");
      if(Set.of("image","link").contains(b.type()))validateUrl(b.url(),"image".equals(b.type()));
      if("image".equals(b.type())&&(b.alt()==null||b.alt().isBlank()))throw error(400,"Images need alternative text");
    }
    if("PUBLISHED".equals(x.status())&&"LESSON".equals(x.kind())&&(x.blocks()==null||x.blocks().isEmpty()))throw error(400,"Add lesson material before publishing");
    if("FLASHCARD".equals(x.kind())) {
      if(!Set.of("concept","scenario","flaw","choice","ordering").contains(Objects.toString(x.cardType(),"")))throw error(400,"Choose a card format");
      if(x.question()==null||x.question().isBlank()||x.answer()==null||x.answer().isBlank())throw error(400,"Question and explanation are required");
      if(Set.of("choice","ordering").contains(x.cardType())&&(x.options()==null||x.options().size()<2||new HashSet<>(x.options()).size()!=x.options().size()))throw error(400,"Add at least two distinct options");
      if("choice".equals(x.cardType())&&(x.correctOption()==null||x.correctOption()<0||x.correctOption()>=x.options().size()))throw error(400,"Select the correct answer");
      if("ordering".equals(x.cardType())&&(x.correctOrder()==null||x.correctOrder().size()!=x.options().size()||!new HashSet<>(x.correctOrder()).equals(new HashSet<>(x.options()))))throw error(400,"Correct order must contain every option once");
    }
  }
  public static void validateUrl(String value,boolean media) {
    if(media&&value!=null&&value.matches("/api/media/[a-f0-9-]{36}"))return;
    try { var u=URI.create(value);if(!Set.of("https","http").contains(u.getScheme())||u.getHost()==null||u.getUserInfo()!=null)throw new IllegalArgumentException(); }
    catch(Exception e){throw error(400,"Use a valid http or https URL");}
  }
  public void delete(String id) {
    find(id);
    if(all().stream().anyMatch(x->id.equals(x.parentId())||(x.trackIds()!=null&&x.trackIds().contains(id))))throw error(409,"Move or delete child content first. You can archive this item instead.");
    db.update("DELETE FROM reviews WHERE card_id=?",id);db.update("DELETE FROM completions WHERE lesson_id=?",id);db.update("DELETE FROM content_items WHERE id=?",id);
  }
  public void requirePublished(String id,String kind) {if(published().stream().noneMatch(x->x.id().equals(id)&&kind.equals(x.kind())))throw error(404,"Published "+kind.toLowerCase()+" not found");}
  public static ResponseStatusException error(int code,String message){return new ResponseStatusException(HttpStatus.valueOf(code),message);}
}
