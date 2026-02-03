package com.workouttracker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workouttracker.dto.CreateBlockRequest;
import com.workouttracker.dto.TrainingBlockDto;
import com.workouttracker.dto.WorkoutResponseDto;
import com.workouttracker.exception.ResourceNotFoundException;
import com.workouttracker.exception.GlobalExceptionHandler;
import com.workouttracker.service.TrainingBlockService;
import com.workouttracker.service.WorkoutService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BlockController.class)
@Import(GlobalExceptionHandler.class)
class BlockControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TrainingBlockService trainingBlockService;

    @MockBean
    private WorkoutService workoutService;

    @Nested
    @DisplayName("GET /blocks")
    class GetAllBlocks {

        @Test
        @DisplayName("returns 200 and list of blocks")
        void returnsBlocks() throws Exception {
            TrainingBlockDto dto = TrainingBlockDto.builder()
                    .id(1L)
                    .blockLength(5)
                    .progressionRate(BigDecimal.valueOf(0.075))
                    .deloadRate(BigDecimal.valueOf(0.85))
                    .build();
            when(trainingBlockService.getAllTrainingBlocks()).thenReturn(List.of(dto));

            mockMvc.perform(get("/blocks"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].id").value(1))
                    .andExpect(jsonPath("$[0].blockLength").value(5));

            verify(trainingBlockService).getAllTrainingBlocks();
        }

        @Test
        @DisplayName("returns 200 and empty array when no blocks")
        void returnsEmpty() throws Exception {
            when(trainingBlockService.getAllTrainingBlocks()).thenReturn(List.of());

            mockMvc.perform(get("/blocks"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));

            verify(trainingBlockService).getAllTrainingBlocks();
        }
    }

    @Nested
    @DisplayName("GET /blocks/{id}")
    class GetBlockById {

        @Test
        @DisplayName("returns 200 and block when found")
        void returnsBlock() throws Exception {
            TrainingBlockDto dto = TrainingBlockDto.builder()
                    .id(1L)
                    .blockLength(5)
                    .progressionRate(BigDecimal.valueOf(0.075))
                    .deloadRate(BigDecimal.valueOf(0.85))
                    .build();
            when(trainingBlockService.getTrainingBlockById(1L)).thenReturn(dto);

            mockMvc.perform(get("/blocks/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.blockLength").value(5));

            verify(trainingBlockService).getTrainingBlockById(1L);
        }

        @Test
        @DisplayName("returns 404 when block not found")
        void returns404WhenNotFound() throws Exception {
            when(trainingBlockService.getTrainingBlockById(99L))
                    .thenThrow(new ResourceNotFoundException("Training block not found with id: 99"));

            mockMvc.perform(get("/blocks/99"))
                    .andExpect(status().isNotFound());

            verify(trainingBlockService).getTrainingBlockById(99L);
        }
    }

    @Nested
    @DisplayName("GET /blocks/{blockId}/progress")
    class GetBlockProgress {

        @Test
        @DisplayName("returns 200 and list of workouts")
        void returnsProgress() throws Exception {
            WorkoutResponseDto workout = WorkoutResponseDto.builder()
                    .blockId(1L)
                    .weekNumber(1)
                    .dayNumber(1)
                    .exercises(List.of())
                    .build();
            when(workoutService.getBlockProgress(1L)).thenReturn(List.of(workout));

            mockMvc.perform(get("/blocks/1/progress"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(1)))
                    .andExpect(jsonPath("$[0].blockId").value(1))
                    .andExpect(jsonPath("$[0].weekNumber").value(1))
                    .andExpect(jsonPath("$[0].dayNumber").value(1));

            verify(workoutService).getBlockProgress(1L);
        }
    }

    @Nested
    @DisplayName("POST /blocks")
    class CreateBlock {

        @Test
        @DisplayName("returns 201 and created block")
        void createsBlock() throws Exception {
            CreateBlockRequest request = CreateBlockRequest.builder()
                    .blockLength(4)
                    .progressionRate(BigDecimal.valueOf(0.1))
                    .deloadRate(BigDecimal.valueOf(0.8))
                    .weeks(List.of())
                    .build();
            TrainingBlockDto dto = TrainingBlockDto.builder()
                    .id(1L)
                    .blockLength(4)
                    .progressionRate(BigDecimal.valueOf(0.1))
                    .deloadRate(BigDecimal.valueOf(0.8))
                    .build();
            when(trainingBlockService.createBlockWithWeeks(any(CreateBlockRequest.class))).thenReturn(dto);

            mockMvc.perform(post("/blocks")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.id").value(1))
                    .andExpect(jsonPath("$.blockLength").value(4));

            verify(trainingBlockService).createBlockWithWeeks(any(CreateBlockRequest.class));
        }
    }

    @Nested
    @DisplayName("DELETE /blocks/{id}")
    class DeleteBlock {

        @Test
        @DisplayName("returns 204 when block deleted")
        void deletesBlock() throws Exception {
            doNothing().when(trainingBlockService).deleteTrainingBlock(1L);

            mockMvc.perform(delete("/blocks/1"))
                    .andExpect(status().isNoContent());

            verify(trainingBlockService).deleteTrainingBlock(1L);
        }

        @Test
        @DisplayName("returns 404 when block not found")
        void returns404WhenNotFound() throws Exception {
            doThrow(new ResourceNotFoundException("Training block not found with id: 99"))
                    .when(trainingBlockService).deleteTrainingBlock(99L);

            mockMvc.perform(delete("/blocks/99"))
                    .andExpect(status().isNotFound());

            verify(trainingBlockService).deleteTrainingBlock(99L);
        }
    }
}
