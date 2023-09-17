declare module Express {
  export interface Request {
    userId?: string; // Add your custom property here
  }

  export interface Response {
    userId?: string; // Add your custom property here
  }
}
