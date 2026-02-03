package com.workouttracker.controller;

import com.workouttracker.exception.ResourceNotFoundException;
import com.workouttracker.exception.GlobalExceptionHandler;
import com.workouttracker.service.ExerciseService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ExerciseController.class)
@Import(GlobalExceptionHandler.class)
class ExerciseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ExerciseService exerciseService;

    @Nested
    @DisplayName("DELETE /exercises/{id}")
    class DeleteExercise {

        @Test
        @DisplayName("returns 204 when exercise deleted")
        void deletesExercise() throws Exception {
            doNothing().when(exerciseService).deleteExercise(1L);

            mockMvc.perform(delete("/exercises/1"))
                    .andExpect(status().isNoContent());

            verify(exerciseService).deleteExercise(1L);
        }

        @Test
        @DisplayName("returns 404 when exercise not found")
        void returns404WhenNotFound() throws Exception {
            doThrow(new ResourceNotFoundException("Exercise not found with id: 99"))
                    .when(exerciseService).deleteExercise(99L);

            mockMvc.perform(delete("/exercises/99"))
                    .andExpect(status().isNotFound());

            verify(exerciseService).deleteExercise(99L);
        }
    }
}
