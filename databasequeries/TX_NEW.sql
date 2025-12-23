-- TX_NEW
-- Run common.sql first to set up variables and tables

SELECT ab.age_band, ab.sex, COUNT(DISTINCT o.patient_id) AS indicator_value
FROM orders o
JOIN drug_order d ON d.order_id = o.order_id
JOIN age_band ab ON ab.patient_id = o.patient_id
JOIN rpt r
WHERE o.voided = @voided_status 
AND o.date_activated BETWEEN r.report_start_date AND r.report_end_date
GROUP BY ab.age_band, ab.sex;