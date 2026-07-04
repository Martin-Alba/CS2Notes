export type PasswordCheck = {
  key: string;
  label: string;
  met: boolean;
};

export function validatePassword(password: string): {
  valid: boolean;
  checks: PasswordCheck[];
} {
  const checks: PasswordCheck[] = [
    { key: "minLength", label: "minLength", met: password.length >= 8 },
    { key: "uppercase", label: "uppercase", met: /[A-Z]/.test(password) },
    { key: "lowercase", label: "lowercase", met: /[a-z]/.test(password) },
    { key: "number", label: "number", met: /[0-9]/.test(password) },
    { key: "special", label: "special", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) },
  ];
  return {
    valid: checks.every((c) => c.met),
    checks,
  };
}
