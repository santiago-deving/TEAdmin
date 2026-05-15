const db = require('../db');

async function calcFreq(id_paciente, id_profissional, req) {
    const usuario = req.session.usuario;
    const client = await db.connect();

    let result;

    if (usuario.tipo === 0 && id_profissional == null) {

        result = await client.query(
            'SELECT calcfreq($1::integer)',
            [id_paciente]
        );

    } else if (usuario.tipo === 0 && id_profissional != null) {

        result = await client.query(
            'SELECT calcfreq($1::integer, $2::integer)',
            [id_paciente, id_profissional]
        );

    } else if (usuario.tipo === 1) {

        result = await client.query(
            'SELECT calcfreq($1::integer, $2::integer)',
            [id_paciente, usuario.id_profissional]
        );

    } else if (usuario.tipo === 2 && id_profissional == null) {

        result = await client.query(
            'SELECT calcfreq($1::integer)',
            [id_paciente]
        );

    } else if (usuario.tipo === 2 && id_profissional != null) {

        result = await client.query(
            'SELECT calcfreq($1::integer, $2::integer)',
            [id_paciente, id_profissional]
        );
    }

    const freq = result.rows[0].calcfreq;

    client.release();

    return freq;
}

module.exports = {calcFreq}