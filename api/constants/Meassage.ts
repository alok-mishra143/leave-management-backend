export const errorMeassage = {
  serverError: {
    internalServerError: "Internal server error",
    unauthorized: "Unauthorized",
    unknownError: "Unknown error",
    tokenNotFound: "Token not found",
    tokenNotValid: "Token not valid",
  },
  userError: {
    userExists: "User already exists",
    userRoleNotFound: "User role not found",
    invalidInput: "Invalid input",
    userNotFound: "User not found",
    invalidPassword: "Invalid password",
    loginSucessFull: "Login successful",
    logoutSucessFull: "Logout successful",
    userCreated: "User created",
    userUpdated: "User updated sucessfully",
    studentCreated: "Student created",
    deletedSucessfully: "Deleted sucessfully",
    invalidOtp: "Invalid OTP",
    otpSend: "OTP send to your email",
    passwordChanged: "Password changed",
    passwordNotMatch: "Password not match",
    passwordUpdated: "Password updated",
    passwordNotChanged: "Password not changed",
    otpExpired: "OTP expired",
  },
  leaveError: {
    leaveNotFound: "Leave not found",
    leaveCreated: "Leave created",
    leaveUpdated: "Leave updated",
    leaveDeleted: "Leave deleted",
    leaveIdRequire: "Leave ID is required",
    invalidLeaveType: "Invalid leave type",
  },
  paginationError: {
    invalidPagination: "Invalid pagination parameters",
  },
  statusCodes: {
    ok: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    conflict: 409,
    internalServerError: 500,
  },
};

export const enum Role {
  ADMIN = "ADMIN",
  STUDENT = "STUDENT",
  STAFF = "STAFF",
  HOD = "HOD",
}

export const enum RoleId {
  ADMIN = "1",
  HOD = "2",
  STAFF = "3",
  STUDENT = "4",
}
