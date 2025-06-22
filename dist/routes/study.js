"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studyController_1 = require("../controllers/studyController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Study session management
router.post('/review', studyController_1.reviewCard);
router.get('/cards-for-review', studyController_1.getCardsForReview);
router.get('/learning-progress', studyController_1.getLearningProgress);
router.get('/history', studyController_1.getStudyHistory);
router.get('/next-review-card', studyController_1.getNextReviewCard);
exports.default = router;
//# sourceMappingURL=study.js.map