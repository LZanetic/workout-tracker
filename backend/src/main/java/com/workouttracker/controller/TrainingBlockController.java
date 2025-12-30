package com.workouttracker.controller;

import com.workouttracker.dto.CreateTrainingBlockRequest;
import com.workouttracker.dto.TrainingBlockDto;
import com.workouttracker.service.TrainingBlockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/training-blocks")
@RequiredArgsConstructor
@Tag(name = "Training Blocks", description = "Training block management APIs")
public class TrainingBlockController {
    
    private final TrainingBlockService trainingBlockService;
    
    @GetMapping
    @Operation(summary = "Get all training blocks")
    public ResponseEntity<List<TrainingBlockDto>> getAllTrainingBlocks() {
        return ResponseEntity.ok(trainingBlockService.getAllTrainingBlocks());
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get training block by ID")
    public ResponseEntity<TrainingBlockDto> getTrainingBlockById(@PathVariable Long id) {
        return ResponseEntity.ok(trainingBlockService.getTrainingBlockById(id));
    }
    
    @GetMapping("/assigned-to/{userId}")
    @Operation(summary = "Get training blocks assigned to a user")
    public ResponseEntity<List<TrainingBlockDto>> getTrainingBlocksByAssignedUser(@PathVariable Long userId) {
        return ResponseEntity.ok(trainingBlockService.getTrainingBlocksByAssignedUser(userId));
    }
    
    @GetMapping("/created-by/{userId}")
    @Operation(summary = "Get training blocks created by a user")
    public ResponseEntity<List<TrainingBlockDto>> getTrainingBlocksByCreatedUser(@PathVariable Long userId) {
        return ResponseEntity.ok(trainingBlockService.getTrainingBlocksByCreatedUser(userId));
    }
    
    @PostMapping
    @Operation(summary = "Create a new training block")
    public ResponseEntity<TrainingBlockDto> createTrainingBlock(@Valid @RequestBody CreateTrainingBlockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(trainingBlockService.createTrainingBlock(request));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete training block by ID")
    public ResponseEntity<Void> deleteTrainingBlock(@PathVariable Long id) {
        trainingBlockService.deleteTrainingBlock(id);
        return ResponseEntity.noContent().build();
    }
}



