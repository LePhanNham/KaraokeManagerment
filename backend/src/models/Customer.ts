export interface Customer {
    id: number;
    username: string;
    password: string;
    name: string | null;
    email: string;
    phone_number: string | null;
    role: 'user' | 'admin';
    created_at: Date;
    updated_at: Date;
}

export default Customer;