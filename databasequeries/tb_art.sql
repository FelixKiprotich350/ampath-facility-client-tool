-- =========================================================
-- TB_ART - Tuberculosis on ART
-- =========================================================

SET @start_date = DATE_FORMAT('2025-11-01', '%Y-%m-01');
SET @end_date   = LAST_DAY('2025-11-01');

SELECT d.gender,
CASE
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) < 1 THEN '<1'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 1 AND 4 THEN '1-4'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 5 AND 9 THEN '5-9'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 10 AND 14 THEN '10-14'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 15 AND 19 THEN '15-19'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 20 AND 24 THEN '20-24'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 25 AND 29 THEN '25-29'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 30 AND 34 THEN '30-34'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 35 AND 39 THEN '35-39'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 40 AND 44 THEN '40-44'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 45 AND 49 THEN '45-49'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 50 AND 54 THEN '50-54'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 55 AND 59 THEN '55-59'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 60 AND 64 THEN '60-64'
 ELSE '65+' END AS age_band,
COUNT(DISTINCT tb.patient_id) AS tb_art
FROM kenyaemr_etl.etl_tb_enrollment tb
JOIN kenyaemr_etl.etl_hiv_enrollment h ON tb.patient_id=h.patient_id
JOIN kenyaemr_etl.etl_patient_demographics d ON tb.patient_id=d.patient_id
WHERE tb.visit_date BETWEEN @start_date AND @end_date
AND h.date_started_art_at_transferring_facility IS NOT NULL
GROUP BY d.gender, age_band;