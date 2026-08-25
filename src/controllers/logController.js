const logService = require('../services/logService');
const response = require('../utils/response');

// POST /logs  (chamado pelo n8n via x-api-key, ou pelo próprio backend)
exports.create = async (req, res) => {
	try {
		const result = await logService.create(req.body);
		return response.success(res, result, 'Log registrado com sucesso', 201);
	} catch (err) {
		return response.handleError(res, err, 'Erro ao registrar log');
	}
};

// GET /logs  (frontend, autenticado — apenas admin)
// Query params opcionais: level, category, client_id, lead_id, resolved, limit, offset
exports.list = async (req, res) => {
	if (req.user.user_role !== 'admin') {
		return response.error(res, 'Acesso negado', 401);
	}

	try {
		const rows = await logService.list(req.query);
		return response.success(res, rows, 'Consulta realizada com sucesso', 200);
	} catch (err) {
		return response.handleError(res, err, 'Erro ao listar logs');
	}
};

// GET /logs/:id  (frontend, autenticado — apenas admin)
exports.getById = async (req, res) => {
	if (req.user.user_role !== 'admin') {
		return response.error(res, 'Acesso negado', 401);
	}

	try {
		const result = await logService.getById(req.params.id);
		return response.success(res, result, '', 200);
	} catch (err) {
		return response.handleError(res, err, 'Erro ao buscar log');
	}
};

// PUT /logs/:id/resolve  (frontend, autenticado — apenas admin)
exports.markResolved = async (req, res) => {
	if (req.user.user_role !== 'admin') {
		return response.error(res, 'Acesso negado', 401);
	}

	try {
		const result = await logService.markResolved(req.params.id);
		return response.success(res, result, 'Log marcado como resolvido', 200);
	} catch (err) {
		return response.handleError(res, err, 'Erro ao atualizar log');
	}
};