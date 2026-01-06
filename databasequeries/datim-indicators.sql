-- =====================================================
-- DATIM/PEPFAR SPECIFIC INDICATOR QUERIES
-- =====================================================

-- 1. TREATMENT INDICATORS (TX)
-- =====================================================

-- TX_CURR: Currently receiving antiretroviral therapy (ART)
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as tx_curr_total,
    -- Age/Sex disaggregation if available in data JSON
    JSON_EXTRACT(i.data, '$.age_15_plus_male') as male_15_plus,
    JSON_EXTRACT(i.data, '$.age_15_plus_female') as female_15_plus,
    JSON_EXTRACT(i.data, '$.age_under_15') as under_15
FROM indicators i
WHERE i.indicatorId LIKE '%TX_CURR%' OR i.name LIKE '%currently%receiving%art%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- TX_NEW: Newly enrolled on antiretroviral therapy (ART)
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as tx_new_total,
    JSON_EXTRACT(i.data, '$.pregnant_breastfeeding') as pregnant_bf,
    JSON_EXTRACT(i.data, '$.key_population') as key_pop
FROM indicators i
WHERE i.indicatorId LIKE '%TX_NEW%' OR i.name LIKE '%newly%enrolled%art%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- TX_ML: Missed appointments or lost to follow-up
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as tx_ml_total,
    JSON_EXTRACT(i.data, '$.died') as died,
    JSON_EXTRACT(i.data, '$.transferred_out') as transferred_out,
    JSON_EXTRACT(i.data, '$.lost_to_followup') as ltfu
FROM indicators i
WHERE i.indicatorId LIKE '%TX_ML%' OR i.name LIKE '%missed%appointment%' OR i.name LIKE '%lost%follow%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- TX_RTT: Return to treatment
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as tx_rtt_total
FROM indicators i
WHERE i.indicatorId LIKE '%TX_RTT%' OR i.name LIKE '%return%treatment%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 2. VIRAL LOAD INDICATORS (TX_PVLS)
-- =====================================================

-- TX_PVLS: Viral load suppression
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.name LIKE '%viral%load%result%' OR i.indicatorId LIKE '%TX_PVLS_D%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as vl_results_total,
    SUM(CASE WHEN i.name LIKE '%viral%suppression%' OR i.indicatorId LIKE '%TX_PVLS_N%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as vl_suppressed_total,
    CASE 
        WHEN SUM(CASE WHEN i.name LIKE '%viral%load%result%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) > 0 
        THEN ROUND(SUM(CASE WHEN i.name LIKE '%viral%suppression%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) * 100.0 / 
                  SUM(CASE WHEN i.name LIKE '%viral%load%result%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END), 2)
        ELSE 0 
    END as suppression_rate
FROM indicators i
WHERE i.name LIKE '%viral%load%' OR i.name LIKE '%viral%suppression%' OR i.indicatorId LIKE '%TX_PVLS%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 3. TESTING INDICATORS (HTS)
-- =====================================================

-- HTS_TST: HIV Testing Services
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST%' OR i.name LIKE '%hiv%test%total%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as hts_tst_total,
    SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST_POS%' OR i.name LIKE '%hiv%test%positive%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as hts_tst_pos,
    JSON_EXTRACT(i.data, '$.index_testing') as index_testing,
    JSON_EXTRACT(i.data, '$.facility_testing') as facility_testing,
    JSON_EXTRACT(i.data, '$.community_testing') as community_testing
FROM indicators i
WHERE i.indicatorId LIKE '%HTS_TST%' OR i.name LIKE '%hiv%test%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- HTS_INDEX: Index testing
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.indicatorId LIKE '%HTS_INDEX%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as hts_index_total,
    JSON_EXTRACT(i.data, '$.contacts_elicited') as contacts_elicited,
    JSON_EXTRACT(i.data, '$.contacts_tested') as contacts_tested
FROM indicators i
WHERE i.indicatorId LIKE '%HTS_INDEX%' OR i.name LIKE '%index%test%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 4. LINKAGE INDICATORS
-- =====================================================

-- HTS_TST_POS and TX_NEW Linkage Analysis
SELECT 
    f.name as facility_name,
    i.period,
    SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as newly_positive,
    SUM(CASE WHEN i.indicatorId LIKE '%TX_NEW%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as newly_enrolled,
    CASE 
        WHEN SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) > 0
        THEN ROUND(SUM(CASE WHEN i.indicatorId LIKE '%TX_NEW%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) * 100.0 / 
                  SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END), 2)
        ELSE 0 
    END as linkage_rate
FROM facilities f
JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
WHERE (i.indicatorId LIKE '%HTS_TST_POS%' OR i.indicatorId LIKE '%TX_NEW%')
GROUP BY f.name, i.period
HAVING newly_positive > 0 OR newly_enrolled > 0
ORDER BY i.period DESC, linkage_rate DESC;

-- 5. PREVENTION INDICATORS
-- =====================================================

-- PMTCT_STAT: Pregnant women with known HIV status
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.indicatorId LIKE '%PMTCT_STAT_D%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as anc_total,
    SUM(CASE WHEN i.indicatorId LIKE '%PMTCT_STAT_N%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as anc_known_status,
    SUM(CASE WHEN i.indicatorId LIKE '%PMTCT_STAT_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as anc_positive
FROM indicators i
WHERE i.indicatorId LIKE '%PMTCT_STAT%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- PMTCT_ART: Pregnant women receiving ART
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as pmtct_art_total,
    JSON_EXTRACT(i.data, '$.new_on_art') as new_on_art,
    JSON_EXTRACT(i.data, '$.already_on_art') as already_on_art
FROM indicators i
WHERE i.indicatorId LIKE '%PMTCT_ART%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- PMTCT_EID: Early infant diagnosis
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as eid_total,
    JSON_EXTRACT(i.data, '$.age_2_12_months') as age_2_12_months,
    JSON_EXTRACT(i.data, '$.positive_results') as positive_results
FROM indicators i
WHERE i.indicatorId LIKE '%PMTCT_EID%' OR i.name LIKE '%early%infant%diagnosis%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 6. TUBERCULOSIS INDICATORS
-- =====================================================

-- TB_STAT: TB screening among HIV patients
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.indicatorId LIKE '%TB_STAT_D%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as hiv_patients_screened,
    SUM(CASE WHEN i.indicatorId LIKE '%TB_STAT_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tb_positive
FROM indicators i
WHERE i.indicatorId LIKE '%TB_STAT%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- TB_ART: TB patients on ART
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as tb_art_total
FROM indicators i
WHERE i.indicatorId LIKE '%TB_ART%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- TB_PREV: TB preventive therapy
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.indicatorId LIKE '%TB_PREV_D%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as eligible_for_tpt,
    SUM(CASE WHEN i.indicatorId LIKE '%TB_PREV_N%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as initiated_tpt
FROM indicators i
WHERE i.indicatorId LIKE '%TB_PREV%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 7. KEY POPULATION INDICATORS
-- =====================================================

-- KP_PREV: Key population prevention
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as kp_prev_total,
    JSON_EXTRACT(i.data, '$.msm') as msm,
    JSON_EXTRACT(i.data, '$.fsw') as fsw,
    JSON_EXTRACT(i.data, '$.pwid') as pwid,
    JSON_EXTRACT(i.data, '$.tgw') as tgw
FROM indicators i
WHERE i.indicatorId LIKE '%KP_PREV%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 8. COMPREHENSIVE DATIM SCORECARD
-- =====================================================

-- Monthly DATIM Indicators Summary
SELECT 
    f.name as facility_name,
    i.period,
    -- Treatment
    SUM(CASE WHEN i.indicatorId LIKE '%TX_CURR%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tx_curr,
    SUM(CASE WHEN i.indicatorId LIKE '%TX_NEW%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tx_new,
    -- Testing
    SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST%' AND i.indicatorId NOT LIKE '%POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as hts_tst,
    SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as hts_tst_pos,
    -- Viral Load
    SUM(CASE WHEN i.indicatorId LIKE '%TX_PVLS_D%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as vl_eligible,
    SUM(CASE WHEN i.indicatorId LIKE '%TX_PVLS_N%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as vl_suppressed,
    -- PMTCT
    SUM(CASE WHEN i.indicatorId LIKE '%PMTCT_STAT_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as pmtct_stat_pos,
    SUM(CASE WHEN i.indicatorId LIKE '%PMTCT_ART%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as pmtct_art,
    -- TB
    SUM(CASE WHEN i.indicatorId LIKE '%TB_STAT_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tb_stat_pos,
    SUM(CASE WHEN i.indicatorId LIKE '%TB_ART%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tb_art
FROM facilities f
JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
WHERE i.period >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 MONTH), '%Y-%m')
  AND (i.indicatorId LIKE '%TX_%' OR i.indicatorId LIKE '%HTS_%' OR i.indicatorId LIKE '%PMTCT_%' OR i.indicatorId LIKE '%TB_%')
GROUP BY f.name, i.period
ORDER BY i.period DESC, f.name;

-- 9. DATIM TARGETS VS ACHIEVEMENTS
-- =====================================================

-- Quarterly Performance Against Targets (assuming targets are stored in indicator_types)
SELECT 
    f.name as facility_name,
    CONCAT(YEAR(STR_TO_DATE(CONCAT(i.period, '-01'), '%Y-%m-%d')), '-Q', QUARTER(STR_TO_DATE(CONCAT(i.period, '-01'), '%Y-%m-%d'))) as quarter,
    i.indicatorId,
    SUM(CAST(i.value AS UNSIGNED)) as achievement,
    it.query as target_query  -- Assuming targets are stored in indicator_types
FROM facilities f
JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
LEFT JOIN indicator_types it ON it.name = i.name
WHERE i.indicatorId LIKE '%TX_CURR%' OR i.indicatorId LIKE '%TX_NEW%' OR i.indicatorId LIKE '%HTS_TST%'
GROUP BY f.name, quarter, i.indicatorId
ORDER BY quarter DESC, f.name, i.indicatorId;

-- 10. DATA QUALITY CHECKS FOR DATIM
-- =====================================================

-- DATIM Data Quality Validation
SELECT 
    i.facilityId,
    i.period,
    -- Check for logical consistency
    SUM(CASE WHEN i.indicatorId LIKE '%TX_NEW%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tx_new,
    SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as hts_pos,
    -- TX_NEW should not exceed HTS_TST_POS significantly
    CASE 
        WHEN SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) > 0
        THEN SUM(CASE WHEN i.indicatorId LIKE '%TX_NEW%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) / 
             SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END)
        ELSE 0 
    END as linkage_ratio,
    -- Flag potential data quality issues
    CASE 
        WHEN SUM(CASE WHEN i.indicatorId LIKE '%TX_NEW%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) > 
             SUM(CASE WHEN i.indicatorId LIKE '%HTS_TST_POS%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) * 1.1
        THEN 'TX_NEW > HTS_POS (Check linkage data)'
        ELSE 'OK'
    END as data_quality_flag
FROM indicators i
WHERE (i.indicatorId LIKE '%TX_NEW%' OR i.indicatorId LIKE '%HTS_TST_POS%')
GROUP BY i.facilityId, i.period
HAVING tx_new > 0 OR hts_pos > 0
ORDER BY i.period DESC, linkage_ratio DESC;