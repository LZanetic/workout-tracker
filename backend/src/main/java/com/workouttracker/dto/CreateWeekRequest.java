package com.workouttracker.dto;

import com.workouttracker.model.WeekType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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
public class CreateWeekRequest {
    @NotNull(message = "Week number is required")
    private Integer weekNumber;
    
    @NotNull(message = "Week type is required")
    private WeekType weekType;
    
    @NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    @Valid
    private List<CreateWorkoutDayRequest> days;
}

