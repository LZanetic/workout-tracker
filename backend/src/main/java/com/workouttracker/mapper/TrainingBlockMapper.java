package com.workouttracker.mapper;

import com.workouttracker.dto.TrainingBlockDto;
import com.workouttracker.model.TrainingBlock;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = {WeekMapper.class})
public interface TrainingBlockMapper {
    TrainingBlockDto toDto(TrainingBlock block);
}




