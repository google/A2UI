plugins {
  kotlin("jvm") version "2.1.10"
  kotlin("plugin.serialization") version "2.1.10"
  id("java-library")
  id("com.ncorti.ktfmt.gradle") version "0.19.0"
  id("org.jetbrains.kotlinx.kover") version "0.9.1"
}

ktfmt {
  googleStyle()
}

version = "0.1.0"
group = "com.google.a2ui"

kotlin {
  jvmToolchain(21)
}

repositories {
  mavenCentral()
}

dependencies {
  api("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
  implementation("com.networknt:json-schema-validator:1.5.1")
  implementation("com.fasterxml.jackson.core:jackson-databind:2.17.2")

  // Core Dependencies
  api("com.google.adk:google-adk:0.9.0")
  api("com.google.adk:google-adk-a2a:0.9.0")
  api("io.github.a2asdk:a2a-java-sdk-client:1.0.0.Alpha3")
  api("com.google.genai:google-genai:1.43.0")

  testImplementation(kotlin("test"))
  testImplementation("io.mockk:mockk:1.13.11")
}

tasks.test {
  useJUnitPlatform()
}

val copySpecs by tasks.registering(Copy::class) {
  val repoRoot = projectDir.parentFile.parentFile

  from(File(repoRoot, "specification/v0_8/json/server_to_client.json")) {
    into("com/google/a2ui/assets/0.8")
  }
  from(File(repoRoot, "specification/v0_8/json/standard_catalog_definition.json")) {
    into("com/google/a2ui/assets/0.8")
  }

  from(File(repoRoot, "specification/v0_9/json/server_to_client.json")) {
    into("com/google/a2ui/assets/0.9")
  }
  from(File(repoRoot, "specification/v0_9/json/common_types.json")) {
    into("com/google/a2ui/assets/0.9")
  }
  from(File(repoRoot, "specification/v0_9/json/basic_catalog.json")) {
    into("com/google/a2ui/assets/0.9")
  }

  into(layout.buildDirectory.dir("generated/resources/specs"))
}

sourceSets {
  main {
    resources {
      srcDir(copySpecs)
    }
  }
}
