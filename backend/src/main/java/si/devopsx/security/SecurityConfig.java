package si.devopsx.security;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {
  @Bean
  HttpSessionSecurityContextRepository contextRepository() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  UrlBasedCorsConfigurationSource corsConfigurationSource(
      @Value("${app.cors.allowed-origins:}") String origins) {
    var source = new UrlBasedCorsConfigurationSource();
    List<String> allowed = Arrays.stream(origins.split(",")).map(String::trim)
        .filter(x -> !x.isEmpty()).toList();
    if (!allowed.isEmpty()) {
      for (String origin : allowed) {
        var uri = java.net.URI.create(origin);
        if (!List.of("http", "https").contains(uri.getScheme()) || uri.getHost() == null
            || uri.getUserInfo() != null || uri.getQuery() != null || uri.getFragment() != null
            || (uri.getPath() != null && !uri.getPath().isEmpty())) {
          throw new IllegalArgumentException("CORS_ALLOWED_ORIGINS must contain exact http(s) origins");
        }
      }
      var config = new CorsConfiguration();
      config.setAllowedOrigins(allowed);
      config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
      config.setAllowedHeaders(List.of("Content-Type", "X-CSRF-TOKEN"));
      config.setAllowCredentials(true);
      config.setMaxAge(3600L);
      source.registerCorsConfiguration("/api/**", config);
    }
    return source;
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http, HttpSessionSecurityContextRepository repo,
      UrlBasedCorsConfigurationSource cors) throws Exception {
    return http.securityContext(c -> c.securityContextRepository(repo))
        .cors(c -> c.configurationSource(cors))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/api/health", "/api/session", "/api/demo/session", "/api/catalog",
                "/api/media/**", "/error").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .exceptionHandling(e -> e
            .authenticationEntryPoint((q,r,x) -> r.sendError(401))
            .accessDeniedHandler((q,r,x) -> r.sendError(403)))
        .headers(h -> h.contentTypeOptions(c -> {})).build();
  }
}
