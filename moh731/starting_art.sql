SET SESSION sql_mode = (
  SELECT REPLACE(@@SESSION.sql_mode, 'ONLY_FULL_GROUP_BY', '')
);

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
    COUNT(*) AS total_patients
FROM (
    SELECT
        p.patient_id,
        p.gender,
        p.DOB AS dob,
        TIMESTAMPDIFF(
            YEAR,
            p.DOB,
            DATE('2025-07-31')
        ) AS age
    FROM (
        /* ===== YOUR NET COHORT QUERY (UNCHANGED) ===== */
        SELECT net.patient_id
        FROM (
            SELECT
                e.patient_id,
                e.date_started,
                d.visit_date AS dis_date,
                IF(d.visit_date IS NOT NULL, 1, 0) AS TOut,
                e.regimen,
                e.regimen_line,
                e.alternative_regimen,
                MID(MAX(CONCAT(fup.visit_date, fup.next_appointment_date)), 11) AS latest_tca,
                MAX(IF(
                    enr.date_started_art_at_transferring_facility IS NOT NULL
                    AND enr.facility_transferred_from IS NOT NULL, 1, 0
                )) AS TI_on_art,
                MAX(IF(enr.transfer_in_date IS NOT NULL, 1, 0)) AS TIn,
                MAX(enr.patient_type) AS latest_patient_type,
                MAX(fup.visit_date) AS latest_vis_date
            FROM (
                SELECT
                    e.patient_id,
                    MIN(e.date_started) AS date_started,
                    MID(MIN(CONCAT(e.date_started, e.regimen_name)), 11) AS regimen,
                    MID(MIN(CONCAT(e.date_started, e.regimen_line)), 11) AS regimen_line,
                    MAX(IF(discontinued, 1, 0)) AS alternative_regimen
                FROM kenyaemr_etl.etl_drug_event e
                JOIN kenyaemr_etl.etl_patient_demographics p
                  ON p.patient_id = e.patient_id
                WHERE e.program = 'HIV'
                GROUP BY e.patient_id
            ) e
            LEFT JOIN kenyaemr_etl.etl_patient_program_discontinuation d
              ON d.patient_id = e.patient_id
            LEFT JOIN kenyaemr_etl.etl_hiv_enrollment enr
              ON enr.patient_id = e.patient_id
            LEFT JOIN kenyaemr_etl.etl_patient_hiv_followup fup
              ON fup.patient_id = e.patient_id
            WHERE DATE(e.date_started) BETWEEN DATE('2025-10-01') AND DATE('2025-10-31')
            GROUP BY e.patient_id
            HAVING TI_on_art = 0
               AND latest_patient_type IN (164144,160563,159833)
        ) net
    ) c
    JOIN kenyaemr_etl.etl_patient_demographics p
      ON p.patient_id = c.patient_id
) x
GROUP BY x.gender, age_band
ORDER BY x.gender, age_band;
