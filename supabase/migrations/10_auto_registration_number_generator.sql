-- ====================================================================
-- SV COLLEGE MANAGEMENT SYSTEM
-- Migration: 10_auto_registration_number_generator.sql
-- Description: Automatic 9-digit Registration Number Generator (19YYTNNNN)
--              Finds the lowest available sequential number starting from 0001
--              and allows reuse of deleted student registration numbers.
-- ====================================================================

CREATE TABLE IF NOT EXISTS registration_sequences (
    academic_year INT NOT NULL,
    track_code VARCHAR(10) NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (academic_year, track_code)
);

-- Function to atomically generate the next registration number with reuse of deleted numbers starting from 0001
CREATE OR REPLACE FUNCTION get_next_registration_number(p_year INT, p_track VARCHAR)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_yy VARCHAR(2);
    v_track_digit VARCHAR(1);
    v_next_seq INT;
    v_reg_no TEXT;
    v_prefix TEXT;
BEGIN
    -- Extract 2-digit year (e.g. 2021 -> '21', 2024 -> '24')
    v_yy := LPAD(((p_year % 100))::TEXT, 2, '0');
    -- Extract track digit (e.g. '1', '2', 'Track 1' -> '1')
    v_track_digit := SUBSTRING(REGEXP_REPLACE(p_track, '[^0-9]', '', 'g') FROM '[0-9]$');
    IF v_track_digit IS NULL OR v_track_digit = '' THEN
        v_track_digit := '1';
    END IF;

    v_prefix := '19' || v_yy || v_track_digit;

    -- Upsert tracking row if missing
    INSERT INTO registration_sequences (academic_year, track_code, last_sequence)
    VALUES (p_year, v_track_digit, 0)
    ON CONFLICT (academic_year, track_code) DO NOTHING;

    -- Row lock to prevent race conditions during concurrent enrollments
    PERFORM 1
    FROM registration_sequences
    WHERE academic_year = p_year AND track_code = v_track_digit
    FOR UPDATE;

    -- Find the lowest available sequence number starting from 1 (allows reuse of deleted numbers)
    SELECT s.num INTO v_next_seq
    FROM generate_series(1, 9999) AS s(num)
    WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE register_number = v_prefix || LPAD(s.num::TEXT, 4, '0')
    )
    ORDER BY s.num ASC
    LIMIT 1;

    IF v_next_seq IS NULL THEN
        v_next_seq := 1;
    END IF;

    -- Update last_sequence to track the current sequence
    UPDATE registration_sequences
    SET last_sequence = v_next_seq, updated_at = NOW()
    WHERE academic_year = p_year AND track_code = v_track_digit;

    v_reg_no := v_prefix || LPAD(v_next_seq::TEXT, 4, '0');
    RETURN v_reg_no;
END;
$$;

-- Function to preview the next registration number without incrementing
CREATE OR REPLACE FUNCTION preview_next_registration_number(p_year INT, p_track VARCHAR)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_yy VARCHAR(2);
    v_track_digit VARCHAR(1);
    v_curr_seq INT;
    v_prefix TEXT;
BEGIN
    v_yy := LPAD(((p_year % 100))::TEXT, 2, '0');
    v_track_digit := SUBSTRING(REGEXP_REPLACE(p_track, '[^0-9]', '', 'g') FROM '[0-9]$');
    IF v_track_digit IS NULL OR v_track_digit = '' THEN
        v_track_digit := '1';
    END IF;

    v_prefix := '19' || v_yy || v_track_digit;

    -- Find the lowest available sequence number starting from 1
    SELECT s.num INTO v_curr_seq
    FROM generate_series(1, 9999) AS s(num)
    WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE register_number = v_prefix || LPAD(s.num::TEXT, 4, '0')
    )
    ORDER BY s.num ASC
    LIMIT 1;

    IF v_curr_seq IS NULL THEN
        v_curr_seq := 1;
    END IF;

    RETURN v_prefix || LPAD(v_curr_seq::TEXT, 4, '0');
END;
$$;

GRANT ALL ON TABLE registration_sequences TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_next_registration_number(INT, VARCHAR) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION preview_next_registration_number(INT, VARCHAR) TO anon, authenticated, service_role;
