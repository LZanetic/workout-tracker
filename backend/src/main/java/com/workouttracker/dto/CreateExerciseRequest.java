package com.workouttracker.dto;

import com.workouttracker.model.ExerciseCategory;
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
public class CreateExerciseRequest {
    @NotNull(message = "Exercise name is required")
    private String name;
    
    @NotNull(message = "Category is required")
    private ExerciseCategory category;
    
    @NotNull(message = "Order in workout is required")
    private Integer orderInWorkout;
    
    @Valid
    private List<CreatePrescribedSetRequest> prescribedSets;
}

