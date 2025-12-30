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
public class CreateWorkoutRequest {
    @NotNull(message = "Block ID is required")
    private Long blockId;
    
    @NotNull(message = "Week number is required")
    private Integer weekNumber;
    
    @NotNull(message = "Day number is required")
    private Integer dayNumber;
    
    @Valid
    @NotNull(message = "Exercises are required")
    private List<CreateWorkoutExerciseRequest> exercises;
}

