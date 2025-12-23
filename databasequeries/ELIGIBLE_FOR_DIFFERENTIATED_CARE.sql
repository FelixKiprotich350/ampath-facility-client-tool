-- ELIGIBLE FOR DIFFERENTIATED CARE
-- Run common.sql first to set up variables and tables

SELECT ab.age_band, ab.sex, COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
WHERE TIMESTAMPDIFF(MONTH, o.date_activated, r.report_date) >= @months_on_art_threshold
GROUP BY ab.age_band, ab.sex;