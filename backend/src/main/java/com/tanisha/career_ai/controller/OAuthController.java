package com.tanisha.career_ai.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import jakarta.servlet.http.HttpSession;
import java.net.URI;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;

@Controller
@RequestMapping("/auth")
public class OAuthController {

    private final ObjectMapper mapper = new ObjectMapper();
    private final WebClient webClient = WebClient.create();

    @Value("${oauth.google.client-id:}")
    private String googleClientId;
    @Value("${oauth.google.client-secret:}")
    private String googleClientSecret;
    @Value("${oauth.google.redirect-uri:http://localhost:8080/auth/google/callback}")
    private String googleRedirectUri;

    @Value("${oauth.linkedin.client-id:}")
    private String linkedinClientId;
    @Value("${oauth.linkedin.client-secret:}")
    private String linkedinClientSecret;
    @Value("${oauth.linkedin.redirect-uri:http://localhost:8080/auth/linkedin/callback}")
    private String linkedinRedirectUri;

    private final SecureRandom secureRandom = new SecureRandom();

    @GetMapping("/{provider}")
    public ResponseEntity<Void> startAuth(@PathVariable String provider, HttpSession session) {
        String state = generateState();
        session.setAttribute("oauth_state", state);
        String url;
        if ("google".equalsIgnoreCase(provider)) {
            url = UriBuilder.of("https://accounts.google.com/o/oauth2/v2/auth")
                    .queryParam("client_id", googleClientId)
                    .queryParam("redirect_uri", googleRedirectUri)
                    .queryParam("response_type", "code")
                    .queryParam("scope", "openid email profile")
                    .queryParam("state", state)
                    .queryParam("prompt", "consent")
                    .build();
        } else if ("linkedin".equalsIgnoreCase(provider)) {
            url = UriBuilder.of("https://www.linkedin.com/oauth/v2/authorization")
                    .queryParam("response_type", "code")
                    .queryParam("client_id", linkedinClientId)
                    .queryParam("redirect_uri", linkedinRedirectUri)
                    .queryParam("scope", "r_liteprofile r_emailaddress")
                    .queryParam("state", state)
                    .build();
        } else {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(url)).build();
    }

    @GetMapping("/{provider}/callback")
    public ResponseEntity<String> callback(
            @PathVariable String provider,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            HttpSession session) throws Exception {
        String expected = (String) session.getAttribute("oauth_state");
        session.removeAttribute("oauth_state");

        if (error != null) {
            return htmlResponse(postMessageHtml(provider, Map.of("error", error)));
        }
        if (state == null || expected == null || !expected.equals(state) || code == null) {
            return htmlResponse(postMessageHtml(provider, Map.of("error", "invalid_state_or_missing_code")));
        }

        JsonNode profile;
        if ("google".equalsIgnoreCase(provider)) {
            profile = handleGoogle(code);
        } else if ("linkedin".equalsIgnoreCase(provider)) {
            profile = handleLinkedIn(code);
        } else {
            return htmlResponse(postMessageHtml(provider, Map.of("error", "unsupported_provider")));
        }

        Map<String, Object> out = Map.of(
                "name", safeText(profile, "name"),
                "email", safeText(profile, "email"));

        return htmlResponse(postMessageHtml(provider, out));
    }

    private JsonNode handleGoogle(String code) throws Exception {
        // exchange code
        String tokenResponse = webClient.post()
                .uri("https://oauth2.googleapis.com/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue("code=" + code +
                        "&client_id=" + googleClientId +
                        "&client_secret=" + googleClientSecret +
                        "&redirect_uri=" + googleRedirectUri +
                        "&grant_type=authorization_code")
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode tokenJson = mapper.readTree(tokenResponse);
        String accessToken = tokenJson.path("access_token").asText();

        String userInfo = webClient.get()
                .uri("https://www.googleapis.com/oauth2/v3/userinfo")
                .headers(h -> h.setBearerAuth(accessToken))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return mapper.readTree(userInfo);
    }

    private JsonNode handleLinkedIn(String code) throws Exception {
        // exchange code
        String tokenResponse = webClient.post()
                .uri("https://www.linkedin.com/oauth/v2/accessToken")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .bodyValue("grant_type=authorization_code" +
                        "&code=" + code +
                        "&redirect_uri=" + linkedinRedirectUri +
                        "&client_id=" + linkedinClientId +
                        "&client_secret=" + linkedinClientSecret)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode tokenJson = mapper.readTree(tokenResponse);
        String accessToken = tokenJson.path("access_token").asText();

        // profile
        String profileResp = webClient.get()
                .uri("https://api.linkedin.com/v2/me?projection=(localizedFirstName,localizedLastName)")
                .headers(h -> h.setBearerAuth(accessToken))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode profileJson = mapper.readTree(profileResp);
        // email
        String emailResp = webClient.get()
                .uri("https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))")
                .headers(h -> h.setBearerAuth(accessToken))
                .retrieve()
                .bodyToMono(String.class)
                .block();

        JsonNode emailJson = mapper.readTree(emailResp);
        String firstName = safeText(profileJson, "localizedFirstName");
        String lastName = safeText(profileJson, "localizedLastName");
        String email = emailJson.path("elements").get(0).path("handle~").path("emailAddress").asText(null);

        return mapper.createObjectNode()
                .put("name", (firstName != null ? firstName : "") + (lastName != null ? " " + lastName : ""))
                .put("email", email == null ? "" : email);
    }

    private static ResponseEntity<String> htmlResponse(String html) {
        return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body(html);
    }

    private String postMessageHtml(String provider, Map<String, Object> profile) throws Exception {
        String profileJson = mapper.writeValueAsString(profile);
        // In production, set targetOrigin to your app origin instead of '*'
        return """
                <!doctype html>
                <html>
                  <head><meta charset="utf-8"></head>
                  <body>
                    <script>
                      const profile = %s;
                      try {
                        window.opener.postMessage({ type: 'oauth_result', provider: '%s', profile }, '*');
                      } catch(e) { console.error(e); }
                      window.close();
                    </script>
                    <p>Signing you in…</p>
                  </body>
                </html>
                """.formatted(profileJson, provider);
    }

    private String generateState() {
        byte[] b = new byte[24];
        secureRandom.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private String safeText(JsonNode node, String field) {
        return node != null && node.has(field) ? node.path(field).asText("") : "";
    }

    // small helper for building URIs with query params
    private static class UriBuilder {
        private final StringBuilder sb;
        private boolean first = true;

        private UriBuilder(String base) {
            sb = new StringBuilder(base);
        }

        static UriBuilder of(String base) {
            return new UriBuilder(base);
        }

        UriBuilder queryParam(String key, String value) {
            if (value == null)
                return this;
            sb.append(first ? "?" : "&").append(key).append("=").append(encode(value));
            first = false;
            return this;
        }

        String build() {
            return sb.toString();
        }

        private static String encode(String s) {
            return java.net.URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8);
        }
    }
}