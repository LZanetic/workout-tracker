# Workout Tracker Backend

Spring Boot 3.2.x REST API backend for the workout tracking application.

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12+

## Setup

1. **Create PostgreSQL Database:**
   ```sql
   CREATE DATABASE workout_tracker;
   ```

2. **Update Database Configuration:**
   Edit `src/main/resources/application.yml` and update the database connection details if needed:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/workout_tracker
       username: postgres
       password: postgres
   ```

3. **Build the Project:**
   ```bash
   mvn clean install
   ```

4. **Run the Application:**
   ```bash
   mvn spring-boot:run
   ```

   Or run the main class: `com.workouttracker.WorkoutTrackerApplication`

## API Documentation

Once the application is running, access the Swagger UI at:
- http://localhost:8080/api/swagger-ui.html

API documentation is also available at:
- http://localhost:8080/api/api-docs

## Project Structure

```
src/main/java/com/workouttracker/
├── config/          # Configuration classes (OpenAPI, etc.)
├── controller/      # REST controllers
├── service/         # Business logic layer
├── repository/      # JPA repositories
├── model/           # JPA entities and enums
├── dto/             # Request/response DTOs
├── mapper/          # MapStruct mappers
└── exception/       # Exception handling

src/main/resources/
├── application.yml  # Application configuration
└── db/changelog/    # Liquibase database migrations
```

## Database Migrations

Database schema is managed by Liquibase. Migrations are located in `src/main/resources/db/changelog/`.

The initial schema includes:
- `users` - User accounts
- `training_blocks` - Training block definitions
- `weeks` - Week definitions within blocks
- `workout_days` - Individual workout days
- `exercises` - Exercise definitions
- `prescribed_sets` - Prescribed workout sets
- `actual_sets` - Completed workout sets

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Training Blocks
- `GET /api/training-blocks` - Get all training blocks
- `GET /api/training-blocks/{id}` - Get training block by ID
- `GET /api/training-blocks/assigned-to/{userId}` - Get blocks assigned to user
- `GET /api/training-blocks/created-by/{userId}` - Get blocks created by user
- `POST /api/training-blocks` - Create new training block
- `DELETE /api/training-blocks/{id}` - Delete training block

### Actual Sets
- `GET /api/actual-sets/exercise/{exerciseId}` - Get actual sets for exercise
- `GET /api/actual-sets/{id}` - Get actual set by ID
- `POST /api/actual-sets` - Create new actual set
- `PUT /api/actual-sets/{id}` - Update actual set
- `DELETE /api/actual-sets/{id}` - Delete actual set

## Technologies

- **Spring Boot 3.2.0** - Application framework
- **Spring Data JPA** - Database access
- **PostgreSQL** - Database
- **Liquibase** - Database migrations
- **MapStruct** - DTO mapping
- **Lombok** - Boilerplate reduction
- **SpringDoc OpenAPI** - API documentation
- **Spring Validation** - Request validation

## Development

### Running Tests
```bash
mvn test
```

### Building for Production
```bash
mvn clean package
```

The JAR file will be created in `target/workout-tracker-backend-1.0.0.jar`

### Running the JAR
```bash
java -jar target/workout-tracker-backend-1.0.0.jar
```




