package com.workouttracker.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBlockRequest {
    @NotNull(message = "Block length is required")
    @Positive(message = "Block length must be positive")
    private Integer blockLength;
    
    @NotNull(message = "Progression rate is required")
    private BigDecimal progressionRate;
    
    @NotNull(message = "Deload rate is required")
    private BigDecimal deloadRate;
    
    @Valid
    @NotNull(message = "Weeks are required")
    private List<CreateWeekRequest> weeks;
}

