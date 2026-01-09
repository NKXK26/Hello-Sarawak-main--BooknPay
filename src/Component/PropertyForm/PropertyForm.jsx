import React, { useState, useEffect, useRef } from "react";
import { GiWashingMachine, GiClothesline, GiDesert  } from "react-icons/gi";
import { PiSecurityCamera } from "react-icons/pi";
import { SiLightning } from "react-icons/si";
import { TbPawFilled, TbPawOff } from "react-icons/tb";
import { MdLandscape, MdOutlineKingBed, MdFireplace, MdSmokingRooms, MdKeyboardArrowDown, MdKeyboardArrowUp} from "react-icons/md";
import { FaWifi, FaDesktop, FaDumbbell, FaWater, FaSkiing, FaChargingStation, FaParking, FaSwimmingPool, FaTv, FaUtensils, FaSnowflake, FaSmokingBan, FaFireExtinguisher, FaFirstAid, FaShower, FaCoffee, FaUmbrellaBeach, FaBath, FaWind, FaBicycle, FaBabyCarriage, FaKey, FaBell, FaTree, FaCity } from "react-icons/fa";
import { propertiesListing, updateProperty, propertyListingRequest, fetchClusters, fetchUserData } from "../../../Api/api";
import Toast from "../Toast/Toast";
import "./PropertyForm.css";
import { useQuery } from '@tanstack/react-query';

// Define maximum dimensions for image resizing
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;

// Utility function to resize images
const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Resize only if the image exceeds max dimensions
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    const resizedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });
                    resolve(resizedFile);
                },
                'image/jpeg',
                0.9
            );
        };
        img.onerror = (error) => reject(error);

        const reader = new FileReader();
        reader.onload = (e) => (img.src = e.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const PropertyForm = ({ initialData, onSubmit, onClose }) => {
    // Add formatDate function at the top of the component
    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const predefinedFacilities = [
        // Essentials
        { name: "Wi-Fi", icon: <FaWifi />, category: "essentials" },
        { name: "Kitchen", icon: <FaUtensils />, category: "essentials" },
        { name: "Washer", icon: <GiWashingMachine />, category: "essentials" },
        { name: "Dryer", icon: <GiClothesline />, category: "essentials" },
        { name: "Air Conditioning", icon: <FaSnowflake />, category: "essentials" },
        { name: "Heating", icon: <FaWind />, category: "essentials" },
        { name: "Dedicated workspace", icon: <FaDesktop />, category: "essentials" },
        { name: "TV", icon: <FaTv />, category: "essentials" },

        // Features
        { name: "Free Parking", icon: <FaParking />, category: "features" },
        { name: "Swimming Pool", icon: <FaSwimmingPool />, category: "features" },
        { name: "Bathtub", icon: <FaBath />, category: "features" },
        { name: "EV charger", icon: <FaChargingStation />, category: "features" },
        { name: "Baby Crib", icon: <FaBabyCarriage />, category: "features" },
        { name: "King bed", icon: <MdOutlineKingBed />, category: "features" },
        { name: "Gym", icon: <FaDumbbell />, category: "features" },
        { name: "Breakfast", icon: <FaCoffee />, category: "features" },
        { name: "Indoor fireplace", icon: <MdFireplace />, category: "features" },
        { name: "Smoking allowed", icon: <MdSmokingRooms />, category: "features" },
        { name: "No Smoking", icon: <FaSmokingBan />, category: "features" },

        // Location
        { name: "City View", icon: <FaCity />, category: "location" },
        { name: "Garden", icon: <FaTree />, category: "location" },
        { name: "Bicycle Rental", icon: <FaBicycle />, category: "location" },
        { name: "Beachfront", icon: <FaUmbrellaBeach />, category: "location" },
        { name: "Waterfront", icon: <FaWater />, category: "location" },
        { name: "Countryside", icon: <MdLandscape />, category: "location" },
        { name: "Ski-in/ski-out", icon: <FaSkiing />, category: "location" },
        { name: "Desert", icon: <GiDesert />, category: "location" },
        
        // Safety
        { name: "Security Alarm", icon: <FaBell />, category: "safety" },
        { name: "Fire Extinguisher", icon: <FaFireExtinguisher />, category: "safety" },
        { name: "First Aid Kit", icon: <FaFirstAid />, category: "safety" },
        { name: "Security Camera", icon: <PiSecurityCamera />, category: "safety" },

        // Booking Options
        { name: "Instant booking", icon: <SiLightning />, category: "booking" },
        { name: "Self check-in", icon: <FaKey />, category: "booking" },
        { name: "Pets Allowed", icon: <TbPawFilled />, category: "booking" },
        { name: "No Pets", icon: <TbPawOff />, category: "booking" },
    ];

    const categories = [
        "Resort",
        "Hotel",
        "Inn",
        "Guesthouse",
        "Apartment",
        "Hostel"
    ];

    const [formData, setFormData] = useState({
        username: "",
        propertyPrice: "1",
        propertyAddress: "",
        nearbyLocation: "",
        propertyBedType: "1",
        propertyGuestPaxNo: "1",
        propertyDescription: "",
        facilities: [],
        propertyImage: [],
        clusterName: "",
        categoryName: "",
        weekendRate: "1",
        specialEventRate: "1",
        specialEventStartDate: "",
        specialEventEndDate: "",
        earlyBirdDiscountRate: "1",
        lastMinuteDiscountRate: "1"
    });

    const [removedImages, setRemovedImages] = useState([]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("");
    const [selectedFacilities, setSelectedFacilities] = useState([]);
    const [isSpecialEventEnabled, setIsSpecialEventEnabled] = useState(false);
    const fileInputRef = useRef(null);
    const locationInputRef = useRef(null);
    const [showMoreAmenities, setShowMoreAmenities] = useState(false);
    const [userCluster, setUserCluster] = useState(null);
    const userid = localStorage.getItem("userid");
    
    const { data: userData } = useQuery({
        queryKey: ['user', userid],
        queryFn: () => fetchUserData(userid),
        enabled: !!userid
    });
    
    const { data: clustersData = [] } = useQuery({
        queryKey: ['clusters'],
        queryFn: fetchClusters,
    });
    
    const clusters = clustersData.map(cluster => cluster.clustername || '');

    // Load form data on component mount
    useEffect(() => {
        if (initialData) {
            let facilitiesArray = [];
            
            if (initialData.facilities) {
                if (typeof initialData.facilities === 'string') {
                    facilitiesArray = initialData.facilities.trim() 
                        ? initialData.facilities.split(",").map(facility => facility.trim())
                        : [];
                } else if (Array.isArray(initialData.facilities)) {
                    facilitiesArray = initialData.facilities;
                }
            }
            
            setFormData({
                username: initialData.username || "",
                propertyPrice: initialData.normalrate || "",
                propertyAddress: initialData.propertyaddress || "",
                nearbyLocation: initialData.nearbylocation || "",
                propertyBedType: initialData.propertybedtype || "",
                propertyGuestPaxNo: initialData.propertyguestpaxno || "",
                propertyDescription: initialData.propertydescription || "",
                facilities: facilitiesArray,
                propertyImage: initialData.propertyimage || [],
                clusterName: initialData.clustername || "",
                categoryName: initialData.categoryname || "",
                weekendRate: initialData.weekendrate || "1",
                specialEventRate: initialData.specialeventrate || "1",
                specialEventStartDate: formatDate(initialData.startdate),
                specialEventEndDate: formatDate(initialData.enddate),
                earlyBirdDiscountRate: initialData.earlybirddiscountrate || "1",
                lastMinuteDiscountRate: initialData.lastminutediscountrate || "1"
            });
            
            // Set special event enabled if dates exist
            setIsSpecialEventEnabled(!!(initialData.startdate && initialData.enddate));
            setSelectedFacilities(facilitiesArray);
        } else {
            setFormData({
                username: localStorage.getItem("username") || "",
                propertyPrice: "1",
                propertyAddress: "",
                nearbyLocation: "",
                propertyBedType: "1",
                propertyGuestPaxNo: "1",
                propertyDescription: "",
                facilities: [],
                propertyImage: [],
                clusterName: "",
                categoryName: "",
                weekendRate: "1",
                specialEventRate: "1",
                specialEventStartDate: "",
                specialEventEndDate: "",
                earlyBirdDiscountRate: "1",
                lastMinuteDiscountRate: "1"
            });
            setSelectedFacilities([]);
        }
    }, [initialData]);

    useEffect(() => {
        if (userData && clustersData.length > 0 && !initialData) {
            const userClusterId = userData.clusterid;
            if (userClusterId) {
                const userCluster = clustersData.find(
                    cluster => cluster.clusterid?.toString() === userClusterId.toString()
                );
                if (userCluster) {
                    setFormData(prev => ({
                        ...prev,
                        clusterName: userCluster.clustername
                    }));
                }
            }
        }
    }, [userData, clustersData, initialData]);

    // Remove localStorage save effect
    useEffect(() => {
        // Don't save form data to localStorage anymore
    }, [formData, selectedFacilities]);

    useEffect(() => {
        if (initialData?.facilities) {
          const selected = initialData.facilities.split(',').map(f => f.trim());
          setSelectedFacilities(selected);
        }
    }, [initialData]);

    useEffect(() => {
        if (window.google) {
            const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current);
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place && place.formatted_address) {
                    setFormData((prev) => ({ ...prev, nearbyLocation: place.formatted_address }));
                }
            });
        }
    }, []);

    const toggleFacility = (facilityName) => {
        setSelectedFacilities((prev) => {
            // Handle mutual exclusivity between smoking options
            if (facilityName === "Smoking allowed") {
                return prev.includes("No Smoking")
                    ? prev.filter(name => name !== "No Smoking").concat(facilityName)
                    : prev.includes(facilityName)
                        ? prev.filter(name => name !== facilityName)
                        : [...prev, facilityName];
            } else if (facilityName === "No Smoking") {
                return prev.includes("Smoking allowed")
                    ? prev.filter(name => name !== "Smoking allowed").concat(facilityName)
                    : prev.includes(facilityName)
                        ? prev.filter(name => name !== facilityName)
                        : [...prev, facilityName];
            }
            
            // Handle mutual exclusivity between pets options
            if (facilityName === "Pets Allowed") {
                return prev.includes("No Pets")
                    ? prev.filter(name => name !== "No Pets").concat(facilityName)
                    : prev.includes(facilityName)
                        ? prev.filter(name => name !== facilityName)
                        : [...prev, facilityName];
            } else if (facilityName === "No Pets") {
                return prev.includes("Pets Allowed")
                    ? prev.filter(name => name !== "Pets Allowed").concat(facilityName)
                    : prev.includes(facilityName)
                        ? prev.filter(name => name !== facilityName)
                        : [...prev, facilityName];
            }
            
            // Handle all other facilities normally
            return prev.includes(facilityName)
                ? prev.filter((name) => name !== facilityName)
                : [...prev, facilityName];
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Special handling for date inputs
        if (name === 'specialEventStartDate' || name === 'specialEventEndDate') {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
            return;
        }
        
        const numValue = parseFloat(value);
        
        // Special handling for weekend rate multiplier
        if (name === 'weekendRate') {
            // Validate multiplier range (1.0 to 2.0)
            if (numValue < 1.0 || numValue > 2.0) {
                setToastMessage("Weekend rate multiplier must be between 1.0 and 2.0");
                setToastType("error");
                setShowToast(true);
                return;
            }
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: numValue >= 0 ? numValue : value
        }));
    };

    const handleFileChange = async (e) => {
        const newFiles = Array.from(e.target.files);
        const imageFiles = newFiles.filter((file) => file.type.startsWith('image/'));

        // Warn if non-image files are selected
        if (imageFiles.length < newFiles.length) {
            setToastMessage('Only image files are allowed. Non-image files have been ignored.');
            setToastType('warning');
            setShowToast(true);
        }

        try {
            const resizedFiles = await Promise.all(
                imageFiles.map((file) => resizeImage(file, MAX_WIDTH, MAX_HEIGHT))
            );
            setFormData((prev) => ({
                ...prev,
                propertyImage: [...prev.propertyImage, ...resizedFiles],
            }));
        } catch (error) {
            console.error('Error resizing images:', error);
            setToastMessage('Error resizing images. Please try again.');
            setToastType('error');
            setShowToast(true);
        }
    };

    const handleRemoveImage = (index) => {
        setFormData((prev) => {
            const updatedImages = [...prev.propertyImage];
            const removedImage = updatedImages.splice(index, 1)[0];
            if (!(removedImage instanceof File)) {
                setRemovedImages((prevRemoved) => [...prevRemoved, removedImage]);
            }
            return { ...prev, propertyImage: updatedImages };
        });
    };

    const toggleSpecialEvent = () => {
        setIsSpecialEventEnabled(!isSpecialEventEnabled);
        if (!isSpecialEventEnabled) {
            // Clear dates when disabling
            setFormData(prev => ({
                ...prev,
                specialEventStartDate: "",
                specialEventEndDate: ""
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.propertyImage.length < 4) {
            setToastMessage("Please upload at least 4 images");
            setToastType("error");
            setShowToast(true);
            return;
        }

        const data = new FormData();
        // Basic property info
        data.append("username", formData.username);
        data.append("propertyPrice", formData.propertyPrice);
        data.append("propertyAddress", formData.propertyAddress);
        data.append("nearbyLocation", formData.nearbyLocation);
        data.append("propertyBedType", formData.propertyBedType);
        data.append("propertyGuestPaxNo", formData.propertyGuestPaxNo);
        data.append("propertyDescription", formData.propertyDescription);
        data.append("facilities", selectedFacilities.join(","));
        data.append("clusterName", formData.clusterName);
        data.append("categoryName", formData.categoryName);
        
        // Add creator info for audit trail
        if (initialData) {
            data.append("creatorid", localStorage.getItem("userid"));
            data.append("creatorUsername", localStorage.getItem("username"));
        }

        // Add rate fields with default values if not set
        data.append("weekendRate", formData.weekendRate || "1");
        data.append("specialEventRate", formData.specialEventRate || "1");
        data.append("isSpecialEventEnabled", isSpecialEventEnabled);
        
        // Only append special event dates if enabled
        if (isSpecialEventEnabled) {
            data.append("specialEventStartDate", formData.specialEventStartDate || "");
            data.append("specialEventEndDate", formData.specialEventEndDate || "");
        }
        
        data.append("earlyBirdDiscountRate", formData.earlyBirdDiscountRate || "1");
        data.append("lastMinuteDiscountRate", formData.lastMinuteDiscountRate || "1");

        if (!initialData) {
            data.append("propertyStatus", "Pending");
        }

        // Handle images
        formData.propertyImage.forEach((file) => {
            if (file instanceof File) {
                data.append("propertyImage", file);
            }
        });
        data.append("removedImages", JSON.stringify(removedImages));

        try {
            let response;
            let propertyId;
            
            if (initialData) {
                propertyId = initialData.propertyid || initialData.propertyID;
                if (!propertyId) {
                    throw new Error('Property ID is required for update');
                }
                response = await updateProperty(data, propertyId);
            } else {
                const usergroup = localStorage.getItem("usergroup");

                if (usergroup === "Administrator") {
                    response = await propertiesListing(data);
                    propertyId = response.propertyid;
                } else if (usergroup === "Moderator") {
                    response = await propertiesListing(data);
                    propertyId = response.propertyid;
                    await propertyListingRequest(propertyId);
                }
            }
           
            if (response && response.message) {
                setToastMessage(response.message);
                setToastType("success");
                setShowToast(true);
                onSubmit();
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            setToastMessage(error.message || "Error submitting form. Please try again.");
            setToastType("error");
            setShowToast(true);
        }
    };

    const handleReset = () => {
        setFormData({
            username: localStorage.getItem("username") || "",
            propertyPrice: "1",
            propertyAddress: "",
            nearbyLocation: "",
            propertyBedType: "1",
            propertyGuestPaxNo: "1",
            propertyDescription: "",
            facilities: [],
            propertyImage: [],
            clusterName: "",
            categoryName: "",
            weekendRate: "1",
            specialEventRate: "1",
            specialEventStartDate: "",
            specialEventEndDate: "",
            earlyBirdDiscountRate: "1",
            lastMinuteDiscountRate: "1"
        });
        setRemovedImages([]);
        setSelectedFacilities([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const imageInfoText = 
        formData.propertyImage.length > 0 
            ? "The first image will be the main display image." 
            : "";

    const getImageLabel = (index) =>
        index === 0 ? "Main Image" : index <= 2 ? "Secondary Image" : "Additional Image";

    const getLabelStyle = (index) => ({
        backgroundColor: index === 0 ? '#4CAF50' : index <= 2 ? '#2196F3' : '#9E9E9E',
        color: 'white',
    });

    return (
        <div className="property-form-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="property-form-content">
                <div className="property-form-header">
                    <h1>{initialData ? "Edit Property" : "Create a New Property"}</h1>
                    <div className="property-form-header-buttons">
                        <button onClick={onClose} className="property-form-close-button">×</button>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="property-form-listing-form">
                    <div className="property-form-section full-width">
                        <h3>Property Details</h3>
                        <div className="property-form-details-grid">
                            <div className="property-form-group">
                                <label>Username:</label>
                                <input type="text" name="username" value={formData.username} readOnly required />
                            </div>
                            <div className="property-form-group">
                                <label>Name:</label>
                                <input
                                    type="text"
                                    name="propertyAddress"
                                    value={formData.propertyAddress}
                                    onChange={handleChange}
                                    placeholder="e.g. Property"
                                    required
                                />
                            </div>
                            <div className="property-form-group">
                                <label>Cluster (City):</label>
                                <input 
                                    type="text" 
                                    name="clusterName" 
                                    value={formData.clusterName} 
                                    readOnly 
                                    required 
                                    className="readonly-input"
                                    style={{ backgroundColor: '#f0f0f0' }}
                                />
                            </div>
                            <div className="property-form-group">
                                <label>Category:</label>
                                <select name="categoryName" value={formData.categoryName} onChange={handleChange} required>
                                    <option value="">Select Category</option>
                                    {categories.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="property-form-group">
                                <label>Base Price (MYR):</label>
                                <input
                                    type="number"
                                    name="propertyPrice"
                                    value={formData.propertyPrice}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="property-form-group">
                                <label>Capacity (Pax):</label>
                                <input
                                    type="number"
                                    name="propertyGuestPaxNo"
                                    value={formData.propertyGuestPaxNo}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="property-form-group">
                                <label>Bed:</label>
                                <input
                                    type="number"
                                    name="propertyBedType"
                                    value={formData.propertyBedType}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="property-form-group">
                                <label>Location:</label>
                                <input
                                    type="text"
                                    name="nearbyLocation"
                                    value={formData.nearbyLocation}
                                    onChange={handleChange}
                                    placeholder="e.g. No.123, LOT 1234, Lorong 1, Jalan ABC, Kuching, Sarawak"
                                    required
                                    ref={locationInputRef}
                                />
                            </div>
                            <div className="property-form-group full-width">
                                <label>Property Description:</label>
                                <textarea
                                    name="propertyDescription"
                                    value={formData.propertyDescription}
                                    onChange={handleChange}
                                    placeholder="e.g. This Property Has Good View"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="property-form-section full-width">
                        <h3>Dynamic Pricing</h3>
                        <div className="property-form-pricing-grid">
                            <div className="property-form-group">
                                <label>Weekend Rate:</label>
                                <input
                                    type="number"
                                    name="weekendRate"
                                    value={formData.weekendRate}
                                    onChange={handleChange}
                                    min="1"
                                    max="2"
                                    step="0.1"
                                />
                                <small className="property-form-help-text">
                                    Rate for bookings made in weekends.
                                </small>
                                <div className="property-form-rate-preview">
                                    Weekend price: MYR {(parseFloat(formData.propertyPrice) * formData.weekendRate).toFixed(2)}
                                </div>
                            </div>
                            
                            <div className="property-form-group">
                                <div className="property-form-label-with-toggle">
                                    <label>Special Event Rate:</label>
                                    <div className="property-form-special-event-toggle">
                                        <label className="property-form-switch">
                                            <input
                                                type="checkbox"
                                                checked={isSpecialEventEnabled}
                                                onChange={toggleSpecialEvent}
                                            />
                                            <span className="property-form-slider"></span>
                                        </label>
                                        <span className="property-form-toggle-label">
                                            {isSpecialEventEnabled ? "Enabled" : "Disabled"}
                                        </span>
                                    </div>
                                </div>
                                <input
                                    type="number"
                                    name="specialEventRate"
                                    value={formData.specialEventRate}
                                    onChange={handleChange}
                                    min="1"
                                    max="2"
                                    step="0.01"
                                />
                                <small className="property-form-help-text">Rate for special events during selected period.</small>
                                <div className="property-form-rate-preview">
                                    Special Event price: MYR {(parseFloat(formData.propertyPrice) * formData.specialEventRate).toFixed(2)}
                                </div>
                            </div>

                            {isSpecialEventEnabled && (
                                <>
                                    <div className="property-form-group">
                                        <label>Special Event Date Range:</label>
                                        <div className="date-input-group">
                                            <label>Start Date:</label>
                                            <input
                                                type="date"
                                                name="specialEventStartDate"
                                                value={formData.specialEventStartDate}
                                                onChange={handleChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="date-input"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="property-form-group">
                                        <label>Special Event Date Range:</label>
                                        <div className="date-input-group">
                                            <label>End Date:</label>
                                            <input
                                                type="date"
                                                name="specialEventEndDate"
                                                value={formData.specialEventEndDate}
                                                onChange={handleChange}
                                                min={formData.specialEventStartDate || new Date().toISOString().split('T')[0]}
                                                className="date-input"
                                                required
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            <div className="property-form-group">
                                <label>Early Bird Discount Rate:</label>
                                <input
                                    type="number"
                                    name="earlyBirdDiscountRate"
                                    value={formData.earlyBirdDiscountRate}
                                    onChange={handleChange}
                                    min="0.1"
                                    max="1"
                                    step="0.01"
                                />
                                <small className="property-form-help-text">
                                    Discount rate for bookings made more than 30 days in advance. 
                                </small>
                                <div className="property-form-rate-preview">
                                    Early Bird price: MYR {(parseFloat(formData.propertyPrice) * formData.earlyBirdDiscountRate).toFixed(2)}
                                </div>
                            </div>
                            
                            <div className="property-form-group">
                                <label>Last Minute Discount Rate:</label>
                                <input
                                    type="number"
                                    name="lastMinuteDiscountRate"
                                    value={formData.lastMinuteDiscountRate}
                                    onChange={handleChange}
                                    min="0.1"
                                    max="1"
                                    step="0.01"
                                />
                                <small className="property-form-help-text">
                                    Discount rate for bookings made 7 days or less before check-in. 
                                </small>
                                <div className="property-form-rate-preview">
                                    Last Minute Discount price: MYR {(parseFloat(formData.propertyPrice) * formData.lastMinuteDiscountRate).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="property-form-section full-width">
                        <h3>Facilities</h3>
                        <div className="property-form-filter-section">
                            <div className="property-form-essentials-section">
                                <h5>Essentials</h5>
                                <div className="property-form-amenities-grid">
                                    {predefinedFacilities
                                        .filter(facility => facility.category === "essentials")
                                        .map((facility) => (
                                            <div
                                                key={facility.name}
                                                className={`property-form-amenity-item ${selectedFacilities.includes(facility.name) ? 'selected' : ''}`}
                                                onClick={() => toggleFacility(facility.name)}
                                            >
                                                <span className="property-form-amenity-icon">{facility.icon}</span>
                                                <span className="property-form-amenity-text">{facility.name}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {!showMoreAmenities && (
                                <button className="property-form-show-more-button" onClick={() => setShowMoreAmenities(true)}>
                                    Show more <MdKeyboardArrowDown />
                                </button>
                            )}

                            {showMoreAmenities && (
                                <>
                                    <div className="property-form-features-section">
                                        <h5>Features</h5>
                                        <div className="property-form-amenities-grid">
                                            {predefinedFacilities
                                                .filter(facility => facility.category === "features")
                                                .map((facility) => (
                                                    <div
                                                        key={facility.name}
                                                        className={`property-form-amenity-item ${selectedFacilities.includes(facility.name) ? 'selected' : ''}`}
                                                        onClick={() => toggleFacility(facility.name)}
                                                    >
                                                        <span className="property-form-amenity-icon">{facility.icon}</span>
                                                        <span className="property-form-amenity-text">{facility.name}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="property-form-location-section">
                                        <h5>Location</h5>
                                        <div className="property-form-amenities-grid">
                                            {predefinedFacilities
                                                .filter(facility => facility.category === "location")
                                                .map((facility) => (
                                                    <div
                                                        key={facility.name}
                                                        className={`property-form-amenity-item ${selectedFacilities.includes(facility.name) ? 'selected' : ''}`}
                                                        onClick={() => toggleFacility(facility.name)}
                                                    >
                                                        <span className="property-form-amenity-icon">{facility.icon}</span>
                                                        <span className="property-form-amenity-text">{facility.name}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="property-form-safety-section">
                                        <h5>Safety</h5>
                                        <div className="property-form-amenities-grid">
                                            {predefinedFacilities
                                                .filter(facility => facility.category === "safety")
                                                .map((facility) => (
                                                    <div
                                                        key={facility.name}
                                                        className={`property-form-amenity-item ${selectedFacilities.includes(facility.name) ? 'selected' : ''}`}
                                                        onClick={() => toggleFacility(facility.name)}
                                                    >
                                                        <span className="property-form-amenity-icon">{facility.icon}</span>
                                                        <span className="property-form-amenity-text">{facility.name}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div className="property-form-booking-section">
                                        <h5>Booking Options</h5>
                                        <div className="property-form-amenities-grid">
                                            {predefinedFacilities
                                                .filter(facility => facility.category === "booking")
                                                .map((facility) => (
                                                    <div
                                                        key={facility.name}
                                                        className={`property-form-amenity-item ${selectedFacilities.includes(facility.name) ? 'selected' : ''}`}
                                                        onClick={() => toggleFacility(facility.name)}
                                                    >
                                                        <span className="property-form-amenity-icon">{facility.icon}</span>
                                                        <span className="property-form-amenity-text">{facility.name}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <button className="property-form-show-less-button" onClick={() => setShowMoreAmenities(false)}>
                                        Show less <MdKeyboardArrowUp />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="property-form-section full-width">
                        <h3>Property Images</h3>
                        <div className="property-form-group">
                            <label>Upload Images:</label>
                            <input
                                type="file"
                                name="propertyImage"
                                accept="image/*"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                multiple
                            />
                            {formData.propertyImage.length < 4 && (
                                <div className="property-form-validation-warning">
                                    Minimum 4 images required ({formData.propertyImage.length}/4 uploaded)
                                </div>
                            )}
                            {formData.propertyImage.length > 0 && (
                                <div className="property-form-info-text">
                                    {imageInfoText}
                                </div>
                            )}
                        </div>
                        <div className="property-form-existing-images-container">
                            {formData.propertyImage.map((image, index) => (
                                <div key={index} className="property-form-image-item">
                                    <div className="property-form-image-label" style={getLabelStyle(index)}>
                                        {getImageLabel(index)}
                                    </div>
                                    {image instanceof File ? (
                                        <img src={URL.createObjectURL(image)} alt="Property" />
                                    ) : (
                                        <img src={`data:image/jpeg;base64,${image}`} alt="Property" />
                                    )}
                                    <button
                                        type="button"
                                        className="property-form-remove-image-btn"
                                        onClick={() => handleRemoveImage(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="property-form-button-group">
                        <button type="button" onClick={handleReset} className="property-form-reset-button">
                            Reset
                        </button>
                        <button type="submit" className="property-form-submit-button">
                            {initialData ? "Update Property" : "Create Property"}
                        </button>
                    </div>
                </form>
                {showToast && <Toast type={toastType} message={toastMessage} />}
            </div>
        </div>
    );
};

export default PropertyForm;
