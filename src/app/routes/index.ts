import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";

// import { DoctorRoutes } from "../module/doctor/doctor.route";

const router = Router();

router.use("/auth", AuthRoutes);
// router.use("/users",UserRoutes)

export const IndexRoutes = router;