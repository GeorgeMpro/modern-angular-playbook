import {Component} from '@angular/core';

@Component({
  selector: 'app-subject-selector',
  imports: [],
  templateUrl: './subject-selector.html',
  styleUrl: './subject-selector.scss',
  standalone: true
})
export default class SubjectSelector {

}

/*
---

## Challenge 12: The Subject Selector

**Concepts:** `Subject`, `BehaviorSubject`, `ReplaySubject`, `asObservable()`
**Data source:** None — no HTTP, no mock API. Pure stream mechanics.

### The Problem

You have three different communication scenarios in an app. Currently all three use plain `Subject`. Two of them are wrong — late subscribers miss data they should have received.

### Task

Build three services, each solving a different problem. Pick the correct Subject type for each. In every case, the Subject must be **private** — consumers receive only `asObservable()`.

**Service 1 — Event Bus** (`ClickEventService`)
Broadcasts button click events to any listener. No consumer needs to know about past clicks — only future ones.

**Service 2 — Auth State** (`AuthStateService`)
Holds the current authenticated user (`User | null`). Any component that subscribes — even one mounted after login — must immediately receive the current user without waiting for the next change.

**Service 3 — Notification History** (`NotificationService`)
Emits toast notifications. A notification panel that opens *after* several notifications have fired must display the last 5, not start empty.

### Behavior

- A new subscriber to `ClickEventService` receives nothing until the next click
- A new subscriber to `AuthStateService` immediately receives the current user
- A new subscriber to `NotificationService` immediately receives up to the last 5 notifications
- No consumer can call `.next()` on any Subject — `asObservable()` hides the write API entirely

### What you'll learn

Subject type selection is entirely about **late subscriber behavior**:

| Type | Late subscriber gets |
|---|---|
| `Subject` | Nothing — joins the stream from now |
| `BehaviorSubject(initialValue)` | The last emitted value immediately |
| `ReplaySubject(n)` | The last `n` emitted values immediately |

`asObservable()` is the RxJS equivalent of `signal.asReadonly()` — it strips the write API so consumers can only observe, not push. Always expose Subjects this way from services.*/
