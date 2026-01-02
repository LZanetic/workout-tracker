package com.workouttracker.mapper;

import com.workouttracker.dto.TrainingBlockDto;
import com.workouttracker.model.TrainingBlock;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {WeekMapper.class})
public interface TrainingBlockMapper {
    @Mapping(target = "createdByUserId", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.name")
    @Mapping(target = "assignedToUserId", source = "assignedTo.id")
    @Mapping(target = "assignedToName", source = "assignedTo.name")
    TrainingBlockDto toDto(TrainingBlock block);
}




