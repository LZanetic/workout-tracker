package com.workouttracker.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateWorkoutExerciseRequest {
    @NotNull(message = "Exercise ID is required")
    private Long exerciseId;
    
    @Valid
    @NotNull(message = "Actual sets are required")
    private List<CreateWorkoutActualSetRequest> actualSets;
}

