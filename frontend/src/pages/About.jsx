import React from 'react';
import { ShieldCheck, Award, Users } from 'lucide-react';

const About = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="bg-primary text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">About Engineers Veedu</h1>
                    <p className="text-xl max-w-2xl mx-auto">
                        Building trust through quality construction and engineering excellence since 2015.
                    </p>
                </div>
            </section>

            {/* Mission & Values */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="md:w-1/2">
                            <h2 className="text-3xl font-bold text-primary mb-6">Our Mission</h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                To deliver superior construction solutions that exceed client expectations,
                                tailored to their unique needs and budgets. We strive to build not just
                                structures, but lasting relationships based on integrity and transparency.
                            </p>
                            <h2 className="text-3xl font-bold text-primary mb-6">Core Values</h2>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <ShieldCheck className="text-accent mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-gray-800">Integrity</h4>
                                        <p className="text-sm text-gray-600">We conduct our business with the highest standards of honesty and fairness.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Award className="text-accent mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-gray-800">Quality</h4>
                                        <p className="text-sm text-gray-600">We never compromise on the quality of our materials or workmanship.</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Users className="text-accent mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-gray-800">Collaboration</h4>
                                        <p className="text-sm text-gray-600">We work closely with clients, architects, and subcontractors to ensure success.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="md:w-1/2">
                            <img
                                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1000"
                                alt="Construction Team"
                                className="rounded-lg shadow-xl w-full h-[400px] object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-16 bg-bg-light">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-primary mb-4">Meet Our Team</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto mb-12">
                        Our team of experienced engineers and project managers is dedicated to making your vision a reality.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Rajesh Kumar", role: "Chief Engineer", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400" },
                            { name: "Sarah Williams", role: "Project Manager", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400" },
                            { name: "Michael Chen", role: "Lead Architect", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400" }
                        ].map((member, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <img
                                    src={member.img}
                                    alt={member.name}
                                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-sm"
                                />
                                <h3 className="text-xl font-bold text-primary">{member.name}</h3>
                                <p className="text-accent font-medium">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
