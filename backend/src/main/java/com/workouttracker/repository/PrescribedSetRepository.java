package com.workouttracker.repository;

import com.workouttracker.model.PrescribedSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescribedSetRepository extends JpaRepository<PrescribedSet, Long> {
    List<PrescribedSet> findByExerciseId(Long exerciseId);
}



