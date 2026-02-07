-- TEMPLATE FOR DISAGGREGATION BY GENDER AND AGE_BAND
-- Wrap any existing query with this structure:

SET SESSION sql_mode = (SELECT REPLACE(@@SESSION.sql_mode, 'ONLY_FULL_GROUP_BY', ''));

SELECT
    x.gender,
    CASE
        WHEN x.dob IS NULL THEN 'Unknown'
        WHEN x.age < 1 THEN '<1'
        WHEN x.age BETWEEN 1 AND 4 THEN '1-4'
        WHEN x.age BETWEEN 5 AND 9 THEN '5-9'
        WHEN x.age BETWEEN 10 AND 14 THEN '10-14'
        WHEN x.age BETWEEN 15 AND 19 THEN '15-19'
        WHEN x.age BETWEEN 20 AND 24 THEN '20-24'
        WHEN x.age BETWEEN 25 AND 29 THEN '25-29'
        WHEN x.age BETWEEN 30 AND 34 THEN '30-34'
        WHEN x.age BETWEEN 35 AND 39 THEN '35-39'
        WHEN x.age BETWEEN 40 AND 44 THEN '40-44'
        WHEN x.age BETWEEN 45 AND 49 THEN '45-49'
        WHEN x.age BETWEEN 50 AND 54 THEN '50-54'
        WHEN x.age BETWEEN 55 AND 59 THEN '55-59'
        WHEN x.age BETWEEN 60 AND 64 THEN '60-64'
        ELSE '65+'
    END AS age_band,
    COUNT(*) AS totalcount
FROM (
    SELECT
        p.patient_id,
        p.gender,
        p.DOB AS dob,
        TIMESTAMPDIFF(YEAR, p.DOB, DATE('2025-10-31')) AS age
    FROM (
        -- ===== INSERT YOUR ORIGINAL QUERY HERE =====
        -- The query should return patient_id column
        -- Example: select patient_id from ...
        
    ) c
    JOIN kenyaemr_etl.etl_patient_demographics p ON p.patient_id = c.patient_id
) x
GROUP BY x.gender, age_band
ORDER BY x.gender, age_band;

-- INSTRUCTIONS:
-- 1. Take your original query that returns patient_id
-- 2. Place it in the section marked "INSERT YOUR ORIGINAL QUERY HERE"
-- 3. Make sure the reporting date is consistent (2025-10-31 in this template)
-- 4. The outer wrapper will add gender and age_band columns with counts
