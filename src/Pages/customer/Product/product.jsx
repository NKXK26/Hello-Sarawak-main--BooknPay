import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import Components
import Navbar from '../../../Component/Navbar/navbar';
import Footer from '../../../Component/Footer/footer';
import Back_To_Top_Button from '../../../Component/Back_To_Top_Button/Back_To_Top_Button';
import Toast from '../../../Component/Toast/Toast';
import ImageSlider from '../../../Component/ImageSlider/ImageSlider';
import TawkMessenger from '../../../Component/TawkMessenger/TawkMessenger';
import { AuthProvider } from '../../../Component/AuthContext/AuthContext';
import Sorting from '../../../Component/Sorting/Sorting';

// Import API
import { fetchProduct } from '../../../../Api/api';

// Import React Icons and CSS
import { FaStar, FaSearch } from 'react-icons/fa';
import { HiUsers } from "react-icons/hi2";
import { CiCalendarDate } from "react-icons/ci";
import { IoLocationSharp } from "react-icons/io5";
import './product.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const Product = () => {
  const [vehicles, setVehicles] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('');
  const [selectedRegion, setSelectedRegion] = useState("");
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
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortOrder, setSortOrder] = useState("none");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTransmission, setSelectedTransmission] = useState([]);
  const observer = useRef();

  // Sample regions - you might want to fetch these from API
  const regions = [
    "Kuala Lumpur",
    "Selangor",
    "Penang",
    "Johor",
    "Melaka",
    "Negeri Sembilan",
    "Pahang",
    "Perak",
    "Kedah",
    "Kelantan",
    "Terengganu",
    "Perlis",
    "Sabah",
    "Sarawak"
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

  // Use React Query to fetch vehicles
  const { data: fetchedVehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchProduct,
  });

  // Set all vehicles when data is fetched
  useEffect(() => {
    console.log('Fetched vehicles:', fetchedVehicles); // Debug log
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

  // Show error toast if fetching fails
  useEffect(() => {
    if (error) {
      console.error('Error fetching vehicles:', error);
      displayToast('error', 'Failed to load vehicles');
    }
  }, [error]);

  // Create refs for search segments
  const locationRef = useRef(null);
  const pickupDateRef = useRef(null);
  const returnDateRef = useRef(null);
  const timeRef = useRef(null);

  // Handle window resize
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
        !timeRef.current?.contains(event.target) &&
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
      const fetchedVehs = fetchedVehicles || await queryClient.fetchQuery({
        queryKey: ['vehicles'],
        queryFn: fetchProduct
      });

      let filteredVehicles = fetchedVehs.filter((vehicle) => {
        const vehiclePrice = parseFloat(vehicle.pricing?.daily || vehicle.daily || 0);

        // Filter by price range if set
        if (vehiclePrice < priceRange.min || vehiclePrice > priceRange.max) return false;

        // Filter by region
        if (selectedRegion && vehicle.region !== selectedRegion) return false;

        // Filter by selected brands
        if (selectedBrands.length > 0 && !selectedBrands.includes(vehicle.brand)) {
          return false;
        }

        // Filter by selected categories
        if (selectedCategories.length > 0 && !selectedCategories.includes(vehicle.category)) {
          return false;
        }

        // Filter by transmission
        if (selectedTransmission.length > 0) {
          const transValue = vehicle.transmission === 1 ? 'Automatic' : 'Manual';
          if (!selectedTransmission.includes(transValue)) {
            return false;
          }
        }

        return true;
      });

      // Sort by price if requested
      if (sortOrder === "asc") {
        filteredVehicles.sort((a, b) =>
          parseFloat(a.pricing?.daily || a.daily || 0) - parseFloat(b.pricing?.daily || b.daily || 0)
        );
      } else if (sortOrder === "desc") {
        filteredVehicles.sort((a, b) =>
          parseFloat(b.pricing?.daily || b.daily || 0) - parseFloat(a.pricing?.daily || a.daily || 0)
        );
      }

      if (filteredVehicles.length === 0) {
        displayToast('error', 'No available vehicles match your criteria');
      } else {
        displayToast('success', `Found ${filteredVehicles.length} available vehicles`);
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
      case 'time': ref = timeRef.current; break;
      default: return {};
    }

    if (!ref) return {};

    const rect = ref.getBoundingClientRect();

    if (activeTab === 'time') {
      return { right: '8px', left: 'auto' };
    }

    return {
      left: `${ref.offsetLeft}px`,
      width: isMobile ? '90%' : `${Math.max(280, rect.width)}px`
    };
  };

  const renderSearchSection = () => {
    return (
      <section className="home" id="home">
        <div className="container_for_product">

          {/* Main search bar */}
          <div className="search-bar">
            <div
              ref={locationRef}
              className={`search-segment ${activeTab === 'location' ? 'active' : ''}`}
              onClick={() => handleTabClick('location')}
            >
              <IoLocationSharp className='search_bar_icon' />
              <div className="search-content">
                <span className="search-label">Pick-up Location</span>
                <span className="search-value">
                  {selectedRegion || 'Select region'}
                </span>
              </div>
            </div>

            <div className="search-divider"></div>

            <div
              ref={pickupDateRef}
              className={`search-segment ${activeTab === 'pickupDate' ? 'active' : ''}`}
              onClick={() => handleTabClick('pickupDate')}
            >
              <CiCalendarDate className='search_bar_icon' />
              <div className="search-content">
                <span className="search-label">Pick-up Date</span>
                <span className="search-value">
                  {bookingData.pickupDate || 'Select date'}
                </span>
              </div>
            </div>

            <div className="search-divider"></div>

            <div
              ref={returnDateRef}
              className={`search-segment ${activeTab === 'returnDate' ? 'active' : ''}`}
              onClick={() => handleTabClick('returnDate')}
            >
              <CiCalendarDate className='search_bar_icon' />
              <div className="search-content">
                <span className="search-label">Return Date</span>
                <span className="search-value">
                  {bookingData.returnDate || 'Select date'}
                </span>
              </div>
            </div>

            <div className="search-divider"></div>

            <div
              ref={timeRef}
              className={`search-segment ${activeTab === 'time' ? 'active' : ''}`}
              onClick={() => handleTabClick('time')}
            >
              <HiUsers className='search_bar_icon' />
              <div className="search-content">
                <span className="search-label">Time</span>
                <span className="search-value">
                  {bookingData.pickupTime} - {bookingData.returnTime}
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
                <div>
                  <h3>Select Region</h3>
                  <RegionSelector
                    selectedRegion={selectedRegion}
                    setSelectedRegion={setSelectedRegion}
                    regions={regions}
                  />
                </div>
              )}

              {activeTab === 'pickupDate' && (
                <div>
                  <h3>Select Pick-up Date</h3>
                  <input
                    type="date"
                    name="pickupDate"
                    value={bookingData.pickupDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="date-input"
                  />
                </div>
              )}

              {activeTab === 'returnDate' && (
                <div>
                  <h3>Select Return Date</h3>
                  <input
                    type="date"
                    name="returnDate"
                    value={bookingData.returnDate}
                    onChange={handleInputChange}
                    min={bookingData.pickupDate || new Date().toISOString().split("T")[0]}
                    className="date-input"
                  />
                </div>
              )}

              {activeTab === 'time' && (
                <div>
                  <h3>Select Time</h3>
                  <div className="time-selection">
                    <div className="time-input-group">
                      <label>Pick-up Time</label>
                      <input
                        type="time"
                        name="pickupTime"
                        value={bookingData.pickupTime}
                        onChange={handleInputChange}
                        className="time-input"
                      />
                    </div>
                    <div className="time-input-group">
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
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  };

  const RegionSelector = ({ selectedRegion, setSelectedRegion, regions }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="cluster-selector">
        <div
          className="cluster-selector-header"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="cluster-label">
            {selectedRegion || "Select Region"}
          </span>
          <i className="cluster-icon">
            {isOpen ? "↑" : "↓"}
          </i>
        </div>

        {isOpen && (
          <div className="cluster-options">
            {regions.map((region, index) => (
              <div
                key={index}
                className={`cluster-option ${selectedRegion === region ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedRegion(region);
                  setIsOpen(false);
                }}
              >
                <span className="cluster-name">{region}</span>
                {selectedRegion === region && (
                  <span className="check-icon">✓</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
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

  // Add scroll handler
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

  return (
    <div>
      <div className="Product_Main_Container">
        <AuthProvider>
          {!showFilters && <Navbar />}
          <br /><br /><br />

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
                selectedBookingOptions={selectedTransmission}
                setSelectedBookingOptions={setSelectedTransmission}
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
                    const getVehicleImage = (vehicleName) => {

                      // Use lowercase and consistent naming
                      const vehicleNameLower = vehicleName.toLowerCase().trim();

                      // Map vehicle names to image paths - use relative paths from public folder
                      const vehicleImageMap = {
                        'perodua myvi': '/public/Perodua Myvi.png',
                        'perodua axia': '/public/Perodua Axia.png',
                        'honda city': '/public/Honda City.png',
                        'toyota vios': '/public/Toyota Vios.png',
                        'proton saga': '/public/Proton Saga.png',
                        'perodua alza': '/public/Perodua Alza.png',
                        'perodua bezza': '/public/Perodua Bezza.png',
                        'perodua myvi (new)': '/public/Perodua Myvi (New).png',
                        'toyota fortuner': '/public/Toyota Fortuner.png',
                        'perodua alza (new)': '/public/Perodua Alza (New).png',
                        'toyota sienta': '/public/Toyota Sienta.png',
                        'perodua aruz': '/public/Perodua Aruz.png',
                        'nissan urvan nv350': '/public/Nissan Urvan NV350.png',
                      };

                      // Try exact match first, then check for partial matches
                      const exactMatch = vehicleImageMap[vehicleNameLower];
                      if (exactMatch) return exactMatch;

                      // Check for partial matches (e.g., "Myvi" in "Perodua Myvi 2023")
                      for (const [key, value] of Object.entries(vehicleImageMap)) {
                        if (vehicleNameLower.includes(key)) {
                          return value;
                        }
                      }
                    };
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
                            <span className="vehicle-features">
                              • CDW: RM{vehicle.pricing?.cdw || vehicle.cdw || 0}
                            </span>
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