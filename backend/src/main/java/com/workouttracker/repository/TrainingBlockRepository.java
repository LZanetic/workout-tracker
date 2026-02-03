package com.workouttracker.repository;

import com.workouttracker.model.TrainingBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrainingBlockRepository extends JpaRepository<TrainingBlock, Long> {
}




