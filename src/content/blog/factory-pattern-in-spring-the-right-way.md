---
author: Yossi Spektor
authorTwitter: SpektorYossi
category: software
title: How To Use Factory Pattern In Spring The Right Way
date: "2023-09-08T10:19:03.284Z"
description: How To Use Factory Pattern In Spring The Right Way
tags:
  - java
  - spring
  - kotlin
  - design-pattern

excerpt: Factory design pattern is one of the most well-known in software engineering. It's often used in object-oriented languages to deal with the problem...
---

<div style="display:flex;flex-direction:column;justify-content:center;padding-right:10%;padding-bottom:6px;padding-top:30px;padding-left:20%;">
    <img style="min-width:60%;max-width:70%;" src="/images/blog/factory.jpg"
            alt="Factory"
            style="margin:0;"
            />
            <span style="font-size:12px;">Image credit: The Westland Milk factory in Hokitika by Wildman NZ (<a href="https://commons.wikimedia.org/wiki/File:Hokitika_milk_factory_27.jpg">license</a>)</span>
            
</div>

1. [What is Factory Pattern?](#what-is-factory-pattern)
2. [Task Definition](#task-definition)
3. [First Try: Losing Dependency Injection Benefits](#first-try)
4. [Second Try: Pervasive Usage of Autowired](#second-try)
5. [Third Try: Using Spring FactoryBean interface](#third-try)
5. [Final Try: Adding getType() to Sport Interface](#final-try)

### <a name="what-is-factory-pattern"></a>What is Factory Pattern?
Factory design pattern is one of the most well-known in software engineering. It's often used in object-oriented languages to deal with the problem of creating objects. That is instead of instantiating and object via a class constructor, a method of another class is called to provide an object instance and often times the factory method determines which object to return based on some property. In this post I will show several iterations to arrive to the cleanest factory pattern implementation in [Spring](https://spring.io/) which is a popular dependency injection Java framework. In these examples we will deal with Spring beans with non-default constructors (the constructors will receive arguments).

### <a name="Task Definition"></a>Task Definition
In the post we'll define a factory method which returns the type of sport which seems to fit one's interest. For example, if someone likes water then the factory method will return swimming. Below is the interest to sport type mapping:
- water -> swimming
- team sport -> football

Each sport type implements a method: `getCoachDetails` which returns the closest coach based on user location.

### <a name="first-try"></a>First Try: Bad
First, we can define a interface `Sport`:
```java
public interface Sport {

	String getCoachDetails();
}
```
and the implementations:
```java
import org.springframework.stereotype.Component;

@Component
public class Swimming implements Sport {

	private LocationService locationService;

	public Swimming(LocationService locationService) {
		this.locationService = locationService;
	}

	@Override
	public String getCoachDetails() {
		// use locationService to find the closest coach
		return "Jack Johnson";
	}
}
```
In the above example `Swimming` is a Spring bean and uses constructor injection in order to receive another Spring bean `LocationService` to find the closest swimming coach. Let's implement the interface for team sport as well:
```java
import org.springframework.stereotype.Component;

@Component
public class Football implements Sport {

	private LocationService locationService;

	public Football(LocationService locationService) {
		this.locationService = locationService;
	}

	@Override
	public String getCoachDetails() {
		// use locationService to find the closest coach
		return "Matt Jackson";
	}
}
```
We will also create an enum `Interest`:
```java
public enum Interest {
	WATER,
	TEAM_SPORT
}
```
and lastly we will implement `SportFactory` class:
```java
import org.springframework.stereotype.Component;

@Component
public class SportFactory {

	private LocationService locationService;
	
	public SportFactory(LocationService locationService) {
		this.locationService = locationService;
	}
	
	public Sport getSport(Interest interest) {
		Sport sport = null;
		switch (interest) {
			case WATER -> sport = new Swimming(locationService);
			case TEAM_SPORT -> new Football(locationService);
			default -> new RuntimeException(String.format("no sport found for interest: '%s'", interest));
		}
		return sport;
	}
}
```
There're multiple issues with this implementation:
1. Separation of concerns: `SportFactory` now has to know what `LocationService` is although it doesn't use this class.
2. Although `Swimming` and `Football` are Spring beans in the above code they're not, rather they are instantiated directly. As a result they're not managed by Spring and lose all the benefits of dependency injection.

### <a name="second-try"></a>Second Try: Pervasive Usage of Autowired
We can try to solve some of the above issues by using `@Autowired`. For example, `Swimming` class could receive `locationService` via `@Autowired` annotation:
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class Swimming implements Sport {

	@Autowired
	private LocationService locationService;

	@Override
	public String getCoachDetails() {
		// use locationService to find the closest coach
		return "Jack Johnson";
	}
}
```
We can then use Spring `ApplicationContext` class to get the Spring beans which implement `Sport` interface:
```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class SportFactory {

	@Autowired
	private ApplicationContext applicationContext;

	public Sport getSport(Interest interest) {
		Sport sport = null;
		switch (interest) {
			case WATER -> sport = applicationContext.getBean(Swimming.class);
			case TEAM_SPORT -> applicationContext.getBean(Football.class);
			default -> new RuntimeException(String.format("no sport found for interest: '%s'", interest));
		}
		return sport;
	}
}
```
This approach is far from perfect:
1. Using `@Autowired` is not a best practice and is not recommended: `Swimming` class now doesn't have a constructor and it's not immediately clear what its dependencies are.
2. `SportFactory` is still using `ApplicationContext` directly which is again not recommended since we're losing the benefits is dependency injection.
Both of these issues will make testing the code more difficult

### <a name="third-try"></a>Third Try: Using Spring FactoryBean interface
Spring allows classes to implement `FactoryBean` interface: objects produced by such classes will be managed by Spring. Let's take a look at a possible implementation draft:
```java
import org.springframework.beans.factory.FactoryBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class SportFactory implements FactoryBean<Sport> {

	@Autowired
	private ApplicationContext applicationContext;

	@Override
	public Sport getObject() throws Exception {
		// decide the sport based on the interest and return it
	}

	@Override
	public Class<?> getObjectType() {
		return Sport.class;
	}

	@Override
	public boolean isSingleton() {
		return false;
	}
}
```
`FactoryBean` not only doesn't help address our problems, on the contrary it only exacerbates them:
1. `getObject` method from `FactoryBean` needs to return the relevant `Sport` implementation however it can't receive any parameters (like `Interest` in our case). Thus [additional](https://www.baeldung.com/spring-factorybean#ways-to-initialize) mechanisms must be employed to somehow pass such information to `getObject`.
2. All the problems from previous examples still presist: `@Autowired` usage and usage of `ApplicationContext` to get the relevant `Sport` instance.

The only thing which `FactoryBean` brings to the table is `isSingleton` method which determines if the object returned by `getObject` is a singleton or not which in our case doesn't really matter. Thus what began as a promising solution quickly grew into an even more complicated factory method implementation then previously.

### <a name="final-try"></a>Final Try: Adding getType() to Sport Interface
Finally, it's time to present the solution which addresses all of the above issues. Let us create a new enum `SportType` and add a new method to `Sport` interface`getType`:
```java
public enum SportType {

	SWIMMING, FOOTBALL
}
```
and `Swimming` implementation:
```java
import org.springframework.stereotype.Component;

@Component
public class Swimming implements Sport {

	private LocationService locationService;

	public Swimming(LocationService locationService) {
		this.locationService = locationService;
	}

	@Override
	public String getCoachDetails() {
		// use locationService to find the closest coach
		return "Jack Johnson";
	}

	@Override
	public SportType getType() {
		return SportType.SWIMMING;
	}
}
```
Finally, we can refactor `SportFactory` class:
```java
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class SportFactory {

	private Map<SportType, Sport> sports;

  // Spring will automatically get all implementations of Sport
  // interface within the list
	public SportFactory(List<Sport> sports) {
		this.sports = sports.stream().collect(
			Collectors.toUnmodifiableMap(
				Sport::getType, Function.identity()
			)
		);
	}

	public Sport getSport(Interest interest) {
		Sport sport = null;
		switch (interest) {
			case WATER -> sport = sports.get(SportType.SWIMMING);
			case TEAM_SPORT -> sports.get(SportType.FOOTBALL);
			default -> new RuntimeException(String.format("no sport found for interest: '%s'", interest));
		}
		return sport;
	}
}
```
The above `SportFactory` implementation solves all of the above issues:
- `Swimming` and `Football` Spring beans can now use constructor injection.
- `SportFactory` doesn't instantiate `Swimming` and `Football` classes directly nor does it use `ApplicationContext`.

I hope you found the post useful and you will use feel more comfortable using factory patterns with Spring.