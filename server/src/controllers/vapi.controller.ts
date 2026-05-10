import type { Request, Response, NextFunction } from "express";
import User from "../models/user.model.ts";
import { initiateOutboundCall } from "../services/vapi.service.ts";

// POST /api/vapi/call
export const startCall = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneNumber, preferredCourse } = req.body;

    if (!phoneNumber) {
      res.status(400).json({
        success: false,
        message: "Phone number is required.",
      });
      return;
    }

    const userId = (req as any).user?.userId;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      });
      return;
    }

    const result = await initiateOutboundCall({
      phoneNumber,
      userName: user.name,
      userEmail: user.email,
      preferredCourse,
    });

    res.status(200).json({
      success: true,
      data: {
        callId: result.callId,
        status: result.status,
        message: "Call initiated successfully. You will receive a call shortly.",
      },
    });
  } catch (error) {
    next(error);
  }
};