import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

// Import Components
import Navbar from '../../../Component/Navbar/navbar';
import Footer from '../../../Component/Footer/footer';
import Back_To_Top_Button from '../../../Component/Back_To_Top_Button/Back_To_Top_Button';
import Toast from '../../../Component/Toast/Toast';
import TawkMessenger from '../../../Component/TawkMessenger/TawkMessenger';
import { AuthProvider } from '../../../Component/AuthContext/AuthContext';
import Sorting from '../../../Component/Sorting/Sorting';

// Import API
import { fetchProduct } from '../../../../Api/api';

// Import React Icons
import { FaSearch } from 'react-icons/fa';
import { IoLocationSharp, IoCalendar } from 'react-icons/io5';
import { MdEventAvailable } from "react-icons/md";
import { TbManualGearbox } from "react-icons/tb";
import { PiSteeringWheelFill } from "react-icons/pi";

// Import vehicle images
import PeroduaMyvi from '../../../public/Perodua Myvi.png';
import PeroduaAxia from '../../../public/Perodua Axia.png';
import HondaCity from '../../../public/Honda City.png';
import ToyotaVios from '../../../public/Toyota Vios.png';
import ProtonSaga from '../../../public/Proton Saga.png';
import PeroduaAlza from '../../../public/Perodua Alza.png';
import PeroduaBezza from '../../../public/Perodua Bezza.png';
import PeroduaMyviNew from '../../../public/Perodua Myvi (New).png';
import ToyotaFortuner from '../../../public/Toyota Fortuner.png';
import PeroduaAlzaNew from '../../../public/Perodua Alza (New).png';
import ToyotaSienta from '../../../public/Toyota Sienta.png';
import PeroduaAruz from '../../../public/Perodua Aruz.png';
import NissanUrvan from '../../../public/Nissan Urvan NV350.png';
import DefaultCar from '../../../public/default-car.png';

import './product.css';

const Product = () => {
  const [vehicles, setVehicles] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('');
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTransmission, setSelectedTransmission] = useState("");
  const [selectedSeats, setSelectedSeats] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [sortBy, setSortBy] = useState("");
  const [bookingData, setBookingData] = useState({
    pickupDate: "",
    returnDate: "",
    pickupTime: "09:00",
    returnTime: "17:00",
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  const [activeTab, setActiveTab] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allVehicles, setAllVehicles] = useState([]);
  const [loadedVehicleIds, setLoadedVehicleIds] = useState(new Set());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const observer = useRef();

  // Remove unused state variables
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortOrder, setSortOrder] = useState("none");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTransmissions, setSelectedTransmissions] = useState([]);

  // Your actual regions from database
  const regions = [
    { id: "", name: "All Regions" },
    { id: "1", name: "Kuching" },
    { id: "2", name: "Sibu" },
    { id: "4", name: "Miri" },
    { id: "3", name: "Bintulu" },
    { id: "6", name: "Kota Kinabalu" }
  ];

  const transmissionTypes = [
    { id: "", name: "All Transmissions" },
    { id: "automatic", name: "Automatic" },
    { id: "manual", name: "Manual" }
  ];

  const seatOptions = [
    { id: "", name: "Any Seats" },
    { id: "2", name: "2 Seats" },
    { id: "4", name: "4 Seats" },
    { id: "5", name: "5 Seats" },
    { id: "7", name: "7 Seats" },
    { id: "8", name: "8+ Seats" }
  ];

  const sortOptions = [
    { id: "", name: "Default" },
    { id: "price_asc", name: "Price: Low to High" },
    { id: "price_desc", name: "Price: High to Low" },
    { id: "name_asc", name: "Name: A to Z" },
    { id: "name_desc", name: "Name: Z to A" }
  ];

  const lastVehicleElementRef = useCallback(node => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && entries[0].intersectionRatio === 1 && hasMore && !isLoadingMore) {
        setIsLoadingMore(true);
        loadMoreVehicles();
      }
    }, {
      threshold: 1.0,
      rootMargin: '0px 0px 50px 0px'
    });

    if (node) observer.current.observe(node);
  }, [hasMore, isLoadingMore]);

  const navigate = useNavigate();

  const { data: fetchedVehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchProduct,
  });

  useEffect(() => {
    console.log('Fetched vehicles:', fetchedVehicles);
    if (fetchedVehicles && Array.isArray(fetchedVehicles)) {
      setAllVehicles(fetchedVehicles);
      setVehicles([]);
      setLoadedVehicleIds(new Set());
      setPage(1);
      setHasMore(true);
      setIsLoadingMore(false);
    }
  }, [fetchedVehicles]);

  // Load initial vehicles
  useEffect(() => {
    if (allVehicles.length > 0 && vehicles.length === 0) {
      loadInitialVehicles();
    }
  }, [allVehicles, vehicles.length]);

  const loadInitialVehicles = () => {
    const initialVehicleIds = new Set();
    const initialVehicles = allVehicles.slice(0, 8);

    initialVehicles.forEach(vehicle => initialVehicleIds.add(vehicle.id));

    setVehicles(initialVehicles);
    setLoadedVehicleIds(initialVehicleIds);
    setPage(2);
    setHasMore(allVehicles.length > 8);
  };

  const loadMoreVehicles = () => {
    const startIndex = (page - 1) * 8;
    const endIndex = page * 8;

    if (startIndex >= allVehicles.length) {
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }

    const nextVehicles = allVehicles.slice(startIndex, endIndex);

    const currentLoadedIds = new Set([...loadedVehicleIds]);

    const filteredVehicles = nextVehicles.filter(
      vehicle => !currentLoadedIds.has(vehicle.id)
    );

    if (filteredVehicles.length === 0) {
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }

    const newVehicleIds = new Set(currentLoadedIds);
    filteredVehicles.forEach(vehicle => newVehicleIds.add(vehicle.id));

    setTimeout(() => {
      const uniqueVehicles = [...vehicles];
      filteredVehicles.forEach(vehicle => {
        if (!uniqueVehicles.some(v => v.id === vehicle.id)) {
          uniqueVehicles.push(vehicle);
        }
      });

      setVehicles(uniqueVehicles);
      setLoadedVehicleIds(newVehicleIds);
      setPage(page + 1);
      setHasMore(endIndex < allVehicles.length);
      setIsLoadingMore(false);
    }, 500);
  };

  useEffect(() => {
    if (error) {
      console.error('Error fetching vehicles:', error);
      displayToast('error', 'Failed to load vehicles');
    }
  }, [error]);

  const locationRef = useRef(null);
  const pickupDateRef = useRef(null);
  const returnDateRef = useRef(null);
  const filtersRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeTab &&
        !locationRef.current?.contains(event.target) &&
        !pickupDateRef.current?.contains(event.target) &&
        !returnDateRef.current?.contains(event.target) &&
        !filtersRef.current?.contains(event.target) &&
        !event.target.closest('.expanded-panel')) {
        setActiveTab(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTab]);

  const displayToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const handleViewDetails = (vehicle) => {
    navigate(`/product/${vehicle.id}`, {
      state: { vehicleDetails: vehicle }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchVehicles = async (e) => {
    if (e) e.stopPropagation();

    try {
      // Use the cached data from react-query
      let filteredVehicles = [...(fetchedVehicles || [])].filter((vehicle) => {
        const vehiclePrice = parseFloat(vehicle.pricing?.daily || vehicle.daily || 0);

        // Price range filter
        if (vehiclePrice < minPrice || vehiclePrice > maxPrice) return false;

        // Region filter - check both region_id and region_name
        if (selectedRegion && selectedRegion !== "") {
          // If vehicle has region_id
          if (vehicle.region_id && vehicle.region_id.toString() !== selectedRegion) return false;
          // If vehicle has region_name
          if (vehicle.region_name && 
              regions.find(r => r.id === selectedRegion)?.name !== vehicle.region_name) return false;
        }

        // Brand filter
        if (selectedBrand && selectedBrand !== "" && 
            vehicle.brand_name !== selectedBrand) return false;

        // Category filter
        if (selectedCategory && selectedCategory !== "" && 
            vehicle.category_name !== selectedCategory) return false;

        // Transmission filter
        if (selectedTransmission && selectedTransmission !== "") {
          const vehicleTransmission = vehicle.transmission_name || 
                                     (vehicle.transmission === 1 ? 'Automatic' : 'Manual');
          if (selectedTransmission === "automatic" && vehicleTransmission !== "Automatic") return false;
          if (selectedTransmission === "manual" && vehicleTransmission !== "Manual") return false;
        }

        // Seats filter
        if (selectedSeats && selectedSeats !== "") {
          const vehicleSeats = vehicle.seat || 5;
          if (selectedSeats === "8") {
            if (vehicleSeats < 8) return false;
          } else {
            if (vehicleSeats !== parseInt(selectedSeats)) return false;
          }
        }

        return true;
      });

      // Apply sorting
      if (sortBy) {
        filteredVehicles.sort((a, b) => {
          switch (sortBy) {
            case "price_asc":
              return parseFloat(a.pricing?.daily || a.daily || 0) - 
                     parseFloat(b.pricing?.daily || b.daily || 0);
            case "price_desc":
              return parseFloat(b.pricing?.daily || b.daily || 0) - 
                     parseFloat(a.pricing?.daily || a.daily || 0);
            case "name_asc":
              return (a.vehicle || "").localeCompare(b.vehicle || "");
            case "name_desc":
              return (b.vehicle || "").localeCompare(a.vehicle || "");
            default:
              return 0;
          }
        });
      }

      if (filteredVehicles.length === 0) {
        displayToast('info', 'No vehicles match your criteria. Try different filters.');
      } else {
        displayToast('success', `Found ${filteredVehicles.length} vehicles`);
      }

      setAllVehicles(filteredVehicles);
      setVehicles([]);
      setLoadedVehicleIds(new Set());
      setPage(1);
      setHasMore(true);
      setIsLoadingMore(false);

      const initialVehicles = filteredVehicles.slice(0, 8);
      const initialVehicleIds = new Set(initialVehicles.map(vehicle => vehicle.id));

      setVehicles(initialVehicles);
      setLoadedVehicleIds(initialVehicleIds);
      setPage(2);
      setHasMore(filteredVehicles.length > 8);

      setShowFilters(false);
      setActiveTab(null);

    } catch (error) {
      console.error('Error filtering vehicles:', error);
      displayToast('error', 'Failed to filter vehicles');
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  const getPanelStyle = () => {
    if (!activeTab) return {};

    let ref;
    switch (activeTab) {
      case 'location': ref = locationRef.current; break;
      case 'pickupDate': ref = pickupDateRef.current; break;
      case 'returnDate': ref = returnDateRef.current; break;
      case 'filters': ref = filtersRef.current; break;
      default: return {};
    }

    if (!ref) return {};

    const rect = ref.getBoundingClientRect();
    const isMobileView = window.innerWidth <= 768;

    if (isMobileView) {
      return {
        left: '5%',
        width: '90%',
        top: `${rect.bottom + window.scrollY + 10}px`
      };
    }

    return {
      left: `${rect.left}px`,
      width: `${Math.max(300, rect.width)}px`,
      top: `${rect.bottom + window.scrollY + 10}px`
    };
  };

  const renderSearchSection = () => {
    return (
      <section className="home" id="home">
        <div className="container_for_product">
          {/* Main search bar */}
          <div className="search-bar">
            {/* Location */}
            <div
              ref={locationRef}
              className={`search-segment ${activeTab === 'location' ? 'active' : ''}`}
              onClick={() => handleTabClick('location')}
            >
              <IoLocationSharp className='search_bar_icon' />
              <div className="search-content">
                <span className="search-label">Location</span>
                <span className="search-value">
                  {selectedRegion ? 
                    regions.find(r => r.id === selectedRegion)?.name || 'Select region' 
                    : 'All Regions'}
                </span>
              </div>
            </div>

            <div className="search-divider"></div>
            {/* Filters */}
            <div
              ref={filtersRef}
              className={`search-segment ${activeTab === 'filters' ? 'active' : ''}`}
              onClick={() => handleTabClick('filters')}
            >
              <MdEventAvailable className='search_bar_icon' />
              <div className="search-content">
                <span className="search-label">Filters</span>
                <span className="search-value">
                  {[
                    selectedRegion ? regions.find(r => r.id === selectedRegion)?.name : '',
                    selectedBrand,
                    selectedTransmission ? transmissionTypes.find(t => t.id === selectedTransmission)?.name : '',
                    selectedSeats ? seatOptions.find(s => s.id === selectedSeats)?.name : '',
                    sortBy ? sortOptions.find(s => s.id === sortBy)?.name : ''
                  ].filter(Boolean).join(', ') || 'Add filters'}
                </span>
              </div>
              <button
                className="search-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSearchVehicles(e);
                }}
              >
                <FaSearch className='Check_icon' />
                <span className="search-button-text">Search</span>
              </button>
            </div>
          </div>

          {/* Conditional expanded panel */}
          {activeTab && (
            <div
              className={`expanded-panel ${activeTab}-panel`}
              style={getPanelStyle()}
            >
              {activeTab === 'location' && (
                <div className="filter-panel">
                  <h3>Select Region</h3>
                  <div className="filter-options">
                    {regions.map((region) => (
                      <button
                        key={region.id}
                        className={`filter-option ${selectedRegion === region.id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedRegion(region.id);
                          setActiveTab(null);
                        }}
                      >
                        {region.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'pickupDate' && (
                <div className="filter-panel">
                  <h3>Select Pick-up Date</h3>
                  <input
                    type="date"
                    name="pickupDate"
                    value={bookingData.pickupDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="date-input"
                  />
                  <div className="time-selection">
                    <label>Pick-up Time</label>
                    <input
                      type="time"
                      name="pickupTime"
                      value={bookingData.pickupTime}
                      onChange={handleInputChange}
                      className="time-input"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'returnDate' && (
                <div className="filter-panel">
                  <h3>Select Return Date</h3>
                  <input
                    type="date"
                    name="returnDate"
                    value={bookingData.returnDate}
                    onChange={handleInputChange}
                    min={bookingData.pickupDate || new Date().toISOString().split("T")[0]}
                    className="date-input"
                  />
                  <div className="time-selection">
                    <label>Return Time</label>
                    <input
                      type="time"
                      name="returnTime"
                      value={bookingData.returnTime}
                      onChange={handleInputChange}
                      className="time-input"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'filters' && (
                <div className="filter-panel">
                  <h3>Vehicle Filters</h3>
                  
                  {/* Brand Filter */}
                  <div className="filter-group">
                    <label>Brand</label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Brands</option>
                      {[...new Set(fetchedVehicles?.map(v => v.brand_name) || [])]
                        .filter(Boolean)
                        .map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="filter-group">
                    <label>Vehicle Type</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Categories</option>
                      {[...new Set(fetchedVehicles?.map(v => v.category_name) || [])]
                        .filter(Boolean)
                        .map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                  </div>

                  {/* Transmission Filter */}
                  <div className="filter-group">
                    <label>Transmission</label>
                    <div className="icon-options">
                      {transmissionTypes.map((type) => (
                        <button
                          key={type.id}
                          className={`icon-option ${selectedTransmission === type.id ? 'selected' : ''}`}
                          onClick={() => setSelectedTransmission(type.id)}
                          title={type.name}
                        >
                          {type.id === "automatic" ? (
                            <PiSteeringWheelFill />
                          ) : type.id === "manual" ? (
                            <TbManualGearbox />
                          ) : (
                            "All"
                          )}
                          <span className="icon-label">{type.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seats Filter */}
                  <div className="filter-group">
                    <label>Number of Seats</label>
                    <div className="seat-options">
                      {seatOptions.map((seats) => (
                        <button
                          key={seats.id}
                          className={`seat-option ${selectedSeats === seats.id ? 'selected' : ''}`}
                          onClick={() => setSelectedSeats(seats.id)}
                        >
                          {seats.name === "Any Seats" ? seats.name : seats.name.replace(" Seats", "")}
                          {seats.id !== "" && <span className="seat-icon">👥</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div className="filter-group">
                    <label>Daily Price Range</label>
                    <div className="price-range-inputs">
                      <div className="price-input-group">
                        <span className="price-label">Min:</span>
                        <input
                          type="number"
                          value={minPrice}
                          onChange={(e) => setMinPrice(Number(e.target.value))}
                          className="price-input"
                          min="0"
                          step="10"
                        />
                        <span className="price-currency">RM</span>
                      </div>
                      <div className="price-input-group">
                        <span className="price-label">Max:</span>
                        <input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(Number(e.target.value))}
                          className="price-input"
                          min="0"
                          step="10"
                        />
                        <span className="price-currency">RM</span>
                      </div>
                    </div>
                    <div className="price-range-display">
                      RM {minPrice} - RM {maxPrice}
                    </div>
                  </div>

                  {/* Sorting Filter */}
                  <div className="filter-group">
                    <label>Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="filter-select"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-actions">
                    <button
                      className="clear-filters"
                      onClick={() => {
                        setSelectedBrand("");
                        setSelectedCategory("");
                        setSelectedTransmission("");
                        setSelectedSeats("");
                        setMinPrice(0);
                        setMaxPrice(1000);
                        setSortBy("");
                      }}
                    >
                      Clear All
                    </button>
                    <button
                      className="apply-filters"
                      onClick={() => {
                        setActiveTab(null);
                        handleSearchVehicles();
                      }}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  };

  const SkeletonVehicleCard = () => {
    return (
      <div className="tour-property-item skeleton-item">
        <div className="tour-property-image-box skeleton-image-box">
          <div className="skeleton-pulse"></div>
        </div>
        <div className="tour-property-info">
          <div className="property-location skeleton-location">
            <div className="skeleton-pulse skeleton-title"></div>
            <div className="tour-property-rating skeleton-rating">
              <div className="skeleton-pulse skeleton-rating-pill"></div>
            </div>
          </div>
          <div className="skeleton-pulse skeleton-cluster"></div>
          <div className="property-details-row">
            <div className="property-price skeleton-price">
              <div className="skeleton-pulse skeleton-price-amount"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || !hasMore) return;

      const scrollPosition = window.innerHeight + window.pageYOffset;
      const documentHeight = document.documentElement.offsetHeight;

      if (documentHeight - scrollPosition < 50) {
        setIsLoadingMore(true);
        loadMoreVehicles();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoadingMore, hasMore, page]);

  // Function to get vehicle image
  const getVehicleImage = (vehicleName) => {
    if (!vehicleName) return DefaultCar;

    const vehicleNameLower = vehicleName.toLowerCase().trim();

    const vehicleImageMap = {
      'perodua myvi': PeroduaMyvi,
      'perodua axia': PeroduaAxia,
      'honda city': HondaCity,
      'toyota vios': ToyotaVios,
      'proton saga': ProtonSaga,
      'perodua alza': PeroduaAlza,
      'perodua bezza': PeroduaBezza,
      'perodua myvi (new)': PeroduaMyviNew,
      'toyota fortuner': ToyotaFortuner,
      'perodua alza (new)': PeroduaAlzaNew,
      'toyota sienta': ToyotaSienta,
      'perodua aruz': PeroduaAruz,
      'nissan urvan nv350': NissanUrvan,
    };

    const exactMatch = vehicleImageMap[vehicleNameLower];
    if (exactMatch) return exactMatch;

    for (const [key, value] of Object.entries(vehicleImageMap)) {
      if (vehicleNameLower.includes(key)) {
        return value;
      }
    }

    return DefaultCar;
  };

  return (
    <div>
      <div className="Product_Main_Container">
        <AuthProvider>
          {!showFilters && <Navbar />}
          <div className="property-container_for_product">
            {renderSearchSection()}
            <div className="header-container">
              <h2>Available Vehicles</h2>
              <Sorting
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                selectedFacilities={selectedBrands}
                setSelectedFacilities={setSelectedBrands}
                selectedPropertyTypes={selectedCategories}
                setSelectedPropertyTypes={setSelectedCategories}
                selectedBookingOptions={selectedTransmissions}
                setSelectedBookingOptions={setSelectedTransmissions}
                handleCheckAvailability={handleSearchVehicles}
              />
            </div>

            {isLoading ? (
              <div className="scrollable-container_for_product">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <SkeletonVehicleCard key={`skeleton-${index}`} />
                ))}
              </div>
            ) : (
              <div className="scrollable-container_for_product">
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle, index) => {
                    const isLast = vehicles.length === index + 1;
                    const dailyPrice = vehicle.pricing?.daily || vehicle.daily || 0;
                    
                    return (
                      <div
                        ref={isLast ? lastVehicleElementRef : null}
                        className="tour-property-item"
                        key={vehicle.id}
                        onClick={() => handleViewDetails(vehicle)}
                      >
                        <div className="tour-property-image-box">
                          <img
                            src={getVehicleImage(vehicle.vehicle)}
                            alt={vehicle.vehicle}
                          />
                        </div>
                        <div className="tour-property-info">
                          <div className="property-location">
                            <h4>{vehicle.vehicle || vehicle.vehicle_name}</h4>
                            <div className="tour-property-rating">
                              <span className="rating-badge">
                                {vehicle.seat || 5} Seats
                              </span>
                            </div>
                          </div>
                          <span className="property-cluster">
                            {vehicle.transmission_name || (vehicle.transmission === 1 ? 'Automatic' : 'Manual')}
                          </span>
                          <div className="property-details-row">
                            <div className="property-price">
                              <span className="price-amount">RM{dailyPrice}</span>
                              <span className="price-period">/day</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="no-properties-message">No vehicles available.</p>
                )}

                {isLoadingMore && hasMore && [1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <SkeletonVehicleCard key={`loading-more-skeleton-${index}`} />
                ))}
              </div>
            )}
          </div>

          {showToast && <Toast type={toastType} message={toastMessage} />}
          <br /><br /><br /><br /><br /><br />
          <Back_To_Top_Button />
          <TawkMessenger />
          <Footer />
        </AuthProvider>
      </div>
    </div>
  );
};

export default Product;