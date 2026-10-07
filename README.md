# 🏦 ApexBank Core Engine

### *High-Performance REST API Banking Backend Built with Spring Boot 3.x & Hibernate 6*

<div align="center">

[![Java Version](https://shields.io)](https://oracle.com)
[![Spring Boot](https://shields.io)](https://spring.io)
[![MySQL](https://shields.io)](https://mysql.com)
[![Architecture](https://shields.io)](#-architecture--package-structure)

---
<p align="center">
  A secure, multi-tier enterprise backend architecture executing low-latency financial transactions. 
  Exposes standard RESTful routes designed for high-concurrency mobile and web banking clients.
</p>

[📌 Overview & Scenario](#-project-overview) • [✨ Endpoint Routes](#-rest-api-endpoint-implementations) • [🚀 Installation](#-setup--installation-guide)

</div>

---

## 📌 Project Overview
**ApexBank** is a robust backend system handling core customer ledgers. By decoupling the presentation layer from business logic using Data Transfer Objects (DTOs), this architecture remains highly scalable, ready to be plugged into any modern frontend web interface or Android application.

### ⚡ The Real-World Scenario It Solves
* **The Business Problem:** A retail fintech startup launching a mobile banking platform faces critical data risks. If a customer attempts a card withdrawal at an ATM at the exact same millisecond an automated debit order processing system hits their account, standard databases suffer from data race conditions, allowing illegal overdraft spending or negative balance leaks.
* **The Engineered Solution:** ApexBank serves as the isolated, secure single source of truth. The backend engine handles incoming actions sequentially, evaluates ledger balance boundaries in real-time, safely blocks double-spending by throwing explicit operational failures (`insufficient amount`), and executes database mutations—completely eliminating financial leakage.

---

## ⚙️ Tech Stack & Dependencies
* **Core Framework:** Spring Boot 3.2.1 (Java 17)
* **Web Container:** Spring Web (Embedded Apache Tomcat Server)
* **Object-Relational Mapping (ORM):** Spring Data JPA (Hibernate 6)
* **Database Management System:** MySQL Server 8.0
* **Boilerplate Reduction:** Project Lombok (Automated Getters, Setters, and Constructors)

---

## 🗂️ Architecture & Package Structure
The application adopts an enterprise-standard **Layered Architecture** to maintain clean separation of concerns:

| Package | Responsibility |
| :--- | :--- |
| **`entity`** | Maps persistence layer database schemas directly to Java models using JPA rules. |
| **`repository`** | Extends `JpaRepository` to inherit automated database CRUD abstractions. |
| **`dto`** | Shields database schemas from the web by encapsulating client network payloads. |
| **`mapper`** | Manages data transformations and serialization between DTOs and Entities. |
| **`service`** | Isolates financial transaction rules and coordinates entity mutations. |
| **`controller`** | Exposes Web API routes and maps incoming HTTP actions to the service layer. |

---

## ✨ REST API Endpoint Implementations
All exposed API routes accept and return data exclusively in JSON format. The base route for all networking nodes is configured at `/api/accounts`.

### 📊 API Endpoint Matrix

| HTTP Method | API Path Node | Description / Business Purpose | Required Payload (JSON) |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/accounts` | Creates a new customer bank account profile. | `{"accountHolderName": "John Doe", "balance": 5000.0}` |
| **`GET`** | `/api/accounts/{id}` | Fetches account summary metadata for a specific ID. | *None (Pass tracking ID in URL)* |
| **`PUT`** | `/api/accounts/{id}/deposit` | Modifies ledger states by adding specified funds. | `{"amount": 1500.0}` |
| **`PUT`** | `/api/accounts/{id}/withdraw` | Processes debit transactions after verifying balance limits. | `{"amount": 500.0}` |
| **`GET`** | `/api/accounts` | Compiles and streams a list of all active ledger logs. | *None* |
| **`DELETE`** | `/api/accounts/{id}` | Purges a target account permanently from the server. | *None (Pass tracking ID in URL)* |

---

## 🚀 Setup & Installation Guide

### 1. Database Schema Initialization
Log into your local MySQL Workbench or shell client instance and execute the database creation query script:
```sql
CREATE DATABASE banking_app;
```

### 2. Environment Variables Configuration
To run this application without exposing raw database credentials, open your project's top-level directory and create a local environment configuration file named `.env`:
```env
DB_URL=jdbc:mysql://localhost:3306/banking_app
DB_USER=your_mysql_username
DB_PASSWORD=your_actual_mysql_password
```

### 3. Application Properties Alignment
Ensure your `/src/main/resources/application.properties` configuration leverages property placeholders to safely extract local credentials:
```properties
spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/banking_app}
spring.datasource.username=${DB_USER:root}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=update
```

### 4. Running the Server Application
Launch the project from your preferred IDE (IntelliJ IDEA) or build and execute the application using Maven directly through your terminal workspace:
```bash
mvn clean package
mvn spring-boot:run
```
The embedded server container will spin up successfully on port **`8080`**.

### 5. API Testing Strategy
Open **Postman** or any API client environment to dispatch verification traffic. For example, validating account profiles via a `POST` request to `http://localhost:8080/api/accounts` will instantly register records, auto-generate incremental IDs, and provide visual compliance logs across your active backend.
