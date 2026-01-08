-- =========================================================
-- VL_SUPP - Viral Load Suppression
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
COUNT(DISTINCT v.patient_id) AS vl_suppressed
FROM kenyaemr_etl.etl_viral_load v
JOIN kenyaemr_etl.etl_patient_demographics d ON v.patient_id=d.patient_id
WHERE v.visit_date BETWEEN @start_date AND @end_date
AND v.current_vl_result<1000
GROUP BY d.gender, age_band;