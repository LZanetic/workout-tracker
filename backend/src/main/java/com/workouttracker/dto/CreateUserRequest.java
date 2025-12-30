package com.workouttracker.dto;

import com.workouttracker.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    private LocalDate startDate;
    private Integer estimatedSquat1RM;
    private Integer estimatedBench1RM;
    private Integer estimatedDeadlift1RM;
    
    @NotNull(message = "Role is required")
    private UserRole role;
}



