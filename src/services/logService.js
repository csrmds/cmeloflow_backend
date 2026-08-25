const pool = require('../config/database');
const ServiceError = require('../utils/ServiceError');

const VALID_LEVELS = ['info', 'warning', 'error', 'critical'];

/**
 * Cria um registro de log/evento.
 * Uso típico:
 *  - chamado pelo n8n (via x-api-key) quando uma tool falha durante o fluxo do AI Agent
 *  - chamado internamente pelo próprio backend (require direto, sem HTTP) em catch blocks
 *
 * @param {{
 *   level?: 'info'|'warning'|'error'|'critical',
 *   category: string,
 *   source?: string,
 *   message: string,
 *   details?: object,
 *   client_id?: number,
 *   lead_id?: number,
 *   workflow_id?: string,
 * }} data
 */
async function create(data) {
	const {
		level = 'info',
		category,
		source = null,
		message,
		details = null,
		client_id = null,
		lead_id = null,
		workflow_id = null,
	} = data;

	if (!category) { throw new ServiceError('category é obrigatório', 400); }
	if (!message) { throw new ServiceError('message é obrigatório', 400); }
	if (!VALID_LEVELS.includes(level)) {
		throw new ServiceError(`level inválido. Use: ${VALID_LEVELS.join(' | ')}`, 400);
	}

	const [result] = await pool.query(
		`INSERT INTO logs (level, category, source, message, details, client_id, lead_id, workflow_id)
   	VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			level,
			category,
			source,
			message,
			details ? JSON.stringify(details) : null,
			client_id,
			lead_id,
			workflow_id,
		]
	);

	return { id: result.insertId };
}

/**
 * Lista logs com filtros opcionais. Usado pelo painel admin.
 * @param {{
 *   level?: string,
 *   category?: string,
 *   client_id?: number|string,
 *   lead_id?: number|string,
 *   resolved?: number|string,
 *   limit?: number|string,
 *   offset?: number|string,
 * }} filters
 */
async function list(filters = {}) {
	const { level, category, client_id, lead_id, resolved, limit = 100, offset = 0 } = filters;

	const where = [];
	const params = [];

	if (level) {
		where.push('level = ?');
		params.push(level);
	}
	if (category) {
		where.push('category = ?');
		params.push(category);
	}
	if (client_id) {
		where.push('client_id = ?');
		params.push(client_id);
	}
	if (lead_id) {
		where.push('lead_id = ?');
		params.push(lead_id);
	}
	if (resolved !== undefined) {
		where.push('resolved = ?');
		params.push(Number(resolved));
	}

	const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

	const [rows] = await pool.query(
		`SELECT * FROM logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
		[...params, Number(limit), Number(offset)]
	);

	return rows;
}

/**
 * Busca um log por id.
 * @param {number|string} id
 */
async function getById(id) {
	const [rows] = await pool.query('SELECT * FROM logs WHERE id = ?', [id]);

	if (!rows.length) { throw new ServiceError('Log não encontrado', 404); }

	return rows[0];
}

/**
 * Marca um log como resolvido (uso do admin, ex: depois de tratar um erro).
 * @param {number|string} id
 */
async function markResolved(id) {
	const [result] = await pool.query('UPDATE logs SET resolved = 1 WHERE id = ?', [id]);

	if (result.affectedRows === 0) { throw new ServiceError('Log não encontrado', 404); }

	return { id: Number(id), resolved: true };
}

module.exports = {
	create,
	list,
	getById,
	markResolved,
	ServiceError,
};