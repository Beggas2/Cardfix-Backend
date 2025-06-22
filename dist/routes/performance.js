"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const performanceController_1 = require("../controllers/performanceController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Get overall performance across all contests
router.get('/overall', performanceController_1.getOverallPerformance);
// Get performance for a specific contest
router.get('/contest/:contestId', performanceController_1.getContestPerformance);
// Get performance for a specific topic
router.get('/topic/:topicId', performanceController_1.getTopicPerformance);
// Get performance for a specific subtopic
router.get('/subtopic/:subtopicId', performanceController_1.getSubtopicPerformance);
// Compare performance across multiple contests
router.post('/compare', performanceController_1.getPerformanceComparison);
// Get study insights and recommendations
router.get('/insights', performanceController_1.getStudyInsights);
exports.default = router;
//# sourceMappingURL=performance.js.map