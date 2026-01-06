-- =====================================================
-- UTILITY QUERIES AND FUNCTIONS
-- =====================================================

-- 1. COMMON QUERY PATTERNS
-- =====================================================

-- Generic indicator aggregation by facility and period
-- Usage: Replace {indicator_pattern} with specific indicator name pattern
/*
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as total_value,
    COUNT(*) as record_count,
    AVG(CAST(i.value AS UNSIGNED)) as average_value
FROM indicators i
WHERE i.name LIKE '%{indicator_pattern}%' 
   OR i.indicatorId LIKE '%{indicator_pattern}%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;
*/

-- 2. DATE RANGE QUERIES
-- =====================================================

-- Last 3 months indicators
SELECT 
    i.facilityId,
    i.period,
    i.name,
    SUM(CAST(i.value AS UNSIGNED)) as total_value
FROM indicators i
WHERE STR_TO_DATE(CONCAT(i.period, '-01'), '%Y-%m-%d') >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
GROUP BY i.facilityId, i.period, i.name
ORDER BY i.period DESC;

-- Year-to-date indicators
SELECT 
    i.facilityId,
    i.name,
    SUM(CAST(i.value AS UNSIGNED)) as ytd_total
FROM indicators i
WHERE YEAR(STR_TO_DATE(CONCAT(i.period, '-01'), '%Y-%m-%d')) = YEAR(CURDATE())
GROUP BY i.facilityId, i.name
ORDER BY i.facilityId, ytd_total DESC;

-- Quarterly aggregation
SELECT 
    i.facilityId,
    CONCAT(YEAR(STR_TO_DATE(CONCAT(i.period, '-01'), '%Y-%m-%d')), '-Q', 
           QUARTER(STR_TO_DATE(CONCAT(i.period, '-01'), '%Y-%m-%d'))) as quarter,
    i.name,
    SUM(CAST(i.value AS UNSIGNED)) as quarterly_total
FROM indicators i
GROUP BY i.facilityId, quarter, i.name
ORDER BY quarter DESC, i.facilityId;

-- 3. FACILITY COMPARISON QUERIES
-- =====================================================

-- Facility ranking by indicator
SELECT 
    f.name as facility_name,
    f.location,
    SUM(CAST(i.value AS UNSIGNED)) as total_value,
    RANK() OVER (ORDER BY SUM(CAST(i.value AS UNSIGNED)) DESC) as facility_rank
FROM facilities f
JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
WHERE i.name LIKE '%tx_curr%'  -- Replace with desired indicator
  AND i.period = '2024-01'     -- Replace with desired period
GROUP BY f.id, f.name, f.location
ORDER BY facility_rank;

-- Facility performance percentiles
SELECT 
    f.name as facility_name,
    SUM(CAST(i.value AS UNSIGNED)) as total_value,
    NTILE(4) OVER (ORDER BY SUM(CAST(i.value AS UNSIGNED))) as performance_quartile,
    CASE 
        WHEN NTILE(4) OVER (ORDER BY SUM(CAST(i.value AS UNSIGNED))) = 4 THEN 'Top 25%'
        WHEN NTILE(4) OVER (ORDER BY SUM(CAST(i.value AS UNSIGNED))) = 3 THEN 'Upper 50%'
        WHEN NTILE(4) OVER (ORDER BY SUM(CAST(i.value AS UNSIGNED))) = 2 THEN 'Lower 50%'
        ELSE 'Bottom 25%'
    END as performance_category
FROM facilities f
JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
WHERE i.name LIKE '%tx_curr%'  -- Replace with desired indicator
GROUP BY f.id, f.name
ORDER BY total_value DESC;

-- 4. TREND ANALYSIS QUERIES
-- =====================================================

-- Month-over-month growth
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as current_value,
    LAG(SUM(CAST(i.value AS UNSIGNED))) OVER (PARTITION BY i.facilityId ORDER BY i.period) as previous_value,
    SUM(CAST(i.value AS UNSIGNED)) - LAG(SUM(CAST(i.value AS UNSIGNED))) OVER (PARTITION BY i.facilityId ORDER BY i.period) as absolute_change,
    CASE 
        WHEN LAG(SUM(CAST(i.value AS UNSIGNED))) OVER (PARTITION BY i.facilityId ORDER BY i.period) > 0
        THEN ROUND((SUM(CAST(i.value AS UNSIGNED)) - LAG(SUM(CAST(i.value AS UNSIGNED))) OVER (PARTITION BY i.facilityId ORDER BY i.period)) * 100.0 / 
                   LAG(SUM(CAST(i.value AS UNSIGNED))) OVER (PARTITION BY i.facilityId ORDER BY i.period), 2)
        ELSE NULL
    END as percentage_change
FROM indicators i
WHERE i.name LIKE '%tx_curr%'  -- Replace with desired indicator
GROUP BY i.facilityId, i.period
ORDER BY i.facilityId, i.period DESC;

-- Moving averages (3-month)
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as current_value,
    AVG(SUM(CAST(i.value AS UNSIGNED))) OVER (
        PARTITION BY i.facilityId 
        ORDER BY i.period 
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) as three_month_avg
FROM indicators i
WHERE i.name LIKE '%tx_curr%'  -- Replace with desired indicator
GROUP BY i.facilityId, i.period
ORDER BY i.facilityId, i.period DESC;

-- 5. DATA VALIDATION QUERIES
-- =====================================================

-- Check for missing periods
SELECT DISTINCT
    f.id as facility_id,
    f.name as facility_name,
    expected_periods.period as missing_period
FROM facilities f
CROSS JOIN (
    SELECT DISTINCT period 
    FROM indicators 
    WHERE period >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 MONTH), '%Y-%m')
) expected_periods
LEFT JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED) 
                       AND i.period = expected_periods.period
WHERE i.id IS NULL
ORDER BY f.name, expected_periods.period;

-- Identify outliers (values beyond 3 standard deviations)
SELECT 
    i.facilityId,
    i.period,
    i.name,
    CAST(i.value AS UNSIGNED) as value,
    AVG(CAST(i.value AS UNSIGNED)) OVER (PARTITION BY i.name) as avg_value,
    STDDEV(CAST(i.value AS UNSIGNED)) OVER (PARTITION BY i.name) as std_dev,
    CASE 
        WHEN ABS(CAST(i.value AS UNSIGNED) - AVG(CAST(i.value AS UNSIGNED)) OVER (PARTITION BY i.name)) > 
             3 * STDDEV(CAST(i.value AS UNSIGNED)) OVER (PARTITION BY i.name)
        THEN 'OUTLIER'
        ELSE 'NORMAL'
    END as outlier_flag
FROM indicators i
WHERE CAST(i.value AS UNSIGNED) > 0
HAVING outlier_flag = 'OUTLIER'
ORDER BY i.name, ABS(CAST(i.value AS UNSIGNED) - avg_value) DESC;

-- 6. PERFORMANCE METRICS
-- =====================================================

-- Facility completeness score
SELECT 
    f.name as facility_name,
    COUNT(DISTINCT i.indicatorId) as indicators_reported,
    COUNT(DISTINCT it.id) as total_indicators_expected,
    ROUND(COUNT(DISTINCT i.indicatorId) * 100.0 / COUNT(DISTINCT it.id), 2) as completeness_percentage
FROM facilities f
LEFT JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED) 
                        AND i.period = DATE_FORMAT(CURDATE(), '%Y-%m')
CROSS JOIN indicator_types it
WHERE it.active = 1
GROUP BY f.id, f.name
ORDER BY completeness_percentage DESC;

-- Timeliness metrics (assuming data should be submitted by 5th of following month)
SELECT 
    i.facilityId,
    i.period,
    MIN(i.created_at) as first_submission,
    MAX(i.created_at) as last_submission,
    STR_TO_DATE(CONCAT(DATE_ADD(STR_TO_DATE(CONCAT(i.period, '-01'), '%Y-%m-%d'), INTERVAL 1 MONTH), '-05'), '%Y-%m-%d') as deadline,
    CASE 
        WHEN MAX(i.created_at) <= STR_TO_DATE(CONCAT(DATE_ADD(STR_TO_DATE(CONCAT(i.period, '-01'), '%Y-%m-%d'), INTERVAL 1 MONTH), '-05'), '%Y-%m-%d')
        THEN 'ON TIME'
        ELSE 'LATE'
    END as timeliness_status,
    DATEDIFF(MAX(i.created_at), STR_TO_DATE(CONCAT(DATE_ADD(STR_TO_DATE(CONCAT(i.period, '-01'), '%Y-%m-%d'), INTERVAL 1 MONTH), '-05'), '%Y-%m-%d')) as days_late
FROM indicators i
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, days_late DESC;

-- 7. AGGREGATION HELPERS
-- =====================================================

-- Create summary table for dashboard
CREATE TEMPORARY TABLE IF NOT EXISTS dashboard_summary AS
SELECT 
    f.name as facility_name,
    i.period,
    'TX_CURR' as indicator_type,
    SUM(CASE WHEN i.indicatorId LIKE '%TX_CURR%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as value
FROM facilities f
JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
WHERE i.period >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 MONTH), '%Y-%m')
GROUP BY f.name, i.period

UNION ALL

SELECT 
    f.name as facility_name,
    i.period,
    'TX_NEW' as indicator_type,
    SUM(CASE WHEN i.indicatorId LIKE '%TX_NEW%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as value
FROM facilities f
JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
WHERE i.period >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 MONTH), '%Y-%m')
GROUP BY f.name, i.period

UNION ALL

SELECT 
    f.name as facility_name,
    i.period,
    'HTS_TST' as indicator_type,
    SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST%' AND i.indicatorId NOT LIKE '%POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as value
FROM facilities f
JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
WHERE i.period >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 MONTH), '%Y-%m')
GROUP BY f.name, i.period;

-- Query the summary table
SELECT * FROM dashboard_summary 
WHERE value > 0 
ORDER BY facility_name, period DESC, indicator_type;

-- 8. EXPORT QUERIES
-- =====================================================

-- Export format for external systems
SELECT 
    f.name as facility_name,
    f.location as facility_location,
    i.period as reporting_period,
    i.indicatorId as indicator_code,
    i.name as indicator_name,
    i.value as indicator_value,
    i.created_at as submission_date,
    i.synced as sync_status,
    i.synced_at as sync_date
FROM facilities f
JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
WHERE i.period = '2024-01'  -- Replace with desired period
ORDER BY f.name, i.indicatorId;

-- 9. CLEANUP QUERIES
-- =====================================================

-- Remove temporary tables
DROP TEMPORARY TABLE IF EXISTS dashboard_summary;

-- Identify duplicate records
SELECT 
    facilityId,
    indicatorId,
    period,
    COUNT(*) as duplicate_count
FROM indicators
GROUP BY facilityId, indicatorId, period
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 10. INDEX RECOMMENDATIONS
-- =====================================================

-- Recommended indexes for performance
/*
CREATE INDEX idx_indicators_facility_period ON indicators(facilityId, period);
CREATE INDEX idx_indicators_indicator_period ON indicators(indicatorId, period);
CREATE INDEX idx_indicators_name_period ON indicators(name, period);
CREATE INDEX idx_indicators_synced ON indicators(synced);
CREATE INDEX idx_indicators_created_at ON indicators(created_at);

CREATE INDEX idx_line_lists_facility_period ON line_lists(facilityId, created_at);
CREATE INDEX idx_line_lists_synced ON line_lists(synced);

CREATE INDEX idx_report_downloads_period ON report_downloads(reportPeriod);
CREATE INDEX idx_report_downloads_uuid ON report_downloads(kenyaEmrReportUuid);
CREATE INDEX idx_report_downloads_sync_status ON report_downloads(syncedToAmep, syncedToAmpath);

CREATE INDEX idx_facilities_synced ON facilities(synced);
CREATE INDEX idx_facilities_created_at ON facilities(created_at);
*/