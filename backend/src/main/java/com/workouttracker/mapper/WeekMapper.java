package com.workouttracker.mapper;

import com.workouttracker.dto.WeekDto;
import com.workouttracker.model.Week;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {WorkoutDayMapper.class})
public interface WeekMapper {
    @Mapping(target = "blockId", source = "block.id")
    WeekDto toDto(Week week);
}




