# Sprint 2: Core Module Development

Date: January 24, 2026
Goal: Core module development and working dashboards
Status: Completed

## 1. Sprint Overview
Sprint 2 delivered the first end-to-end functional experience for core users. The sprint implemented the primary business modules, established role-based dashboards, and ensured the system could support daily project operations.

## 2. Objectives
- Implement authentication and organization setup
- Deliver project and task management features
- Build time tracking and timesheet workflows
# Sprint Documentation

## 1. Sprint Overview

Sprint Name: Sprint 2 – Core Module Development
Sprint Number: 2
Sprint Duration: January 24, 2026
Sprint Goal: Deliver core modules and working dashboards.

---

## 2. Sprint Objectives

- Implement authentication and organization onboarding
- Deliver project and task management features
- Build milestones, phases, and team management
- Add time tracking and weekly timesheets
- Provide role-based dashboards with live data

---

## 3. Sprint Team

ID	Candidate Name

f00dfe078a69f52b5f24ffc0828a612f	Mohammed farook
129d1e5155cc230ad92485f39e665703	Mohamed Abdul Faazil A
4a3a44b029ef13c82784df7ea7b6defe	Mohammed Ayyub Khan
753e742e1869362a4584bf1f5f3317b5	Irfan khan J
71039bd7f121df0a32b4730e65578eca	Gowtham
4039fbf9c927921a8d341f1ace6533ec	Gopinathan
0454ef4f5d44365b2e94155b1afc07e6	Mohamed suhailu A
d8b40442ebf003abace4b89bd9f599f8	Sreejith
7e9b1116b711f0f8c51408423bf2e4b0	N Faheen ashar
e5d65a339cfb20fb35f4649dfb2205c5	Ifath Ahamed
de2a328eb5f4473ad0f4e6661308fd7c	Mohammad Madina
2912ccf5c8d1a53b0c14e8e0a5c47c55	SYED UMAR PEERAN K
99b434a63a685f399c64229e97f13012	abdul adhil t
134647691c08216a59941346939f0093	Shahul Hameed
4505ba0bf8beda7b24b49d6be82553bd	Mohamed Muzzammil M
7ddac8e2b919aee830a4a582b89ec14d	Mohammed abzal m
d765a31efe0d66694b7410f9d1208ef1	Syed Thahsin agusam s
e10a33c1cf6994f9b654364dd033c50d	Athifa fareeza
b4c7dede130cf169e154ae11f6729acb	Mohamed mayish A
aed46be93f0b094bf2e4a9262407c0ea	DIVYA K
2d200ea601b7306be9c46b49403f52b8	Nikkitha
1f7d489e69d5d13ae514ce1a744b5b73	THEANMERCY M
9f985ccb30de43f8554437cd476987a0	Arif basha
35f0ca4cdff4df5b8d34c6fca63e27db	M MOHAMMED FARHAAD
187f4e36d03af9da39c44db791119a97	Delli ganesh j

---

## 4. Sprint Backlog

User Story ID	Description	Priority	Story Points	Status

US-201	Authentication and organization setup	High	8	Done
US-202	Projects and tasks core CRUD	High	8	Done
US-203	Milestones, phases, and teams	Medium	5	Done
US-204	Timesheets and timers	Medium	5	Done
US-205	Role-based dashboards	Medium	5	Done

---

## 5. Scope (In-Scope / Out-of-Scope)

In-Scope:

- Authentication and organization membership flows
- Projects, tasks, milestones, phases
- Team and membership management
- Time tracking and timesheets
- Role-based dashboards and widgets

Out-of-Scope:

- Reporting and analytics exports
- Document management and versioning
- Notifications and collaboration threads

---

## 6. Sprint Plan

Day	Planned Activity

Day 1–3	Authentication and organization workflows
Day 4–7	Project and task management APIs
Day 8–10	Teams, milestones, phases
Day 11–12	Dashboards and widgets
Day 13–14	Integration checks and QA

---

## 7. Daily Stand-up Summary (Optional)

Blockers: None reported

Resolutions: Not applicable

---

## 8. Deliverables

- Auth and organization APIs and UI
- Project CRUD with membership handling
- Task CRUD with assignments and statuses
- Milestones and phases support
- Teams and membership management
- Timer and timesheet endpoints and UI
- Dashboard endpoints and role-aware widgets

---

## 9. Testing & Quality Assurance

Unit Tests: Core logic tests in place

Functional Testing: Project, task, and timesheet flows validated

Regression Issues: None

---

## 10. Risks & Mitigation

Risk	Impact	Mitigation

Complex data relationships	Medium	Validated Prisma relations and indexes
Role-based visibility	Medium	RBAC checks in API routes

---

## 11. Sprint Review Summary

Core functionality is complete, and the application supports daily operations for primary users. Dashboards present live project and task status.

---

## 12. Sprint Retrospective

What Went Well:

- Modular API structure enabled parallel work
- Dashboards provided immediate visibility

What Can Be Improved:

- Automated tests for core workflows should be expanded

Action Items:

- Add additional integration tests in later sprints

---

## 13. Metrics

Planned Story Points: 31

Completed Story Points: 31

Sprint Velocity: 100%
