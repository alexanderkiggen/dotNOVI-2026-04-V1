# Les 8: Monitoring & Observability

## Doelstellingen

In deze les leer je:
- Waarom monitoring essentieel is in DevOps
- Het verschil tussen monitoring en observability
- De drie pijlers: Metrics, Logs, Traces
- Prometheus: architectuur, metriek types, PromQL
- Grafana: dashboards bouwen en alerts instellen
- Golden Signals: latency, traffic, errors, saturation

## Waarom Monitoring?

Monitor sluit de DevOps lifecycle loop:
```
Plan → Code → Build → Test → Release → Deploy → Operate → Monitor
                                                              ↓
                                                         terug naar Plan
```

Zonder monitoring:
- Geen idee of de app werkt na een deploy
- Problemen pas ontdekken als gebruikers klagen
- Geen data om te verbeteren (DORA metrics!)

## Drie Pijlers van Observability

### 1. Metrics (Prometheus)
Getallen over tijd — trends en alerting
```
http_requests_total: 1500/min
response_time_p95: 200ms
error_rate: 0.5%
cpu_usage: 45%
```

### 2. Logs (ELK, Loki)
Gestructureerde events — debugging
```json
{"level":"error","msg":"DB connection failed","ts":"2026-04-15T10:30:00Z"}
{"level":"info","msg":"User created","userId":42}
```

### 3. Traces (Jaeger, Zipkin)
Request volgen door services — bottleneck detectie
```
Frontend → API → Order Service → Payment → DB
                                   ↑ 800ms bottleneck
```

## Prometheus

### Architectuur
- **Pull-model**: Prometheus haalt metrics OP van je app
- Je app exposed een `/metrics` endpoint
- Prometheus scraped elke 15s (configureerbaar)

### /metrics endpoint toevoegen aan Node.js

```bash
npm install prom-client
```

```javascript
import { collectDefaultMetrics, register, Counter, Histogram } from 'prom-client';

// Standaard metrics: CPU, memory, event loop
collectDefaultMetrics();

// Custom counter
const httpRequests = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status']
});

// Custom histogram
const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
});

// Endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Metriek types

| Type | Richting | Voorbeeld |
|------|----------|-----------|
| Counter | Alleen omhoog | requests_total, errors_total |
| Gauge | Op en neer | cpu_usage, memory_bytes |
| Histogram | Verdeling (buckets) | request_duration_seconds |
| Summary | Kwantielen | response_time p50, p95, p99 |

### PromQL voorbeelden

```promql
# Totaal requests
http_requests_total

# Requests per seconde (5m window)
rate(http_requests_total[5m])

# Error rate (alleen 5xx)
rate(http_requests_total{status=~"5.."}[5m])

# p95 response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Top 5 endpoints
topk(5, rate(http_requests_total[5m]))
```

## Grafana

### Dashboard bouwen
1. Data source: Prometheus toevoegen (http://prometheus:9090)
2. Panels: graph, stat, gauge, table
3. Variables: $service, $namespace (dynamische filters)
4. Alerts: trigger op metriek-condities

### Golden Signals (Google SRE)
Focus je dashboard op deze vier:
- **Latency**: hoe snel reageert de app? (p50, p95, p99)
- **Traffic**: hoeveel requests per seconde?
- **Errors**: hoeveel requests falen? (error rate %)
- **Saturation**: hoe vol zit het systeem? (CPU, memory)

## Opdrachten

### Opdracht 1: /metrics endpoint (15 min)

```bash
# Installeer prom-client
npm install prom-client

# Voeg metrics toe aan je app (zie voorbeeld hierboven)

# Test
curl http://localhost:3000/metrics
```

### Opdracht 2: Prometheus + Grafana opstarten (25 min)

```bash
# Gebruik de docker-compose.yml uit monitoring/
cd monitoring
docker compose up -d

# Prometheus UI: http://localhost:9090
# Grafana UI: http://localhost:3001 (admin/admin)

# Test PromQL in Prometheus UI:
# rate(http_requests_total[5m])
```

### Opdracht 3: Grafana dashboard (20 min)

1. Voeg Prometheus als data source toe
2. Maak een nieuw dashboard met 3-4 panels:
    - Request rate: `rate(http_requests_total[5m])`
    - Error rate: `rate(http_requests_total{status=~"5.."}[5m])`
    - Response time p95: `histogram_quantile(0.95, ...)`
    - Active connections (gauge)
3. Sla het dashboard op

## Bestandsstructuur

```
les-08-monitoring/
├── README.md
└── monitoring/
    ├── docker-compose.yml    # Prometheus + Grafana + Node Exporter + cAdvisor
    └── prometheus.yml        # Scrape configuratie
```

## Volgende Les

In Les 9 gaan we:
- Pipeline best practices samenvatten
- DevSecOps recap over alle lessen
- Eindopdracht doorlopen en starten

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/)
- [Google SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
