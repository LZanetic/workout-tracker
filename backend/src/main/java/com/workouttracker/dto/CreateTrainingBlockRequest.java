package com.workouttracker.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTrainingBlockRequest {
    @NotNull(message = "Created by user ID is required")
    private Long createdByUserId;
    
    @NotNull(message = "Assigned to user ID is required")
    private Long assignedToUserId;
    
    @NotNull(message = "Block length is required")
    @Positive(message = "Block length must be positive")
    private Integer blockLength;
    
    @NotNull(message = "Progression rate is required")
    private BigDecimal progressionRate;
    
    @NotNull(message = "Deload rate is required")
    private BigDecimal deloadRate;
    
    @NotNull(message = "Macrocycle is required")
    private String macrocycle;
    
    @NotNull(message = "Mesocycle is required")
    private String mesocycle;
}




