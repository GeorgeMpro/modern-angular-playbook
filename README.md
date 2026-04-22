# Angular Challenges

A collection of hands-on Angular challenges built to master modern framework patterns — signals, RxJS, interceptors, error handling, performance, accessibility, and more. Each challenge is a self-contained Angular workspace project with a corresponding `.md` file covering the requirements and implementation details.

---

## Contents

- [Challenge 11 — Centralized Error Handling](#challenge-11--centralized-error-handling)

---

## Challenge 11 — Centralized Error Handling

**Focus:** GlobalErrorHandler, HTTP interceptors, toast notifications, RxJS patterns

**Project:** `challenge-11-centralized-error-handling`

```bash
ng serve challenge-11-centralized-error-handling
```

### What's inside

- **`GlobalErrorHandler`** — catches all uncaught JS errors app-wide, logs them and shows a toast
- **`errorInterceptor`** — intercepts HTTP errors, maps status codes to user-friendly messages, retries network errors with exponential backoff via a custom `retryOnNetworkError` operator
- **`mockBackendInterceptor`** — simulates HTTP error responses (400, 401, 403, 404, 500, network) without a real server
- **`ToastService`** — signal-based toast queue with auto-dismiss, action buttons (retry, undo, dismiss), and status-driven action mapping
- **`ErrorLogger`** — structured console logging with error context (source, status, URL, method, stack)
- **`trackRequest`** — custom RxJS operator using `defer` to set a loading signal at subscription time
- **`ErrorTest` component** — interactive test page using `exhaustMap` to limit concurrent requests, with cancel support via `takeUntil`
