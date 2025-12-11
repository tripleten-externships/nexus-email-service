export function getAuthError(code: string): string {
  const errorMap: Record<string, string> = {
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'The email address is not valid.',
    'auth/email-already-in-use': 'This email is already registered.',
  };

  return errorMap[code] || 'An unexpected error occurred. Please try again.';
}
