package com.workouttracker.dto;

import com.workouttracker.model.WeekType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeekDto {
    private Long id;
    private Long blockId;
    private Integer weekNumber;
    private WeekType weekType;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<WorkoutDayDto> days;
}



