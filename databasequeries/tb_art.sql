-- =========================================================
-- TB_ART - Tuberculosis on ART
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
COUNT(DISTINCT tb.patient_id) AS tb_art
FROM kenyaemr_etl.etl_tb_enrollment tb
JOIN kenyaemr_etl.etl_hiv_enrollment h ON tb.patient_id=h.patient_id
JOIN kenyaemr_etl.etl_patient_demographics d ON tb.patient_id=d.patient_id
WHERE tb.visit_date BETWEEN @start_date AND @end_date
AND h.date_started_art_at_transferring_facility IS NOT NULL
GROUP BY d.gender, age_band;