package com.workouttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingBlockDto {
    private Long id;
    private Long createdByUserId;
    private String createdByName;
    private Long assignedToUserId;
    private String assignedToName;
    private Integer blockLength;
    private BigDecimal progressionRate;
    private BigDecimal deloadRate;
    private String macrocycle;
    private String mesocycle;
    private List<WeekDto> weeks;
    private LocalDateTime createdAt;
}



