package si.devopsx.security;
import java.util.*;
import jakarta.servlet.http.*;
import org.springframework.core.env.Environment;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import static si.devopsx.content.ContentService.error;
@RestController
@RequestMapping("/api")
public class SessionController {
  private final HttpSessionSecurityContextRepository repo;
  private final Environment env;
  public SessionController(HttpSessionSecurityContextRepository repo,Environment env){this.repo=repo;this.env=env;}
  @GetMapping("/session") public Map<String,Object> session(Authentication auth,CsrfToken csrf){return Map.of("role",auth==null?"ANONYMOUS":auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"))?"ADMIN":"LEARNER","csrfToken",csrf.getToken(),"demo",env.matchesProfiles("demo"));}
  @PostMapping("/demo/session") public Map<String,String> demo(@RequestBody Map<String,String> body,HttpServletRequest req,HttpServletResponse res) {
    if(!env.matchesProfiles("demo"))throw error(404,"Demo access is disabled");
    var role=body.get("role");if(!Set.of("LEARNER","ADMIN").contains(Objects.toString(role,"")))throw error(400,"Invalid role");
    req.changeSessionId();var ctx=SecurityContextHolder.createEmptyContext();
    ctx.setAuthentication(UsernamePasswordAuthenticationToken.authenticated("local-demo",null,List.of(new SimpleGrantedAuthority("ROLE_"+role))));
    SecurityContextHolder.setContext(ctx);repo.saveContext(ctx,req,res);return Map.of("role",role);
  }
}
