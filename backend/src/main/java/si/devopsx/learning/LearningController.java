package si.devopsx.learning;
import java.util.*;
import java.time.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.ObjectMapper;
import si.devopsx.content.ContentService;
import static si.devopsx.content.ContentService.error;
@RestController
@RequestMapping("/api")
public class LearningController {
  private final JdbcTemplate db;private final ContentService content;private final ObjectMapper json;
  public LearningController(JdbcTemplate db,ContentService content,ObjectMapper json){this.db=db;this.content=content;this.json=json;}
  @GetMapping("/progress") public Map<String,Object> progress(){
    return Map.of("completed",db.queryForList("SELECT lesson_id FROM completions",String.class),"reviews",db.queryForList("SELECT card_id AS \"cardId\",rating AS \"rating\",repetitions AS \"repetitions\",due_at AS \"dueAt\" FROM reviews"));
  }
  @PutMapping("/progress/lessons/{id}") public void complete(@PathVariable String id){content.requirePublished(id,"LESSON");db.update("MERGE INTO completions KEY(lesson_id) VALUES(?,?)",id,Instant.now().toString());}
  @DeleteMapping("/progress/lessons/{id}") public void uncomplete(@PathVariable String id){db.update("DELETE FROM completions WHERE lesson_id=?",id);}
  @PostMapping("/reviews") public void review(@RequestBody Review review){
    content.requirePublished(review.cardId(),"FLASHCARD");if(review.rating()<1||review.rating()>4)throw error(400,"Rating must be from 1 to 4");
    var counts=db.queryForList("SELECT repetitions FROM reviews WHERE card_id=?",Integer.class,review.cardId());var count=counts.isEmpty()?0:counts.getFirst();
    long days=switch(review.rating()){case 1->0;case 2->1;case 3->Math.min(30,2L*(count+1));default->Math.min(60,4L*(count+1));};
    var due=days==0?Instant.now().plusSeconds(600):Instant.now().plusSeconds(days*86400);
    db.update("MERGE INTO reviews KEY(card_id) VALUES(?,?,?,?)",review.cardId(),review.rating(),count+1,due.toString());
  }
  public record Review(String cardId,int rating){}
  @GetMapping("/preferences") public Map<String,Object> preferences(){var rows=db.queryForList("SELECT payload FROM preferences WHERE id=1",String.class);return rows.isEmpty()?Map.of("name","Alex","trackId","track-ai","dailyGoal",15,"saved",List.of(),"onboarded",false):json.readValue(rows.getFirst(),Map.class);}
  @PutMapping("/preferences") public Map<String,Object> preferences(@RequestBody Map<String,Object> p){
    var name=Objects.toString(p.get("name"),"").strip();if(name.isEmpty()||name.length()>60)throw error(400,"Name must be from 1 to 60 characters");
    var track=Objects.toString(p.get("trackId"),"");content.requirePublished(track,"TRACK");
    int goal;try{goal=Integer.parseInt(p.get("dailyGoal").toString());}catch(Exception e){throw error(400,"Choose a valid daily goal");}
    if(!Set.of(10,15,30,45).contains(goal))throw error(400,"Choose a daily goal of 10, 15, 30 or 45 minutes");
    var saved=p.get("saved");if(!(saved instanceof List<?> list)||list.size()>1000||list.stream().anyMatch(x->!(x instanceof String)))throw error(400,"Invalid saved lessons");
    var result=Map.of("name",name,"trackId",track,"dailyGoal",goal,"saved",saved,"onboarded",Boolean.TRUE.equals(p.get("onboarded")));
    db.update("MERGE INTO preferences KEY(id) VALUES(1,?)",json.writeValueAsString(result));return result;
  }
}
