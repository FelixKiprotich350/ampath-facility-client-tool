-- ON DTG
-- Run common.sql first to set up variables and tables

SELECT ab.age_band, ab.sex, COUNT(DISTINCT d.patient_id) AS indicator_value
FROM drug_order d
JOIN orders o ON o.order_id = d.order_id
JOIN age_band ab ON ab.patient_id = d.patient_id
JOIN rpt r
JOIN drug dr ON dr.drug_id = d.drug_inventory_id
WHERE dr.name LIKE @drug_dtg_pattern AND o.voided = @voided_status AND d.voided = @voided_status
GROUP BY ab.age_band, ab.sex;