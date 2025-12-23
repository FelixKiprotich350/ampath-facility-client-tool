-- TX_NEW PREGNANT
-- Run common.sql first to set up variables and tables

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