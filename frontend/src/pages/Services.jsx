import React from 'react';
import { Home, Building, Hammer, LayoutDashboard, Star } from 'lucide-react';

const Services = () => {
    const services = [
        {
            title: "Residential Construction",
            icon: Home,
            description: "From custom home builds to comprehensive renovations, we bring your dream home to life with precision and care.",
            features: ["Custom Home Design", "New Builds", "Energy Efficient Homes"]
        },
        {
            title: "Commercial Construction",
            icon: Building,
            description: "We provide end-to-end commercial construction services for offices, retail spaces, and mixed-use developments.",
            features: ["Office Buildouts", "Retail Spaces", "Warehouses"]
        },
        {
            title: "Renovation & Remodeling",
            icon: Hammer,
            description: "Transform your existing space with our expert renovation services. We handle everything from concept to completion.",
            features: ["Kitchen Remodels", "Bathroom Renovations", "Full Home Makeovers"]
        },
        {
            title: "Project Management",
            icon: LayoutDashboard,
            description: "Our experienced project managers ensure your project stays on schedule, within budget, and meets all quality standards.",
            features: ["Timeline Management", "Budget Control", "Quality Assurance"]
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-primary to-blue-900 text-white py-16 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
                    <p className="text-xl max-w-2xl mx-auto opacity-90">
                        Comprehensive construction solutions tailored to your unique needs.
                    </p>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {services.map((service, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-transform hover:-translate-y-1 border-t-4 border-accent">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="bg-accent/10 p-4 rounded-full">
                                        <service.icon size={32} className="text-accent" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-primary">{service.title}</h3>
                                </div>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    {service.description}
                                </p>
                                <ul className="space-y-2">
                                    {service.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-center gap-2 text-sm text-gray-500">
                                            <Star size={16} className="text-yellow-400 fill-current" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-primary text-white py-16 text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-6">Start Your Next Project Today</h2>
                    <p className="max-w-xl mx-auto mb-8 text-blue-100">
                        Contact us to discuss your vision and receive a complimentary quote.
                    </p>
                    <a href="/contact" className="inline-block bg-accent text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg">
                        Get a Free Quote
                    </a>
                </div>
            </section>
        </div>
    );
};

export default Services;
