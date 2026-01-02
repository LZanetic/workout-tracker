package com.workouttracker.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    
    @Bean
    public OpenAPI workoutTrackerOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Workout Tracker API")
                        .description("REST API for workout tracking application")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Workout Tracker Team")
                                .email("support@workouttracker.com")));
    }
}




