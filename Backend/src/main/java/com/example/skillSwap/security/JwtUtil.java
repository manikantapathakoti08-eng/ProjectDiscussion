package com.example.skillSwap.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {

    private final PrivateKey privateKey;
    private final PublicKey publicKey;
    private final long expirationTime; // in milliseconds
    private final long refreshExpirationTime;

    public JwtUtil(
            @Value("${jwt.private-key}") String privateKeyStr,
            @Value("${jwt.public-key}") String publicKeyStr,
            @Value("${jwt.expiration}") long expirationTime,
            @Value("${jwt.refresh-expiration:86400000}") long refreshExpirationTime
    ) throws Exception {
        this.privateKey = loadPrivateKey(privateKeyStr);
        this.publicKey = loadPublicKey(publicKeyStr);
        this.expirationTime = expirationTime;
        this.refreshExpirationTime = refreshExpirationTime;
    }

    private PrivateKey loadPrivateKey(String keyStr) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(keyStr.replace("\\\n", "").replace("\n", "").trim());
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePrivate(spec);
    }

    private PublicKey loadPublicKey(String keyStr) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(keyStr.replace("\\\n", "").replace("\n", "").trim());
        X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        return kf.generatePublic(spec);
    }

    // 🚀 Generate the 24-Hour Refresh Token
    public String generateRefreshToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpirationTime))
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }

    // ================== GENERATE TOKEN ==================
    public String generateToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(privateKey, SignatureAlgorithm.RS256)
                .compact();
    }

    // ================== EXTRACT EMAIL ==================
    public String extractEmail(String token) {
        return getClaims(token).getSubject();
    }

    // ================== EXTRACT ROLE ==================
    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    // ================== EXTRACT EXPIRATION ==================
    public Date extractExpiration(String token) {
        return getClaims(token).getExpiration();
    }

    // ================== VALIDATE TOKEN ==================
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String email = extractEmail(token);
            return (email.equals(userDetails.getUsername())
                    && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }

    // ================== CHECK EXPIRATION ==================
    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return true; // If it throws an error parsing, consider it expired/invalid
        }
    }

    // ================== RESOLVE TOKEN FROM HEADER ==================
    public String resolveToken(String authorizationHeader) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }
        return null;
    }

    // ================== INTERNAL CLAIM PARSER ==================
    private Claims getClaims(String token) {
        Jws<Claims> claims = Jwts.parserBuilder()
                .setSigningKey(publicKey)
                .build()
                .parseClaimsJws(token);
        return claims.getBody();
    }
}