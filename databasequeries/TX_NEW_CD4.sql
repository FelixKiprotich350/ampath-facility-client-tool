-- TX_NEW CD4 <200 / >=200 / UNKNOWN
-- Run common.sql first to set up variables and tables

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
WHERE o.date_activated BETWEEN r.report_start_date AND r.report_end_date
GROUP BY ab.age_band, ab.sex, cd4_category;