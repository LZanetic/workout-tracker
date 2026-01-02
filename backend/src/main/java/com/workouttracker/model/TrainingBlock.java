package com.workouttracker.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "training_blocks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingBlock {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_user_id", nullable = false)
    private User assignedTo;
    
    @Column(name = "block_length", nullable = false)
    private Integer blockLength;
    
    @Column(name = "progression_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal progressionRate;
    
    @Column(name = "deload_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal deloadRate;
    
    @Column(nullable = false)
    private String macrocycle;
    
    @Column(nullable = false)
    private String mesocycle;
    
    @OneToMany(mappedBy = "block", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Week> weeks = new ArrayList<>();
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}




