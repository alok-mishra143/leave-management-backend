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
