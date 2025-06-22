"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const cardController_1 = require("../controllers/cardController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Card routes
router.post('/', cardController_1.createCard);
router.get('/', cardController_1.getCards);
router.get('/:id', cardController_1.getCard);
router.put('/:id', cardController_1.updateCard);
router.delete('/:id', cardController_1.deleteCard);
// Bulk operations
router.delete('/bulk/delete', cardController_1.bulkDeleteCards);
// AI generation
router.post('/generate', cardController_1.generateCards);
exports.default = router;
//# sourceMappingURL=cards.js.map