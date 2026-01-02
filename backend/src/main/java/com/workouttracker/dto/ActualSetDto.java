package com.workouttracker.dto;

import com.workouttracker.model.Tempo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActualSetDto {
    private Long id;
    private Long exerciseId;
    private Long prescribedSetId;
    private Integer setNumber;
    private BigDecimal actualWeight;
    private Integer actualReps;
    private Integer actualRPE;
    private Tempo tempoUsed;
    private Boolean videoRecorded;
    private String feedback;
    private LocalDateTime completedAt;
}




