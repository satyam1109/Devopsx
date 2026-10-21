package si.devopsx.media;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import si.devopsx.content.ContentService;
import static si.devopsx.content.ContentService.error;
@RestController
@RequestMapping("/api")
public class MediaController {
  private final JdbcTemplate db;private final ContentService content;
  public MediaController(JdbcTemplate db,ContentService content){this.db=db;this.content=content;}
  @GetMapping("/admin/media") public List<Map<String,Object>> list(){return db.query("SELECT id,name,mime,OCTET_LENGTH(bytes) FROM media",(rs,n)->Map.of("id",rs.getString(1),"name",rs.getString(2),"mime",rs.getString(3),"size",rs.getInt(4),"url","/api/media/"+rs.getString(1)));}
  @PostMapping("/admin/media") public Map<String,String> upload(@RequestParam("file") MultipartFile file)throws Exception {
    var b=file.getBytes();if(b.length==0||b.length>5*1024*1024)throw error(400,"Choose an image smaller than 5 MB");
    String mime=null;
    if(b.length>8&&b[0]==(byte)0x89&&b[1]==0x50&&b[2]==0x4e&&b[3]==0x47&&b[4]==13&&b[5]==10&&b[6]==26&&b[7]==10)mime="image/png";
    if(b.length>3&&b[0]==(byte)0xff&&b[1]==(byte)0xd8&&b[2]==(byte)0xff)mime="image/jpeg";
    if(b.length>6&&(new String(b,0,6,java.nio.charset.StandardCharsets.US_ASCII).matches("GIF8[79]a")))mime="image/gif";
    if(b.length>12&&new String(b,0,4,java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")&&new String(b,8,4,java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP"))mime="image/webp";
    if(mime==null)throw error(400,"Supported formats: PNG, JPEG, GIF and WebP");
    var id=UUID.randomUUID().toString();var name=Objects.toString(file.getOriginalFilename(),"image").replaceAll("[^a-zA-Z0-9._ -]","_");if(name.length()>200)name=name.substring(name.length()-200);
    db.update("INSERT INTO media VALUES(?,?,?,?)",id,name,mime,b);return Map.of("id",id,"name",name,"url","/api/media/"+id);
  }
  @GetMapping("/media/{id}") public ResponseEntity<byte[]> image(@PathVariable String id){var rows=db.query("SELECT mime,bytes FROM media WHERE id=?",(rs,n)->ResponseEntity.ok().contentType(MediaType.parseMediaType(rs.getString(1))).header("Cache-Control","public, max-age=3600").body(rs.getBytes(2)),id);if(rows.isEmpty())throw error(404,"Image not found");return rows.getFirst();}
  @DeleteMapping("/admin/media/{id}") public void delete(@PathVariable String id){
    if(content.all().stream().anyMatch(x->x.blocks()!=null&&x.blocks().stream().anyMatch(b->("/api/media/"+id).equals(b.url()))))throw error(409,"This image is used in a lesson. Remove it there first.");
    if(db.update("DELETE FROM media WHERE id=?",id)==0)throw error(404,"Image not found");
  }
}
