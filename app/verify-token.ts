import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest } from "./AuthenticatedRequest";

// Middleware function to verify JWT token
export const verifyToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const auth = req.headers.authorization?.split(" ");
  if (!auth || auth[0] !== "Bearer") {
    return res
      .status(401)
      .json({ message: "Authentication failed (no token or Bearer)" });
  }
  const token = auth[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication failed (no token)" });
  }

  // Verify and decode the token
  jwt.verify(token, process.env.JWT_SECRET!, (err, decoded: any) => {
    if (err) {
      return res
        .status(401)
        .json({ message: "Authentication failed (invalid token)", err });
    }

    // Attach the decoded user information to the request
    req.userId = decoded.userId;
    next(); // Continue to the next middleware or route
  });
};
