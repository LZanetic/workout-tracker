package com.workouttracker.repository;

import com.workouttracker.model.TrainingBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingBlockRepository extends JpaRepository<TrainingBlock, Long> {
    List<TrainingBlock> findByAssignedToId(Long userId);
    List<TrainingBlock> findByCreatedById(Long userId);
}



