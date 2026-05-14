export async function login(email: string, password: string) {
    console.log('Attempting login with email:', email)
    console.log('Attempting login with password:', password)
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error('Login failed')
  }

  return response.json()
}
