package com.workouttracker.controller;

import com.workouttracker.dto.ActualSetDto;
import com.workouttracker.dto.CreateActualSetRequest;
import com.workouttracker.service.ActualSetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/actual-sets")
@RequiredArgsConstructor
@Tag(name = "Actual Sets", description = "Actual set management APIs")
public class ActualSetController {
    
    private final ActualSetService actualSetService;
    
    @GetMapping("/exercise/{exerciseId}")
    @Operation(summary = "Get all actual sets for an exercise")
    public ResponseEntity<List<ActualSetDto>> getActualSetsByExercise(@PathVariable Long exerciseId) {
        return ResponseEntity.ok(actualSetService.getActualSetsByExercise(exerciseId));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get actual set by ID")
    public ResponseEntity<ActualSetDto> getActualSetById(@PathVariable Long id) {
        return ResponseEntity.ok(actualSetService.getActualSetById(id));
    }
    
    @PostMapping
    @Operation(summary = "Create a new actual set")
    public ResponseEntity<ActualSetDto> createActualSet(@Valid @RequestBody CreateActualSetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(actualSetService.createActualSet(request));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update actual set by ID")
    public ResponseEntity<ActualSetDto> updateActualSet(@PathVariable Long id, 
                                                         @Valid @RequestBody CreateActualSetRequest request) {
        return ResponseEntity.ok(actualSetService.updateActualSet(id, request));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete actual set by ID")
    public ResponseEntity<Void> deleteActualSet(@PathVariable Long id) {
        actualSetService.deleteActualSet(id);
        return ResponseEntity.noContent().build();
    }
}



