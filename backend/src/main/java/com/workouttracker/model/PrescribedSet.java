package com.workouttracker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "prescribed_sets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescribedSet {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    private Exercise exercise;
    
    @Column(name = "set_number", nullable = false)
    private Integer setNumber;
    
    @Column(name = "target_sets", nullable = false)
    private Integer targetSets;
    
    @Column(name = "target_reps", nullable = false)
    private Integer targetReps;
    
    @Column(name = "target_load_min", precision = 6, scale = 2)
    private BigDecimal targetLoadMin;
    
    @Column(name = "target_load_max", precision = 6, scale = 2)
    private BigDecimal targetLoadMax;
    
    @Column(name = "target_rpe")
    private Integer targetRPE;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Tempo tempo;
    
    @Column(name = "video_required", nullable = false)
    private Boolean videoRequired;
}




