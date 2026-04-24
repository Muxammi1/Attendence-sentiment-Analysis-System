
SOFTWARE REQUIREMENTS SPECIFICATION
Automatic Attendance & Sentiment Analysis System

Version 4.0  —  Updated After Developer Progress Review


Confidential — Internal Use Only

1. Introduction
1.1 Purpose
This document is SRS Version 4.0 for the Automatic Attendance and Sentiment Analysis System (AASAS). It supersedes SRS v3.0 and incorporates insights from the developer's progress update received after initial drafting. The update revealed that three core workflows are already implemented and highlighted two open questions — user access control and use case definition — that this version fully addresses.
1.2 What Changed from SRS v3.0
The developer's update introduced the following new information that required revision:

1.3 Scope
In-Scope: Course creation, student enrollment, lecture-numbered attendance via face recognition, sentiment analysis, role-based access control, reporting, ERP integration, alerting
Out-of-Scope (Phase 1): Edge computing on cameras, mobile-side processing, physical access control, student self-service portal
1.4 Definitions

1.5 References
IEEE 830-1998: Recommended Practice for SRS
ISO/IEC 27001:2022: Information Security Management
ArcFace: Additive Angular Margin Loss for Deep Face Recognition (Deng et al., 2019)
GDPR Regulation (EU) 2016/679 — applicable data privacy principles
Apache Kafka Documentation: https://kafka.apache.org/documentation/
DeepSort: Simple Online and Realtime Tracking with a Deep Association Metric

2. Current Implementation Status
This section maps what the developer has confirmed as implemented against the full requirement set. It serves as a live progress tracker for the project.



3. Overall Description
3.1 Product Perspective
AASAS is a centralized, server-side AI platform deployed within the university LAN. It ingests live CCTV video, identifies students via face recognition, records attendance per lecture number, and surfaces behavioral insights to faculty. All processing occurs on an in-house GPU cluster — no cloud dependency, no data leaves the campus network.
The system augments (not replaces) existing university infrastructure: it consumes IP camera feeds and writes structured outputs to the university ERP and faculty portal.
3.2 User Classes and Permissions
Two primary roles have been identified by the developer. The table below defines their precise permissions — this is the access control model the system must implement.

3.3 Operating Environment
OS: Ubuntu 22.04 LTS on all GPU processing nodes
Hardware: Multi-node GPU cluster (RTX 3090/4090); 10–15 nodes for 120 classrooms
Network: 10 Gbps backbone between GPU cluster nodes; 1 Gbps for camera RTSP ingest
Containerization: Docker with Kubernetes orchestration
Database: PostgreSQL (primary) + Redis (cache/hot data)
Message Queue: Apache Kafka for reliable inter-service event streaming
Frontend: Web-based dashboard accessible via standard browser; no client installation
3.4 Design Constraints
Lecture structure: Each course contains exactly 16 numbered lectures (configurable per course)
No raw facial images may be persisted at any pipeline stage
All processing must occur on-premises — no data routed to external cloud services
System must not degrade existing university network performance

4. Use Cases
This section provides the comprehensive use case catalogue the developer requested. Use cases are organized by actor and cover the complete system scope. Each use case specifies the actor, preconditions, main flow, and postconditions.
4.1 Use Case Summary

4.2 Detailed Use Cases
UC-04: Trigger Attendance for a Lecture  [ALREADY IMPLEMENTED]


UC-06: Override Attendance Record


UC-09: Register Student Biometrics


UC-10: Manage User Accounts  [IN PROGRESS]


5. Lecture Number Model
The developer's update introduced a specific constraint — lecture numbers 1 through 16 — that was not in SRS v3. This section formally defines the lecture number model as a core system requirement.
5.1 Model Definition
Each course is divided into a fixed number of lectures, defaulting to 16 (configurable per course by Admin)
Each lecture is identified by an integer in the range [1, N] where N is the course lecture count
Attendance is recorded independently per lecture number — not per calendar date
Each lecture number may be executed once per course; re-execution requires explicit confirmation and overwrites the previous record
A lecture is in one of three states: Not Started, Completed, or Overridden
5.2 Lecture Number Requirements


6. Functional Requirements
6.1 Course & Enrollment Management

6.2 Face Detection & Tracking

6.3 Face Recognition

6.4 Attendance Engine


6.5 Sentiment Analysis

6.6 Reporting


7. Non-Functional Requirements
7.1 Performance

7.2 Security
All embeddings encrypted at rest (AES-256-GCM); encryption keys in a dedicated KMS
All API endpoints protected by JWT authentication; tokens expire after 8 hours
All inter-service communication over TLS 1.3
RBAC enforced at the API layer for every endpoint
Failed login attempts exceeding 5 consecutive failures trigger account lockout and Admin alert
All privileged actions recorded in an append-only, immutable Audit Log
7.3 Reliability & Availability
Target availability: 99% uptime during operational hours (6:00 AM – 10:00 PM)
Node failure must not halt processing for streams on other nodes
Hot standby for Central API; failover within 30 seconds
Kafka consumer offsets persisted; full event replay on recovery
7.4 Usability
Faculty dashboard: attendance report accessible within 3 clicks from login
Lecture number selector: clearly labeled 1–N with visual completion status
Responsive design: functional on tablet and desktop browsers
System should support Arabic localization for the faculty portal

8. System Architecture
8.1 High-Level Architecture

8.2 Node-Level CV Pipeline


9. Database Design
9.1 Schema Overview


10. Failure Handling & Recovery


11. Deployment Strategy


12. Privacy & Compliance
Only 512-d embeddings persisted; raw facial images discarded immediately after inference at every stage
Students must provide explicit digital consent before biometric enrollment; consent can be withdrawn at any time
On consent withdrawal: embedding deleted from FAISS index and database within 24 hours
Data retention: one academic year; automated purge runs at start of new academic year
Biometric data never transmitted outside the university LAN or shared with any third party
All access and modification events recorded in immutable Audit Log, retained for 3 academic years
A Privacy Impact Assessment (PIA) shall be maintained and updated before each deployment phase

13. API Design


14. Consultant Suggestions & Recommendations
Based on the developer's progress update and the overall architecture, the following recommendations are made to strengthen the project, close gaps, and avoid common pitfalls in face-recognition-based attendance systems.









END OF DOCUMENT
SRS v4.0 — Automatic Attendance & Sentiment Analysis System — Updated Post-Developer Review