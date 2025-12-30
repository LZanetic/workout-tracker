package com.workouttracker.repository;

import com.workouttracker.model.ActualSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActualSetRepository extends JpaRepository<ActualSet, Long> {
    List<ActualSet> findByExerciseId(Long exerciseId);
    
    @Query("SELECT a FROM ActualSet a WHERE a.completedAt >= :startDate AND a.completedAt <= :endDate")
    List<ActualSet> findByCompletedAtBetween(@Param("startDate") LocalDateTime startDate, 
                                               @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT a FROM ActualSet a WHERE a.exercise.day.week.block.id = :blockId " +
           "AND a.exercise.day.week.weekNumber = :weekNumber " +
           "AND a.exercise.day.dayNumber = :dayNumber")
    List<ActualSet> findByBlockIdAndWeekNumberAndDayNumber(@Param("blockId") Long blockId,
                                                             @Param("weekNumber") Integer weekNumber,
                                                             @Param("dayNumber") Integer dayNumber);
    
    @Query("SELECT a FROM ActualSet a WHERE a.exercise.day.week.block.id = :blockId")
    List<ActualSet> findByBlockId(@Param("blockId") Long blockId);
}
