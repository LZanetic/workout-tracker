package com.workouttracker.service;

import com.workouttracker.exception.ResourceNotFoundException;
import com.workouttracker.model.Exercise;
import com.workouttracker.model.ExerciseCategory;
import com.workouttracker.repository.ExerciseRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExerciseServiceTest {

    @Mock
    private ExerciseRepository exerciseRepository;

    @InjectMocks
    private ExerciseService exerciseService;

    @Nested
    @DisplayName("deleteExercise")
    class DeleteExercise {

        @Test
        @DisplayName("deletes exercise when found")
        void deletesWhenFound() {
            Exercise exercise = Exercise.builder()
                    .id(1L)
                    .name("Squat")
                    .category(ExerciseCategory.SQUAT)
                    .orderInWorkout(1)
                    .build();
            when(exerciseRepository.findById(1L)).thenReturn(Optional.of(exercise));
            doNothing().when(exerciseRepository).delete(exercise);

            exerciseService.deleteExercise(1L);

            verify(exerciseRepository).findById(1L);
            verify(exerciseRepository).delete(exercise);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when exercise not found")
        void throwsWhenNotFound() {
            when(exerciseRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> exerciseService.deleteExercise(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Exercise not found with id: 99");

            verify(exerciseRepository).findById(99L);
            verify(exerciseRepository, never()).delete(any());
        }
    }
}
