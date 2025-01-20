import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Importing Axios
import { ToastContainer, toast } from 'react-toastify';

const Profile = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegistration1 = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('email', email);
        formData.append('username', username);
        formData.append('password', password);

        console.log('FormData before submission:', formData); // Log the FormData object

        try {
            const response = await axios.post('http://localhost:8000/api/v1/users/login', formData);
            toast.success("User login successful!");

            // No need to access tokens from cookies
            // Tokens are stored in cookies and will be sent automatically with requests

            setTimeout(() => {
                navigate('/update');
            }, 3000);
        } catch (error) {
            console.error('Login error:', error); // Log the entire error object
            if (error.response) {
                console.log('Error response data:', error.response.data); // Log the error response data
                if (error.response.status === 404) {
                    toast.error("User not Found !!");
                } else if (error.response.status === 401) {
                    toast.error("Password incorrect");
                }
            } else {
                toast.error("Something went wrong, try Again !!");
            }
        }
    };

    return (
        <div>
            <form onSubmit={handleRegistration1}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            <ToastContainer />
        </div>
    );
};

export default Profile;
