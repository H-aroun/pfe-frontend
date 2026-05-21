const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
interface User {
    id?: string | number
    email: string
    firstName?: string
    lastName?: string
    dateInscription?: Date
    role : {id: number}
}


export const signUp = async (data: any) => {
  try {
    console.log("dataaaa ==> ", data);

    const response = await fetch('http://localhost:3001/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }

    return result;

  } catch (error) {
    console.log(error);
    throw error;
  }
};
