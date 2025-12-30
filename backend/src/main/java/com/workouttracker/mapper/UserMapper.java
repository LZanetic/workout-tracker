package com.workouttracker.mapper;

import com.workouttracker.dto.CreateUserRequest;
import com.workouttracker.dto.UpdateUserRequest;
import com.workouttracker.dto.UserDto;
import com.workouttracker.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {
    UserDto toDto(User user);
    User toEntity(CreateUserRequest request);
    void updateEntityFromRequest(UpdateUserRequest request, @MappingTarget User user);
}



