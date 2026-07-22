import React, { useState } from 'react';
import { Check } from 'lucide-react';

const Projects = () => {
    const categories = ["All", "Residential", "Commercial", "Renovation"];
    const [selectedCategory, setSelectedCategory] = useState("All");

    const projects = [
        {
            title: "Modern Office Buildout",
            category: "Commercial",
            image: "/projects/commercial.jpeg",
            description: "A 5,000 sq ft modern open-plan office space with custom glass partitions."
        },
        {
            title: "Luxury Hillside Home",
            category: "Residential",
            image: "/projects/luxury.jpeg",
            description: "Custom-designed 4-bedroom home featuring sustainable materials and panoramic views."
        },
        {
            title: "Foundation Reinforcement",
            category: "Renovation",
            image: "/projects/foundation.jpeg",
            description: "Structural reinforcement and foundation repair for a historic building."
        },
        {
            title: "Retail Storefront",
            category: "Commercial",
            image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1000",
            description: "High-visibility retail space renovation with custom lighting and display units."
        },
        {
            title: "Kitchen Remodel",
            category: "Renovation",
            image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1000",
            description: "Complete kitchen overhaul with custom cabinetry and quartz countertops."
        }
    ];

    const filteredProjects = selectedCategory === "All"
        ? projects
        : projects.filter(p => p.category === selectedCategory);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="bg-primary text-white py-16 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Portfolio</h1>
                    <p className="text-xl max-w-2xl mx-auto opacity-90">
                        Explore our diverse range of successful projects.
                    </p>
                </div>
            </section>

            {/* Filter Section */}
            <section className="py-8 bg-white border-b sticky top-[72px] z-10 shadow-sm">
                <div className="container mx-auto px-4 flex flex-wrap justify-center gap-4">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${selectedCategory === cat
                                ? 'bg-accent text-white shadow-md scale-105'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat}
                            {selectedCategory === cat && <Check size={16} />}
                        </button>
                    ))}
                </div>
            </section>

            {/* Projects Grid */}
            <section className="py-16 bg-gray-50 flex-grow">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProjects.map((project, idx) => (
                            <div key={idx} className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="relative overflow-hidden h-64">
                                    <img
                                        src={project.image}
                                        alt={project.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 right-4 bg-primary/90 text-white text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-sm">
                                        {project.category}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">
                                        {project.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        {project.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredProjects.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            <p className="text-xl">No projects found in this category.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Projects;
