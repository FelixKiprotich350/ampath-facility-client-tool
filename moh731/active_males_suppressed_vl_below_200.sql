-- Active males in Male Clinic with Suppressed VL below 200
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
        select t.patient_id
        from (select fup.patient_id,
                     p.Gender,
                     max(e.visit_date)                                                                as enroll_date,
                     greatest(max(fup.visit_date), ifnull(max(d.visit_date), '0000-00-00'))           as latest_vis_date,
                     greatest(mid(max(concat(fup.visit_date, fup.next_appointment_date)), 11),
                              ifnull(max(d.visit_date), '0000-00-00'))                                as latest_tca,
                     d.patient_id                                                                     as disc_patient,
                     d.effective_disc_date                                                            as effective_disc_date,
                     max(d.visit_date)                                                                as date_discontinued,
                     de.patient_id                                                                    as started_on_drugs,
                     mid(max(concat(vl.visit_date, vl.test_result)), 11)                              as latest_vl
              from kenyaemr_etl.etl_patient_hiv_followup fup
                       join kenyaemr_etl.etl_patient_demographics p on p.patient_id = fup.patient_id
                       join kenyaemr_etl.etl_hiv_enrollment e on fup.patient_id=e.patient_id
                       left join kenyaemr_etl.etl_drug_event de
                                  on e.patient_id = de.patient_id and de.program = 'HIV' and date(de.date_started) <= date('2025-10-31 00:00:00')
                       left join kenyaemr_etl.etl_laboratory_extract vl
                                  on fup.patient_id = vl.patient_id and vl.lab_test = 856
                                  and vl.visit_date <= date('2025-10-31 00:00:00')
                       left outer JOIN
                   (select patient_id,
                           coalesce(date(effective_discontinuation_date), visit_date) visit_date,
                           max(date(effective_discontinuation_date)) as               effective_disc_date
                    from kenyaemr_etl.etl_patient_program_discontinuation
                    where date(visit_date) <= date('2025-10-31 00:00:00')
                      and program_name = 'HIV'
                    group by patient_id) d on d.patient_id = fup.patient_id
              where fup.visit_date <= date('2025-10-31 00:00:00')
              group by patient_id
              having (started_on_drugs is not null and started_on_drugs <> '')
                 and p.Gender = 'M'
                 and latest_vl is not null
                 and cast(latest_vl as unsigned) < 200
                 and (
                  (
                          (timestampdiff(DAY, date(latest_tca), date('2025-10-31 00:00:00')) <= 30 and
                           ((date(d.effective_disc_date) > date('2025-10-31 00:00:00') or date(enroll_date) > date(d.effective_disc_date)) or
                            d.effective_disc_date is null))
                          and
                          (date(latest_vis_date) >= date(date_discontinued) or date(latest_tca) >= date(date_discontinued) or
                           disc_patient is null)
                      )
                  )) t
    ) c
    JOIN kenyaemr_etl.etl_patient_demographics p ON p.patient_id = c.patient_id
) x
GROUP BY x.gender, age_band
ORDER BY x.gender, age_band;
