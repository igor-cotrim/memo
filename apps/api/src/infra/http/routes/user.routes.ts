import { Router } from "express";
import type { Response, NextFunction } from "express";

import type { AuthRequest } from "../middleware/auth";
import type { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { UpdateProfileUseCase } from "../../../usecases/UpdateProfileUseCase";
import { ChangePasswordUseCase } from "../../../usecases/ChangePasswordUseCase";

export function createUserRoutes(userRepo: IUserRepository): Router {
  const router = Router();

  const updateProfile = new UpdateProfileUseCase(userRepo);
  const changePassword = new ChangePasswordUseCase(userRepo);

  router.put(
    "/profile",
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        const user = await updateProfile.execute(req.userId!, req.body);
        res.json({ user });
      } catch (err) {
        next(err);
      }
    },
  );

  router.put(
    "/password",
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        await changePassword.execute(req.userId!, req.body);
        res.json({ message: "Password updated" });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
