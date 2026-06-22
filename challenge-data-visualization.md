# Challenge: Data Visualization Dashboard — Threat Analytics

**Difficulty:** Medium-Hard
**Angular Version:** 22+
**Focus:** ECharts integration, reactive data pipelines, signal-driven chart updates, responsive layouts

---

## The Problem

Tables and lists are not enough when users need to spot patterns, outliers, and trends in large datasets. A security analyst reviewing thousands of threat events needs visual summaries — not scrolling through rows. This challenge builds the kind of interactive dashboard you'd find at companies like Palo Alto Networks, CrowdStrike, or any SOC (Security Operations Center) tool.

---

## Task

Build a **Threat Analytics Dashboard** that visualizes mock security event data using Apache ECharts via `ngx-echarts`. The dashboard displays multiple chart types, reacts to user filters, and updates charts reactively through signals and RxJS.

---

## Tech Stack

- **Apache ECharts** — the charting engine
- **ngx-echarts** — Angular directive wrapper for ECharts
- Install: `npm install echarts ngx-echarts`

---

## Mock Data

Create a `ThreatMockService` (backend contract — do not modify after creation).

### Models

```ts
export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low';
export type ThreatCategory = 'phishing' | 'malware' | 'brute_force' | 'data_exfiltration' | 'insider_threat';
export type ThreatStatus = 'active' | 'mitigated' | 'investigating';

export interface ThreatEvent {
  id: number;
  timestamp: Date;
  severity: ThreatSeverity;
  category: ThreatCategory;
  status: ThreatStatus;
  source: string;        // e.g. 'email', 'endpoint', 'network', 'cloud'
  target: string;        // e.g. 'user@company.com', '192.168.1.50'
  description: string;
}
```

### Service Contract

```ts
@Service()
export class ThreatMockService {
  // Returns 200+ generated events spanning the last 30 days
  getEvents(): Observable<ThreatEvent[]>

  // Returns events filtered by date range — simulates 300ms network delay
  getEventsByRange(start: Date, end: Date): Observable<ThreatEvent[]>

  // Returns a live stream of new events, one every 2-5 seconds
  getLiveEvents(): Observable<ThreatEvent>
}
```

Generate realistic seed data — distribute events across categories, severities, sources, and dates. Weight it so `phishing` and `malware` are more common than `insider_threat`.

---

## Dashboard Components

### 1. `ThreatDashboardShell` (smart)

- Injects `ThreatMockService` (or a facade if you prefer)
- Manages filter state: date range, severity filter, category filter
- Exposes filtered data as signals to child components
- Subscribes to live event stream and merges new events into the dataset

### 2. `SeverityPieChart` (dumb)

- Input: `ThreatEvent[]`
- Renders a **pie/donut chart** showing distribution by severity
- Color-coded: critical = red, high = orange, medium = yellow, low = green
- Tooltip on hover shows count and percentage

### 3. `TimelineBarChart` (dumb)

- Input: `ThreatEvent[]`
- Renders a **stacked bar chart** — X axis is date (grouped by day), Y axis is event count
- Each stack segment is a severity level
- Shows trends over time — are attacks increasing?

### 4. `CategoryBreakdown` (dumb)

- Input: `ThreatEvent[]`
- Renders a **horizontal bar chart** showing count per threat category
- Sorted by count descending

### 5. `LiveEventFeed` (dumb)

- Input: receives new events via signal or input
- Renders a scrolling list of the last 20 live events
- New events animate in at the top
- Each event shows: timestamp, severity badge, category, description

### 6. `DashboardFilters`

- Outputs filter changes to the shell
- Date range picker (start/end)
- Severity multi-select (checkboxes or chips)
- Category multi-select
- Filters update all charts reactively

---

## Behavior

- On load, fetch all events and render all charts
- Changing a filter updates **all charts simultaneously** — no manual refresh button
- The live event stream runs independently — new events appear in the feed and optionally update chart totals
- Charts must resize responsively when the browser window changes
- Empty states: if a filter returns zero results, charts show a "No data" message — not a broken empty chart

---

## ECharts Integration Pattern

Each chart component should:
1. Accept data as an `input()`
2. Compute the ECharts `EChartsOption` config object as a `computed()` signal derived from the input data
3. Pass the option to the `echarts` directive in the template

The transformation from `ThreatEvent[]` → `EChartsOption` is the core logic of each chart. ECharts handles rendering — you handle data shaping.

---

## Acceptance Criteria

- [ ] `ngx-echarts` installed and configured
- [ ] `ThreatMockService` generates 200+ realistic events across 30 days
- [ ] Pie chart shows severity distribution with correct colors and tooltips
- [ ] Stacked bar chart shows daily event counts grouped by severity
- [ ] Horizontal bar chart shows category breakdown sorted by count
- [ ] Live event feed displays streaming events with severity badges
- [ ] All filters (date range, severity, category) update all charts reactively
- [ ] Charts resize on window resize
- [ ] Empty filter results show a "No data" state, not a broken chart
- [ ] No `any` types
- [ ] Smart/dumb component split — chart components have zero `inject()` calls
- [ ] ECharts options are derived via `computed()` from input data

---

## Stretch Goals

- [ ] Add a **heatmap** — X axis = hour of day, Y axis = day of week, color intensity = event count
- [ ] Add a **gauge chart** showing current threat level (based on active critical/high events)
- [ ] Click on a pie segment to filter all other charts by that severity
- [ ] Add `dataZoom` slider to the timeline chart for zooming into date ranges
- [ ] Dark theme toggle that swaps ECharts theme

---

## Resources

### ECharts

- [ECharts Examples Gallery](https://echarts.apache.org/examples/en/) — interactive demos of every chart type with source code
- [ECharts Option Documentation](https://echarts.apache.org/en/option.html) — full config reference
- [ECharts Getting Started](https://echarts.apache.org/handbook/en/get-started/)

### ngx-echarts (Angular wrapper)

- [ngx-echarts GitHub](https://github.com/xieziyu/ngx-echarts) — setup instructions, API reference
- [ngx-echarts npm](https://www.npmjs.com/package/ngx-echarts) — installation and version compatibility
- [ngx-echarts Live Demo](https://xieziyu.github.io/ngx-echarts/) — working Angular examples

### Dashboard Design

- [How Data Visualization Helps Prevent Cyber Attacks](https://www.centraleyes.com/how-data-visualization-helps-prevent-cyber-attacks/) — context on security dashboards
- [Data Visualization in Cybersecurity](https://www.apriorit.com/dev-blog/threat-visualization-in-cybersecurity) — real-world visualization patterns

### ECharts Specific Chart Guides

- [Pie Chart Config](https://echarts.apache.org/en/option.html#series-pie) — radius, label, color mapping
- [Bar Chart Config](https://echarts.apache.org/en/option.html#series-bar) — stacking, axis, categories
- [Heatmap Config](https://echarts.apache.org/en/option.html#series-heatmap) — for the stretch goal
