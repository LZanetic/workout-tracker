# Workout Tracker Backend

Spring Boot REST API for the workout tracker: training blocks, workout logging, and exercise deletion. The frontend uses this API when available (web with `REACT_APP_USE_API=true`) and falls back to local storage when it is not; the Android app uses local storage by default when the API URL is localhost.

## Prerequisites

- Java 17+
- Maven 3.6+
- PostgreSQL 12+

## Setup

1. **Create the database:**
   ```sql
   CREATE DATABASE workout_tracker;
   ```

2. **Configure connection** in `src/main/resources/application.yml` if needed:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/workout_tracker
       username: postgres
       password: postgres
   ```

3. **Build and run:**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
   Or run the main class: `com.workouttracker.WorkoutTrackerApplication`.

The API is served at **http://localhost:8080/api** (context path `/api`).

## API documentation

- **Swagger UI:** http://localhost:8080/api/swagger-ui.html  
- **OpenAPI JSON:** http://localhost:8080/api/api-docs  

## API endpoints

Base URL: `http://localhost:8080/api`

### Blocks (training block management)

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/blocks` | List all training blocks |
| `GET`  | `/blocks/{id}` | Get block by ID (with weeks, days, exercises, prescribed sets) |
| `GET`  | `/blocks/{blockId}/progress` | List completed workouts for a block |
| `POST` | `/blocks` | Create a new block (with weeks/days/exercises/prescribed sets) |
| `DELETE` | `/blocks/{id}` | Delete a block |

### Workouts (logged workouts)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/workouts` | Log a completed workout (body: blockId, weekNumber, dayNumber, exercises with actual sets) |
| `GET`  | `/workouts?blockId=&weekNumber=&dayNumber=` | Get a single logged workout by block/week/day |
| `DELETE` | `/workouts?blockId=&weekNumber=&dayNumber=` | Delete a logged workout |

### Exercises

| Method | Path | Description |
|--------|------|-------------|
| `DELETE` | `/exercises/{id}` | Delete an exercise (removes from all weeks in the block) |

## Project structure

```
src/main/java/com/workouttracker/
├── config/           # CORS, OpenAPI/Swagger
├── controller/       # REST controllers
│   ├── BlockController.java      # /blocks
│   ├── WorkoutController.java   # /workouts
│   └── ExerciseController.java  # /exercises
├── service/          # Business logic
├── repository/       # JPA repositories
├── model/            # JPA entities
├── dto/              # Request/response DTOs
├── mapper/           # MapStruct entity ↔ DTO
├── exception/        # Global exception handling
└── WorkoutTrackerApplication.java

src/main/resources/
├── application.yml
└── db/changelog/     # Liquibase migrations
```

## Database

Schema is managed by **Liquibase**. Changelogs are under `src/main/resources/db/changelog/`.

Main entities:
- **training_blocks** – Block metadata (length, progression rate, deload rate)
- **weeks** – Weeks belonging to a block
- **workout_days** – Days within a week
- **exercises** – Exercise definitions per day
- **prescribed_sets** – Target sets/reps/load per exercise
- **workouts** – Logged workout instances (block + week + day)
- **actual_sets** – Logged weight/reps/RPE per set

There is no user/authentication layer; the app is single-user per database.

## Tech stack

- **Spring Boot 3.2** – Framework
- **Spring Data JPA** – Persistence
- **PostgreSQL** – Database
- **Liquibase** – Migrations
- **MapStruct** – DTO mapping
- **Lombok** – Boilerplate reduction
- **SpringDoc OpenAPI** – Swagger/OpenAPI docs
- **Jakarta Validation** – Request validation

## Development

**Tests:** Unit and controller tests for services and REST endpoints (blocks, workouts, exercises).
```bash
mvn test
```

**Package:**
```bash
mvn clean package
```
JAR: `target/workout-tracker-backend-1.0.0.jar`

**Run JAR:**
```bash
java -jar target/workout-tracker-backend-1.0.0.jar
```

## Frontend integration

The React app uses `REACT_APP_API_URL` (default `http://localhost:8080/api`) for all block and workout requests. If the backend is unreachable, the frontend stores data in localStorage only.
