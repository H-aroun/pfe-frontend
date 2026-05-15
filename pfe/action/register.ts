const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
interface User {
    id?: string | number
    email: string
    firstName?: string
    lastName?: string
    dateInscription?: Date
    role : {id: number}
}


export async function signUp(data: User) {
    try {
        
        console.log("dataaaa ==> ", data);
        
  const response = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
})

if (!response.ok) {
    throw new Error('Login failed')
}

const result = (await response.json()) as User
console.log(result);

return result
} catch (error) {
    console.error(error);
    
}
}
