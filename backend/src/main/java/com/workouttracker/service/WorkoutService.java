package com.workouttracker.service;

import com.workouttracker.dto.*;
import com.workouttracker.exception.ResourceNotFoundException;
import com.workouttracker.mapper.ActualSetMapper;
import com.workouttracker.model.*;
import com.workouttracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class WorkoutService {
    
    private final ActualSetRepository actualSetRepository;
    private final ExerciseRepository exerciseRepository;
    private final WorkoutDayRepository workoutDayRepository;
    private final ActualSetMapper actualSetMapper;
    
    public WorkoutResponseDto logWorkout(CreateWorkoutRequest request) {
        // Find the workout day
        WorkoutDay workoutDay = workoutDayRepository
                .findByBlockIdAndWeekNumberAndDayNumber(request.getBlockId(), request.getWeekNumber(), request.getDayNumber())
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Workout day not found for block %d, week %d, day %d",
                                request.getBlockId(), request.getWeekNumber(), request.getDayNumber())));
        
        LocalDateTime completedAt = LocalDateTime.now();
        
        // Process each exercise in the workout
        for (CreateWorkoutExerciseRequest exerciseRequest : request.getExercises()) {
            Exercise exercise = exerciseRepository.findById(exerciseRequest.getExerciseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + exerciseRequest.getExerciseId()));
            
            // Verify exercise belongs to the correct day
            if (!exercise.getDay().getId().equals(workoutDay.getId())) {
                throw new IllegalArgumentException(
                        String.format("Exercise %d does not belong to the specified workout day", exerciseRequest.getExerciseId()));
            }
            
            // Save all actual sets for this exercise
            for (CreateWorkoutActualSetRequest setRequest : exerciseRequest.getActualSets()) {
                ActualSet actualSet = ActualSet.builder()
                        .exercise(exercise)
                        .prescribedSet(setRequest.getPrescribedSetId() != null 
                                ? PrescribedSet.builder().id(setRequest.getPrescribedSetId()).build() 
                                : null)
                        .setNumber(setRequest.getSetNumber())
                        .actualWeight(setRequest.getActualWeight())
                        .actualReps(setRequest.getActualReps())
                        .actualRPE(setRequest.getActualRPE())
                        .tempoUsed(setRequest.getTempoUsed())
                        .videoRecorded(setRequest.getVideoRecorded() != null ? setRequest.getVideoRecorded() : false)
                        .feedback(setRequest.getFeedback())
                        .completedAt(completedAt)
                        .build();
                
                actualSetRepository.save(actualSet);
            }
        }
        
        // Return the saved workout
        return getWorkout(request.getBlockId(), request.getWeekNumber(), request.getDayNumber());
    }
    
    @Transactional(readOnly = true)
    public WorkoutResponseDto getWorkout(Long blockId, Integer weekNumber, Integer dayNumber) {
        // Verify the workout day exists
        workoutDayRepository
                .findByBlockIdAndWeekNumberAndDayNumber(blockId, weekNumber, dayNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Workout day not found for block %d, week %d, day %d",
                                blockId, weekNumber, dayNumber)));
        
        // Get all actual sets for this day
        List<ActualSet> allActualSets = actualSetRepository
                .findByBlockIdAndWeekNumberAndDayNumber(blockId, weekNumber, dayNumber);
        
        // Get the most recent completion time (assuming all sets in a workout are completed at the same time)
        LocalDateTime completedAt = allActualSets.stream()
                .map(ActualSet::getCompletedAt)
                .filter(date -> date != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);
        
        // Group actual sets by exercise
        Map<Long, List<ActualSet>> setsByExercise = allActualSets.stream()
                .collect(Collectors.groupingBy(set -> set.getExercise().getId()));
        
        // Build response
        List<WorkoutExerciseResponseDto> exercises = setsByExercise.entrySet().stream()
                .map(entry -> {
                    Long exerciseId = entry.getKey();
                    List<ActualSet> sets = entry.getValue();
                    Exercise exercise = sets.get(0).getExercise();
                    
                    return WorkoutExerciseResponseDto.builder()
                            .exerciseId(exerciseId)
                            .exerciseName(exercise.getName())
                            .actualSets(sets.stream()
                                    .map(actualSetMapper::toDto)
                                    .collect(Collectors.toList()))
                            .build();
                })
                .collect(Collectors.toList());
        
        return WorkoutResponseDto.builder()
                .blockId(blockId)
                .weekNumber(weekNumber)
                .dayNumber(dayNumber)
                .completedAt(completedAt)
                .exercises(exercises)
                .build();
    }
    
    @Transactional(readOnly = true)
    public List<WorkoutResponseDto> getBlockProgress(Long blockId) {
        // Get all actual sets for this block
        List<ActualSet> allActualSets = actualSetRepository.findByBlockId(blockId);
        
        // Group by block/week/day combination
        Map<String, List<ActualSet>> groupedSets = allActualSets.stream()
                .collect(Collectors.groupingBy(set -> {
                    WorkoutDay day = set.getExercise().getDay();
                    return String.format("%d_%d_%d", 
                            day.getWeek().getBlock().getId(),
                            day.getWeek().getWeekNumber(),
                            day.getDayNumber());
                }));
        
        // Convert to WorkoutResponseDto
        return groupedSets.entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split("_");
                    Long blockIdFromKey = Long.parseLong(parts[0]);
                    Integer weekNumber = Integer.parseInt(parts[1]);
                    Integer dayNumber = Integer.parseInt(parts[2]);
                    List<ActualSet> sets = entry.getValue();
                    
                    // Get the most recent completion time
                    LocalDateTime completedAt = sets.stream()
                            .map(ActualSet::getCompletedAt)
                            .filter(date -> date != null)
                            .max(LocalDateTime::compareTo)
                            .orElse(null);
                    
                    // Group by exercise
                    Map<Long, List<ActualSet>> setsByExercise = sets.stream()
                            .collect(Collectors.groupingBy(set -> set.getExercise().getId()));
                    
                    List<WorkoutExerciseResponseDto> exercises = setsByExercise.entrySet().stream()
                            .map(exEntry -> {
                                Long exerciseId = exEntry.getKey();
                                List<ActualSet> exerciseSets = exEntry.getValue();
                                Exercise exercise = exerciseSets.get(0).getExercise();
                                
                                return WorkoutExerciseResponseDto.builder()
                                        .exerciseId(exerciseId)
                                        .exerciseName(exercise.getName())
                                        .actualSets(exerciseSets.stream()
                                                .map(actualSetMapper::toDto)
                                                .collect(Collectors.toList()))
                                        .build();
                            })
                            .collect(Collectors.toList());
                    
                    return WorkoutResponseDto.builder()
                            .blockId(blockIdFromKey)
                            .weekNumber(weekNumber)
                            .dayNumber(dayNumber)
                            .completedAt(completedAt)
                            .exercises(exercises)
                            .build();
                })
                .collect(Collectors.toList());
    }
}

