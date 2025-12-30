package com.workouttracker.controller;

import com.workouttracker.dto.CreateBlockRequest;
import com.workouttracker.dto.TrainingBlockDto;
import com.workouttracker.dto.WorkoutResponseDto;
import com.workouttracker.service.TrainingBlockService;
import com.workouttracker.service.WorkoutService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/blocks")
@RequiredArgsConstructor
@Tag(name = "Blocks", description = "Training block management APIs")
public class BlockController {
    
    private final TrainingBlockService trainingBlockService;
    private final WorkoutService workoutService;
    
    @PostMapping
    @Operation(summary = "Create a new training block with all weeks")
    public ResponseEntity<TrainingBlockDto> createBlock(@Valid @RequestBody CreateBlockRequest request) {
        TrainingBlockDto block = trainingBlockService.createBlockWithWeeks(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(block);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get training block by ID with all nested data")
    public ResponseEntity<TrainingBlockDto> getBlockById(@PathVariable Long id) {
        TrainingBlockDto block = trainingBlockService.getTrainingBlockById(id);
        return ResponseEntity.ok(block);
    }
    
    @GetMapping("/{blockId}/progress")
    @Operation(summary = "Get all completed workouts for a block")
    public ResponseEntity<List<WorkoutResponseDto>> getBlockProgress(@PathVariable Long blockId) {
        List<WorkoutResponseDto> workouts = workoutService.getBlockProgress(blockId);
        return ResponseEntity.ok(workouts);
    }
}

