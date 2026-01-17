import React, { useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { FaCar, FaGasPump, FaCheckCircle, FaShieldAlt, FaStar, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { GiCarSeat, GiGearStickPattern } from "react-icons/gi";
import { MdLocationPin, MdDirectionsCar } from "react-icons/md";

import './Destination.css';

// Import Vehicle Images
import PeroduaMyvi from '../../public/Perodua Myvi.png';
import PeroduaAxia from '../../public/Perodua Axia.png';
import HondaCity from '../../public/Honda City.png';
import ToyotaVios from '../../public/Toyota Vios.png';
import ProtonSaga from '../../public/Proton Saga.png';
import PeroduaAlza from '../../public/Perodua Alza.png';
import PeroduaBezza from '../../public/Perodua Bezza.png';
import PeroduaMyviNew from '../../public/Perodua Myvi (New).png';
import ToyotaFortuner from '../../public/Toyota Fortuner.png';
import ToyotaSienta from '../../public/Toyota Sienta.png';
import PeroduaAlzaNew from '../../public/Perodua Alza (New).png';
import PeroduaAruz from '../../public/Perodua Aruz.png';
import NissanUrvan from '../../public/Nissan Urvan NV350.png';
import homeBackground from '../../public/home.png';
const Destination = () => {
  const imagesRef = useRef([]);
  const sectionRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    // 3D rotation effect for vehicle images
    imagesRef.current.forEach((item) => {
      if (!item) return; // Guard clause for null refs

      const handleMouseMove = (e) => {
        const rect = item.getBoundingClientRect();
        const positionX = ((e.clientX - rect.left) / rect.width) * 100;
        const positionY = ((e.clientY - rect.top) / rect.height) * 100;

        item.style.setProperty('--rX', 0.5 * (50 - positionY) + 'deg');
        item.style.setProperty('--rY', -0.5 * (50 - positionX) + 'deg');
      };

      const handleMouseOut = () => {
        item.style.setProperty('--rX', '0deg');
        item.style.setProperty('--rY', '0deg');
      };

      item.addEventListener('mousemove', handleMouseMove);
      item.addEventListener('mouseout', handleMouseOut);

      return () => {
        item.removeEventListener('mousemove', handleMouseMove);
        item.removeEventListener('mouseout', handleMouseOut);
      };
    });

    // IntersectionObserver for fade-in effect
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
    );

    // Observe all elements in sectionRefs
    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Featured vehicles data
  const featuredVehicles = [
    {
      id: 1,
      name: "Perodua Myvi",
      type: "Hatchback",
      brand: "Perodua",
      capacity: 5,
      transmission: "Automatic",
      fuelType: "Petrol",
      pricePerDay: 120,
      image: PeroduaMyvi,
      features: ["Air Conditioning", "Power Windows", "USB Port", "Touchscreen"],
      rating: 4.5,
      availability: true,
      popular: true
    },
    {
      id: 2,
      name: "Honda City",
      type: "Sedan",
      brand: "Honda",
      capacity: 5,
      transmission: "Automatic",
      fuelType: "Petrol",
      pricePerDay: 180,
      image: HondaCity,
      features: ["Premium Sound", "Push Start", "Rear Camera", "Lane Watch"],
      rating: 4.7,
      availability: true,
      popular: true
    },
    {
      id: 3,
      name: "Toyota Fortuner",
      type: "SUV",
      brand: "Toyota",
      capacity: 7,
      transmission: "Automatic",
      fuelType: "Diesel",
      pricePerDay: 250,
      image: ToyotaFortuner,
      features: ["4x4", "Leather Seats", "Sunroof", "Premium Audio"],
      rating: 4.8,
      availability: true,
      popular: false
    },
  ];

  // Popular vehicles data
  const popularVehicles = [
    {
      id: 4,
      name: "Perodua Axia",
      type: "Economy",
      brand: "Perodua",
      capacity: 5,
      transmission: "Automatic",
      fuelType: "Petrol",
      pricePerDay: 90,
      image: PeroduaAxia,
      features: ["Air Conditioning", "Economical", "Easy Parking"],
      rating: 4.2,
      availability: true
    },
    {
      id: 5,
      name: "Toyota Vios",
      type: "Sedan",
      brand: "Toyota",
      capacity: 5,
      transmission: "Automatic",
      fuelType: "Petrol",
      pricePerDay: 160,
      image: ToyotaVios,
      features: ["Dual VVT-i", "ECO Mode", "Smart Entry", "7 Airbags"],
      rating: 4.6,
      availability: true
    },
    {
      id: 6,
      name: "Proton Saga",
      type: "Sedan",
      brand: "Proton",
      capacity: 5,
      transmission: "Manual/Automatic",
      fuelType: "Petrol",
      pricePerDay: 100,
      image: ProtonSaga,
      features: ["Economical", "Spacious Boot", "Touchscreen"],
      rating: 4.3,
      availability: true
    },
  ];

  // Family vehicles data
  const familyVehicles = [
    {
      id: 7,
      name: "Perodua Alza",
      type: "MPV",
      brand: "Perodua",
      capacity: 7,
      transmission: "Automatic",
      fuelType: "Petrol",
      pricePerDay: 150,
      image: PeroduaAlza,
      features: ["7 Seater", "Foldable Seats", "Dual Airbags"],
      rating: 4.4,
      availability: true
    },
    {
      id: 8,
      name: "Toyota Sienta",
      type: "MPV",
      brand: "Toyota",
      capacity: 7,
      transmission: "Automatic",
      fuelType: "Petrol",
      pricePerDay: 200,
      image: ToyotaSienta,
      features: ["Sliding Doors", "Spacious Interior", "Dual Zone AC"],
      rating: 4.6,
      availability: true
    },
    {
      id: 9,
      name: "Perodua Aruz",
      type: "SUV",
      brand: "Perodua",
      capacity: 7,
      transmission: "Automatic",
      fuelType: "Petrol",
      pricePerDay: 170,
      image: PeroduaAruz,
      features: ["7 Seater", "Advanced Safety", "High Ground Clearance"],
      rating: 4.5,
      availability: true
    },
  ];

  const handleBookNow = (vehicleId) => {
    navigate('/product', { state: { vehicleId } });
  };

  const handleViewAll = () => {
    navigate('/product');
  };

  const handleQuickRent = () => {
    navigate('/product');
  };

  const renderVehicleCard = (vehicle) => (
    <div
      key={vehicle.id}
      className="vehicle_card"
      ref={(el) => sectionRefs.current.push(el)}
    >
      <div className="vehicle_image_container">
        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="vehicle_image"
          ref={(el) => imagesRef.current.push(el)}
        />
        {vehicle.availability && (
          <span className="availability_badge">
            <FaCheckCircle /> Available
          </span>
        )}
        {vehicle.popular && (
          <span className="popular_badge">
            <FaStar /> Popular
          </span>
        )}
      </div>

      <div className="vehicle_info">
        <div className="vehicle_header">
          <div>
            <h3>{vehicle.name}</h3>
            <p className="vehicle_brand">{vehicle.brand}</p>
          </div>
          <span className="vehicle_type">{vehicle.type}</span>
        </div>


        <div className="vehicle_specs">
          <div className="spec_item">
            <GiCarSeat className="spec_icon" />
            <span>{vehicle.capacity} Seats</span>
          </div>
          <div className="spec_item">
            <GiGearStickPattern className="spec_icon" />
            <span>{vehicle.transmission}</span>
          </div>
          <div className="spec_item">
            <FaGasPump className="spec_icon" />
            <span>{vehicle.fuelType}</span>
          </div>
        </div>

        <div className="vehicle_features">
          {vehicle.features.slice(0, 3).map((feature, idx) => (
            <div key={idx} className="feature_item">
              <FaCheckCircle className="feature_icon" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="vehicle_footer">
          <div className="price_section">
            <span className="price_label">From</span>
            <div className="price_amount">
              <span className="currency">RM</span>
              <span className="price">{vehicle.pricePerDay}</span>
              <span className="period">/day</span>
            </div>
          </div>

          <button
            className="book_btn"
            onClick={() => handleBookNow(vehicle.id)}
          >
            <FaCar className="btn_icon" />
            Book Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="destination-container">
      {/* Hero Section */}
      <div className="hero-section" style={{ backgroundImage: `url(${homeBackground})` }}>
        <div className="hero-content">
          <h1>Drive Your Adventure in Sarawak</h1>
          <p>Premium car rental service with flexible options for every journey</p>

          <div className="hero-stats">
            <div className="stat-item">
              <MdDirectionsCar className="stat-icon" />
              <div>
                <h3>50+</h3>
                <p>Vehicles</p>
              </div>
            </div>
            <div className="stat-item">
              <FaMapMarkerAlt className="stat-icon" />
              <div>
                <h3>15+</h3>
                <p>Pickup Locations</p>
              </div>
            </div>
            <div className="stat-item">
              <FaShieldAlt className="stat-icon" />
              <div>
                <h3>24/7</h3>
                <p>Roadside Assistance</p>
              </div>
            </div>
          </div>

          <button className="hero-cta" onClick={handleQuickRent}>
            <FaCar /> Quick Rent
          </button>
        </div>
      </div>

      {/* Featured Vehicles */}
      <div className="section featured-section">
        <div className="section-header">
          <h2>Featured Vehicles</h2>
          <p>Top picks for your Sarawak adventure</p>
        </div>

        <div className="vehicle_grid">
          {featuredVehicles.map(renderVehicleCard)}
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="section benefits-section">
        <div className="section-header">
          <h2>Why Choose GoCar Rental?</h2>
          <p>Experience hassle-free car rental in Sarawak</p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-card">
            <FaShieldAlt className="benefit-icon" />
            <h3>Full Insurance</h3>
            <p>Comprehensive coverage for peace of mind on every journey</p>
          </div>

          <div className="benefit-card">
            <FaClock className="benefit-icon" />
            <h3>24/7 Support</h3>
            <p>Round-the-clock assistance for any road emergencies</p>
          </div>

          <div className="benefit-card">
            <FaMapMarkerAlt className="benefit-icon" />
            <h3>Flexible Locations</h3>
            <p>Pick up and return at multiple convenient locations</p>
          </div>

          <div className="benefit-card">
            <MdDirectionsCar className="benefit-icon" />
            <h3>New Fleet</h3>
            <p>Well-maintained vehicles with regular servicing</p>
          </div>
        </div>
      </div>

      {/* Popular Vehicles */}
      <div className="section popular-section">
        <div className="section-header">
          <h2>Most Popular</h2>
          <p>Our customers' favorite choices</p>
        </div>

        <div className="vehicle_grid">
          {popularVehicles.map(renderVehicleCard)}
        </div>
      </div>

      {/* Family Vehicles */}
      <div className="section family-section">
        <div className="section-header">
          <h2>Family & Group</h2>
          <p>Spacious vehicles for group travels</p>
        </div>

        <div className="vehicle_grid">
          {familyVehicles.map(renderVehicleCard)}
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to Explore Sarawak?</h2>
          <p>Book your perfect vehicle today and start your adventure</p>
          <div className="cta-buttons">
            <button className="cta-primary" onClick={handleViewAll}>
              Browse All Vehicles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Destination;