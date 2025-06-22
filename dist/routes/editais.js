"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const editalController_1 = require("../controllers/editalController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Edital management
router.post('/:contestId/upload', upload_1.uploadSingle, editalController_1.uploadEdital);
router.post('/:contestId/process', editalController_1.processEdital);
router.get('/:contestId/status', editalController_1.getProcessingStatus);
router.get('/:contestId/file', editalController_1.getEditalFile);
router.delete('/:contestId', editalController_1.deleteEdital);
exports.default = router;
//# sourceMappingURL=editais.js.map