package com.workouttracker.service;

import com.workouttracker.dto.*;
import com.workouttracker.exception.ResourceNotFoundException;
import com.workouttracker.mapper.ActualSetMapper;
import com.workouttracker.model.*;
import com.workouttracker.repository.ActualSetRepository;
import com.workouttracker.repository.ExerciseRepository;
import com.workouttracker.repository.WorkoutDayRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkoutServiceTest {

    @Mock
    private ActualSetRepository actualSetRepository;

    @Mock
    private ExerciseRepository exerciseRepository;

    @Mock
    private WorkoutDayRepository workoutDayRepository;

    @Mock
    private ActualSetMapper actualSetMapper;

    @InjectMocks
    private WorkoutService workoutService;

    @Nested
    @DisplayName("getWorkout")
    class GetWorkout {

        @Test
        @DisplayName("throws ResourceNotFoundException when workout day not found")
        void throwsWhenWorkoutDayNotFound() {
            when(workoutDayRepository.findByBlockIdAndWeekNumberAndDayNumber(1L, 1, 1))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> workoutService.getWorkout(1L, 1, 1))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Workout day not found");

            verify(workoutDayRepository).findByBlockIdAndWeekNumberAndDayNumber(1L, 1, 1);
            verify(actualSetRepository, never()).findByBlockIdAndWeekNumberAndDayNumber(any(), any(), any());
        }

        @Test
        @DisplayName("returns workout DTO when day exists and has no logged sets")
        void returnsWorkoutWhenDayExistsNoSets() {
            WorkoutDay day = WorkoutDay.builder()
                    .id(10L)
                    .dayNumber(1)
                    .dayName("Day 1")
                    .restDay(false)
                    .build();
            when(workoutDayRepository.findByBlockIdAndWeekNumberAndDayNumber(1L, 1, 1))
                    .thenReturn(Optional.of(day));
            when(actualSetRepository.findByBlockIdAndWeekNumberAndDayNumber(1L, 1, 1))
                    .thenReturn(Collections.emptyList());

            WorkoutResponseDto result = workoutService.getWorkout(1L, 1, 1);

            assertThat(result).isNotNull();
            assertThat(result.getBlockId()).isEqualTo(1L);
            assertThat(result.getWeekNumber()).isEqualTo(1);
            assertThat(result.getDayNumber()).isEqualTo(1);
            assertThat(result.getExercises()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getBlockProgress")
    class GetBlockProgress {

        @Test
        @DisplayName("returns empty list when block has no logged workouts")
        void returnsEmptyWhenNoWorkouts() {
            when(actualSetRepository.findByBlockId(1L)).thenReturn(Collections.emptyList());

            List<WorkoutResponseDto> result = workoutService.getBlockProgress(1L);

            assertThat(result).isEmpty();
            verify(actualSetRepository).findByBlockId(1L);
        }
    }

    @Nested
    @DisplayName("deleteWorkout")
    class DeleteWorkout {

        @Test
        @DisplayName("throws ResourceNotFoundException when workout day not found")
        void throwsWhenWorkoutDayNotFound() {
            when(workoutDayRepository.findByBlockIdAndWeekNumberAndDayNumber(1L, 1, 1))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> workoutService.deleteWorkout(1L, 1, 1))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Workout day not found");

            verify(workoutDayRepository).findByBlockIdAndWeekNumberAndDayNumber(1L, 1, 1);
            verify(actualSetRepository, never()).deleteAll(anyList());
        }

        @Test
        @DisplayName("deletes all actual sets for the workout when day exists")
        void deletesSetsWhenDayExists() {
            WorkoutDay day = WorkoutDay.builder()
                    .id(10L)
                    .dayNumber(1)
                    .dayName("Day 1")
                    .restDay(false)
                    .build();
            when(workoutDayRepository.findByBlockIdAndWeekNumberAndDayNumber(1L, 1, 1))
                    .thenReturn(Optional.of(day));
            when(actualSetRepository.findByBlockIdAndWeekNumberAndDayNumber(1L, 1, 1))
                    .thenReturn(Collections.emptyList());
            doNothing().when(actualSetRepository).deleteAll(anyList());

            workoutService.deleteWorkout(1L, 1, 1);

            verify(actualSetRepository).findByBlockIdAndWeekNumberAndDayNumber(1L, 1, 1);
            verify(actualSetRepository).deleteAll(Collections.emptyList());
        }
    }

    @Nested
    @DisplayName("logWorkout")
    class LogWorkout {

        @Test
        @DisplayName("throws ResourceNotFoundException when workout day not found")
        void throwsWhenWorkoutDayNotFound() {
            CreateWorkoutRequest request = CreateWorkoutRequest.builder()
                    .blockId(1L)
                    .weekNumber(1)
                    .dayNumber(1)
                    .exercises(Collections.emptyList())
                    .build();
            when(workoutDayRepository.findByBlockIdAndWeekNumberAndDayNumber(1L, 1, 1))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> workoutService.logWorkout(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Workout day not found");

            verify(workoutDayRepository).findByBlockIdAndWeekNumberAndDayNumber(1L, 1, 1);
            verify(actualSetRepository, never()).save(any());
        }
    }
}
