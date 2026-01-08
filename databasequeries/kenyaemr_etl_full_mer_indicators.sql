
-- =========================================================
-- KenyaEMR ETL HIV MER INDICATORS (FULL SET)
-- Age/Sex Disaggregated | MER / DATIM Aligned
-- =========================================================

SET @start_date = '2025-01-01';
SET @end_date   = '2025-01-31';

-- =========================================================
-- TX_NEW
-- =========================================================
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
 ELSE '50+' END AS age_band,
COUNT(DISTINCT e.patient_id) AS tx_new
FROM kenyaemr_etl.etl_hiv_enrollment e
JOIN kenyaemr_etl.etl_patient_demographics d ON e.patient_id=d.patient_id
WHERE e.date_started_art BETWEEN @start_date AND @end_date
AND e.transfer_in=0
GROUP BY d.gender, age_band;

-- =========================================================
-- TX_CURR
-- =========================================================
SELECT d.gender,
CASE
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) < 15 THEN '<15'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 15 AND 19 THEN '15-19'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 20 AND 24 THEN '20-24'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 25 AND 49 THEN '25-49'
 ELSE '50+' END AS age_band,
COUNT(DISTINCT f.patient_id) AS tx_curr
FROM kenyaemr_etl.etl_patient_hiv_followup f
JOIN kenyaemr_etl.etl_patient_demographics d ON f.patient_id=d.patient_id
WHERE f.visit_date<=@end_date
AND f.next_appointment_date>=@end_date
AND f.patient_id NOT IN (
 SELECT patient_id FROM kenyaemr_etl.etl_patient_program_discontinuation
 WHERE effective_discontinuation_date<=@end_date)
GROUP BY d.gender, age_band;

-- =========================================================
-- TX_RTT
-- =========================================================
SELECT d.gender,
CASE
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) < 15 THEN '<15'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 15 AND 19 THEN '15-19'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 20 AND 24 THEN '20-24'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 25 AND 49 THEN '25-49'
 ELSE '50+' END AS age_band,
COUNT(DISTINCT f.patient_id) AS tx_rtt
FROM kenyaemr_etl.etl_patient_hiv_followup f
JOIN kenyaemr_etl.etl_patient_demographics d ON f.patient_id=d.patient_id
WHERE f.visit_date BETWEEN @start_date AND @end_date
AND f.days_since_last_visit>28
GROUP BY d.gender, age_band;

-- =========================================================
-- HTS_TST
-- =========================================================
SELECT d.gender,
CASE
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) < 15 THEN '<15'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 15 AND 19 THEN '15-19'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 20 AND 24 THEN '20-24'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 25 AND 49 THEN '25-49'
 ELSE '50+' END AS age_band,
COUNT(*) AS hts_tst
FROM kenyaemr_etl.etl_hts_test h
JOIN kenyaemr_etl.etl_patient_demographics d ON h.patient_id=d.patient_id
WHERE h.visit_date BETWEEN @start_date AND @end_date
GROUP BY d.gender, age_band;

-- =========================================================
-- HTS_TST_POS
-- =========================================================
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

-- =========================================================
-- VL_SUPP
-- =========================================================
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

-- =========================================================
-- PMTCT_STAT
-- =========================================================
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

-- =========================================================
-- PMTCT_ART
-- =========================================================
SELECT d.gender,
CASE
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) < 15 THEN '<15'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 15 AND 19 THEN '15-19'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 20 AND 24 THEN '20-24'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 25 AND 49 THEN '25-49'
 ELSE '50+' END AS age_band,
COUNT(DISTINCT m.patient_id) AS pmtct_art
FROM kenyaemr_etl.etl_mch_enrollment m
JOIN kenyaemr_etl.etl_hiv_enrollment h ON m.patient_id=h.patient_id
JOIN kenyaemr_etl.etl_patient_demographics d ON m.patient_id=d.patient_id
WHERE m.hiv_status='Positive'
AND h.date_started_art<=@end_date
GROUP BY d.gender, age_band;

-- =========================================================
-- TB_STAT
-- =========================================================
SELECT d.gender,
CASE
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) < 15 THEN '<15'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 15 AND 19 THEN '15-19'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 20 AND 24 THEN '20-24'
 WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 25 AND 49 THEN '25-49'
 ELSE '50+' END AS age_band,
COUNT(DISTINCT t.patient_id) AS tb_stat
FROM kenyaemr_etl.etl_tb_screening t
JOIN kenyaemr_etl.etl_patient_demographics d ON t.patient_id=d.patient_id
WHERE t.visit_date BETWEEN @start_date AND @end_date
GROUP BY d.gender, age_band;

-- =========================================================
-- TB_ART
-- =========================================================
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
AND h.date_started_art IS NOT NULL
GROUP BY d.gender, age_band;

-- END OF FILE
