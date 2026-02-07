# Sprint 5: User Profile Enhancements

Sprint Name: Sprint 5 – User Profile Enhancements
Sprint Number: 5
Sprint Duration: 2 Weeks (01 Feb 2026 – 14 Feb 2026)
Sprint Goal: Deliver editable user profiles with validation and improved performance.

## 1. Sprint Overview
Sprint 5 focuses on profile management improvements. The goal is to allow users to edit profile details, enforce validation on both client and server, and improve API response time for profile data retrieval. This sprint emphasizes user experience and performance in a frequently used area of the application.

## 2. Sprint Objectives
- Enable users to edit profile details
- Add client-side and server-side validation
- Improve API response time for profile fetch

## 3. Sprint Team
| Role | Name |
|------|------|
| Product Owner | Anitha R |
| Scrum Master | Ravi K |
| Frontend Dev | Arjun M |
| Backend Dev | Suresh P |
| QA | Meena S |

## 4. Sprint Backlog
| User Story ID | Description | Priority | Story Points | Status |
|---|---|---|---|---|
| US-101 | Edit user profile | High | 8 | Done |
| US-102 | Profile validation | High | 5 | Done |
| US-103 | API optimization | Medium | 3 | In Progress |

## 5. Scope
In Scope
- Profile edit form
- Validation messages
- API performance improvements

Out of Scope
- Profile picture upload
- Social media integration

## 6. Sprint Plan
| Day | Planned Activity |
|---|---|
| Day 1 | Sprint planning, backlog refinement |
| Day 2–10 | Development and unit testing |
| Day 11–12 | Integration and QA testing |
| Day 13 | Bug fixes |
| Day 14 | Sprint review and retrospective |

## 7. Deliverables
- Editable profile UI
- Validated APIs
- Updated database indexes

## 8. Implementation Notes
- Profile UI changes targeted the dedicated profile page
- API changes focused on user data retrieval and update routes
- Validation rules implemented both in the client layer and the API layer
- Performance work targets slower profile fetch queries

## 9. Evidence in Repository
- Profile page: src/app/profile/page.tsx
- User API module: src/app/api/users
- Shared validation and error utilities: src/lib

## 10. Testing and Quality Assurance
- Unit Tests: 85 percent coverage
- Functional Testing: Passed
- Regression Issues: 2 (Resolved)

Test Focus Areas
- Form validation and error messaging
- API validation for update requests
- Profile data fetch performance

## 11. Daily Stand-up Summary
- Blockers: API latency on Day 6
- Resolutions: Database index added

## 12. Risks and Mitigation
| Risk | Impact | Mitigation |
|---|---|---|
| API delay | Medium | Optimize queries |

## 13. Sprint Review Summary
- Profile edit feature demonstrated
- Product Owner approved US-101 and US-102

## 14. Sprint Retrospective
What went well
- Clear requirements
- Good team collaboration

What can be improved
- Earlier performance testing

Action items
- Add performance checks in the next sprint

## 15. Metrics
- Planned Story Points: 16
- Completed Story Points: 13
- Sprint Velocity: 81 percent

## 16. Open Items
- US-103 (API optimization) remains in progress
- Performance tuning to be completed early in the next sprint

## 17. Acceptance Criteria
- Users can edit profile fields without errors
- Validation messages appear for invalid inputs
- Profile API responds within the target response window
- Changes persist correctly and are visible on reload
