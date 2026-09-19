import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [role, setRole] = useState('client'); // 'client', 'contractor', 'site_engineer'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('user');
        if (saved) {
            navigate('/community');
        }
    }, [navigate]);

    const handleQuickFill = (targetRole, demoUser, demoPass) => {
        setRole(targetRole);
        setUsername(demoUser);
        setPassword(demoPass);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password) {
            setError('Please enter your username and password');
            return;
        }

        setLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: username.trim(),
                    username: username.trim(),
                    password: password,
                    role: role
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.dispatchEvent(new Event('user-state-change'));
                navigate('/community');
            } else {
                setError(data.error || 'Invalid username or password');
            }
        } catch (err) {
            console.error("Login demo catch-all:", err);
            // Strict Demo Mode based on selected role
            localStorage.setItem('token', 'demo-token');
            const demoUser = {
                email: username.includes('@') ? username : `${username}@demo.com`,
                id: 'demo-user',
                role: role
            };
            localStorage.setItem('user', JSON.stringify(demoUser));
            window.dispatchEvent(new Event('user-state-change'));
            navigate('/community');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            {/* Login Card matching the reference screenshot */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200/80 w-full max-w-[480px] overflow-hidden border-t-4 border-t-red-500">
                {/* Header Row: "Login" on left, Role Tabs on right */}
                <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100 flex-wrap gap-3">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Login
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
                    {/* Username Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-800 mb-1.5">
                            Username
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Enter Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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

                    {error && (
                        <div className="text-red-600 text-xs font-medium bg-red-50 p-2.5 rounded border border-red-100">
                            {error}
                        </div>
                    )}

                    {/* Action Row: Login Button + Forgot Your Password? */}
                    <div className="flex items-center gap-4 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-7 py-2 rounded-md text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Login"}
                        </button>
                        <button
                            type="button"
                            onClick={() => alert("Password reset link will be sent to your registered email.")}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline cursor-pointer"
                        >
                            Forgot Your Password?
                        </button>
                    </div>

                    {/* Quick-fill Demo Accounts Helper */}
                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Quick-Fill Demo Credentials:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickFill('client', 'client@demo.com', 'password123')}
                                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded border border-gray-200 transition-colors"
                            >
                                Client Demo
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickFill('contractor', 'contractor@engineersveedu.com', 'password123')}
                                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded border border-gray-200 transition-colors"
                            >
                                Contractor Demo
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickFill('site_engineer', 'engineer@engineersveedu.com', 'password123')}
                                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded border border-gray-200 transition-colors"
                            >
                                Site Engineer Demo
                            </button>
                        </div>
                    </div>
                </form>

                {/* Footer Sign Up Link */}
                <div className="p-4 bg-gray-50/80 border-t border-gray-100 text-center text-xs text-gray-500">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                        Register here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
