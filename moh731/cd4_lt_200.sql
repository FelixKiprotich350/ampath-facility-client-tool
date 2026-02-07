select a.patient_id
from (select x.patient_id,
             mid(min(concat(coalesce(date(date_test_requested), date(visit_date)),
                            if(lab_test = 167718 and test_result = 1254, '>200',
                               if(lab_test = 167718 and test_result = 167717, '<=200',
                                  if(lab_test = 5497, test_result, ''))),
                            '')),
                 11) as baseline_cd4
      from kenyaemr_etl.etl_laboratory_extract x
      where lab_test in (167718, 5497) and date(x.date_test_requested) <= date('2025-10-31 00:00:00')
      GROUP BY x.patient_id
      having baseline_cd4 < 200
          or baseline_cd4 = '<=200') a