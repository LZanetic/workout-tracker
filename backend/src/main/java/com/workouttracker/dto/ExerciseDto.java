package com.workouttracker.dto;

import com.workouttracker.model.ExerciseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExerciseDto {
    private Long id;
    private Long dayId;
    private String name;
    private ExerciseCategory category;
    private Integer orderInWorkout;
    private List<PrescribedSetDto> prescribedSets;
    private List<ActualSetDto> actualSets;
}




