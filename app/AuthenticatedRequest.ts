import { Request } from "express";
export interface AuthenticatedRequest extends Request {
  userId?: string; // Add your custom property here
}
