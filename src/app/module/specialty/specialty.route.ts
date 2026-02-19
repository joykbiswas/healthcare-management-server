import { Router } from "express";
import { SpecialtyController } from "./specialty.controller";

const router = Router();

router.get('/', SpecialtyController.createSpecialty);
router.post('/', SpecialtyController.getAllSpecialties);
router.delete('/:id', SpecialtyController.deleteSpecialty);

export const SpecialtyRouters = router;