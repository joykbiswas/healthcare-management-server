import { Router } from "express";
import { SpecialtyRouters } from "../module/specialty/specialty.route";

const router = Router();
router.use("/specialties", SpecialtyRouters)
export const IndexRoutes = router;