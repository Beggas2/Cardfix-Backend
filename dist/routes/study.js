"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studyController_1 = require("../controllers/studyController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Study session management
router.get('/session/:contestId', studyController_1.getStudySession);
router.post('/review', studyController_1.reviewCard);
router.get('/stats/:contestId', studyController_1.getStudyStatsController);
// Card study management
router.post('/cards', studyController_1.addCardToStudy);
router.delete('/cards/:cardId', studyController_1.removeCardFromStudy);
exports.default = router;
//# sourceMappingURL=study.js.map