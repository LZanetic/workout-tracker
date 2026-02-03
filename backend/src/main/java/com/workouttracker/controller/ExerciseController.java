package com.workouttracker.controller;

import com.workouttracker.service.ExerciseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/exercises")
@RequiredArgsConstructor
@Tag(name = "Exercises", description = "Exercise management APIs")
public class ExerciseController {

    private final ExerciseService exerciseService;

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete exercise by ID (removes from block/day, cascades to prescribed and actual sets)")
    public ResponseEntity<Void> deleteExercise(@PathVariable Long id) {
        exerciseService.deleteExercise(id);
        return ResponseEntity.noContent().build();
    }
}
