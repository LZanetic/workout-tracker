package com.workouttracker.mapper;

import com.workouttracker.dto.ExerciseDto;
import com.workouttracker.model.Exercise;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {PrescribedSetMapper.class, ActualSetMapper.class})
public interface ExerciseMapper {
    @Mapping(target = "dayId", source = "day.id")
    ExerciseDto toDto(Exercise exercise);
}



