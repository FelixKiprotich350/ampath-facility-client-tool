-- =========================================================
-- PMTCT_STAT - Prevention of Mother-to-Child Transmission Status
-- =========================================================

SET @start_date = '2025-01-01';
SET @end_date   = '2025-01-31';

SELECT d.gender,
CASE
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) < 15 THEN '<15'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 15 AND 19 THEN '15-19'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 20 AND 24 THEN '20-24'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 25 AND 49 THEN '25-49'
 ELSE '50+' END AS age_band,
COUNT(DISTINCT m.patient_id) AS pmtct_stat
FROM kenyaemr_etl.etl_mch_enrollment m
JOIN kenyaemr_etl.etl_patient_demographics d ON m.patient_id=d.patient_id
WHERE m.visit_date BETWEEN @start_date AND @end_date
AND m.hiv_status='Positive'
GROUP BY d.gender, age_band;