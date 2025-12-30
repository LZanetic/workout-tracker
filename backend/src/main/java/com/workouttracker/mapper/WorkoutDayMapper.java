package com.workouttracker.mapper;

import com.workouttracker.dto.WorkoutDayDto;
import com.workouttracker.model.WorkoutDay;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {ExerciseMapper.class})
public interface WorkoutDayMapper {
    @Mapping(target = "weekId", source = "week.id")
    WorkoutDayDto toDto(WorkoutDay day);
}



