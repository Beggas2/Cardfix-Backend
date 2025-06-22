"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subtopicController_1 = require("../controllers/subtopicController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Subtopic CRUD
router.post('/', subtopicController_1.createSubtopic);
router.get('/', subtopicController_1.getSubtopics);
router.get('/:id', subtopicController_1.getSubtopic);
router.put('/:id', subtopicController_1.updateSubtopic);
router.delete('/:id', subtopicController_1.deleteSubtopic);
// Subtopic statistics
router.get('/:id/stats', subtopicController_1.getSubtopicStats);
exports.default = router;
//# sourceMappingURL=subtopics.js.map