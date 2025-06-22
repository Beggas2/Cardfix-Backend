"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cardController_1 = require("../controllers/cardController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Card CRUD
router.post('/', cardController_1.createCard);
router.get('/', cardController_1.getCards);
router.get('/:id', cardController_1.getCard);
router.put('/:id', cardController_1.updateCard);
router.delete('/:id', cardController_1.deleteCard);
// AI card generation
router.post('/generate', cardController_1.generateCards);
router.post('/bulk-generate', cardController_1.bulkGenerateCards);
exports.default = router;
//# sourceMappingURL=cards.js.map