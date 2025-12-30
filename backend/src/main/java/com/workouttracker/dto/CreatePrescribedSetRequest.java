package com.workouttracker.dto;

import com.workouttracker.model.Tempo;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePrescribedSetRequest {
    @NotNull(message = "Set number is required")
    private Integer setNumber;
    
    @NotNull(message = "Target sets is required")
    private Integer targetSets;
    
    @NotNull(message = "Target reps is required")
    private Integer targetReps;
    
    private BigDecimal targetLoadMin;
    
    private BigDecimal targetLoadMax;
    
    private Integer targetRPE;
    
    @NotNull(message = "Tempo is required")
    private Tempo tempo;
    
    @Builder.Default
    private Boolean videoRequired = false;
}

