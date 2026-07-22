import React, { useState } from 'react';
import { HelpCircle, FileText, ChevronDown, ChevronUp, Clock, Info } from 'lucide-react';

const Support = () => {
    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
        {
            question: "How do I request a quote?",
            answer: "You can request a quote by visiting our Contact page and filling out the inquiry form, or by calling our office directly."
        },
        {
            question: "What areas do you serve?",
            answer: "We primarily serve the greater metropolitan area and surrounding suburbs. Please contact us for specific location inquiries."
        },
        {
            question: "Are you licensed and insured?",
            answer: "Yes, we are fully licensed and carry comprehensive liability and workers' compensation insurance."
        },
        {
            question: "How long does a typical project take?",
            answer: "Project timelines vary greatly depending on scope and complexity. We provide detailed schedules during the consultation phase."
        },
        {
            question: "Do you offer financing options?",
            answer: "We work with several financial partners to offer flexible payment plans for qualified clients."
        }
    ];

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="bg-primary text-white py-16 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Support Center</h1>
                    <p className="text-xl max-w-2xl mx-auto opacity-90">
                        Find answers to common questions and get the help you need.
                    </p>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-3xl font-bold text-center mb-12 text-primary">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all duration-300">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors text-left focus:outline-none"
                                >
                                    <span className="font-semibold text-gray-800 text-lg">{faq.question}</span>
                                    {openFaq === index ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-gray-500" />}
                                </button>
                                {openFaq === index && (
                                    <div className="p-6 bg-white animate-fade-in border-t border-gray-100">
                                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Help & Resources */}
            <section className="py-16 bg-bg-light">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-xl shadow-md border-t-4 border-accent hover:shadow-lg transition-shadow">
                            <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
                                <FileText size={28} className="text-accent" /> Customer Guides
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Download our comprehensive guides on home maintenance, renovation planning, and more.
                            </p>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-center gap-2 text-primary hover:text-accent cursor-pointer transition-colors">
                                    <ChevronDown size={16} className="rotate-[-90deg]" /> Home Maintenance Checklist (PDF)
                                </li>
                                <li className="flex items-center gap-2 text-primary hover:text-accent cursor-pointer transition-colors">
                                    <ChevronDown size={16} className="rotate-[-90deg]" /> Renovation Budget Planner (Excel)
                                </li>
                            </ul>
                            <button className="text-accent font-bold hover:underline">View All Resources &rarr;</button>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-md border-t-4 border-primary hover:shadow-lg transition-shadow">
                            <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
                                <HelpCircle size={28} className="text-primary" /> Need More Help?
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Can't find what you're looking for? Our support team is here to assist you.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 text-gray-700">
                                    <Clock size={20} className="text-gray-400" />
                                    <span>Mon - Fri: 8:00 AM - 6:00 PM EST</span>
                                </div>
                                <div className="flex items-center gap-4 text-gray-700">
                                    <Info size={20} className="text-gray-400" />
                                    <span>Submit a ticket for non-urgent issues.</span>
                                </div>
                            </div>
                            <a href="/contact" className="mt-8 inline-block bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-md">
                                Contact Support
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Support;
