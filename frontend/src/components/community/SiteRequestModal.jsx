import React, { useState } from 'react';
import { X, Building2, MapPin, DollarSign, CheckCircle2, Send, Info } from 'lucide-react';

const BUILDING_TYPES = [
    'Residential Villa / Individual House',
    'Apartment / Multi-Storey RCC',
    'Commercial Complex / Office Space',
    'Industrial Warehouse / Factory Shed',
    'Renovation & Remodeling',
    'Foundation & Structural Restoration',
    'Other Construction'
];

const SiteRequestModal = ({ engineer, currentUser, onClose, onSubmitSuccess }) => {
    const [formData, setFormData] = useState({
        name: currentUser?.name || currentUser?.email?.split('@')[0] || '',
        siteAddress: '',
        amount: '',
        buildingType: 'Residential Villa / Individual House',
        requiredDetails: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!engineer) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.name.trim()) {
            setErrorMsg('Please enter your name.');
            return;
        }
        if (!formData.siteAddress.trim()) {
            setErrorMsg('Please enter the site address.');
            return;
        }
        if (!formData.amount.trim()) {
            setErrorMsg('Please enter the project budget / amount.');
            return;
        }
        if (!formData.buildingType.trim()) {
            setErrorMsg('Please select a building type.');
            return;
        }
        if (!formData.requiredDetails.trim()) {
            setErrorMsg('Please enter some required details in the text area.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (onSubmitSuccess) {
                const payload = {
                    name: formData.name.trim(),
                    siteAddress: formData.siteAddress.trim(),
                    amount: formData.amount.trim(),
                    buildingType: formData.buildingType,
                    requiredDetails: formData.requiredDetails.trim(),
                    // Backwards-compatible aliases
                    siteDetails: formData.requiredDetails.trim(),
                    anotherDetails: formData.requiredDetails.trim()
                };
                await onSubmitSuccess(payload, engineer);
            }
            setIsSuccess(true);
        } catch (err) {
            console.error('Error submitting site request:', err);
            setErrorMsg('Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isContractor = engineer.role === 'contractor' || engineer.role === 'builder';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div 
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl max-h-[92vh] overflow-y-auto relative animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Close */}
                <div className="bg-gradient-to-r from-primary to-blue-800 text-white p-5 rounded-t-2xl relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full border-2 border-white/50 overflow-hidden bg-white flex-shrink-0">
                            <img
                                src={engineer.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                alt={engineer.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 text-blue-100 px-2.5 py-0.5 rounded-full">
                                {isContractor ? 'Turnkey Contractor Request' : 'Site Engineer Request'}
                            </span>
                            <h3 className="text-lg font-bold text-white leading-snug mt-1">
                                Request {isContractor ? 'Contractor ' : ''}{engineer.name}
                            </h3>
                            <p className="text-xs text-blue-100 line-clamp-1">
                                {engineer.headline || `${engineer.company || 'Engineers Veedu Partner'}`}
                            </p>
                        </div>
                    </div>
                </div>

                {isSuccess ? (
                    /* Success Confirmation State */
                    <div className="p-8 text-center space-y-4 animate-fade-in">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <CheckCircle2 size={36} />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">
                            Request Submitted to {isContractor ? 'Contractor' : 'Engineer'}!
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                            Your construction project request for <strong>{formData.buildingType}</strong> at <strong>{formData.siteAddress}</strong> has been transmitted directly to <strong>{engineer.name}</strong>.
                        </p>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-left max-w-md mx-auto space-y-1.5 text-gray-700">
                            <div><strong>Name:</strong> {formData.name}</div>
                            <div><strong>Site Address:</strong> {formData.siteAddress}</div>
                            <div><strong>Amount:</strong> {formData.amount}</div>
                            <div><strong>Building Type:</strong> {formData.buildingType}</div>
                            <div><strong>Required Details:</strong> {formData.requiredDetails}</div>
                        </div>
                        <button
                            onClick={onClose}
                            className="mt-4 px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:bg-blue-800 transition-colors shadow-sm"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    /* Request Form */
                    <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                        {errorMsg && (
                            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium">
                                {errorMsg}
                            </div>
                        )}

                        <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl flex items-start gap-2 text-blue-900">
                            <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed">
                                {isContractor 
                                    ? 'Submit your turnkey construction parameters below. The general contractor will review your building scope, prepare cost estimates, and contact you directly.'
                                    : 'Submit your site details and specifications below. The site engineer will review your project parameters and contact you to schedule on-site inspection or consultation.'
                                }
                            </p>
                        </div>

                        {/* 1. Name */}
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your name / client name"
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                                required
                            />
                        </div>

                        {/* 2. Site Address */}
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">
                                Site Address <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="siteAddress"
                                    value={formData.siteAddress}
                                    onChange={handleChange}
                                    placeholder="e.g. Plot 42, Avinashi Road, Peelamedu, Coimbatore - 641004"
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>
                        </div>

                        {/* 3. Amount */}
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">
                                Amount <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="e.g. ₹35,00,000 or $45,000"
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                                    required
                                />
                            </div>
                        </div>

                        {/* 4. Building Type */}
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">
                                Building Type <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select
                                    name="buildingType"
                                    value={formData.buildingType}
                                    onChange={handleChange}
                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                                    required
                                >
                                    {BUILDING_TYPES.map((type, idx) => (
                                        <option key={idx} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 5. Text area for some required details */}
                        <div>
                            <label className="block font-bold text-gray-700 mb-1">
                                Required Details <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="requiredDetails"
                                rows={4}
                                value={formData.requiredDetails}
                                onChange={handleChange}
                                placeholder="Enter some required details (e.g. plot area, floor requirements, soil conditions, architectural guidelines, structural inspections, material choices, or timeline)..."
                                className="w-full p-2.5 bg-white border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                                required
                            />
                            <span className="text-[10px] text-gray-400 mt-0.5 block">
                                Enter key specifications and required details for the contractor / engineer.
                            </span>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-bold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-accent hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                            >
                                <Send size={14} />
                                <span>{isSubmitting ? 'Submitting Request...' : isContractor ? 'Send Request to Contractor' : 'Send Request to Engineer'}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SiteRequestModal;

