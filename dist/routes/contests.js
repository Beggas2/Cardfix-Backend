"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contestController_1 = require("../controllers/contestController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Contest CRUD
router.post('/', contestController_1.createContest);
router.get('/', contestController_1.getContests);
router.get('/:id', contestController_1.getContest);
router.put('/:id', contestController_1.updateContest);
router.delete('/:id', contestController_1.deleteContest);
// Contest topics
router.post('/:contestId/topics', contestController_1.addTopicToContest);
router.delete('/:contestId/topics/:topicId', contestController_1.removeTopicFromContest);
exports.default = router;
//# sourceMappingURL=contests.js.map