SET SESSION sql_mode = (
  SELECT REPLACE(@@SESSION.sql_mode, 'ONLY_FULL_GROUP_BY', '')
);

SELECT
    x.Gender,
    CASE
        WHEN x.DOB IS NULL THEN 'Unknown'
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
    COUNT(*) AS total_patients
FROM (
    SELECT
        c.patient_id,
        p.Gender,
        p.DOB,
        TIMESTAMPDIFF(YEAR, p.DOB, DATE('2025-10-31')) AS age
    FROM (
        /* ===== ART ACTIVE COHORT ===== */
        SELECT t.patient_id
        FROM (
            SELECT
                fup.patient_id,
                MAX(e.visit_date) AS enroll_date,
                GREATEST(
                    MAX(fup.visit_date),
                    IFNULL(MAX(d.visit_date), '0000-00-00')
                ) AS latest_vis_date,
                GREATEST(
                    MID(MAX(CONCAT(fup.visit_date, fup.next_appointment_date)), 11),
                    IFNULL(MAX(d.visit_date), '0000-00-00')
                ) AS latest_tca,
                d.patient_id AS disc_patient,
                d.effective_disc_date,
                MAX(d.visit_date) AS date_discontinued,
                de.patient_id AS started_on_drugs
            FROM kenyaemr_etl.etl_patient_hiv_followup fup
            JOIN kenyaemr_etl.etl_hiv_enrollment e
              ON fup.patient_id = e.patient_id
            LEFT JOIN kenyaemr_etl.etl_drug_event de
              ON e.patient_id = de.patient_id
             AND de.program = 'HIV'
             AND DATE(de.date_started) <= DATE('2025-10-31')
            LEFT JOIN (
                SELECT
                    patient_id,
                    COALESCE(DATE(effective_discontinuation_date), visit_date) AS visit_date,
                    MAX(DATE(effective_discontinuation_date)) AS effective_disc_date
                FROM kenyaemr_etl.etl_patient_program_discontinuation
                WHERE DATE(visit_date) <= DATE('2025-10-31')
                  AND program_name = 'HIV'
                GROUP BY patient_id
            ) d ON d.patient_id = fup.patient_id
            WHERE fup.visit_date <= DATE('2025-10-31')
            GROUP BY fup.patient_id
            HAVING started_on_drugs IS NOT NULL
               AND (
                   TIMESTAMPDIFF(DAY, DATE(latest_tca), DATE('2025-10-31')) <= 30
               )
        ) t
    ) c
    JOIN kenyaemr_etl.etl_patient_demographics p
      ON p.patient_id = c.patient_id
) x
GROUP BY x.Gender, age_band
ORDER BY x.Gender, age_band;
