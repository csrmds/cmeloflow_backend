const express = require('express');
const router = express.Router();
const internalAuth = require('../middleware/internalAuth');
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/logController');

// Chamada SEM auth de usuário (vai ser chamado pelo n8n) -> usa x-api-key no header
router.post('/', internalAuth, controller.create);

// Chamadas COM auth - painel admin
router.get('/', auth, controller.list);
router.get('/:id', auth, controller.getById);
router.put('/:id/resolve', auth, controller.markResolved);

module.exports = router;