package com.workouttracker.service;

import com.workouttracker.dto.CreateBlockRequest;
import com.workouttracker.dto.CreateExerciseRequest;
import com.workouttracker.dto.CreatePrescribedSetRequest;
import com.workouttracker.dto.CreateWeekRequest;
import com.workouttracker.dto.CreateWorkoutDayRequest;
import com.workouttracker.dto.TrainingBlockDto;
import com.workouttracker.exception.ResourceNotFoundException;
import com.workouttracker.mapper.TrainingBlockMapper;
import com.workouttracker.model.ExerciseCategory;
import com.workouttracker.model.Tempo;
import com.workouttracker.model.TrainingBlock;
import com.workouttracker.model.WeekType;
import com.workouttracker.repository.TrainingBlockRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrainingBlockServiceTest {

    @Mock
    private TrainingBlockRepository trainingBlockRepository;

    @Mock
    private TrainingBlockMapper trainingBlockMapper;

    @InjectMocks
    private TrainingBlockService trainingBlockService;

    private TrainingBlock block;
    private TrainingBlockDto blockDto;

    @BeforeEach
    void setUp() {
        block = TrainingBlock.builder()
                .id(1L)
                .blockLength(5)
                .progressionRate(BigDecimal.valueOf(0.075))
                .deloadRate(BigDecimal.valueOf(0.85))
                .macrocycle("Default")
                .mesocycle("Default")
                .build();
        blockDto = TrainingBlockDto.builder()
                .id(1L)
                .blockLength(5)
                .progressionRate(BigDecimal.valueOf(0.075))
                .deloadRate(BigDecimal.valueOf(0.85))
                .build();
    }

    @Nested
    @DisplayName("getAllTrainingBlocks")
    class GetAllTrainingBlocks {

        @Test
        @DisplayName("returns empty list when no blocks exist")
        void returnsEmptyList() {
            when(trainingBlockRepository.findAll()).thenReturn(Collections.emptyList());

            List<TrainingBlockDto> result = trainingBlockService.getAllTrainingBlocks();

            assertThat(result).isEmpty();
            verify(trainingBlockRepository).findAll();
        }

        @Test
        @DisplayName("returns all blocks as DTOs")
        void returnsAllBlocks() {
            when(trainingBlockRepository.findAll()).thenReturn(List.of(block));
            when(trainingBlockMapper.toDto(block)).thenReturn(blockDto);

            List<TrainingBlockDto> result = trainingBlockService.getAllTrainingBlocks();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo(1L);
            assertThat(result.get(0).getBlockLength()).isEqualTo(5);
            verify(trainingBlockMapper).toDto(block);
        }
    }

    @Nested
    @DisplayName("getTrainingBlockById")
    class GetTrainingBlockById {

        @Test
        @DisplayName("returns block when found")
        void returnsBlockWhenFound() {
            when(trainingBlockRepository.findById(1L)).thenReturn(Optional.of(block));
            when(trainingBlockMapper.toDto(block)).thenReturn(blockDto);

            TrainingBlockDto result = trainingBlockService.getTrainingBlockById(1L);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            verify(trainingBlockRepository).findById(1L);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when not found")
        void throwsWhenNotFound() {
            when(trainingBlockRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> trainingBlockService.getTrainingBlockById(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Training block not found with id: 99");
            verify(trainingBlockRepository).findById(99L);
        }
    }

    @Nested
    @DisplayName("deleteTrainingBlock")
    class DeleteTrainingBlock {

        @Test
        @DisplayName("deletes block when it exists")
        void deletesWhenExists() {
            when(trainingBlockRepository.existsById(1L)).thenReturn(true);
            doNothing().when(trainingBlockRepository).deleteById(1L);

            trainingBlockService.deleteTrainingBlock(1L);

            verify(trainingBlockRepository).existsById(1L);
            verify(trainingBlockRepository).deleteById(1L);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when block does not exist")
        void throwsWhenNotExists() {
            when(trainingBlockRepository.existsById(99L)).thenReturn(false);

            assertThatThrownBy(() -> trainingBlockService.deleteTrainingBlock(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Training block not found with id: 99");
            verify(trainingBlockRepository).existsById(99L);
            verify(trainingBlockRepository, never()).deleteById(any());
        }
    }

    @Nested
    @DisplayName("createBlockWithWeeks")
    class CreateBlockWithWeeks {

        @Test
        @DisplayName("creates block with weeks and returns DTO")
        void createsBlockWithWeeks() {
            CreateBlockRequest request = CreateBlockRequest.builder()
                    .blockLength(4)
                    .progressionRate(BigDecimal.valueOf(0.1))
                    .deloadRate(BigDecimal.valueOf(0.8))
                    .weeks(List.of(
                            CreateWeekRequest.builder()
                                    .weekNumber(1)
                                    .weekType(WeekType.BASE)
                                    .startDate(LocalDate.of(2025, 1, 6))
                                    .days(List.of(
                                            CreateWorkoutDayRequest.builder()
                                                    .dayNumber(1)
                                                    .dayName("Day 1")
                                                    .restDay(false)
                                                    .exercises(List.of(
                                                            CreateExerciseRequest.builder()
                                                                    .name("Squat")
                                                                    .category(ExerciseCategory.SQUAT)
                                                                    .orderInWorkout(1)
                                                                    .prescribedSets(List.of(
                                                                            CreatePrescribedSetRequest.builder()
                                                                                    .setNumber(1)
                                                                                    .targetSets(3)
                                                                                    .targetReps(5)
                                                                                    .targetLoadMin(BigDecimal.valueOf(100))
                                                                                    .targetLoadMax(BigDecimal.valueOf(100))
                                                                                    .targetRPE(8)
                                                                                    .tempo(Tempo.CONTROLLED)
                                                                                    .build()
                                                                    ))
                                                                    .build()
                                                    ))
                                                    .build()
                                    ))
                                    .build()
                    ))
                    .build();

            when(trainingBlockRepository.save(any(TrainingBlock.class))).thenAnswer(inv -> {
                TrainingBlock saved = inv.getArgument(0);
                saved.setId(1L);
                return saved;
            });
            when(trainingBlockMapper.toDto(any(TrainingBlock.class))).thenReturn(blockDto);

            TrainingBlockDto result = trainingBlockService.createBlockWithWeeks(request);

            assertThat(result).isNotNull();
            ArgumentCaptor<TrainingBlock> captor = ArgumentCaptor.forClass(TrainingBlock.class);
            verify(trainingBlockRepository).save(captor.capture());
            TrainingBlock saved = captor.getValue();
            assertThat(saved.getBlockLength()).isEqualTo(4);
            assertThat(saved.getProgressionRate()).isEqualByComparingTo(BigDecimal.valueOf(0.1));
            assertThat(saved.getWeeks()).hasSize(1);
            assertThat(saved.getWeeks().get(0).getWeekNumber()).isEqualTo(1);
            assertThat(saved.getWeeks().get(0).getDays()).hasSize(1);
            assertThat(saved.getWeeks().get(0).getDays().get(0).getExercises()).hasSize(1);
            assertThat(saved.getWeeks().get(0).getDays().get(0).getExercises().get(0).getName()).isEqualTo("Squat");
        }
    }
}
