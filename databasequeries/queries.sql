-- HIV INDICATOR SQL QUERIES (OPENMRS ONLY - FULL QUERIES)
-- Run common.sql first to set up variables and tables

-- TX_NEW
SELECT ab.age_band, ab.sex, COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
WHERE o.voided = @voided_status AND d.voided = @voided_status
AND o.date_activated BETWEEN DATE_FORMAT(r.report_date, '%Y-%m-01') AND r.report_date
GROUP BY ab.age_band, ab.sex;

-- TX_NEW CD4 <200 / >=200 / UNKNOWN
SELECT ab.age_band, ab.sex,
CASE
WHEN cd4.value_numeric < @cd4_threshold_low THEN 'CD4<200'
WHEN cd4.value_numeric >= @cd4_threshold_high THEN 'CD4>=200'
ELSE 'CD4_UNKNOWN'
END AS cd4_category,
COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
LEFT JOIN obs cd4 ON cd4.person_id = o.patient_id
AND cd4.concept_id = (SELECT concept_id FROM concept_name WHERE name = @concept_cd4_count LIMIT 1)
AND cd4.voided = @voided_status
WHERE o.date_activated BETWEEN DATE_FORMAT(r.report_date, '%Y-%m-01') AND r.report_date
GROUP BY ab.age_band, ab.sex, cd4_category;

-- TX_NEW PREGNANT
SELECT ab.age_band, ab.sex, COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
JOIN obs pg ON pg.person_id = o.patient_id
AND pg.concept_id = (SELECT concept_id FROM concept_name WHERE name = @concept_pregnant LIMIT 1)
AND pg.value_coded = (SELECT concept_id FROM concept_name WHERE name = @concept_yes LIMIT 1)
AND pg.voided = @voided_status
WHERE o.date_activated BETWEEN DATE_FORMAT(r.report_date, '%Y-%m-01') AND r.report_date
GROUP BY ab.age_band, ab.sex;

-- TX_NEW TB
SELECT ab.age_band, ab.sex, COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN patient_program pp ON pp.patient_id = o.patient_id
JOIN program prg ON prg.program_id = pp.program_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
WHERE prg.name = @program_tb AND pp.voided = @voided_status
AND o.date_activated BETWEEN DATE_FORMAT(r.report_date, '%Y-%m-01') AND r.report_date
GROUP BY ab.age_band, ab.sex;

-- TX_CURR INCLUDING DEFAULTERS 0-30 DAYS
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

-- TX_CURR EXCLUDING MISSED
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs next_appt ON next_appt.encounter_id = e.encounter_id
AND next_appt.concept_id = (SELECT concept_id FROM concept_name WHERE name = @concept_next_appointment LIMIT 1)
AND next_appt.voided = @voided_status
WHERE e.encounter_datetime <= r.report_date
AND TIMESTAMPDIFF(DAY, next_appt.value_datetime, r.report_date) <= @voided_status
GROUP BY ab.age_band, ab.sex;

-- TX_CURR DEFAULTERS 0-30 DAYS
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs next_appt ON next_appt.encounter_id = e.encounter_id
AND next_appt.concept_id = (SELECT concept_id FROM concept_name WHERE name = @concept_next_appointment LIMIT 1)
AND next_appt.voided = @voided_status
WHERE e.encounter_datetime <= r.report_date
AND TIMESTAMPDIFF(DAY, next_appt.value_datetime, r.report_date) BETWEEN @defaulter_days_min AND @defaulter_days_max
GROUP BY ab.age_band, ab.sex;

-- <6 MONTHS ON ART
SELECT ab.age_band, ab.sex, COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
WHERE TIMESTAMPDIFF(MONTH, o.date_activated, r.report_date) < @months_on_art_threshold
GROUP BY ab.age_band, ab.sex;

-- WHO STAGE I & II
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

-- WHO STAGE III & IV
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs who ON who.encounter_id = e.encounter_id
AND who.concept_id = (SELECT concept_id FROM concept_name WHERE name = @concept_who_stage LIMIT 1)
AND who.value_coded IN ((SELECT concept_id FROM concept_name WHERE name = @concept_stage_3 LIMIT 1),
(SELECT concept_id FROM concept_name WHERE name = @concept_stage_4 LIMIT 1))
AND who.voided = @voided_status
WHERE e.encounter_datetime <= r.report_date
GROUP BY ab.age_band, ab.sex;

-- ELIGIBLE FOR DIFFERENTIATED CARE
SELECT ab.age_band, ab.sex, COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
WHERE TIMESTAMPDIFF(MONTH, o.date_activated, r.report_date) >= @months_on_art_threshold
GROUP BY ab.age_band, ab.sex;

-- ON DTG
SELECT ab.age_band, ab.sex, COUNT(DISTINCT d.patient_id) AS indicator_value
FROM drug_order d
JOIN orders o ON o.order_id = d.order_id
JOIN age_band ab ON ab.patient_id = d.patient_id
JOIN rpt r
JOIN drug dr ON dr.drug_id = d.drug_inventory_id
WHERE dr.name LIKE @drug_dtg_pattern AND o.voided = @voided_status AND d.voided = @voided_status
GROUP BY ab.age_band, ab.sex;

-- VIRAL LOAD SUPPRESSED
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs vl ON vl.person_id = e.patient_id
AND vl.concept_id = (SELECT concept_id FROM concept_name WHERE name = @concept_hiv_viral_load LIMIT 1)
AND vl.value_numeric < @viral_load_threshold AND vl.voided = @voided_status
WHERE e.encounter_datetime <= r.report_date
GROUP BY ab.age_band, ab.sex;

-- VIRAL LOAD VIREMIA >=200
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs vl ON vl.person_id = e.patient_id
AND vl.concept_id = (SELECT concept_id FROM concept_name WHERE name = @concept_hiv_viral_load LIMIT 1)
AND vl.value_numeric >= @viral_load_threshold AND vl.voided = @voided_status
WHERE e.encounter_datetime <= r.report_date
GROUP BY ab.age_band, ab.sex;