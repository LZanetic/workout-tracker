package com.workouttracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutExerciseResponseDto {
    private Long exerciseId;
    private String exerciseName;
    private List<ActualSetDto> actualSets;
}

