-- COMMON VARIABLES AND TABLES FOR HIV INDICATOR QUERIES

-- Set variables for hardcoded values
SET @report_start_date = '2025-01-01';
SET @report_end_date = '2025-01-31';
SET @cd4_threshold_low = 200;
SET @cd4_threshold_high = 200;
SET @viral_load_threshold = 200;
SET @defaulter_days_min = 1;
SET @defaulter_days_max = 30;
SET @months_on_art_threshold = 6;
SET @age_threshold_infant = 1;
SET @voided_status = 0;

-- Concept names
SET @concept_cd4_count = 'CD4 COUNT';
SET @concept_pregnant = 'Pregnant';
SET @concept_yes = 'Yes';
SET @concept_next_appointment = 'Next Appointment Date';
SET @concept_who_stage = 'WHO Stage';
SET @concept_stage_1 = 'Stage 1';
SET @concept_stage_2 = 'Stage 2';
SET @concept_stage_3 = 'Stage 3';
SET @concept_stage_4 = 'Stage 4';
SET @concept_hiv_viral_load = 'HIV Viral Load';

-- Program names
SET @program_tb = 'TB Program';

-- Drug names
SET @drug_dtg_pattern = '%DTG%';

-- Common tables
DROP TEMPORARY TABLE IF EXISTS rpt;
CREATE TEMPORARY TABLE rpt AS (
SELECT @report_start_date AS report_start_date, @report_end_date AS report_end_date
);

DROP TEMPORARY TABLE IF EXISTS age_calc;
CREATE TEMPORARY TABLE age_calc AS (
SELECT
p.patient_id,
pr.gender AS sex,
TIMESTAMPDIFF(YEAR, pr.birthdate, r.report_end_date) AS age
FROM patient p
JOIN person pr ON pr.person_id = p.patient_id
CROSS JOIN rpt r
WHERE p.voided = @voided_status AND pr.voided = @voided_status
);

DROP TEMPORARY TABLE IF EXISTS age_band;
CREATE TEMPORARY TABLE age_band AS (
SELECT *,
CASE
WHEN age < @age_threshold_infant THEN '<1'
WHEN age BETWEEN 1 AND 4 THEN '1-4'
WHEN age BETWEEN 5 AND 9 THEN '5-9'
WHEN age BETWEEN 10 AND 14 THEN '10-14'
WHEN age BETWEEN 15 AND 19 THEN '15-19'
WHEN age BETWEEN 20 AND 24 THEN '20-24'
WHEN age BETWEEN 25 AND 29 THEN '25-29'
WHEN age BETWEEN 30 AND 34 THEN '30-34'
WHEN age BETWEEN 35 AND 39 THEN '35-39'
WHEN age BETWEEN 40 AND 44 THEN '40-44'
WHEN age BETWEEN 45 AND 49 THEN '45-49'
WHEN age BETWEEN 50 AND 54 THEN '50-54'
WHEN age BETWEEN 55 AND 59 THEN '55-59'
WHEN age BETWEEN 60 AND 64 THEN '60-64'
ELSE '65+'
END AS age_band
FROM age_calc
);