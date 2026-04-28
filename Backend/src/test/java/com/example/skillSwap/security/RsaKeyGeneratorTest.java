package com.example.skillSwap.security;

import org.junit.jupiter.api.Test;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Base64;

public class RsaKeyGeneratorTest {

    @Test
    public void generateKeys() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        KeyPair kp = kpg.generateKeyPair();
        
        String privateKey = Base64.getEncoder().encodeToString(kp.getPrivate().getEncoded());
        String publicKey = Base64.getEncoder().encodeToString(kp.getPublic().getEncoded());
        
        System.out.println("--- GENERATED RSA KEYS ---");
        System.out.println("PRIVATE_KEY:" + privateKey);
        System.out.println("PUBLIC_KEY:" + publicKey);
        System.out.println("--------------------------");
    }
}
