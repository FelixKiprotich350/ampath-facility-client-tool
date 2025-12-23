-- TX_NEW TB
-- Run common.sql first to set up variables and tables

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