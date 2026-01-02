package com.workouttracker.dto;

import com.workouttracker.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private LocalDate startDate;
    private Integer estimatedSquat1RM;
    private Integer estimatedBench1RM;
    private Integer estimatedDeadlift1RM;
    private UserRole role;
    private LocalDateTime createdAt;
}




