package com.workouttracker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "actual_sets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActualSet {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescribed_set_id")
    private PrescribedSet prescribedSet;
    
    @Column(name = "set_number", nullable = false)
    private Integer setNumber;
    
    @Column(name = "actual_weight", precision = 6, scale = 2)
    private BigDecimal actualWeight;
    
    @Column(name = "actual_reps")
    private Integer actualReps;
    
    @Column(name = "actual_rpe")
    private Integer actualRPE;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tempo_used")
    private Tempo tempoUsed;
    
    @Column(name = "video_recorded", nullable = false)
    private Boolean videoRecorded;
    
    @Column(columnDefinition = "TEXT")
    private String feedback;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}



