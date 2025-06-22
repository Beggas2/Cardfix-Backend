"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const performanceController_1 = require("../controllers/performanceController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Performance routes
router.get('/overall', performanceController_1.getOverallPerformance);
router.get('/topic', performanceController_1.getPerformanceByTopic);
router.get('/subtopic', performanceController_1.getPerformanceBySubtopic);
router.get('/daily', performanceController_1.getDailyPerformance);
exports.default = router;
//# sourceMappingURL=performance.js.map