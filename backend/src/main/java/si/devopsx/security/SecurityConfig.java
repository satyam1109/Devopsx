package si.devopsx.security;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.http.HttpStatus;
@Configuration
public class SecurityConfig {
  @Bean HttpSessionSecurityContextRepository contextRepository(){return new HttpSessionSecurityContextRepository();}
  @Bean SecurityFilterChain security(HttpSecurity http,HttpSessionSecurityContextRepository repo)throws Exception {
    return http.securityContext(c->c.securityContextRepository(repo))
      .authorizeHttpRequests(a->a.requestMatchers("/api/session","/api/demo/session","/api/catalog","/api/media/**","/error").permitAll()
      .requestMatchers("/api/admin/**").hasRole("ADMIN").anyRequest().authenticated())
      .exceptionHandling(e->e.authenticationEntryPoint((q,r,x)->r.sendError(401)).accessDeniedHandler((q,r,x)->r.sendError(403)))
      .headers(h->h.contentTypeOptions(c->{})).build();
  }
}
