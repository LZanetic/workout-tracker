package com.workouttracker.repository;

import com.workouttracker.model.WorkoutDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutDayRepository extends JpaRepository<WorkoutDay, Long> {
    List<WorkoutDay> findByWeekId(Long weekId);
    
    @Query("SELECT d FROM WorkoutDay d WHERE d.week.block.id = :blockId " +
           "AND d.week.weekNumber = :weekNumber AND d.dayNumber = :dayNumber")
    Optional<WorkoutDay> findByBlockIdAndWeekNumberAndDayNumber(@Param("blockId") Long blockId,
                                                                  @Param("weekNumber") Integer weekNumber,
                                                                  @Param("dayNumber") Integer dayNumber);
}
