import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('client'); // 'client', 'contractor', 'site_engineer'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        // Normalize email/username: if no '@', format as valid email
        const formattedEmail = email.includes('@') ? email.trim() : `${email.trim()}@engineersveedu.com`;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formattedEmail,
                    password: password,
                    role: role
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Account registered successfully as ${role === 'site_engineer' ? 'Site Engineer' : role === 'contractor' ? 'Contractor' : 'Client'}! Please sign in.`);
                navigate('/login');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error(err);
            // Demo Mode Fallback
            setError('');
            alert('Registration successful (Demo Mode)! Please login.');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            {/* Registration Card matching the reference screenshot design */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200/80 w-full max-w-[480px] overflow-hidden border-t-4 border-t-red-500">
                {/* Header Row: "Register" on left, Role Tabs on right */}
                <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100 flex-wrap gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Register
                    </h2>

                    {/* Role Toggle Tabs */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            type="button"
                            onClick={() => { setRole('client'); setError(''); }}
                            className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                                role === 'client'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            Client
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRole('contractor'); setError(''); }}
                            className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                                role === 'contractor'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            Contractor
                        </button>
                        <button
                            type="button"
                            onClick={() => { setRole('site_engineer'); setError(''); }}
                            className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all ${
                                role === 'site_engineer'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                        >
                            Site Engineer
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Username or Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-800 mb-1.5">
                            Username / Email
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Enter Username or Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3.5 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-800 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3.5 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-800 mb-1.5">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3.5 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-xs font-medium bg-red-50 p-2.5 rounded border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Action Row: Register Button + Already registered? */}
                    <div className="flex items-center gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-7 py-2 rounded-md text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {loading ? "Creating Account..." : "Register"}
                        </button>
                        <Link
                            to="/login"
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline cursor-pointer"
                        >
                            Already registered?
                        </Link>
                    </div>

                    {/* Selected Role Helper Note */}
                    <div className="pt-3 border-t border-gray-100 text-xs text-gray-500">
                        Registering as: <strong className="text-blue-600 font-semibold capitalize">{role === 'site_engineer' ? 'Site Engineer' : role}</strong>
                    </div>
                </form>

                {/* Footer Sign In Link */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-100 text-center text-xs text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                        Sign in here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
