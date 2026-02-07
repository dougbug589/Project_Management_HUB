import { NextApiRequest, NextApiResponse } from "next"
import { ApiError, logError } from "./errors"

export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void | any>

export function apiHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      return await handler(req, res)
    } catch (error) {
      logError(error, `${req.method} ${req.url}`)

      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          code: error.code,
        })
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error",
      })
    }
  }
}

export function successResponse<T>(
  res: NextApiResponse,
  data: T,
  statusCode: number = 200
) {
  res.status(statusCode).json({
    success: true,
    data,
  })
}

export function errorResponse(
  res: NextApiResponse,
  message: string,
  statusCode: number = 400,
  code?: string
) {
  res.status(statusCode).json({
    success: false,
    message,
    code,
  })
}

export function paginatedResponse<T>(
  res: NextApiResponse,
  data: T[],
  total: number,
  page: number,
  pageSize: number
) {
  const totalPages = Math.ceil(total / pageSize)
  
  res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  })
}
