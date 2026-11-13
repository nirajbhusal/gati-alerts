plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

import org.jetbrains.kotlin.gradle.dsl.JvmTarget

val keystorePath = System.getenv("GATI_ANDROID_KEYSTORE_FILE")
val hasReleaseKeystore = !keystorePath.isNullOrBlank() && file(keystorePath).isFile

android {
    namespace = "io.github.nirajbhusal.gati.alerts"
    compileSdk = 36

    defaultConfig {
        applicationId = "io.github.nirajbhusal.gati.alerts"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }

    signingConfigs {
        if (hasReleaseKeystore) {
            create("release") {
                storeFile = file(keystorePath!!)
                storePassword = System.getenv("GATI_ANDROID_KEYSTORE_PASSWORD")
                    ?: error("GATI_ANDROID_KEYSTORE_PASSWORD is not set")
                keyAlias = System.getenv("GATI_ANDROID_KEY_ALIAS")
                    ?: error("GATI_ANDROID_KEY_ALIAS is not set")
                keyPassword = System.getenv("GATI_ANDROID_KEY_PASSWORD")
                    ?: error("GATI_ANDROID_KEY_PASSWORD is not set")
            }
        }
    }

    buildTypes {
        debug {
            versionNameSuffix = "-preview"
            resValue(
                "string",
                "preview_banner",
                "PREVIEW. डिबग साइन भएको परीक्षण बिल्ड। गुगल प्लेका लागि होइन। Debug-signed test build. Not for Google Play.",
            )
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
            resValue("string", "preview_banner", "")
            if (hasReleaseKeystore) {
                signingConfig = signingConfigs.getByName("release")
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        buildConfig = false
    }

    packaging {
        jniLibs {
            useLegacyPackaging = false
        }
        resources {
            excludes += setOf(
                "META-INF/DEPENDENCIES",
                "META-INF/LICENSE",
                "META-INF/LICENSE.txt",
                "META-INF/NOTICE",
                "META-INF/NOTICE.txt",
                "META-INF/AL2.0",
                "META-INF/LGPL2.1",
            )
        }
    }

    lint {
        abortOnError = true
        checkReleaseBuilds = true
    }
}

base {
    archivesName.set("gati-alerts")
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.4")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.core:core-ktx:1.17.0")
    implementation("androidx.activity:activity-ktx:1.11.0")
    implementation("androidx.core:core-splashscreen:1.0.1")
    constraints {
        implementation("com.google.guava:guava:33.8.0-android") {
            because("CVE-2026-102554 is fixed in Guava 33.7.2 and later")
        }
    }
}

configurations.configureEach {
    resolutionStrategy.force("com.google.guava:guava:33.8.0-android")
}
