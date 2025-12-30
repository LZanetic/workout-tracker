package com.workouttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutResponseDto {
    private Long id;
    private Long blockId;
    private Integer weekNumber;
    private Integer dayNumber;
    private LocalDateTime completedAt;
    private List<WorkoutExerciseResponseDto> exercises;
}

