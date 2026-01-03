pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
    versionCatalogs {
        create("libs") {
            from(files("../../../renderers/android/gradle/libs.versions.toml"))
        }
    }
}

rootProject.name = "A2UI-Android-Sample"
include(":projects:contact")
include(":projects:orchestrator")
include(":projects:restaurant")

includeBuild("../../../renderers/android") {
    dependencySubstitution {
        substitute(module("com.google.a2ui.compose:a2ui-compose")).using(project(":a2ui-compose"))
        substitute(module("com.google.a2ui.core:a2ui-core")).using(project(":a2ui-core"))
    }
}
