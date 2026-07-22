import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        projectType: 'Residential',
        message: ''
    });
    const [status, setStatus] = useState('idle');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('sending');
        setTimeout(() => {
            setStatus('success');
            setFormData({ name: '', email: '', phone: '', projectType: 'Residential', message: '' });
        }, 1500);
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="bg-primary text-white py-16 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
                    <p className="text-xl max-w-2xl mx-auto opacity-90">
                        Get in touch for appointments, quotes, or general inquiries.
                    </p>
                </div>
            </section>

            {/* Contact Info & Form */}
            <section className="py-16 bg-gray-50 flex-grow">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white rounded-2xl shadow-xl overflow-hidden">

                        {/* Contact Form */}
                        <div className="p-8 md:p-12">
                            <h2 className="text-2xl font-bold text-primary mb-6">Send Us a Message</h2>
                            {status === 'success' ? (
                                <div className="bg-green-100 text-green-700 p-6 rounded-lg text-center animate-fade-in">
                                    <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                                    <p>We'll get back to you within 24 hours.</p>
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="mt-4 text-primary font-bold hover:underline"
                                    >
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent outline-none transition-shadow"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent outline-none transition-shadow"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent outline-none transition-shadow"
                                                placeholder="(555) 123-4567"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
                                            <select
                                                name="projectType"
                                                value={formData.projectType}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent outline-none transition-shadow"
                                            >
                                                <option>Residential</option>
                                                <option>Commercial</option>
                                                <option>Renovation</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows="4"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent outline-none transition-shadow resize-none"
                                            placeholder="Tell us about your project..."
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'sending'}
                                        className="w-full bg-accent text-white font-bold py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {status === 'sending' ? 'Sending...' : (
                                            <>
                                                Send Message <Send size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Contact Info Side */}
                        <div className="bg-primary text-white p-8 md:p-12 flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-white/10 p-3 rounded-full">
                                            <MapPin className="text-accent" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Our Office</h4>
                                            <p className="text-gray-300">123 Construction Ave, Building B<br />Cityville, State 12345</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-white/10 p-3 rounded-full">
                                            <Phone className="text-accent" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Phone</h4>
                                            <p className="text-gray-300">+1 (555) 123-4567<br />Mon-Fri, 8am - 6pm</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-white/10 p-3 rounded-full">
                                            <Mail className="text-accent" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Email</h4>
                                            <p className="text-gray-300">info@engineersveedu.com<br />support@engineersveedu.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Embed Map Placeholder */}
                            <div className="mt-8 rounded-lg overflow-hidden h-64 bg-gray-300 relative shadow-inner">
                                <iframe
                                    title="Office Location"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15762.6738947934!2d76.9538421!3d11.0018115!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba859af2f971cb5%3A0x2fc1c81e183ed282!2sCoimbatore%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1645000000000!5m2!1sen!2sin"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Contact;
