package com.workouttracker.dto;

import com.workouttracker.model.UserRole;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {
    private String name;
    
    @Email(message = "Email must be valid")
    private String email;
    
    private LocalDate startDate;
    private Integer estimatedSquat1RM;
    private Integer estimatedBench1RM;
    private Integer estimatedDeadlift1RM;
    private UserRole role;
}



