FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
COPY src ./src

RUN chmod +x mvnw && ./mvnw -q -DskipTests package

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "target/core-0.0.1-SNAPSHOT.jar"]
