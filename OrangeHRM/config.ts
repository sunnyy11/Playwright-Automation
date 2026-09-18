function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const credentials = {
  username: requiredEnvironmentVariable('ADMIN_USERNAME'),
  password: requiredEnvironmentVariable('ADMIN_PASSWORD'),
};

export const employeeSearchTerm = requiredEnvironmentVariable('EMPLOYEE_SEARCH_TERM');
export const employeeName = requiredEnvironmentVariable('EMPLOYEE_NAME');
