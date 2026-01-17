import React, { useState, useEffect } from 'react';
import './VehicleForm.css';

const VehicleForm = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    initialData,
    brands = [],
    categories = [],
    regions = [],
    title = 'Vehicle Form'
}) => {
    const [formData, setFormData] = useState({
        vehicle: '',
        brand_id: '',
        category_id: '',
        region_id: '',
        seat: 5,
        transmission: 1, // 1 for Automatic, 2 for Manual
        position: 0,
        status: 0, // 0 for Unavailable, 1 for Available
        hourly: 0,
        daily: 0,
        weekly: 0,
        monthly: 0,
        cdw: 0,
        seo_keyword: '',
        seo_description: '',
        photo: null,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                vehicle: initialData.vehicle || '',
                brand_id: initialData.brand_id || '',
                category_id: initialData.category_id || '',
                region_id: initialData.region_id || '',
                seat: initialData.seat || 5,
                transmission: initialData.transmission || 1,
                position: initialData.position || 0,
                status: initialData.status || 0,
                hourly: initialData.pricing?.hourly || 0,
                daily: initialData.pricing?.daily || 0,
                weekly: initialData.pricing?.weekly || 0,
                monthly: initialData.pricing?.monthly || 0,
                cdw: initialData.pricing?.cdw || 0,
                seo_keyword: initialData.seo_keyword || '',
                seo_description: initialData.seo_description || '',
                photo: initialData.photo || null,
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const formDataToSubmit = new FormData();
            
            // Append all form data
            Object.keys(formData).forEach(key => {
                if (key === 'photo' && formData[key]) {
                    formDataToSubmit.append('photo', formData[key]);
                } else {
                    formDataToSubmit.append(key, formData[key]);
                }
            });

            await onSubmit(formData);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content vehicle-form-modal">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="vehicle-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Vehicle Name *</label>
                            <input
                                type="text"
                                name="vehicle"
                                value={formData.vehicle}
                                onChange={handleChange}
                                required
                                placeholder="Enter vehicle name"
                            />
                        </div>

                        <div className="form-group">
                            <label>Brand *</label>
                            <select
                                name="brand_id"
                                value={formData.brand_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Brand</option>
                                {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Category *</label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Region *</label>
                            <select
                                name="region_id"
                                value={formData.region_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Region</option>
                                {regions.map(region => (
                                    <option key={region.id} value={region.id}>
                                        {region.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Number of Seats *</label>
                            <input
                                type="number"
                                name="seat"
                                value={formData.seat}
                                onChange={handleChange}
                                min="1"
                                max="20"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Transmission *</label>
                            <select
                                name="transmission"
                                value={formData.transmission}
                                onChange={handleChange}
                                required
                            >
                                <option value="1">Automatic</option>
                                <option value="2">Manual</option>
                            </select>
                        </div>

                        {/* Pricing Section */}
                        <div className="form-group full-width">
                            <h3>Pricing</h3>
                        </div>

                        <div className="form-group">
                            <label>Hourly Rate</label>
                            <input
                                type="number"
                                name="hourly"
                                value={formData.hourly}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="form-group">
                            <label>Daily Rate *</label>
                            <input
                                type="number"
                                name="daily"
                                value={formData.daily}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Weekly Rate</label>
                            <input
                                type="number"
                                name="weekly"
                                value={formData.weekly}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="form-group">
                            <label>Monthly Rate</label>
                            <input
                                type="number"
                                name="monthly"
                                value={formData.monthly}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="form-group">
                            <label>CDW (Collision Damage Waiver)</label>
                            <input
                                type="number"
                                name="cdw"
                                value={formData.cdw}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="form-group">
                            <label>Display Position</label>
                            <input
                                type="number"
                                name="position"
                                value={formData.position}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="0">Unavailable</option>
                                <option value="1">Available</option>
                            </select>
                        </div>

                        <div className="form-group full-width">
                            <label>Vehicle Image</label>
                            <input
                                type="file"
                                name="photo"
                                onChange={handleChange}
                                accept="image/*"
                            />
                            {formData.photo && typeof formData.photo === 'string' && (
                                <div className="image-preview">
                                    <img src={formData.photo} alt="Preview" />
                                </div>
                            )}
                        </div>

                        <div className="form-group full-width">
                            <label>SEO Keywords</label>
                            <input
                                type="text"
                                name="seo_keyword"
                                value={formData.seo_keyword}
                                onChange={handleChange}
                                placeholder="Comma-separated keywords"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>SEO Description</label>
                            <textarea
                                name="seo_description"
                                value={formData.seo_description}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Enter SEO description"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="cancel-button" 
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="submit-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (initialData ? 'Update Vehicle' : 'Create Vehicle')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehicleForm;