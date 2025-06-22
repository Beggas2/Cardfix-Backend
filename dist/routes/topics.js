"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const topicController_1 = require("../controllers/topicController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Topic CRUD
router.post('/', topicController_1.createTopic);
router.get('/', topicController_1.getTopics);
router.get('/:id', topicController_1.getTopic);
router.put('/:id', topicController_1.updateTopic);
router.delete('/:id', topicController_1.deleteTopic);
// Topic statistics
router.get('/:id/stats', topicController_1.getTopicStats);
exports.default = router;
//# sourceMappingURL=topics.js.map