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
    private final UserRepository userRepository;
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
    
    public List<TrainingBlockDto> getTrainingBlocksByAssignedUser(Long userId) {
        return trainingBlockRepository.findByAssignedToId(userId).stream()
                .map(trainingBlockMapper::toDto)
                .collect(Collectors.toList());
    }
    
    public List<TrainingBlockDto> getTrainingBlocksByCreatedUser(Long userId) {
        return trainingBlockRepository.findByCreatedById(userId).stream()
                .map(trainingBlockMapper::toDto)
                .collect(Collectors.toList());
    }
    
    public TrainingBlockDto createTrainingBlock(CreateTrainingBlockRequest request) {
        User createdBy = userRepository.findById(request.getCreatedByUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getCreatedByUserId()));
        
        User assignedTo = userRepository.findById(request.getAssignedToUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + request.getAssignedToUserId()));
        
        TrainingBlock block = TrainingBlock.builder()
                .createdBy(createdBy)
                .assignedTo(assignedTo)
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
        // For now, we'll use a default user (ID 1) if users exist, otherwise create a simple block
        // In a real app, you'd get this from security context or require it in the request
        User defaultUser = userRepository.findById(1L)
                .orElseThrow(() -> new ResourceNotFoundException("Default user not found. Please create a user first."));
        
        TrainingBlock block = TrainingBlock.builder()
                .createdBy(defaultUser)
                .assignedTo(defaultUser)
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



