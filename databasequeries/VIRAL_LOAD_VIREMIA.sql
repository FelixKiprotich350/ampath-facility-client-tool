-- VIRAL LOAD VIREMIA >=200
-- Run common.sql first to set up variables and tables

SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs vl ON vl.person_id = e.patient_id
AND vl.concept_id = (SELECT concept_id FROM concept_name WHERE name = @concept_hiv_viral_load LIMIT 1)
AND vl.value_numeric >= @viral_load_threshold AND vl.voided = @voided_status
WHERE e.encounter_datetime <= r.report_date
GROUP BY ab.age_band, ab.sex;