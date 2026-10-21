package si.devopsx.content;
import java.util.List;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api")
public class ContentController {
  private final ContentService content;
  public ContentController(ContentService content){this.content=content;}
  @GetMapping("/catalog") public List<ContentItem> catalog(){return content.published();}
  @GetMapping("/admin/content") public List<ContentItem> all(){return content.all();}
  @PostMapping("/admin/content") public ContentItem create(@RequestBody ContentItem item){return content.save(null,item);}
  @PutMapping("/admin/content/{id}") public ContentItem update(@PathVariable String id,@RequestBody ContentItem item){return content.save(id,item);}
  @DeleteMapping("/admin/content/{id}") public void delete(@PathVariable String id){content.delete(id);}
}
