# Challenge #3: Defer (Deferrable Views) Optimization - Performance Dashboard

**Difficulty:** Medium
**Time Estimate:** 2-3 hours
**Angular Version:** 17+
**Feature:** @defer blocks (Deferrable Views)

---

## 🎯 Learning Objectives

- Use `@defer` blocks for lazy loading components
- Understand different defer triggers (viewport, interaction, idle, timer)
- Implement loading and error states with `@placeholder` and `@error`
- Measure bundle size reduction with defer
- Optimize Largest Contentful Paint (LCP)
- Learn when to use each defer trigger

---

## 📋 Requirements

### Core Features

**Dashboard Layout**
- Header with app title and stats summary
- Sidebar navigation (always loaded)
- Main content area with 4 sections:
  1. **Analytics Chart** (heavy Chart.js component)
  2. **Data Table** (heavy table with 1000+ rows)
  3. **Image Gallery** (10+ high-res images)
  4. **Recent Activity** (real-time updates)

**Defer Strategies by Section**

1. **Analytics Chart** - `@defer (on viewport)`
   - Loads only when scrolled into view
   - Heavy dependency: Chart.js library
   - Placeholder: skeleton chart loader
   - Minimum loading time: 200ms

2. **Data Table** - `@defer (on interaction)`
   - Loads when "Show Data" button clicked
   - Heavy component with virtual scrolling
   - Placeholder: button with "Load Data Table"
   - Error state: retry button

3. **Image Gallery** - `@defer (on idle)`
   - Loads when browser is idle (after initial render)
   - 10+ images (lazy loaded individually)
   - Placeholder: image grid skeleton
   - Prefetch: on idle

4. **Recent Activity** - `@defer (on timer(2s))`
   - Loads 2 seconds after page load
   - Simulates SSE/WebSocket connection
   - Placeholder: loading spinner

### Technical Requirements

1. **Defer Syntax Usage**
   ```html
   @defer (on viewport) {
     <app-chart [data]="chartData" />
   } @placeholder (minimum 200ms) {
     <app-chart-skeleton />
   } @error {
     <p>Failed to load chart. <button (click)="retry()">Retry</button></p>
   } @loading (minimum 200ms; after 100ms) {
     <app-spinner />
   }
   ```

2. **Bundle Size Measurement**
   - Build with defer: `ng build --configuration production`
   - Build without defer (all eager): compare bundle sizes
   - Document size reduction (aim for 30%+ reduction)
   - Use `ng build --stats-json` and webpack-bundle-analyzer

3. **Loading States**
   - Each defer block has custom placeholder
   - Minimum loading time to prevent flashing
   - Skeleton loaders that match final UI
   - Smooth transitions

4. **Error Handling**
   - Error state for each defer block
   - Retry mechanism
   - Fallback content

5. **Performance Metrics**
   - Measure Initial Bundle Size
   - Measure Time to Interactive (TTI)
   - Measure Largest Contentful Paint (LCP)
   - Use Chrome Lighthouse

### Bonus Challenges

- [ ] Add `prefetch` triggers for better UX
- [ ] Implement custom defer triggers with `DeferTrigger`
- [ ] Add hover trigger for tooltip components
- [ ] Combine multiple triggers (`on viewport; on timer(5s)`)
- [ ] Build the same dashboard WITHOUT defer and compare performance
- [ ] Add service worker caching for deferred chunks
- [ ] Implement progressive image loading within gallery
- [ ] Add Network Information API integration (load less on slow networks)
- [ ] Create a defer strategy decision tree/documentation

---

## 🏗️ Implementation Guide

### 1. Setup

```bash
# Create new Angular app
ng new defer-dashboard --standalone --routing=false

cd defer-dashboard

# Install Chart.js (heavy library for demo)
npm install chart.js
```

### 2. Component Structure

```
src/app/
├── components/
│   ├── dashboard/
│   │   └── dashboard.component.ts (main layout)
│   ├── analytics-chart/
│   │   ├── analytics-chart.component.ts (heavy, deferred)
│   │   └── chart-skeleton.component.ts (placeholder)
│   ├── data-table/
│   │   ├── data-table.component.ts (heavy, deferred)
│   │   └── table-skeleton.component.ts (placeholder)
│   ├── image-gallery/
│   │   ├── image-gallery.component.ts (deferred)
│   │   └── gallery-skeleton.component.ts (placeholder)
│   ├── recent-activity/
│   │   ├── recent-activity.component.ts (deferred)
│   │   └── activity-skeleton.component.ts (placeholder)
│   └── shared/
│       └── spinner.component.ts
├── services/
│   └── performance-monitor.service.ts
└── app.component.ts
```

### 3. Defer Syntax Examples

**Viewport Trigger (load when visible):**
```html
<!-- dashboard.component.html -->
<section class="analytics-section">
  <h2>Analytics</h2>

  @defer (on viewport) {
    <app-analytics-chart [data]="chartData" />
  } @placeholder (minimum 200ms) {
    <app-chart-skeleton />
  } @loading (minimum 200ms) {
    <app-spinner />
  } @error {
    <div class="error-state">
      <p>Failed to load analytics chart</p>
      <button (click)="retryChart()">Retry</button>
    </div>
  }
</section>
```

**Interaction Trigger (load on click/focus):**
```html
<section class="data-table-section">
  <h2>Data Table</h2>

  @defer (on interaction) {
    <app-data-table [rows]="tableData" />
  } @placeholder {
    <button class="load-data-btn">
      Click to Load Data Table (1000+ rows)
    </button>
  } @error {
    <p>Failed to load table. <button (click)="retryTable()">Retry</button></p>
  }
</section>
```

**Idle Trigger (load when browser idle):**
```html
<section class="gallery-section">
  <h2>Image Gallery</h2>

  @defer (on idle) {
    <app-image-gallery [images]="galleryImages" />
  } @placeholder (minimum 500ms) {
    <app-gallery-skeleton />
  } @loading {
    <app-spinner />
  }
</section>
```

**Timer Trigger (load after delay):**
```html
<section class="activity-section">
  <h2>Recent Activity</h2>

  @defer (on timer(2s)) {
    <app-recent-activity />
  } @placeholder {
    <app-activity-skeleton />
  }
</section>
```

**Prefetching (load code in background):**
```html
@defer (on viewport; prefetch on idle) {
  <!-- Component loads when visible, but code prefetches when idle -->
  <app-heavy-component />
}
```

**Multiple Triggers:**
```html
@defer (on viewport; on timer(5s)) {
  <!-- Loads when EITHER condition is met -->
  <app-component />
}
```

### 4. Heavy Chart Component Example

```typescript
// analytics-chart.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-analytics-chart',
  standalone: true,
  template: `
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      height: 400px;
    }
  `]
})
export class AnalyticsChartComponent implements OnInit {
  @Input() data: any;

  ngOnInit() {
    // Simulate heavy initialization
    console.log('AnalyticsChartComponent loaded (heavy Chart.js library)');
    this.renderChart();
  }

  renderChart() {
    const ctx = document.querySelector('canvas')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Revenue',
          data: [12000, 19000, 15000, 25000, 22000, 30000],
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }]
      }
    });
  }
}
```

### 5. Skeleton Loader Examples

```typescript
// chart-skeleton.component.ts
@Component({
  selector: 'app-chart-skeleton',
  standalone: true,
  template: `
    <div class="skeleton-chart">
      <div class="skeleton-bar" *ngFor="let bar of [1,2,3,4,5,6]"></div>
    </div>
  `,
  styles: [`
    .skeleton-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 400px;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 20px;
    }

    .skeleton-bar {
      width: 40px;
      background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-bar:nth-child(1) { height: 40%; }
    .skeleton-bar:nth-child(2) { height: 70%; }
    .skeleton-bar:nth-child(3) { height: 55%; }
    .skeleton-bar:nth-child(4) { height: 85%; }
    .skeleton-bar:nth-child(5) { height: 65%; }
    .skeleton-bar:nth-child(6) { height: 90%; }

    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class ChartSkeletonComponent {}
```

### 6. Bundle Size Analysis

```bash
# Build for production with stats
ng build --configuration production --stats-json

# Install bundle analyzer
npm install -g webpack-bundle-analyzer

# Analyze bundle
webpack-bundle-analyzer dist/defer-dashboard/stats.json
```

**Measure before/after:**
```typescript
// WITHOUT defer (eager loading)
@Component({
  template: `
    <app-analytics-chart />
    <app-data-table />
    <app-image-gallery />
    <app-recent-activity />
  `
})

// WITH defer
@Component({
  template: `
    @defer (on viewport) { <app-analytics-chart /> }
    @defer (on interaction) { <app-data-table /> }
    @defer (on idle) { <app-image-gallery /> }
    @defer (on timer(2s)) { <app-recent-activity /> }
  `
})
```

### 7. Performance Monitoring Service

```typescript
// services/performance-monitor.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PerformanceMonitorService {
  measureLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  measureTTI() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('TTI:', entry);
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  logBundleSize() {
    const resources = performance.getEntriesByType('resource');
    const jsFiles = resources.filter(r => r.name.endsWith('.js'));

    const totalSize = jsFiles.reduce((sum, file: any) =>
      sum + (file.transferSize || 0), 0
    );

    console.log('Total JS Bundle Size:', (totalSize / 1024).toFixed(2), 'KB');

    return jsFiles.map((file: any) => ({
      name: file.name.split('/').pop(),
      size: (file.transferSize / 1024).toFixed(2) + ' KB'
    }));
  }
}
```

---

## ✅ Acceptance Criteria

### Must Have
- [ ] Dashboard with 4 distinct sections
- [ ] Analytics chart defers on viewport (with Chart.js)
- [ ] Data table defers on interaction (button click)
- [ ] Image gallery defers on idle
- [ ] Recent activity defers on timer (2s)
- [ ] Custom placeholders for each defer block
- [ ] Error states with retry buttons
- [ ] Loading states with minimum display time
- [ ] Smooth transitions between states

### Should Have
- [ ] Skeleton loaders match final UI
- [ ] No content flash (minimum display times)
- [ ] Bundle size reduced by 30%+ with defer
- [ ] Performance metrics logged to console
- [ ] Responsive design
- [ ] Accessible (ARIA labels, keyboard nav)

### Nice to Have
- [ ] Prefetch triggers for better UX
- [ ] Multiple trigger combinations
- [ ] Comparison build (with/without defer)
- [ ] Lighthouse performance score > 90
- [ ] Service worker caching
- [ ] Network-aware loading strategies

---

## 🧪 Testing Strategy

**Manual Testing Checklist:**
- [ ] Page loads → only header/sidebar visible, no heavy components
- [ ] Scroll down → chart loads when viewport reached
- [ ] Click "Load Data" button → table loads
- [ ] Wait on page → gallery loads on idle
- [ ] Recent activity loads after 2 seconds
- [ ] Disable network in DevTools → error states show
- [ ] Click retry → components reload
- [ ] Check Network tab → deferred chunks load separately
- [ ] Run Lighthouse → performance score improved

**Performance Comparison:**
```
BEFORE (no defer):
- Initial bundle: 500 KB
- LCP: 2.5s
- TTI: 3.2s

AFTER (with defer):
- Initial bundle: 250 KB (-50%)
- LCP: 1.2s (-52%)
- TTI: 1.8s (-44%)
```

---

## 📚 Resources

**Angular Defer:**
- [Angular Deferrable Views Guide](https://angular.dev/guide/defer)
- [Angular v17 Release (introduced @defer)](https://blog.angular.dev/introducing-angular-v17-4d7033312e4b)
- [Defer Performance Benefits](https://angular.dev/best-practices/performance)

**Performance Tools:**
- [Chrome Lighthouse](https://developer.chrome.com/docs/lighthouse)
- [Web Vitals](https://web.dev/vitals/)
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

**Chart.js:**
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)

---

## 🎓 Key Learnings

After completing this challenge, you should understand:

1. **@defer syntax** - All defer triggers and their use cases
2. **Bundle optimization** - How defer reduces initial bundle size
3. **Loading states** - @placeholder, @loading, @error blocks
4. **Performance metrics** - LCP, TTI, bundle size measurement
5. **When to defer** - Decision making for lazy loading components
6. **User experience** - Balancing performance with perceived speed

---

## 📊 Defer Trigger Decision Tree

```
Should this component be deferred?

Is it heavy (>50KB) or has heavy dependencies?
  ├─ No → Don't defer (overhead not worth it)
  └─ Yes → Continue

Is it visible on initial page load?
  ├─ Yes → Don't defer (bad UX)
  └─ No → Continue

When should it load?
  ├─ When user scrolls to it → @defer (on viewport)
  ├─ When user clicks/focuses → @defer (on interaction)
  ├─ After critical content loads → @defer (on idle)
  ├─ After a delay → @defer (on timer(Xms))
  └─ Based on custom logic → @defer (when condition)
```

---

## 💡 Hints & Tips

1. **Start without defer** - Build all components first, then add defer
2. **Measure first** - Baseline performance before optimization
3. **Skeleton loaders are key** - Match final UI dimensions to prevent layout shift
4. **Minimum display time** - Prevents flashing (use 200ms minimum)
5. **Bundle analyzer is your friend** - Visualize what's being deferred
6. **Don't over-defer** - Deferring small components adds overhead
7. **Prefetch intelligently** - Load code in background for better UX
8. **Test on slow networks** - Throttle in DevTools (Fast 3G)

---

## 🚀 Getting Started

1. Create new Angular app (v17+)
2. Build all 4 sections WITHOUT defer first
3. Measure baseline performance (bundle size, Lighthouse score)
4. Add defer blocks one by one
5. Create custom placeholders for each
6. Add error states with retry
7. Measure performance after defer
8. Document improvements
9. Experiment with different triggers
10. Run Lighthouse and celebrate improvements!

---

**Remember: Defer is about initial load performance. Don't defer everything - be strategic!**
