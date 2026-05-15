-- DROP FUNCTION teadmin.consultas_hoje(bigint);
-- DROP FUNCTION teadmin.calcfreq(int4, int4);

CREATE OR REPLACE FUNCTION teadmin.calcfreq(p_paciente integer, p_profissional integer DEFAULT NULL::integer)
 RETURNS numeric
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_total     INT;
    v_presencas INT;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE id_status = 2)
    INTO v_total, v_presencas
    FROM consulta
    WHERE id_paciente = p_paciente
      AND (p_profissional IS NULL OR id_profissional = p_profissional);

    RETURN ROUND(v_presencas * 100.0 / NULLIF(v_total, 0), 2);
END;
$function$
;

CREATE OR REPLACE FUNCTION teadmin.consultas_hoje(p_profissional bigint DEFAULT NULL::bigint)
RETURNS TABLE (
    id_consulta     bigint,
    id_paciente     bigint,
    id_profissional bigint,
    id_status       int,
    hora_consulta   time,
    data_consulta   date,
    nome            varchar,
    sobrenome       varchar
)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
        SELECT 
            c.id_consulta,
            c.id_paciente,
            c.id_profissional,
            c.id_status,
            c.hora_consulta,
            c.data_consulta,
            p.nome,
            p.sobrenome
        FROM teadmin.consulta c
        JOIN teadmin.pacientes p ON p.id_paciente = c.id_paciente
        WHERE DATE(c.data_consulta) = CURRENT_DATE
          AND (p_profissional IS NULL OR c.id_profissional = p_profissional)
        ORDER BY c.hora_consulta;
END;
$function$;