"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const topicController_1 = require("../controllers/topicController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes (read-only)
router.get('/topics', topicController_1.getTopics);
router.get('/topics/:id', topicController_1.getTopic);
router.get('/subtopics', topicController_1.getSubtopics);
router.get('/subtopics/:id', topicController_1.getSubtopic);
// Protected routes (require authentication)
router.use(auth_1.authenticateToken);
// Topic management
router.post('/topics', topicController_1.createTopic);
router.put('/topics/:id', topicController_1.updateTopic);
router.delete('/topics/:id', topicController_1.deleteTopic);
// Subtopic management
router.post('/subtopics', topicController_1.createSubtopic);
router.put('/subtopics/:id', topicController_1.updateSubtopic);
router.delete('/subtopics/:id', topicController_1.deleteSubtopic);
exports.default = router;
//# sourceMappingURL=topics.js.map