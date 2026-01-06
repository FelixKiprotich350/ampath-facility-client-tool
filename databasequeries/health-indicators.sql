-- =====================================================
-- HEALTH SPECIFIC INDICATOR QUERIES
-- =====================================================

-- 1. HIV CARE AND TREATMENT INDICATORS
-- =====================================================

-- Currently on ART (Active on Treatment)
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as currently_on_art
FROM indicators i
WHERE i.name LIKE '%currently%art%' 
   OR i.name LIKE '%active%treatment%'
   OR i.indicatorId LIKE '%TX_CURR%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- New ART Initiations
SELECT 
    i.facilityId,
    i.period,
    SUM(CAST(i.value AS UNSIGNED)) as new_on_art
FROM indicators i
WHERE i.name LIKE '%new%art%' 
   OR i.name LIKE '%newly%initiated%'
   OR i.indicatorId LIKE '%TX_NEW%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- Viral Load Testing and Suppression
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.name LIKE '%viral%load%test%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as vl_tests_done,
    SUM(CASE WHEN i.name LIKE '%viral%suppression%' OR i.name LIKE '%suppressed%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as vl_suppressed
FROM indicators i
WHERE i.name LIKE '%viral%load%' OR i.name LIKE '%suppression%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 2. HIV TESTING SERVICES (HTS)
-- =====================================================

-- HIV Testing Indicators
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.name LIKE '%hiv%test%' AND i.name NOT LIKE '%positive%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as total_tested,
    SUM(CASE WHEN i.name LIKE '%hiv%positive%' OR i.name LIKE '%test%positive%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as positive_results,
    SUM(CASE WHEN i.name LIKE '%linked%care%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as linked_to_care
FROM indicators i
WHERE i.name LIKE '%hiv%test%' OR i.name LIKE '%hts%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 3. PREVENTION OF MOTHER TO CHILD TRANSMISSION (PMTCT)
-- =====================================================

-- PMTCT Indicators
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.name LIKE '%anc%hiv%positive%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as anc_hiv_positive,
    SUM(CASE WHEN i.name LIKE '%pmtct%art%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as pmtct_on_art,
    SUM(CASE WHEN i.name LIKE '%infant%test%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as infants_tested,
    SUM(CASE WHEN i.name LIKE '%infant%positive%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as infants_positive
FROM indicators i
WHERE i.name LIKE '%pmtct%' OR i.name LIKE '%anc%' OR i.name LIKE '%infant%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 4. TUBERCULOSIS (TB) INDICATORS
-- =====================================================

-- TB Case Detection and Treatment
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.name LIKE '%tb%case%' OR i.name LIKE '%tb%detect%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tb_cases_detected,
    SUM(CASE WHEN i.name LIKE '%tb%treatment%' OR i.name LIKE '%tb%start%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tb_treatment_started,
    SUM(CASE WHEN i.name LIKE '%tb%success%' OR i.name LIKE '%tb%cure%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tb_treatment_success
FROM indicators i
WHERE i.name LIKE '%tb%' OR i.name LIKE '%tuberculosis%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- TB/HIV Co-infection
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.name LIKE '%tb%hiv%' AND i.name LIKE '%positive%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tb_hiv_coinfected,
    SUM(CASE WHEN i.name LIKE '%tb%hiv%art%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tb_hiv_on_art
FROM indicators i
WHERE i.name LIKE '%tb%hiv%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 5. MATERNAL AND CHILD HEALTH (MCH)
-- =====================================================

-- Antenatal Care (ANC) Indicators
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.name LIKE '%anc%first%' OR i.name LIKE '%anc1%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as anc_first_visit,
    SUM(CASE WHEN i.name LIKE '%anc%fourth%' OR i.name LIKE '%anc4%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as anc_fourth_visit,
    SUM(CASE WHEN i.name LIKE '%skilled%delivery%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as skilled_deliveries
FROM indicators i
WHERE i.name LIKE '%anc%' OR i.name LIKE '%delivery%' OR i.name LIKE '%maternal%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- Child Health Indicators
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.name LIKE '%immunization%' OR i.name LIKE '%vaccination%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as immunizations,
    SUM(CASE WHEN i.name LIKE '%malnutrition%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as malnutrition_cases,
    SUM(CASE WHEN i.name LIKE '%under%five%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as under_five_visits
FROM indicators i
WHERE i.name LIKE '%child%' OR i.name LIKE '%immunization%' OR i.name LIKE '%under%five%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 6. FAMILY PLANNING
-- =====================================================

-- Family Planning Indicators
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.name LIKE '%family%planning%' OR i.name LIKE '%contraceptive%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as fp_clients,
    SUM(CASE WHEN i.name LIKE '%new%fp%' OR i.name LIKE '%new%contraceptive%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as new_fp_clients,
    SUM(CASE WHEN i.name LIKE '%long%acting%' OR i.name LIKE '%larc%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as larc_uptake
FROM indicators i
WHERE i.name LIKE '%family%planning%' OR i.name LIKE '%contraceptive%' OR i.name LIKE '%fp%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 7. MALARIA INDICATORS
-- =====================================================

-- Malaria Case Management
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.name LIKE '%malaria%test%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as malaria_tests,
    SUM(CASE WHEN i.name LIKE '%malaria%positive%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as malaria_positive,
    SUM(CASE WHEN i.name LIKE '%malaria%treatment%' OR i.name LIKE '%act%treatment%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as malaria_treated
FROM indicators i
WHERE i.name LIKE '%malaria%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 8. NON-COMMUNICABLE DISEASES (NCDs)
-- =====================================================

-- Diabetes and Hypertension
SELECT 
    i.facilityId,
    i.period,
    SUM(CASE WHEN i.name LIKE '%diabetes%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as diabetes_cases,
    SUM(CASE WHEN i.name LIKE '%hypertension%' OR i.name LIKE '%blood%pressure%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as hypertension_cases,
    SUM(CASE WHEN i.name LIKE '%cancer%screening%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as cancer_screening
FROM indicators i
WHERE i.name LIKE '%diabetes%' OR i.name LIKE '%hypertension%' OR i.name LIKE '%ncd%' OR i.name LIKE '%cancer%'
GROUP BY i.facilityId, i.period
ORDER BY i.period DESC, i.facilityId;

-- 9. COMPREHENSIVE FACILITY PERFORMANCE SCORECARD
-- =====================================================

-- Monthly Facility Scorecard
SELECT 
    f.name as facility_name,
    i.period,
    COUNT(DISTINCT i.indicatorId) as total_indicators_reported,
    SUM(CASE WHEN i.name LIKE '%tx_curr%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as current_on_art,
    SUM(CASE WHEN i.name LIKE '%tx_new%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as new_on_art,
    SUM(CASE WHEN i.name LIKE '%hiv%test%' AND i.name NOT LIKE '%positive%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as hiv_tests,
    SUM(CASE WHEN i.name LIKE '%tb%case%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as tb_cases,
    SUM(CASE WHEN i.name LIKE '%anc%' THEN CAST(i.value AS UNSIGNED) ELSE 0 END) as anc_visits
FROM facilities f
JOIN indicators i ON f.id = CAST(i.facilityId AS UNSIGNED)
WHERE i.period >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 6 MONTH), '%Y-%m')
GROUP BY f.name, i.period
ORDER BY i.period DESC, f.name;

-- 10. INDICATOR COMPLETENESS AND QUALITY
-- =====================================================

-- Data Completeness by Indicator Type
SELECT 
    SUBSTRING_INDEX(i.name, '_', 1) as indicator_category,
    i.period,
    COUNT(*) as total_reports,
    COUNT(CASE WHEN i.value IS NOT NULL AND i.value != '' AND i.value != '0' THEN 1 END) as non_zero_reports,
    ROUND(COUNT(CASE WHEN i.value IS NOT NULL AND i.value != '' AND i.value != '0' THEN 1 END) * 100.0 / COUNT(*), 2) as completeness_percentage
FROM indicators i
WHERE i.period >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 MONTH), '%Y-%m')
GROUP BY SUBSTRING_INDEX(i.name, '_', 1), i.period
HAVING COUNT(*) >= 5  -- Only show categories with at least 5 reports
ORDER BY i.period DESC, completeness_percentage DESC;