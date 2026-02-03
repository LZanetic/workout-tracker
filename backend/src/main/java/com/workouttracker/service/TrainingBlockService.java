package com.workouttracker.service;

import com.workouttracker.dto.*;
import com.workouttracker.exception.ResourceNotFoundException;
import com.workouttracker.mapper.TrainingBlockMapper;
import com.workouttracker.model.*;
import com.workouttracker.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TrainingBlockService {
    
    private final TrainingBlockRepository trainingBlockRepository;
    private final TrainingBlockMapper trainingBlockMapper;
    
    public List<TrainingBlockDto> getAllTrainingBlocks() {
        return trainingBlockRepository.findAll().stream()
                .map(trainingBlockMapper::toDto)
                .collect(Collectors.toList());
    }
    
    public TrainingBlockDto getTrainingBlockById(Long id) {
        TrainingBlock block = trainingBlockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training block not found with id: " + id));
        return trainingBlockMapper.toDto(block);
    }
    
    public TrainingBlockDto createTrainingBlock(CreateTrainingBlockRequest request) {
        TrainingBlock block = TrainingBlock.builder()
                .blockLength(request.getBlockLength())
                .progressionRate(request.getProgressionRate())
                .deloadRate(request.getDeloadRate())
                .macrocycle(request.getMacrocycle())
                .mesocycle(request.getMesocycle())
                .build();
        
        TrainingBlock savedBlock = trainingBlockRepository.save(block);
        return trainingBlockMapper.toDto(savedBlock);
    }
    
    public void deleteTrainingBlock(Long id) {
        if (!trainingBlockRepository.existsById(id)) {
            throw new ResourceNotFoundException("Training block not found with id: " + id);
        }
        trainingBlockRepository.deleteById(id);
    }
    
    public TrainingBlockDto createBlockWithWeeks(CreateBlockRequest request) {
        TrainingBlock block = TrainingBlock.builder()
                .blockLength(request.getBlockLength())
                .progressionRate(request.getProgressionRate())
                .deloadRate(request.getDeloadRate())
                .macrocycle("Default")
                .mesocycle("Default")
                .build();
        
        // Create weeks
        for (CreateWeekRequest weekRequest : request.getWeeks()) {
            Week week = Week.builder()
                    .block(block)
                    .weekNumber(weekRequest.getWeekNumber())
                    .weekType(weekRequest.getWeekType())
                    .startDate(weekRequest.getStartDate())
                    .endDate(weekRequest.getStartDate().plusDays(6)) // Assuming 7-day weeks
                    .build();
            
            // Create workout days
            if (weekRequest.getDays() != null) {
                for (CreateWorkoutDayRequest dayRequest : weekRequest.getDays()) {
                    WorkoutDay day = WorkoutDay.builder()
                            .week(week)
                            .dayNumber(dayRequest.getDayNumber())
                            .dayName(dayRequest.getDayName())
                            .restDay(dayRequest.getRestDay() != null ? dayRequest.getRestDay() : false)
                            .build();
                    
                    // Create exercises
                    if (dayRequest.getExercises() != null) {
                        for (CreateExerciseRequest exerciseRequest : dayRequest.getExercises()) {
                            Exercise exercise = Exercise.builder()
                                    .day(day)
                                    .name(exerciseRequest.getName())
                                    .category(exerciseRequest.getCategory())
                                    .orderInWorkout(exerciseRequest.getOrderInWorkout())
                                    .build();
                            
                            // Create prescribed sets
                            if (exerciseRequest.getPrescribedSets() != null) {
                                for (CreatePrescribedSetRequest setRequest : exerciseRequest.getPrescribedSets()) {
                                    PrescribedSet prescribedSet = PrescribedSet.builder()
                                            .exercise(exercise)
                                            .setNumber(setRequest.getSetNumber())
                                            .targetSets(setRequest.getTargetSets())
                                            .targetReps(setRequest.getTargetReps())
                                            .targetLoadMin(setRequest.getTargetLoadMin())
                                            .targetLoadMax(setRequest.getTargetLoadMax())
                                            .targetRPE(setRequest.getTargetRPE())
                                            .tempo(setRequest.getTempo())
                                            .videoRequired(setRequest.getVideoRequired() != null ? setRequest.getVideoRequired() : false)
                                            .build();
                                    // Add to exercise's prescribed sets list
                                    exercise.getPrescribedSets().add(prescribedSet);
                                }
                            }
                            // Add exercise to day's exercises list
                            day.getExercises().add(exercise);
                        }
                    }
                    // Add day to week's days list
                    week.getDays().add(day);
                }
            }
            // Add week to block's weeks list
            block.getWeeks().add(week);
        }
        
        // Save the block (cascade will save all nested entities)
        TrainingBlock savedBlock = trainingBlockRepository.save(block);
        return trainingBlockMapper.toDto(savedBlock);
    }
}



