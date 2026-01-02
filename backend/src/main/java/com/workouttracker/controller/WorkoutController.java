package com.workouttracker.controller;

import com.workouttracker.dto.CreateWorkoutRequest;
import com.workouttracker.dto.WorkoutResponseDto;
import com.workouttracker.service.WorkoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/workouts")
@RequiredArgsConstructor
@Tag(name = "Workouts", description = "Workout logging APIs")
public class WorkoutController {
    
    private final WorkoutService workoutService;
    
    @PostMapping
    @Operation(summary = "Log a completed workout")
    public ResponseEntity<WorkoutResponseDto> logWorkout(@Valid @RequestBody CreateWorkoutRequest request) {
        WorkoutResponseDto workout = workoutService.logWorkout(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(workout);
    }
    
    @GetMapping
    @Operation(summary = "Get a specific logged workout by block, week, and day")
    public ResponseEntity<WorkoutResponseDto> getWorkout(
            @RequestParam Long blockId,
            @RequestParam Integer weekNumber,
            @RequestParam Integer dayNumber) {
        WorkoutResponseDto workout = workoutService.getWorkout(blockId, weekNumber, dayNumber);
        return ResponseEntity.ok(workout);
    }
    
    @DeleteMapping
    @Operation(summary = "Delete a specific logged workout by block, week, and day")
    public ResponseEntity<Void> deleteWorkout(
            @RequestParam Long blockId,
            @RequestParam Integer weekNumber,
            @RequestParam Integer dayNumber) {
        workoutService.deleteWorkout(blockId, weekNumber, dayNumber);
        return ResponseEntity.noContent().build();
    }
}

