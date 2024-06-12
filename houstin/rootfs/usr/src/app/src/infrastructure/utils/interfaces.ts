export interface internalResponse {
  success: boolean;
  error: { message: string; code: string };
  result: any;
}

export interface RequestDataString {
  data: string;
}
export interface RequestDataUser {
  username: string;
  password: string;
  roleType: "User" | "Owner";
}

export interface RequestDataUserWithoutRoleType {
  username: string;
  password: string;
}

export interface RequestDataUserDelete {
  username: string;
}

export interface Request {
  command: "POST" | "GET" | "create_user" | "delete_user" | "update_token"; // Extend this as necessary
  data:
    | RequestDataString
    | RequestDataUser
    | RequestDataUserDelete
    | RequestDataUserWithoutRoleType; // Extend this as necessary
  hasResult: boolean;
}

export interface supervisorResponse {
  id: string;
  type: string;
  success: boolean;
  result: any; // Adjust the type of result based on your actual response structure
  error: any;
}

export interface supervisorPayload {
  type: string;
  method: any;
  endpoint: string;
}
