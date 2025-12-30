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
public class CreateWorkoutDayRequest {
    @NotNull(message = "Day number is required")
    private Integer dayNumber;
    
    @NotNull(message = "Day name is required")
    private String dayName;
    
    @Builder.Default
    private Boolean restDay = false;
    
    @Valid
    private List<CreateExerciseRequest> exercises;
}

