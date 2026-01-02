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
public class WorkoutDayDto {
    private Long id;
    private Long weekId;
    private Integer dayNumber;
    private String dayName;
    private Boolean restDay;
    private List<ExerciseDto> exercises;
}




