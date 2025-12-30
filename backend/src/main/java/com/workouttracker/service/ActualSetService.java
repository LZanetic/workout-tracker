package com.workouttracker.service;

import com.workouttracker.dto.ActualSetDto;
import com.workouttracker.dto.CreateActualSetRequest;
import com.workouttracker.exception.ResourceNotFoundException;
import com.workouttracker.mapper.ActualSetMapper;
import com.workouttracker.model.ActualSet;
import com.workouttracker.model.Exercise;
import com.workouttracker.model.PrescribedSet;
import com.workouttracker.repository.ActualSetRepository;
import com.workouttracker.repository.ExerciseRepository;
import com.workouttracker.repository.PrescribedSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ActualSetService {
    
    private final ActualSetRepository actualSetRepository;
    private final ExerciseRepository exerciseRepository;
    private final PrescribedSetRepository prescribedSetRepository;
    private final ActualSetMapper actualSetMapper;
    
    public List<ActualSetDto> getActualSetsByExercise(Long exerciseId) {
        return actualSetRepository.findByExerciseId(exerciseId).stream()
                .map(actualSetMapper::toDto)
                .collect(Collectors.toList());
    }
    
    public ActualSetDto getActualSetById(Long id) {
        ActualSet actualSet = actualSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Actual set not found with id: " + id));
        return actualSetMapper.toDto(actualSet);
    }
    
    public ActualSetDto createActualSet(CreateActualSetRequest request) {
        Exercise exercise = exerciseRepository.findById(request.getExerciseId())
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + request.getExerciseId()));
        
        ActualSet actualSet = actualSetMapper.toEntity(request);
        actualSet.setExercise(exercise);
        
        if (request.getPrescribedSetId() != null) {
            PrescribedSet prescribedSet = prescribedSetRepository.findById(request.getPrescribedSetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Prescribed set not found with id: " + request.getPrescribedSetId()));
            actualSet.setPrescribedSet(prescribedSet);
        }
        
        actualSet.setCompletedAt(LocalDateTime.now());
        ActualSet savedSet = actualSetRepository.save(actualSet);
        return actualSetMapper.toDto(savedSet);
    }
    
    public ActualSetDto updateActualSet(Long id, CreateActualSetRequest request) {
        ActualSet actualSet = actualSetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Actual set not found with id: " + id));
        
        if (request.getExerciseId() != null && !request.getExerciseId().equals(actualSet.getExercise().getId())) {
            Exercise exercise = exerciseRepository.findById(request.getExerciseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + request.getExerciseId()));
            actualSet.setExercise(exercise);
        }
        
        if (request.getPrescribedSetId() != null) {
            PrescribedSet prescribedSet = prescribedSetRepository.findById(request.getPrescribedSetId())
                    .orElseThrow(() -> new ResourceNotFoundException("Prescribed set not found with id: " + request.getPrescribedSetId()));
            actualSet.setPrescribedSet(prescribedSet);
        }
        
        if (request.getSetNumber() != null) {
            actualSet.setSetNumber(request.getSetNumber());
        }
        if (request.getActualWeight() != null) {
            actualSet.setActualWeight(request.getActualWeight());
        }
        if (request.getActualReps() != null) {
            actualSet.setActualReps(request.getActualReps());
        }
        if (request.getActualRPE() != null) {
            actualSet.setActualRPE(request.getActualRPE());
        }
        if (request.getTempoUsed() != null) {
            actualSet.setTempoUsed(request.getTempoUsed());
        }
        if (request.getVideoRecorded() != null) {
            actualSet.setVideoRecorded(request.getVideoRecorded());
        }
        if (request.getFeedback() != null) {
            actualSet.setFeedback(request.getFeedback());
        }
        
        ActualSet updatedSet = actualSetRepository.save(actualSet);
        return actualSetMapper.toDto(updatedSet);
    }
    
    public void deleteActualSet(Long id) {
        if (!actualSetRepository.existsById(id)) {
            throw new ResourceNotFoundException("Actual set not found with id: " + id);
        }
        actualSetRepository.deleteById(id);
    }
}



