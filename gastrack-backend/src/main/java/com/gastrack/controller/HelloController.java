package com.gastrack.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Created on Ağustos, 2020
 *
 * @author Faruk
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Hello API v1", description = "Protected endpoint for testing authentication")
public class HelloController {

	@GetMapping("/hello")
	@Operation(summary = "Hello endpoint", description = "When you send token information in the header it just says Hello")
	public ResponseEntity<String> sayHello() {

		return ResponseEntity.ok("Hello Spring Boot Boilerplate");
	}

}
