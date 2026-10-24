# ACME Core Banking Console

High-Performance REST API Banking Backend Built with Spring Boot 3.x & Hibernate 6

A secure, multi-tier enterprise backend architecture executing low-latency financial transactions. Exposes standard RESTful routes designed for high-concurrency mobile and web banking clients.

* Overview & Scenario
* Endpoint Routes
* Audit Trail & Banking Rules Console
* Installation

## Project Overview

ACME Core Banking Console is a robust backend system handling core customer ledgers, security events, and automated audit rules. By decoupling the presentation layer from business logic using Data Transfer Objects (DTOs), this architecture remains highly scalable, ready to be plugged into the ACME web console and React frontend interface.

## The Real-World Scenario It Solves

* The Business Problem: A retail fintech platform launching a mobile and web banking console faces critical data risks. If a customer attempts a card withdrawal at an ATM at the exact same millisecond an automated debit order processing system hits their account, standard databases suffer from data race conditions, allowing illegal overdraft spending or negative balance leaks.
* The Engineered Solution: ACME Core Banking Console serves as the isolated, secure single source of truth. The backend engine handles incoming actions sequentially, evaluates ledger balance boundaries in real-time, safely blocks double-spending by throwing explicit operational failures, logs all actions to an immutable audit trail, and executes database mutations without financial leakage.

## Tech Stack & Dependencies

* Core Framework: Spring Boot 3.2.5 (Java 17)
* Web Container: Spring Web (Embedded Apache Tomcat Server)
* Object-Relational Mapping (ORM): Spring Data JPA (Hibernate 6)
* Database Management System: MySQL Server 8.0
* Boilerplate Reduction: Project Lombok (Automated Getters, Setters, and Constructors)

## Architecture & Package Structure

The application adopts an enterprise-standard Layered Architecture to maintain clean separation of concerns:

| Package | Responsibility |
| --- | --- |
| entity | Maps persistence layer database schemas directly to Java models using JPA rules (`AppUser`, `Loan`, `SecurityEvent`, `SecurityPolicy`, `SystemSettings`, `Transaction`). |
| repository | Extends `JpaRepository` to inherit automated database CRUD abstractions. |
| dto | Shields database schemas from the web by encapsulating client network payloads (`AccountDto`, `LoanRequestDto`, `TransactionDto`, `TransferRequestDto`). |
| mapper | Manages data transformations and serialization between DTOs and Entities. |
| service | Isolates financial transaction rules, audit logging (`SecurityEventLogger`), and coordinates entity mutations. |
| controller | Exposes Web API routes (`SecurityController`, `SettingsController`, `UserController`) and maps incoming HTTP actions to the service layer. |
| management | Handles global API exceptions (`ApiExceptionHandler`, `ApiException`) and seed data (`ManagementDataSeeder`). |
| config | Configures CORS policy (`ManagementCorsConfig`) to allow cross-origin communication with frontend consoles. |

## REST API Endpoint Implementations

All exposed API routes accept and return data exclusively in JSON format. The base route for all networking nodes is configured at `/api/accounts`.

### API Endpoint Matrix

| HTTP Method | API Path Node | Description / Business Purpose | Required Payload (JSON) |
| --- | --- | --- | --- |
| POST | `/api/accounts` | Creates a new customer bank account profile. | `{"accountHolderName": "John Doe", "balance": 5000.0}` |
| GET | `/api/accounts/{id}` | Fetches account summary metadata for a specific ID. | None (Pass tracking ID in URL) |
| PUT | `/api/accounts/{id}/deposit` | Modifies ledger states by adding specified funds. | `{"amount": 1500.0}` |
| PUT | `/api/accounts/{id}/withdraw` | Processes debit transactions after verifying balance limits. | `{"amount": 500.0}` |
| GET | `/api/accounts` | Compiles and streams a list of all active ledger logs. | None |
| DELETE | `/api/accounts/{id}` | Purges a target account permanently from the server. | None (Pass tracking ID in URL) |

## Audit Trail & Banking Rules Console

The platform includes integrated administrative capabilities across both the Spring Boot backend and the React web frontend console:

* Security Audit Trails: Tracks system events, user role actions, and configuration changes via dedicated security repositories and controllers.
* System Security Policies: Enforces banking rules, password expiration, session limits, and account suspension workflows.
* User & Access Directory: Manages role-based access controls for Admin, Manager, Teller, and Auditor personas directly from the console interface.

## Setup & Installation Guide

### 1. Database Schema Initialization

Log into your local MySQL Workbench or shell client instance and execute the database creation query script:

```sql
CREATE DATABASE banking_app;

```

### 2. Environment Variables Configuration

To run this application without exposing raw database credentials, open your project's top-level directory and create a local environment configuration file named `.env`:

```text
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
spring.jackson.property-naming-strategy=SNAKE_CASE

```

### 4. Running the Server Application

Launch the project from your preferred IDE (IntelliJ IDEA) or build and execute the application using Maven directly through your terminal workspace:

```bash
mvn clean package
mvn spring-boot:run

```

The embedded server container will spin up successfully on port `8080`.

### 5. API Testing Strategy

Open Postman or any API client environment to dispatch verification traffic. For example, validating account profiles via a POST request to `http://localhost:8080/api/accounts` will instantly register records, auto-generate incremental IDs, and provide visual compliance logs across your active backend.
