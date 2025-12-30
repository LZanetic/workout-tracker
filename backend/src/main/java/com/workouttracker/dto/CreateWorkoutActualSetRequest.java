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
public class CreateWorkoutActualSetRequest {
    private Long prescribedSetId;
    
    @NotNull(message = "Set number is required")
    private Integer setNumber;
    
    private BigDecimal actualWeight;
    private Integer actualReps;
    private Integer actualRPE;
    private Tempo tempoUsed;
    
    @Builder.Default
    private Boolean videoRecorded = false;
    
    private String feedback;
}

