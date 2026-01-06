-- =====================================================
-- INDICATOR QUERIES FOR ETL TABLES
-- =====================================================

-- 1. FACILITY INDICATORS
-- =====================================================

-- Total facilities by sync status
SELECT 
    synced,
    COUNT(*) as facility_count
FROM facilities 
GROUP BY synced;

-- Facilities with recent data (last 30 days)
SELECT 
    f.id,
    f.name,
    f.location,
    f.created_at,
    f.synced_at
FROM facilities f
WHERE f.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY f.created_at DESC;

-- 2. INDICATOR PERFORMANCE METRICS
-- =====================================================

-- Indicator counts by facility and sync status
SELECT 
    i.facilityId,
    i.synced,
    COUNT(*) as indicator_count,
    COUNT(DISTINCT i.indicatorId) as unique_indicators
FROM indicators i
GROUP BY i.facilityId, i.synced
ORDER BY i.facilityId;

-- Monthly indicator trends
SELECT 
    i.period,
    COUNT(*) as total_indicators,
    COUNT(CASE WHEN i.synced = 1 THEN 1 END) as synced_indicators,
    ROUND(COUNT(CASE WHEN i.synced = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as sync_percentage
FROM indicators i
GROUP BY i.period
ORDER BY i.period DESC;

-- Top indicators by frequency
SELECT 
    i.name,
    i.indicatorId,
    COUNT(*) as frequency,
    COUNT(DISTINCT i.facilityId) as facility_count
FROM indicators i
GROUP BY i.name, i.indicatorId
ORDER BY frequency DESC
LIMIT 20;

-- 3. REPORT DOWNLOAD ANALYTICS
-- =====================================================

-- Report download summary by period
SELECT 
    rd.reportPeriod,
    rd.kenyaEmrReportUuid,
    COUNT(*) as download_count,
    SUM(rd.recordCount) as total_records,
    COUNT(CASE WHEN rd.syncedToAmep = 1 THEN 1 END) as synced_to_amep,
    COUNT(CASE WHEN rd.syncedToAmpath = 1 THEN 1 END) as synced_to_ampath
FROM report_downloads rd
GROUP BY rd.reportPeriod, rd.kenyaEmrReportUuid
ORDER BY rd.reportPeriod DESC;

-- Sync performance metrics
SELECT 
    DATE(rd.requested_at) as request_date,
    COUNT(*) as total_downloads,
    AVG(rd.recordCount) as avg_records_per_download,
    COUNT(CASE WHEN rd.syncedToAmep = 1 THEN 1 END) as amep_synced,
    COUNT(CASE WHEN rd.syncedToAmpath = 1 THEN 1 END) as ampath_synced,
    AVG(TIMESTAMPDIFF(MINUTE, rd.requested_at, rd.synced_amep_at)) as avg_amep_sync_time_minutes
FROM report_downloads rd
WHERE rd.requested_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(rd.requested_at)
ORDER BY request_date DESC;

-- 4. QUEUE MANAGEMENT INDICATORS
-- =====================================================

-- Queue status summary
SELECT 
    rq.status,
    COUNT(*) as queue_count,
    MIN(rq.created_at) as oldest_request,
    MAX(rq.created_at) as newest_request
FROM report_queue rq
GROUP BY rq.status;

-- Processing time analysis
SELECT 
    rq.kenyaEmrReportUuid,
    rq.reportPeriod,
    AVG(TIMESTAMPDIFF(MINUTE, rq.created_at, rq.processed_at)) as avg_processing_time_minutes,
    COUNT(*) as total_processed
FROM report_queue rq
WHERE rq.processed_at IS NOT NULL
GROUP BY rq.kenyaEmrReportUuid, rq.reportPeriod
ORDER BY avg_processing_time_minutes DESC;

-- 5. LINE LIST ANALYTICS
-- =====================================================

-- Line list summary by facility
SELECT 
    ll.facilityId,
    COUNT(*) as total_records,
    COUNT(DISTINCT ll.patientId) as unique_patients,
    COUNT(CASE WHEN ll.synced = 1 THEN 1 END) as synced_records,
    MIN(ll.created_at) as first_record,
    MAX(ll.created_at) as latest_record
FROM line_lists ll
GROUP BY ll.facilityId
ORDER BY total_records DESC;

-- Daily line list creation trends
SELECT 
    DATE(ll.created_at) as record_date,
    COUNT(*) as records_created,
    COUNT(DISTINCT ll.facilityId) as active_facilities,
    COUNT(DISTINCT ll.patientId) as unique_patients
FROM line_lists ll
WHERE ll.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(ll.created_at)
ORDER BY record_date DESC;

-- 6. COMPREHENSIVE FACILITY PERFORMANCE
-- =====================================================

-- Facility performance dashboard
SELECT 
    f.id as facility_id,
    f.name as facility_name,
    f.location,
    COUNT(DISTINCT i.id) as total_indicators,
    COUNT(DISTINCT CASE WHEN i.synced = 1 THEN i.id END) as synced_indicators,
    COUNT(DISTINCT ll.id) as total_line_lists,
    COUNT(DISTINCT CASE WHEN ll.synced = 1 THEN ll.id END) as synced_line_lists,
    MAX(i.created_at) as last_indicator_date,
    MAX(ll.created_at) as last_linelist_date
FROM facilities f
LEFT JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
LEFT JOIN line_lists ll ON f.id = CAST(ll.facilityId AS UNSIGNED)
GROUP BY f.id, f.name, f.location
ORDER BY f.name;

-- 7. DATA QUALITY INDICATORS
-- =====================================================

-- Missing or null value analysis
SELECT 
    'indicators' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN value IS NULL OR value = '' THEN 1 END) as missing_values,
    COUNT(CASE WHEN period IS NULL OR period = '' THEN 1 END) as missing_periods,
    COUNT(CASE WHEN facilityId IS NULL OR facilityId = '' THEN 1 END) as missing_facility_ids
FROM indicators
UNION ALL
SELECT 
    'line_lists' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN patientId IS NULL OR patientId = '' THEN 1 END) as missing_patient_ids,
    COUNT(CASE WHEN data IS NULL THEN 1 END) as missing_data,
    COUNT(CASE WHEN facilityId IS NULL OR facilityId = '' THEN 1 END) as missing_facility_ids
FROM line_lists;

-- 8. REPORT TYPE UTILIZATION
-- =====================================================

-- Report type usage analysis
SELECT 
    frt.name as report_type_name,
    frt.reportType as category,
    frt.isReporting,
    COUNT(rd.id) as download_count,
    SUM(rd.recordCount) as total_records
FROM facility_report_types frt
LEFT JOIN report_downloads rd ON frt.kenyaEmrReportUuid = rd.kenyaEmrReportUuid
GROUP BY frt.id, frt.name, frt.reportType, frt.isReporting
ORDER BY download_count DESC;

-- 9. TEMPORAL ANALYSIS
-- =====================================================

-- Weekly data collection trends
SELECT 
    YEARWEEK(created_at) as year_week,
    'indicators' as data_type,
    COUNT(*) as record_count
FROM indicators
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
GROUP BY YEARWEEK(created_at)
UNION ALL
SELECT 
    YEARWEEK(created_at) as year_week,
    'line_lists' as data_type,
    COUNT(*) as record_count
FROM line_lists
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
GROUP BY YEARWEEK(created_at)
ORDER BY year_week DESC, data_type;

-- 10. SYNC EFFICIENCY METRICS
-- =====================================================

-- Overall sync efficiency
SELECT 
    'Indicators' as data_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN synced = 1 THEN 1 END) as synced_records,
    ROUND(COUNT(CASE WHEN synced = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as sync_percentage,
    AVG(TIMESTAMPDIFF(HOUR, created_at, synced_at)) as avg_sync_time_hours
FROM indicators
UNION ALL
SELECT 
    'Line Lists' as data_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN synced = 1 THEN 1 END) as synced_records,
    ROUND(COUNT(CASE WHEN synced = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as sync_percentage,
    AVG(TIMESTAMPDIFF(HOUR, created_at, synced_at)) as avg_sync_time_hours
FROM line_lists
UNION ALL
SELECT 
    'Report Downloads' as data_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN syncedToAmep = 1 OR syncedToAmpath = 1 THEN 1 END) as synced_records,
    ROUND(COUNT(CASE WHEN syncedToAmep = 1 OR syncedToAmpath = 1 THEN 1 END) * 100.0 / COUNT(*), 2) as sync_percentage,
    AVG(TIMESTAMPDIFF(HOUR, requested_at, COALESCE(synced_amep_at, synced_ampath_at))) as avg_sync_time_hours
FROM report_downloads;