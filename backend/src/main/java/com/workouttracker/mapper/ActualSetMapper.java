package com.workouttracker.mapper;

import com.workouttracker.dto.ActualSetDto;
import com.workouttracker.dto.CreateActualSetRequest;
import com.workouttracker.model.ActualSet;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ActualSetMapper {
    @Mapping(target = "exerciseId", source = "exercise.id")
    @Mapping(target = "prescribedSetId", source = "prescribedSet.id")
    ActualSetDto toDto(ActualSet actualSet);
    
    ActualSet toEntity(CreateActualSetRequest request);
}




