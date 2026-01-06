# Database Queries for ETL Indicators

This directory contains SQL queries for analyzing various indicators from the ETL tables in the facility client tool.

## Query Files Overview

### 1. `indicator-queries.sql`
General indicator queries covering:
- Facility performance metrics
- Sync status analysis
- Report download analytics
- Queue management indicators
- Line list analytics
- Data quality indicators
- Temporal analysis
- Comprehensive facility performance scorecards

### 2. `health-indicators.sql`
Health-specific indicator queries for:
- **HIV Care & Treatment**: Currently on ART, new initiations, viral load suppression
- **HIV Testing Services (HTS)**: Testing volumes, positivity rates, linkage to care
- **PMTCT**: Prevention of mother-to-child transmission indicators
- **Tuberculosis**: TB case detection, treatment outcomes, TB/HIV co-infection
- **Maternal & Child Health**: ANC visits, skilled deliveries, child health metrics
- **Family Planning**: Contraceptive uptake, new clients, LARC utilization
- **Malaria**: Testing, treatment, case management
- **Non-Communicable Diseases**: Diabetes, hypertension, cancer screening

### 3. `datim-indicators.sql`
DATIM/PEPFAR specific indicators:
- **Treatment Indicators**: TX_CURR, TX_NEW, TX_ML, TX_RTT
- **Viral Load**: TX_PVLS (suppression rates)
- **Testing**: HTS_TST, HTS_INDEX
- **Linkage Analysis**: HTS to treatment linkage rates
- **Prevention**: PMTCT_STAT, PMTCT_ART, PMTCT_EID
- **TB Indicators**: TB_STAT, TB_ART, TB_PREV
- **Key Populations**: KP_PREV
- **Data Quality Checks**: Validation and consistency checks

### 4. `utility-queries.sql`
Reusable utility functions and patterns:
- Common query patterns and templates
- Date range queries (monthly, quarterly, YTD)
- Facility comparison and ranking
- Trend analysis (growth rates, moving averages)
- Data validation and outlier detection
- Performance metrics (completeness, timeliness)
- Export formats
- Index recommendations

## Database Schema Reference

The queries work with these main tables:

- **`facilities`**: Facility information and sync status
- **`indicators`**: Individual indicator values by facility and period
- **`line_lists`**: Patient-level data records
- **`report_downloads`**: Downloaded report data and sync status
- **`report_queue`**: Report processing queue
- **`facility_report_types`**: Available report types
- **`indicator_types`**: Configured indicator definitions

## Usage Examples

### 1. Get Current ART Patients by Facility
```sql
SELECT 
    f.name as facility_name,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as current_on_art
FROM facilities f
JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
WHERE i.indicatorId LIKE '%TX_CURR%'
  AND i.period = '2024-01'
GROUP BY f.name, i.period
ORDER BY current_on_art DESC;
```

### 2. Monthly Trend Analysis
```sql
SELECT 
    i.period,
    COUNT(*) as total_indicators,
    COUNT(CASE WHEN i.synced = 1 THEN 1 END) as synced_indicators,
    ROUND(COUNT(CASE WHEN i.synced = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as sync_percentage
FROM indicators i
WHERE i.period >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 MONTH), '%Y-%m')
GROUP BY i.period
ORDER BY i.period DESC;
```

### 3. Facility Performance Scorecard
```sql
SELECT 
    f.name as facility_name,
    COUNT(DISTINCT i.indicatorId) as indicators_reported,
    SUM(CASE WHEN i.indicatorId LIKE '%TX_CURR%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as current_on_art,
    SUM(CASE WHEN i.indicatorId LIKE '%TX_NEW%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as new_on_art
FROM facilities f
LEFT JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
WHERE i.period = '2024-01'
GROUP BY f.name
ORDER BY current_on_art DESC;
```

## Query Customization

### Parameters to Modify
- **Period filters**: Change date ranges by modifying `WHERE i.period >= 'YYYY-MM'`
- **Indicator patterns**: Update `LIKE '%pattern%'` clauses for specific indicators
- **Facility filters**: Add `WHERE f.id IN (1,2,3)` to focus on specific facilities
- **Aggregation levels**: Modify `GROUP BY` clauses for different aggregation levels

### Common Patterns
1. **Replace indicator patterns**: Change `%TX_CURR%` to your specific indicator
2. **Adjust time periods**: Modify `DATE_SUB(NOW(), INTERVAL X MONTH)` for different ranges
3. **Add facility filters**: Include `AND f.location = 'specific_location'` for geographic filtering
4. **Change aggregation**: Use `QUARTER()`, `YEAR()`, or `WEEK()` functions for different time groupings

## Performance Considerations

### Recommended Indexes
```sql
CREATE INDEX idx_indicators_facility_period ON indicators(facilityId, period);
CREATE INDEX idx_indicators_indicator_period ON indicators(indicatorId, period);
CREATE INDEX idx_indicators_name_period ON indicators(name, period);
CREATE INDEX idx_indicators_synced ON indicators(synced);
```

### Query Optimization Tips
1. Always include period filters to limit data scanned
2. Use specific indicator patterns instead of broad wildcards
3. Consider using `LIMIT` for large result sets
4. Use `EXPLAIN` to analyze query performance

## Integration with Application

### Using in TypeScript/Node.js
```typescript
import { fetchFromDatabase } from '../lib/database';

async function getCurrentART(facilityId: string, period: string) {
  const query = `
    SELECT SUM(CAST(value AS UNSIGNED)) as current_on_art
    FROM indicators 
    WHERE facilityId = ? 
      AND indicatorId LIKE '%TX_CURR%' 
      AND period = ?
  `;
  
  const result = await fetchFromDatabase(query, [facilityId, period]);
  return result[0]?.current_on_art || 0;
}
```

### API Endpoint Example
```typescript
// app/api/indicators/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const facilityId = searchParams.get('facilityId');
  const period = searchParams.get('period');
  
  const query = `
    SELECT 
      indicatorId,
      name,
      value,
      period
    FROM indicators 
    WHERE facilityId = ? AND period = ?
    ORDER BY name
  `;
  
  const indicators = await fetchFromDatabase(query, [facilityId, period]);
  return Response.json(indicators);
}
```

## Data Quality Checks

Before running analysis queries, consider running these validation checks:

1. **Check for missing periods**:
```sql
SELECT DISTINCT period FROM indicators ORDER BY period DESC LIMIT 12;
```

2. **Verify data types**:
```sql
SELECT value FROM indicators WHERE value NOT REGEXP '^[0-9]+$' LIMIT 10;
```

3. **Check for outliers**:
```sql
SELECT facilityId, indicatorId, value 
FROM indicators 
WHERE CAST(value AS UNSIGNED) > 10000  -- Adjust threshold as needed
ORDER BY CAST(value AS UNSIGNED) DESC;
```

## Contributing

When adding new queries:
1. Follow the existing naming conventions
2. Include comments explaining the purpose
3. Add parameter placeholders for customization
4. Test queries with sample data
5. Document any specific requirements or assumptions

## Support

For questions about specific indicators or query modifications, refer to:
- DATIM documentation for PEPFAR indicators
- Local health information system documentation
- Database schema documentation in `prisma/schema.prisma`