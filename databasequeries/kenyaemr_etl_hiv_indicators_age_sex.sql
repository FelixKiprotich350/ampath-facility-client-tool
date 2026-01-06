
-- KenyaEMR ETL HIV Indicator Queries with Age/Sex Disaggregation
-- Author: ChatGPT
-- Assumes MySQL / MariaDB
-- ===============================================

-- Reporting Period
SET @start_date = '2025-01-01';
SET @end_date   = '2025-01-31';

-- =================================================
-- Helper: Age/Sex Disaggregation
-- Age calculated at END DATE
-- =================================================

-- =======================
-- TX_NEW (New on ART)
-- =======================
SELECT
  d.gender,
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
    ELSE '50+'
  END AS age_band,
  COUNT(DISTINCT e.patient_id) AS tx_new
FROM kenyaemr_etl.etl_hiv_enrollment e
JOIN kenyaemr_etl.etl_patient_demographics d
  ON e.patient_id = d.patient_id
WHERE e.date_started_art BETWEEN @start_date AND @end_date
  AND e.transfer_in = 0
GROUP BY d.gender, age_band;

-- =======================
-- TX_CURR (Currently on ART)
-- =======================
SELECT
  d.gender,
  CASE
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) < 15 THEN '<15'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 15 AND 19 THEN '15-19'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 20 AND 24 THEN '20-24'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 25 AND 49 THEN '25-49'
    ELSE '50+'
  END AS age_band,
  COUNT(DISTINCT f.patient_id) AS tx_curr
FROM kenyaemr_etl.etl_patient_hiv_followup f
JOIN kenyaemr_etl.etl_patient_demographics d
  ON f.patient_id = d.patient_id
WHERE f.visit_date <= @end_date
  AND f.next_appointment_date >= @end_date
  AND f.patient_id NOT IN (
        SELECT patient_id
        FROM kenyaemr_etl.etl_patient_program_discontinuation
        WHERE discontinuation_date <= @end_date
  )
GROUP BY d.gender, age_band;

-- =======================
-- HTS_TST (HIV Tests)
-- =======================
SELECT
  d.gender,
  CASE
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) < 15 THEN '<15'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 15 AND 19 THEN '15-19'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 20 AND 24 THEN '20-24'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 25 AND 49 THEN '25-49'
    ELSE '50+'
  END AS age_band,
  COUNT(*) AS hts_tst
FROM kenyaemr_etl.etl_hts_test h
JOIN kenyaemr_etl.etl_patient_demographics d
  ON h.patient_id = d.patient_id
WHERE h.visit_date BETWEEN @start_date AND @end_date
GROUP BY d.gender, age_band;

-- =======================
-- HTS_TST_POS (HIV Positive)
-- =======================
SELECT
  d.gender,
  CASE
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) < 15 THEN '<15'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 15 AND 19 THEN '15-19'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 20 AND 24 THEN '20-24'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 25 AND 49 THEN '25-49'
    ELSE '50+'
  END AS age_band,
  COUNT(*) AS hts_tst_pos
FROM kenyaemr_etl.etl_hts_test h
JOIN kenyaemr_etl.etl_patient_demographics d
  ON h.patient_id = d.patient_id
WHERE h.visit_date BETWEEN @start_date AND @end_date
  AND h.test_result = 'Positive'
GROUP BY d.gender, age_band;

-- =======================
-- VL_SUPP (Viral Load Suppressed)
-- =======================
SELECT
  d.gender,
  CASE
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) < 15 THEN '<15'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 15 AND 19 THEN '15-19'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 20 AND 24 THEN '20-24'
    WHEN TIMESTAMPDIFF(YEAR, d.DOB, @end_date) BETWEEN 25 AND 49 THEN '25-49'
    ELSE '50+'
  END AS age_band,
  COUNT(DISTINCT v.patient_id) AS vl_suppressed
FROM kenyaemr_etl.etl_viral_load v
JOIN kenyaemr_etl.etl_patient_demographics d
  ON v.patient_id = d.patient_id
WHERE v.visit_date BETWEEN @start_date AND @end_date
  AND v.current_vl_result < 1000
GROUP BY d.gender, age_band;

-- END OF FILE
