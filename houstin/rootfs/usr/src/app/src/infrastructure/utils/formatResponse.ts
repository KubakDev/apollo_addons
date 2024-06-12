import { internalResponse } from "./interfaces";
export function formatErrorResponse(
  message: string,
  code: string
): internalResponse {
  return {
    success: false,
    result: null,
    error: {
      message,
      code,
    },
  };
}

export function formatSuccessResponse(result: any): internalResponse {
  return {
    success: true,
    result: result,
    error: { message: "", code: "" },
  };
}
