import 'express';

declare global {
  namespace Express {
    interface UserPayload {
      id: number;
      role: string;
      department_id?: number;
      [key: string]: any;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
