---
author: Yossi Spektor
authorTwitter: SpektorYossi
category: software
title: "Kotlin Features Deep Dive"
date: "2024-08-11T20:19:03.284Z"
description: "Learn about advanced Kotlin features as well as learn more in-depth Kotlin"
tags:
  - kotlin
  - java

excerpt: Kotlin is a modern language which tries to simplify common actions which usually result in a lot of Java boilerplate. Its approach to concurrency is a breath of fresh air...
---

<div style="display:flex;justify-content:center;padding-right:10%;padding-bottom:50px;padding-top:30px;">
    <img src="/images/blog/kotlin_logo.svg"
    alt="Kotlin Logo"
    style="margin:0;"
    />
</div>

1. [Introduction](#introduction)
2. [Arrays](#arrays)
3. [Condition Validation](#condition-validation)
4. [Delegated Properties](#delegated-properties)
5. [Functional Interfaces](#functional-interfaces)

### <a name="introduction"></a>Introduction
It's been almost a year since I started to develop in Kotlin and it's been great so far! I love the language features and how it increases productivity as opposed to Java. This year was mostly about learning Kotlin and making the mental switch from Java. I feel that I'm now at a point to learn more idiomatic Kotlin and dive deeper into the language. This article summarizes all the new stuff I've learned and is more or less an eclectic choice of interesting features from [Kotlin official docs](https://kotlinlang.org/docs/home.html).

### <a name="arrays"></a>Arrays
To initialize an array in Kotlin with a default value use this syntax:
```kotlin
// creates an array of length 3 where each element equals 0
val array = Array<Int>(3) { 0 }
```
Array initializer can also use a function which receives array index as argument and returns the element value at the index:
```kotlin
// creates the array with elements 0, 2, 4
val array = Array<Int>(3) { i -> i * 2 }
```
Kotlin arrays also have built-in functions like: `.sum()`/`.shuffle()`/`toList()`.
We can also create arrays of pairs conviniently:
```kotlin
val arrayOfPairs = arrayOf("x" to 1, "y" to 2, "z" to 3)
```
There's also a handy way to iterate over arrays using their index:
```kotlin
for (i in array.indices) {
    println(array[i])
}
```
or by accessing both the index and the element value:
```kotlin
for ((index, value) in array.withIndex()) {
    println("the element at $index is $value")
}
```

### <a name="condition-validation"></a>Condition Validation
Kotlin has several built-in functions which allow to validate conditions or input and can throw an exception with a custom message:
```kotlin
val array = Array<Int>(3) { 0 }
// will throw IllegalArgumentException with the message: Array size '3' is too small
require(array.size > 5) {
    "Array size '${array.size}' is too small"
}
```
Another option is to use `check()`:
```kotlin
val array = Array<Int>(3) { 0 }
// will throw IllegalStateException with the message: Array size '3' is too small
check(array.size > 5) {
    "Array size '${array.size}' is too small"
}
```
The difference between `require` and `check` is mostly semantic whereas `require` is usually used to check input validity while `check` is used to check for state validity. And of course they throw different exception types.

It's also worth mentioning `takeIf` function which returns `this` if its predicate returns true and `null` otherwise:
```kotlin
val name = "Paul"
val result = name.takeIf { name.startsWith("a") }?.toUpperCase()
```

### <a name="delegated-properties"></a>Delegated Properties
Kotlin's delegated properties is a concept similar to Java's dynamic proxies or Javascript proxies. For example `Car` class uses `WheelDelegate`:
```kotlin
class Car {
    var wheel: String by WheelDelegate()
}
```
and this is the implementation of `WheelDelegate`:
```kotlin
import kotlin.reflect.KProperty

class WheelDelegate {
    operator fun getValue(thisRef: Any?, property: KProperty<*>): String {
        return "$thisRef, intercepting call to '${property.name}'"
    }

    operator fun setValue(thisRef: Any?, property: KProperty<*>, value: String) {
        println("$value has been assigned to '${property.name}' in $thisRef.")
    }
}
```
By assigning `WheelDelegate` to the `wheel` property `WheelDelegate` methods `getValue()` and `setValue()` are invoked on each get/set access to a `wheel` property:
```kotlin
val toyota = Car()
// prints: Car@33751d49, intercepting call to 'wheel'
println(toyota.wheel)
```
This mechanism can be very useful to observe changes in objects (e.g. Spring uses JDK dynamic proxies wherever possible for Spring AOP).

Kotlin even provides a few standard delegates. For example:
```kotlin
val lazyValue: String by lazy {
    println("computed!")
    "computation result"
}

fun main() {
    // prints: computed!, Hello, Hello
    println(lazyValue)
    println(lazyValue)
}
```
`lazy` delegate runs the lambda parameter only ones and then memoizes the result. This way on future invocations of `lazyValue` the computation will not be performed again.

Another handy delegate is `Delegates.observable`:
```kotlin
import kotlin.properties.Delegates

class Car {
    var wheel: String by Delegates.observable("small") {
        prop, old, new ->
        // prints:
        // small -> bigger
        // bigger -> huge
        println("$old -> $new")
    }
}

fun main() {
    val toyota = Car()
    toyota.wheel = "bigger"
    toyota.wheel = "huge"
}
```
`Delegates.observable` receives the initial value as the first argument and a lambda as the second one.

The last interesting case of using delegated properties is deprecation of some class property:
```kotlin
class Car {
    var newName: Int = 0
    @Deprecated("Use 'newName' instead", ReplaceWith("newName"))
    var oldName: Int by this::newName
}
fun main() {
    val toyota = Car()
    //IDE will display deprecation notification for `oldName`
    toyota.oldName = 42
    // prints: 42
    println(toyota.newName) // 42
}
```
If `oldName` property was deprecated we can add a new property `newName`, deprecate `oldName` and use property delegation so that `newName` gets the value of `oldName` if it's still used somewhere in code.

### <a name="functional-interfaces"></a>Functional Interfaces
An interface with only one abstract method is called a functional interface, or a Single Abstract Method (SAM) interface. Functional interfaces are declared as such:
```kotlin
fun interface EvenPredicate {
   fun invoke()
}
```
You can then use lambda functions to implement functional interfaces:
```kotlin
val isEven = EvenPredicate { it % 2 == 0 }
```
