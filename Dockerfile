# ==========================================
# STAGE 1: Build the Maven Fat JAR
# ==========================================
FROM maven:3.8.5-openjdk-17 AS builder
WORKDIR /app

# Copy pom.xml and download dependencies to optimize caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy full source and package the application (skipping test compilation)
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# STAGE 2: Lightweight Runtime JRE
# ==========================================
FROM openjdk:17-jdk-slim
WORKDIR /app

# Copy only the compiled fat JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose server port (default 8080, overridden by cloud hosts)
EXPOSE 8080

# Run Spring Boot with environment port properties mapping
ENTRYPOINT ["java", "-Dserver.port=${PORT:8080}", "-jar", "app.jar"]
