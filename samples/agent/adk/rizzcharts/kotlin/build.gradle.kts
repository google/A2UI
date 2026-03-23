plugins {
    kotlin("jvm") version "2.3.0"
    application
    id("com.ncorti.ktfmt.gradle") version "0.19.0"
}

ktfmt {
  googleStyle()
}

group = "com.google.a2ui.samples"
version = "0.9.0-SNAPSHOT"

// Configure Java capability
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
    google()
}

dependencies {
    implementation("com.google.a2ui:a2ui-agent")

    // Google ADK
    implementation("com.google.adk:google-adk:0.9.0")

    // Default model integration
    implementation("com.google.genai:google-genai:1.43.0")

    // Ktor Server
    implementation("io.ktor:ktor-server-core:3.4.1")
    implementation("io.ktor:ktor-server-netty:3.4.1")
    implementation("io.ktor:ktor-server-cors:3.4.1")
    implementation("io.ktor:ktor-server-content-negotiation:3.4.1")
    implementation("io.ktor:ktor-serialization-jackson:3.4.1")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.17.2")

    // Dotenv
    implementation("io.github.cdimascio:dotenv-java:3.0.0")
}

application {
    mainClass.set("com.google.a2ui.samples.rizzcharts.RizzchartsMainKt")
}
