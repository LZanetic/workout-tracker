package com.workouttracker.service;

import com.workouttracker.exception.ResourceNotFoundException;
import com.workouttracker.repository.ExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;

    public void deleteExercise(Long id) {
        var exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found with id: " + id));
        exerciseRepository.delete(exercise); // load then delete so cascade/orphanRemoval runs
    }
}
