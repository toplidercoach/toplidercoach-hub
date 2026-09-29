-- ============================================================
-- TopLiderCoach — Refresco de fechas del club demo (Rapid Alianza)
-- Uso: ejecutar en el SQL Editor de Supabase antes de cada tanda de demos
--      SELECT demo_refrescar_fechas();
-- Mueve todas las fechas del club demo hasta "hoy" a partir de las referencias
-- guardadas en clubs.demo_reference_date (narrativo, por días) y
-- clubs.demo_reference_month (económico, por meses naturales).
-- Apertura contable, año fiscal y patrocinadores se quedan fijos.
-- Ultima revision: 2026-09-29
-- ============================================================

-- Requisito (una sola vez): la regla "un informe diario por fisio y dia" debe ser diferible
ALTER TABLE cm_fisio_daily_reports
  DROP CONSTRAINT IF EXISTS cm_fisio_daily_reports_club_id_report_date_physio_wp_user_i_key,
  ADD CONSTRAINT cm_fisio_daily_reports_club_id_report_date_physio_wp_user_i_key
      UNIQUE (club_id, report_date, physio_wp_user_id) DEFERRABLE INITIALLY IMMEDIATE;

-- Auxiliar: desplaza nombres de mes en español dentro de un texto
CREATE OR REPLACE FUNCTION demo_desplazar_meses_texto(txt text, n int) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  meses text[] := ARRAY['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  i int;
BEGIN
  IF txt IS NULL OR n = 0 THEN RETURN txt; END IF;
  FOR i IN 1..12 LOOP
    txt := regexp_replace(txt, '\m' || meses[i] || '\M', '#M' || i || '#', 'gi');
  END LOOP;
  FOR i IN 1..12 LOOP
    txt := replace(txt, '#M' || i || '#', meses[((i - 1 + n) % 12 + 12) % 12 + 1]);
  END LOOP;
  RETURN txt;
END $$;

-- Principal
CREATE OR REPLACE FUNCTION demo_refrescar_fechas() RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  v_club uuid := '00000000-0000-4000-8000-00000000de30';
  v_ref_dia date; v_ref_mes date; v_dias int; v_meses int; v_int interval;
BEGIN
  SELECT demo_reference_date, demo_reference_month INTO v_ref_dia, v_ref_mes FROM clubs WHERE id = v_club;
  v_dias  := CURRENT_DATE - v_ref_dia;
  v_int   := (v_dias || ' days')::interval;
  v_meses := (EXTRACT(YEAR FROM date_trunc('month', CURRENT_DATE)) - EXTRACT(YEAR FROM v_ref_mes)) * 12
           + (EXTRACT(MONTH FROM date_trunc('month', CURRENT_DATE)) - EXTRACT(MONTH FROM v_ref_mes));

  UPDATE matches SET match_date = match_date + v_dias, fecha_salida = fecha_salida + v_dias WHERE club_id = v_club;
  UPDATE training_sessions SET session_date = session_date + v_dias WHERE club_id = v_club;
  UPDATE training_periods SET date_start = date_start + v_dias, date_end = date_end + v_dias WHERE club_id = v_club;
  UPDATE cm_med_injuries SET injury_date = injury_date + v_dias, discharge_date = discharge_date + v_dias WHERE club_id = v_club;
  UPDATE cm_med_rtp SET started_at = started_at + v_dias, completed_at = completed_at + v_dias WHERE club_id = v_club;
  UPDATE cm_med_sessions SET session_date = session_date + v_dias WHERE club_id = v_club;
  UPDATE cm_med_ostrc SET eval_date = eval_date + v_dias WHERE club_id = v_club;
  UPDATE cm_med_player_record SET last_ecg_date = last_ecg_date + v_dias, last_stress_test = last_stress_test + v_dias,
         last_blood_test = last_blood_test + v_dias, medical_certificate_expiry = medical_certificate_expiry + v_dias WHERE club_id = v_club;
  UPDATE cm_fisio_sessions SET session_date = session_date + v_dias WHERE club_id = v_club;
  UPDATE cm_fisio_appointments SET appointment_date = appointment_date + v_dias WHERE club_id = v_club;
  SET CONSTRAINTS cm_fisio_daily_reports_club_id_report_date_physio_wp_user_i_key DEFERRED;
  UPDATE cm_fisio_daily_reports SET report_date = report_date + v_dias, sent_at = sent_at + v_int WHERE club_id = v_club;
  UPDATE cm_fisio_treatments SET start_date = start_date + v_dias, estimated_end_date = estimated_end_date + v_dias, actual_end_date = actual_end_date + v_dias WHERE club_id = v_club;
  UPDATE cm_pf_gps_sessions SET session_date = session_date + v_dias WHERE club_id = v_club;
  UPDATE cm_pf_test_results SET test_date = test_date + v_dias WHERE club_id = v_club;
  UPDATE cm_pf_anthropometry SET measure_date = measure_date + v_dias WHERE club_id = v_club;
  UPDATE cm_sc_matches SET match_date = match_date + v_dias WHERE club_id = v_club;
  UPDATE cm_sc_player_reports SET report_date = report_date + v_dias WHERE club_id = v_club;
  UPDATE cm_sc_rival_reports SET report_date = report_date + v_dias WHERE club_id = v_club;
  UPDATE cm_sc_player_sightings SET sighting_date = sighting_date + v_dias WHERE club_id = v_club;
  UPDATE cm_sc_expense_reports SET period_from = period_from + v_dias, period_to = period_to + v_dias,
         submitted_at = submitted_at + v_int, approved_at = approved_at + v_int, paid_at = paid_at + v_int WHERE club_id = v_club;
  UPDATE cm_sc_expense_items SET expense_date = expense_date + v_dias WHERE club_id = v_club;
  UPDATE cm_dd_interactions SET interaction_date = interaction_date + v_dias, follow_up_date = follow_up_date + v_dias WHERE club_id = v_club;
  UPDATE cm_util_deliveries SET delivered_at = delivered_at + v_dias, returned_at = returned_at + v_dias WHERE club_id = v_club;
  UPDATE cm_util_requests SET session_date = session_date + v_dias WHERE club_id = v_club;
  UPDATE club_player_availability SET valid_until = valid_until + v_dias WHERE club_id = v_club;
  UPDATE cm_rfef_submissions SET submitted_on = submitted_on + v_dias, valid_until = valid_until + v_dias WHERE club_id = v_club;
  UPDATE cm_rfef_debt SET as_of_date = as_of_date + v_dias WHERE club_id = v_club;
  UPDATE cm_comm_messages SET sent_at = sent_at + v_int, created_at = created_at + v_int, updated_at = updated_at + v_int WHERE club_id = v_club;
  UPDATE cm_comm_recipients SET sent_at = sent_at + v_int, delivered_at = delivered_at + v_int, read_at = read_at + v_int, confirmed_at = confirmed_at + v_int WHERE club_id = v_club;

  IF v_dias <> 0 THEN
    UPDATE analista_dossiers
    SET partidos = (SELECT jsonb_agg(p || jsonb_build_object('fecha', ((p->>'fecha')::date + v_dias)::text)) FROM jsonb_array_elements(partidos) p)
    WHERE club_id = v_club AND jsonb_array_length(partidos) > 0;
  END IF;

  IF v_meses <> 0 THEN
    UPDATE cm_eco_journal SET entry_date = entry_date + (v_meses || ' months')::interval,
                              description = demo_desplazar_meses_texto(description, v_meses)
      WHERE club_id = v_club AND description <> 'Apertura';
    UPDATE cm_eco_incomes SET income_date = income_date + (v_meses || ' months')::interval WHERE club_id = v_club;
    UPDATE cm_eco_expense_items SET expense_date = expense_date + (v_meses || ' months')::interval WHERE club_id = v_club;
    UPDATE cm_eco_expense_sheets SET paid_at = paid_at + (v_meses || ' months')::interval,
                                     approved_at = approved_at + (v_meses || ' months')::interval WHERE club_id = v_club;
    UPDATE cm_pay_assignments
      SET period_start = period_start + (v_meses || ' months')::interval,
          period_end = (date_trunc('month', period_end + (v_meses || ' months')::interval) + INTERVAL '1 month' - INTERVAL '1 day')::date
      WHERE club_id = v_club;
    UPDATE cm_pay_transactions SET paid_at = paid_at + (v_meses || ' months')::interval WHERE club_id = v_club;
  END IF;

  UPDATE clubs SET demo_reference_date = CURRENT_DATE, demo_reference_month = date_trunc('month', CURRENT_DATE)::date WHERE id = v_club;
  RETURN format('Rapid Alianza refrescado: +%s días (narrativo), +%s meses (económico).', v_dias, v_meses);
END $$;
