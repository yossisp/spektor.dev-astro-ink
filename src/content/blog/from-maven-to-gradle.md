---
author: Yossi Spektor
authorTwitter: SpektorYossi
category: software
title: "From Maven To Gradle: Crash Course"
date: "2024-08-12T20:19:03.284Z"
description: "Learn How To Transition From Maven To Gradle."
tags:
  - kotlin
  - java
  - maven
  - gradle

excerpt: Gradle is a popular open-source build tool which is often used in Java ecosystem and is the default system for Android and Kotlin Multi-Platform projects...
---

<div style="display:flex;justify-content:center;padding-right:10%;padding-bottom:50px;padding-top:30px;">
    <img src="/images/blog/gradle_logo.svg"
    alt="Gradle Logo"
    style="margin:0;"
    />
</div>

1. [What Is Gradle?](#what-is-gradle)
2. [Core Gradle Concepts](#core-gradle-concepts)
3. [Project Structure](#project-structure)
4. [Gradle Wrapper](#gradle-wrapper)
5. [Declaring Dependencies](#declaring-dependencies)
6. [Tasks](#tasks)
7. [Plugins](#plugins)
8. [Incremental Builds](#incremental-builds)
9. [Build Caching](#build-caching)
10. [Sharing Build Settings Between Projects](#sharing-build-settings-between-projects)
11. [Build Lifecycle](#build-lifecycle)
12. [Dependencies Scopes](#dependencies-scopes)
13. [Repositories](#repositories)
14. [Controlling dependency versions](#controlling-dependency-versions)
    1. [Dependency Constraints](#dependency-constraints)
    2. [Bills of Materials (Maven BOMs)](#bom)
    3. [Overriding Transitive Versions](#overriding-transitive-versions)
    4. [Exclude Dependencies](#exclude-dependencies)
15. [Differences](#differences)
16. [Summary](#summary)

### <a name="what-is-gradle"></a>What Is Gradle?
Gradle is a popular open-source build tool which is often used in Java ecosystem and is the default system for Android and Kotlin Multi-Platform projects. As someone who previously used Maven I wanted to write a short crash course for transitioning from Maven to Gradle as well as talk about the core Gradle concepts.

### <a name="core-gradle-concepts"></a>Core Gradle Concepts
There's an excellent overview of the core concepts in [Gradle docs](https://docs.gradle.org/current/userguide/gradle_basics.html) but below is the gist:

- a Gradle **project** is a piece of software that can be built, such as an application or a library. Single project builds include a single project called the root project.
Multi-project builds include one root project and any number of subprojects.

- **build scripts** detail to Gradle what steps to take to build the project. Each project can include one or more build scripts.

- **dependency management** is an automated technique for declaring and resolving external resources required by a project.

- **tasks** are a basic unit of work such as compiling code or running your test. Each project contains one or more tasks defined inside a build script or a plugin.

- **plugins** are used to extend Gradle’s capability and optionally contribute tasks to a project.

### <a name="project-structure"></a>Project Structure
![Gradle Project Structure](/images/blog/gradle-project-structure.png)

Where:
1. Gradle directory to store wrapper files and more
2. Gradle version catalog for dependency management
3. Gradle wrapper scripts
4. Gradle settings file to define a root project name and subprojects
5. Gradle build scripts of the two subprojects - subproject-a and subproject-b
6. Source code and/or additional files for the projects

### <a name="gradle-wrapper"></a>Gradle Wrapper
Similar to Maven wrapper Gradle also has one. It's recommended to invoke Gradle wrapper instead of a global Gradle executable because the wrapper contains the Gradle version the project uses
and as a result builds will be more reproducible.

### <a name="declaring-dependencies"></a>Declaring Dependencies
The Maven dependency below
```xml
<dependencies>
    <dependency>
        <groupId>com.google.guava</groupId>
        <artifactId>guava</artifactId>
        <version>33.2.1-jre</version>
    </dependency>
</dependencies>
```
can be converted to the following Gradle dependency:
```kotlin
dependencies {
    implementation("com.google.guava:guava:33.2.1-jre")  
}
```
The above string identifier takes the Maven values of groupId, artifactId and version, although Gradle refers to them as group, module and version.

Gradle keeps track of dependencies used in a project in `libs.versions.toml` file which contains the information about libraries, versions and plugins. It is recommended to keep the file as the source of truth regarding dependencies. It allows to set a dependency version once and then re-use the dependency and version configuration across multiple subprojects, for example, given this `libs.versions.toml`:
```toml
[versions]
guava = "33.2.1-jre"

[libraries]
guava = { module = "com.google.guava:guava", version.ref = "guava" }
```
the `guava` dependency can be used like in `build.gradle.kts`:
```kotlin
dependencies {
    implementation(libs.guava) 
}
```
### <a name="tasks"></a>Tasks
Tasks are the basic Gradle unit of work. For example, `./gradlew build` executes `build` task. Tasks can depend on other tasks (for example, `:app:compileJava` task must complete first before `build`).

### <a name="plugins"></a>Plugins
Just like Maven, Gradle uses plugins for similar purposes like adding new tasks, configurations, or other build-related capabilities. A special kind of plugin is [convention plugin](https://docs.gradle.org/current/samples/sample_convention_plugins.html) which allows to re-use build logic across multiple projets.

### <a name="incremental-builds"></a>Incremental Builds
An incremental build is a build that avoids running tasks whose inputs have not changed since the previous build. For incremental builds to work, tasks must define their inputs and outputs. If inputs or outputs changed Gradle will execute the task otherwise it will skip it. Incremental builds are always enabled, and the best way to see them in action is to turn on verbose mode, for example: `./gradlew compileJava --console=verbose`:
```bash
> Task :buildSrc:generateExternalPluginSpecBuilders UP-TO-DATE
> Task :buildSrc:extractPrecompiledScriptPluginPlugins UP-TO-DATE
> Task :buildSrc:compilePluginsBlocks UP-TO-DATE
> Task :buildSrc:generatePrecompiledScriptPluginAccessors UP-TO-DATE
> Task :buildSrc:generateScriptPluginAdapters UP-TO-DATE
> Task :buildSrc:compileKotlin UP-TO-DATE
> Task :buildSrc:compileJava NO-SOURCE
> Task :buildSrc:compileGroovy NO-SOURCE
> Task :buildSrc:pluginDescriptors UP-TO-DATE
> Task :buildSrc:processResources UP-TO-DATE
> Task :buildSrc:classes UP-TO-DATE
> Task :buildSrc:jar UP-TO-DATE
> Task :list:compileJava UP-TO-DATE
> Task :utilities:compileJava UP-TO-DATE
> Task :app:compileJava UP-TO-DATE
```
`UP-TO-DATE` is printed next to the task if its inputs/outputs didn't change. This feature is very useful when there're several subprojects and only a few files were changed. For example, let's say there's module `A` which depends on module `B` which depends on module `C`. If a file in `B` was changed full build will still build all modules. However with incremental builds only `B` module will be re-compiled as well as module `A` because it depends on module `B`. Incremental build will also be helpful if only a single file is changed in a project such that other files which don't depend on it are not re-built.

### <a name="build-caching"></a>Build Caching
Build caching helps save results when you switch between Git branches or want to re-use previous output in CI environments. For example, after you first build a project and then build it again incremental build feature will be used (you should see `UP-TO-DATE` in verbose mode). Let's say you then run `./gradlew clean` which deletes build output. When you run `./gradlew clean` Gradle will fetch the build output from its cache and you should see `FROM-CACHE` next to tasks in verbose mode. Gradle saves tasks outputs in global build cache which is located at `~/.gradle/caches/` in Unix/Mac OS. Gradle will also periodically remove cached outputs to free disk space. 

As you can imagine this feature can be very nice in CI builds as shared modules can be built once and then the build output can be re-used by different applications.

### <a name="sharing-build-settings-between-projects"></a>Sharing Build Settings Between Projects
Suppose there're many modules in a Gradle project. All of the modules apply plugins which enforce style conventions, look for code bugs, lint etc. Instead of specifying these plugins manually in each of the modules we can specify them once in what is called plugin convention file and then import this file in each of the individual modules. A special folder called `buildSrc` is reserved by Gradle for these purposes. Consider the following project structure:
```
├── module-a
│   └── build.gradle.kts
├── module-b
│   └── build.gradle.kts
├── buildSrc
│   ├── build.gradle.kts
│   ├── settings.gradle.kts
│   ├── src
│   │   ├── main
│   │   │   └── kotlin
│   │   │       ├── myproject.my-conventions.gradle.kts
└── settings.gradle.kts
```
and the below is the contents of `myproject.my-conventions.gradle.kts`:
```kotlin
plugins {
    java
    checkstyle
}
```
Then each module can import the convention plugin in its `build.gradle.kts` like this:
```plugins {
    id("myproject.library-conventions")
}

dependencies {
    ...
}
```

### <a name="build-lifecycle"></a>Build Lifecycle
Maven builds are based around the concept of build lifecycles that consist of a set of fixed phases while Gradle uses its own [build model](https://docs.gradle.org/current/userguide/build_lifecycle.html#build_lifecycle). For Maven users transitioning to Gradle, it provides a helper feature that can mimic Maven’s phases: lifecycle tasks.
Here is a list of some of the main Maven phases and the Gradle tasks that they map to:

**clean** -> use the clean task provided by the Base Plugin.

**compile** -> use the classes task provided by the Java Plugin and other JVM language plugins. This compiles all classes for all source files of all languages and also performs resource filtering via the processResources task.

**test** -> use the test task provided by the Java Plugin. It runs the unit tests, and more specifically, the tests that make up the test source set.

**package** -> use the assemble task provided by the Base Plugin. This builds whatever is the appropriate package for the project; for example, a JAR for Java libraries or a WAR for traditional Java webapps.

**verify** -> use the check task provided by the Base Plugin. This runs all verification tasks that are attached to it, which typically includes the unit tests, any static analysis tasks — such as Checkstyle — and others. If you want to include integration tests, you will have to configure these **manually**.

**install** -> use the `publishToMavenLocal` task provided by the Maven Publish Plugin. Note that Gradle builds don’t require you to "install" artifacts as you have access to more appropriate features like inter-project dependencies and composite builds. **You should only use publishToMavenLocal for interoperating with Maven builds**.

### <a name="dependencies-scopes"></a>Dependencies Scopes
Below is the mapping between Maven and Gradle dependencies scopes:
**compile** -> in most cases you should simply use the `implementation` configuration, particularly if you’re building an application or webapp. But if you’re building a library, you can learn about which dependencies should be declared using `api` configuration [here](https://docs.gradle.org/current/userguide/building_java_projects.html#sec:building_java_libraries).

**runtime** -> use the `runtimeOnly` configuration.

**test** -> Gradle distinguishes between those dependencies that are required to compile a project’s tests and those that are only needed to run them. Dependencies required for test compilation should be declared against the `testImplementation` configuration. Those that are only required for running the tests should use `testRuntimeOnly`.

You can read more about `provided` and `import` scopes [here](https://docs.gradle.org/current/userguide/migrating_from_maven.html)

### <a name="#repositories"></a>Repositories
Unlike Maven, it has no default repository and so you have to declare at least one. In order to have the same behavior as your Maven build, just configure Maven Central in your Gradle build, like this:
```kotlin
repositories {
    mavenCentral()
}
```

### <a name="controlling-dependency-versions"></a>Controlling dependency versions
The existence of transitive dependencies means that you can very easily end up with multiple versions of the same dependency in your dependency graph. By default, Gradle will pick the newest version of a dependency in the graph, but that’s not always the right solution. That’s why it provides several mechanisms for controlling which version of a given dependency is resolved.

#### <a name="dependency-constraints"></a>Dependency Constraints
Provides a way to enforce specific transitive dependency version across all the dependencies of a project:
```kotlin
dependencies {
    implementation("org.apache.httpcomponents:httpclient") // note that version is not specified here
    constraints {
        implementation("org.apache.httpcomponents:httpclient:4.5.3") {
            because("previous versions have a bug impacting this application")
        }
        implementation("commons-codec:commons-codec:1.11") {
            because("version 1.9 pulled from httpclient has bugs affecting this application")
        }
    }
}
```
In the example, all versions are omitted from the dependency declaration. Instead, the versions are defined in the constraints block. The version definition for `commons-codec:1.11` is only taken into account if `commons-codec` is brought in as transitive dependency, since `commons-codec` is not defined as dependency in the project. Otherwise, the constraint has no effect.

#### <a name="bom"></a>Bills of Materials (Maven BOMs)
Maven allows you to share dependency constraints by defining dependencies inside a <dependencyManagement> section of a POM file that has a packaging type of pom. This special type of POM (a BOM) can then be imported into other POMs so that you have consistent library versions across your projects.
Gradle can use such BOMs for the same purpose, using a special dependency syntax based on platform() and enforcedPlatform() methods. You simply declare the dependency in the normal way, but wrap the dependency identifier in the appropriate method, as shown in this example that "imports" the Spring Boot Dependencies BOM:
```kotlin
dependencies {
    implementation(platform("org.springframework.boot:spring-boot-dependencies:1.5.8.RELEASE"))  
    implementation("com.google.code.gson:gson")  
    implementation("dom4j:dom4j")
}
```

#### <a name="overriding-transitive-versions"></a>Overriding Transitive Versions
Gradle also allows to force dependency version on dependency level:
```kotlin
dependencies {
    implementation("org.apache.httpcomponents:httpclient:4.5.4")
    implementation("commons-codec:commons-codec") {
        version {
            strictly("1.9")
        }
    }
}
```
Using the above method may cause [issues](https://docs.gradle.org/current/userguide/dependency_downgrade_and_exclude.html#sec:strict-version-consequences) to consumers of the a module.

#### <a name="exclude-dependencies"></a>Exclude Dependencies
Gradle's exclude mechanism, in contrast to Maven, takes the whole dependency graph into account. So if there are multiple dependencies on a library, excludes are only exercised if all dependencies agree on them. For example:
```kotlin
dependencies {
    implementation("commons-beanutils:commons-beanutils:1.9.4") {
        exclude(group = "commons-collections", module = "commons-collections")
    }
    implementation("com.opencsv:opencsv:4.6") // depends on 'commons-beanutils' without exclude and brings back 'commons-collections'
}
```
If we add `opencsv` as another dependency to our project above, which also depends on `commons-beanutils`, `commons-collection` is no longer excluded as `opencsv` itself does not exclude it.
If we still want to have `commons-collections` excluded, because our combined usage of `commons-beanutils` and `opencsv` does not need it, we need to exclude it from the transitive dependencies of `opencsv` as well.
```kotlin
dependencies {
    implementation("commons-beanutils:commons-beanutils:1.9.4") {
        exclude(group = "commons-collections", module = "commons-collections")
    }
    implementation("com.opencsv:opencsv:4.6") {
        exclude(group = "commons-collections", module = "commons-collections")
    }
}
```
Lastly, if you want to share constraints between modules in a multi-module project you can use [Java Platform Plugin](https://docs.gradle.org/current/userguide/java_platform_plugin.html#java_platform_plugin).

### <a name="differences"></a>Differences
One notable difference between the two tools is in how they manage version conflicts. Maven uses a "closest" match algorithm, whereas Gradle picks the newest. You can learn more about the differences between Maven and Gradle [here](https://gradle.org/maven-vs-gradle).

### <a name="summary"></a>Summary
Maven and Gradle share quite a few similarities but they also take different approaches to various build aspects. Gradle brings in incremental builds and caching which are very nice features not available in Maven. I hope your transition from Maven to Gradle will be easier after reading the blog post.