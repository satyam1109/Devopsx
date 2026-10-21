package si.devopsx.web;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
@RestControllerAdvice
public class ApiErrors {
  @ExceptionHandler(ResponseStatusException.class) ResponseEntity<?> status(ResponseStatusException e){return ResponseEntity.status(e.getStatusCode()).body(Map.of("message",e.getReason()==null?"Request failed":e.getReason()));}
  @ExceptionHandler(MaxUploadSizeExceededException.class) ResponseEntity<?> upload(){return ResponseEntity.status(413).body(Map.of("message","Image must be smaller than 5 MB"));}
}
