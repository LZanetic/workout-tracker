package com.workouttracker.mapper;

import com.workouttracker.dto.PrescribedSetDto;
import com.workouttracker.model.PrescribedSet;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PrescribedSetMapper {
    @Mapping(target = "exerciseId", source = "exercise.id")
    PrescribedSetDto toDto(PrescribedSet prescribedSet);
}




