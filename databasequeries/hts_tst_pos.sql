-- =========================================================
-- HTS_TST_POS - HIV Testing Services Positive
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
COUNT(*) AS hts_tst_pos
FROM kenyaemr_etl.etl_hts_test h
JOIN kenyaemr_etl.etl_patient_demographics d ON h.patient_id=d.patient_id
WHERE h.visit_date BETWEEN @start_date AND @end_date
AND h.test_result='Positive'
GROUP BY d.gender, age_band;