import type { Request, Response, NextFunction } from "express";
import { getRAGResponse } from "../services/rag.service.ts";

// POST /api/chat/message
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      res.status(400).json({
        success: false,
        message: "Message is required.",
      });
      return;
    }

    const response = await getRAGResponse(message.trim());

    res.status(200).json({
      success: true,
      data: {
        response,
      },
    });
  } catch (error) {
    next(error);
  }
};