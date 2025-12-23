-- WHO STAGE I & II
-- Run common.sql first to set up variables and tables

SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs who ON who.encounter_id = e.encounter_id
AND who.concept_id = (SELECT concept_id FROM concept_name WHERE name = @concept_who_stage LIMIT 1)
AND who.value_coded IN ((SELECT concept_id FROM concept_name WHERE name = @concept_stage_1 LIMIT 1),
(SELECT concept_id FROM concept_name WHERE name = @concept_stage_2 LIMIT 1))
AND who.voided = @voided_status
WHERE e.encounter_datetime <= r.report_date
GROUP BY ab.age_band, ab.sex;