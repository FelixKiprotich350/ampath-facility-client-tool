# HIV INDICATOR SQL QUERIES (OPENMRS ONLY - FULL QUERIES)

WITH rpt AS (
SELECT LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AS report_date
),

age_calc AS (
SELECT
p.patient_id,
pr.gender AS sex,
TIMESTAMPDIFF(YEAR, pr.birthdate, r.report_date) AS age
FROM patient p
JOIN person pr ON pr.person_id = p.patient_id
CROSS JOIN rpt r
WHERE p.voided = 0 AND pr.voided = 0
),

age_band AS (
SELECT *,
CASE
WHEN age < 1 THEN '<1'
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
)

-- TX_NEW
SELECT ab.age_band, ab.sex, COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
WHERE o.voided = 0 AND d.voided = 0
AND o.date_activated BETWEEN DATE_FORMAT(r.report_date, '%Y-%m-01') AND r.report_date
GROUP BY ab.age_band, ab.sex;

-- TX_NEW CD4 <200 / >=200 / UNKNOWN
SELECT ab.age_band, ab.sex,
CASE
WHEN cd4.value_numeric < 200 THEN 'CD4<200'
WHEN cd4.value_numeric >= 200 THEN 'CD4>=200'
ELSE 'CD4_UNKNOWN'
END AS cd4_category,
COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
LEFT JOIN obs cd4 ON cd4.person_id = o.patient_id
AND cd4.concept_id = (SELECT concept_id FROM concept_name WHERE name = 'CD4 COUNT' LIMIT 1)
AND cd4.voided = 0
WHERE o.date_activated BETWEEN DATE_FORMAT(r.report_date, '%Y-%m-01') AND r.report_date
GROUP BY ab.age_band, ab.sex, cd4_category;

-- TX_NEW PREGNANT
SELECT ab.age_band, ab.sex, COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
JOIN obs pg ON pg.person_id = o.patient_id
AND pg.concept_id = (SELECT concept_id FROM concept_name WHERE name = 'Pregnant' LIMIT 1)
AND pg.value_coded = (SELECT concept_id FROM concept_name WHERE name = 'Yes' LIMIT 1)
AND pg.voided = 0
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
WHERE prg.name = 'TB Program' AND pp.voided = 0
AND o.date_activated BETWEEN DATE_FORMAT(r.report_date, '%Y-%m-01') AND r.report_date
GROUP BY ab.age_band, ab.sex;

-- TX_CURR INCLUDING DEFAULTERS 0-30 DAYS
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs next_appt ON next_appt.encounter_id = e.encounter_id
AND next_appt.concept_id = (SELECT concept_id FROM concept_name WHERE name = 'Next Appointment Date' LIMIT 1)
AND next_appt.voided = 0
WHERE e.encounter_datetime <= r.report_date
AND TIMESTAMPDIFF(DAY, next_appt.value_datetime, r.report_date) <= 30
GROUP BY ab.age_band, ab.sex;

-- TX_CURR EXCLUDING MISSED
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs next_appt ON next_appt.encounter_id = e.encounter_id
AND next_appt.concept_id = (SELECT concept_id FROM concept_name WHERE name = 'Next Appointment Date' LIMIT 1)
AND next_appt.voided = 0
WHERE e.encounter_datetime <= r.report_date
AND TIMESTAMPDIFF(DAY, next_appt.value_datetime, r.report_date) <= 0
GROUP BY ab.age_band, ab.sex;

-- TX_CURR DEFAULTERS 0-30 DAYS
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs next_appt ON next_appt.encounter_id = e.encounter_id
AND next_appt.concept_id = (SELECT concept_id FROM concept_name WHERE name = 'Next Appointment Date' LIMIT 1)
AND next_appt.voided = 0
WHERE e.encounter_datetime <= r.report_date
AND TIMESTAMPDIFF(DAY, next_appt.value_datetime, r.report_date) BETWEEN 1 AND 30
GROUP BY ab.age_band, ab.sex;

-- <6 MONTHS ON ART
SELECT ab.age_band, ab.sex, COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
WHERE TIMESTAMPDIFF(MONTH, o.date_activated, r.report_date) < 6
GROUP BY ab.age_band, ab.sex;

-- WHO STAGE I & II
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs who ON who.encounter_id = e.encounter_id
AND who.concept_id = (SELECT concept_id FROM concept_name WHERE name = 'WHO Stage' LIMIT 1)
AND who.value_coded IN ((SELECT concept_id FROM concept_name WHERE name = 'Stage 1' LIMIT 1),
(SELECT concept_id FROM concept_name WHERE name = 'Stage 2' LIMIT 1))
AND who.voided = 0
WHERE e.encounter_datetime <= r.report_date
GROUP BY ab.age_band, ab.sex;

-- WHO STAGE III & IV
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs who ON who.encounter_id = e.encounter_id
AND who.concept_id = (SELECT concept_id FROM concept_name WHERE name = 'WHO Stage' LIMIT 1)
AND who.value_coded IN ((SELECT concept_id FROM concept_name WHERE name = 'Stage 3' LIMIT 1),
(SELECT concept_id FROM concept_name WHERE name = 'Stage 4' LIMIT 1))
AND who.voided = 0
WHERE e.encounter_datetime <= r.report_date
GROUP BY ab.age_band, ab.sex;

-- ELIGIBLE FOR DIFFERENTIATED CARE
SELECT ab.age_band, ab.sex, COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
WHERE TIMESTAMPDIFF(MONTH, o.date_activated, r.report_date) >= 6
GROUP BY ab.age_band, ab.sex;

-- ON DTG
SELECT ab.age_band, ab.sex, COUNT(DISTINCT d.patient_id) AS indicator_value
FROM drug_order d
JOIN orders o ON o.order_id = d.order_id
JOIN age_band ab ON ab.patient_id = d.patient_id
JOIN rpt r
JOIN drug dr ON dr.drug_id = d.drug_inventory_id
WHERE dr.name LIKE '%DTG%' AND o.voided = 0 AND d.voided = 0
GROUP BY ab.age_band, ab.sex;

-- VIRAL LOAD SUPPRESSED
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs vl ON vl.person_id = e.patient_id
AND vl.concept_id = (SELECT concept_id FROM concept_name WHERE name = 'HIV Viral Load' LIMIT 1)
AND vl.value_numeric < 200 AND vl.voided = 0
WHERE e.encounter_datetime <= r.report_date
GROUP BY ab.age_band, ab.sex;

-- VIRAL LOAD VIREMIA >=200
SELECT ab.age_band, ab.sex, COUNT(DISTINCT e.patient_id) AS indicator_value
FROM encounter e
JOIN age_band ab ON ab.patient_id = e.patient_id
JOIN rpt r
JOIN obs vl ON vl.person_id = e.patient_id
AND vl.concept_id = (SELECT concept_id FROM concept_name WHERE name = 'HIV Viral Load' LIMIT 1)
AND vl.value_numeric >= 200 AND vl.voided = 0
WHERE e.encounter_datetime <= r.report_date
GROUP BY ab.age_band, ab.sex;
