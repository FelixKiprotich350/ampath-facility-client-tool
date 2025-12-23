-- TX_CURR INCLUDING DEFAULTERS 0-30 DAYS
-- Run common.sql first to set up variables and tables

SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs next_appt ON next_appt.encounter_id = e.encounter_id
AND next_appt.concept_id = (SELECT concept_id FROM concept_name WHERE name = @concept_next_appointment LIMIT 1)
AND next_appt.voided = @voided_status
WHERE e.encounter_datetime <= r.report_date
AND TIMESTAMPDIFF(DAY, next_appt.value_datetime, r.report_date) <= @defaulter_days_max
GROUP BY ab.age_band, ab.sex;