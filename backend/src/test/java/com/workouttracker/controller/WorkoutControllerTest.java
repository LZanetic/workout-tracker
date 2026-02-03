package com.workouttracker.controller;

import com.workouttracker.dto.CreateWorkoutRequest;
import com.workouttracker.dto.WorkoutResponseDto;
import com.workouttracker.exception.ResourceNotFoundException;
import com.workouttracker.exception.GlobalExceptionHandler;
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

import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WorkoutController.class)
@Import(GlobalExceptionHandler.class)
class WorkoutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WorkoutService workoutService;

    @Nested
    @DisplayName("POST /workouts")
    class LogWorkout {

        @Test
        @DisplayName("returns 201 and logged workout")
        void logsWorkout() throws Exception {
            CreateWorkoutRequest request = CreateWorkoutRequest.builder()
                    .blockId(1L)
                    .weekNumber(1)
                    .dayNumber(1)
                    .exercises(Collections.emptyList())
                    .build();
            WorkoutResponseDto response = WorkoutResponseDto.builder()
                    .blockId(1L)
                    .weekNumber(1)
                    .dayNumber(1)
                    .exercises(Collections.emptyList())
                    .build();
            when(workoutService.logWorkout(any(CreateWorkoutRequest.class))).thenReturn(response);

            mockMvc.perform(post("/workouts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"blockId\":1,\"weekNumber\":1,\"dayNumber\":1,\"exercises\":[]}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.blockId").value(1))
                    .andExpect(jsonPath("$.weekNumber").value(1))
                    .andExpect(jsonPath("$.dayNumber").value(1));

            verify(workoutService).logWorkout(any(CreateWorkoutRequest.class));
        }
    }

    @Nested
    @DisplayName("GET /workouts")
    class GetWorkout {

        @Test
        @DisplayName("returns 200 and workout when found")
        void returnsWorkout() throws Exception {
            WorkoutResponseDto response = WorkoutResponseDto.builder()
                    .blockId(1L)
                    .weekNumber(1)
                    .dayNumber(1)
                    .exercises(Collections.emptyList())
                    .build();
            when(workoutService.getWorkout(1L, 1, 1)).thenReturn(response);

            mockMvc.perform(get("/workouts")
                            .param("blockId", "1")
                            .param("weekNumber", "1")
                            .param("dayNumber", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.blockId").value(1))
                    .andExpect(jsonPath("$.weekNumber").value(1))
                    .andExpect(jsonPath("$.dayNumber").value(1));

            verify(workoutService).getWorkout(1L, 1, 1);
        }

        @Test
        @DisplayName("returns 404 when workout day not found")
        void returns404WhenNotFound() throws Exception {
            when(workoutService.getWorkout(99L, 1, 1))
                    .thenThrow(new ResourceNotFoundException("Workout day not found"));

            mockMvc.perform(get("/workouts")
                            .param("blockId", "99")
                            .param("weekNumber", "1")
                            .param("dayNumber", "1"))
                    .andExpect(status().isNotFound());

            verify(workoutService).getWorkout(99L, 1, 1);
        }
    }

    @Nested
    @DisplayName("DELETE /workouts")
    class DeleteWorkout {

        @Test
        @DisplayName("returns 204 when workout deleted")
        void deletesWorkout() throws Exception {
            doNothing().when(workoutService).deleteWorkout(1L, 1, 1);

            mockMvc.perform(delete("/workouts")
                            .param("blockId", "1")
                            .param("weekNumber", "1")
                            .param("dayNumber", "1"))
                    .andExpect(status().isNoContent());

            verify(workoutService).deleteWorkout(1L, 1, 1);
        }

        @Test
        @DisplayName("returns 404 when workout day not found")
        void returns404WhenNotFound() throws Exception {
            doThrow(new ResourceNotFoundException("Workout day not found"))
                    .when(workoutService).deleteWorkout(99L, 1, 1);

            mockMvc.perform(delete("/workouts")
                            .param("blockId", "99")
                            .param("weekNumber", "1")
                            .param("dayNumber", "1"))
                    .andExpect(status().isNotFound());

            verify(workoutService).deleteWorkout(99L, 1, 1);
        }
    }
}
