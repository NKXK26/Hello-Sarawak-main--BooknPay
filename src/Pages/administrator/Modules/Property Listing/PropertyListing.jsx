import React, { useState, useEffect } from 'react';
import { 
    fetchVehicles, 
    updateVehicleStatus, 
    deleteVehicle, 
    createVehicle,
    updateVehicle,
    fetchBrands,
    fetchCategories,
    fetchRegions
} from '../../../../../Api/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ActionDropdown from '../../../../Component/ActionDropdown/ActionDropdown';
import Modal from '../../../../Component/Modal/Modal';
import SearchBar from '../../../../Component/SearchBar/SearchBar';
import Filter from '../../../../Component/Filter/Filter';
import PaginatedTable from '../../../../Component/PaginatedTable/PaginatedTable';
import Toast from '../../../../Component/Toast/Toast';
import Alert from '../../../../Component/Alert/Alert';
import Loader from '../../../../Component/Loader/Loader';
import Status from '../../../../Component/Status/Status';
import VehicleForm from '../../../../Component/VehicleForm/VehicleForm'; // Create this component
import { FaEye, FaEdit, FaTrash, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import '../../../../Component/MainContent/MainContent.css';
import '../Property Listing/PropertyListing.css';

const PropertyListing = () => {
    const [searchKey, setSearchKey] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedBrand, setSelectedBrand] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedRegion, setSelectedRegion] = useState('All');
    const [appliedFilters, setAppliedFilters] = useState({ 
        status: 'All', 
        brand: 'All',
        category: 'All',
        region: 'All'
    });
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    
    const queryClient = useQueryClient();
    
    // Use React Query to fetch vehicles
    const { data, isLoading, error } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => fetchVehicles(),
        select: (data) => ({
            vehicles: data?.data || [],
            totalCount: data?.count || 0,
            brands: [...new Set(data?.data?.map(v => v.brand_name).filter(Boolean))],
            categories: [...new Set(data?.data?.map(v => v.category_name).filter(Boolean))],
            regions: [...new Set(data?.data?.map(v => v.region_name).filter(Boolean))]
        }),
        staleTime: 30 * 60 * 1000,
        refetchInterval: 10000,
    });

    // Fetch brands, categories, and regions for the form
    const { data: brandsData } = useQuery({
        queryKey: ['brands'],
        queryFn: () => fetchBrands(),
        select: (data) => data?.data || [],
    });

    const { data: categoriesData } = useQuery({
        queryKey: ['categories'],
        queryFn: () => fetchCategories(),
        select: (data) => data?.data || [],
    });

    const { data: regionsData } = useQuery({
        queryKey: ['regions'],
        queryFn: () => fetchRegions(),
        select: (data) => data?.data || [],
    });
    
    // Extract data from query result
    const vehicles = data?.vehicles || [];
    const totalCount = data?.totalCount || 0;
    const brands = brandsData || [];
    const categories = categoriesData || [];
    const regions = regionsData || [];

    const displayToast = (type, message) => {
        setToastType(type);
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
    };

    // React Query mutation for creating vehicle
    const createVehicleMutation = useMutation({
        mutationFn: async (vehicleData) => {
            return createVehicle(vehicleData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            displayToast('success', 'Vehicle created successfully');
            setIsVehicleFormOpen(false);
            setEditingVehicle(null);
        },
        onError: (error) => {
            console.error('Failed to create vehicle', error);
            displayToast('error', 'Failed to create vehicle');
        }
    });

    // React Query mutation for updating vehicle
    const updateVehicleMutation = useMutation({
        mutationFn: async ({ id, vehicleData }) => {
            return updateVehicle(id, vehicleData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
            displayToast('success', 'Vehicle updated successfully');
            setIsVehicleFormOpen(false);
            setEditingVehicle(null);
        },
        onError: (error) => {
            console.error('Failed to update vehicle', error);
            displayToast('error', 'Failed to update vehicle');
        }
    });
  
    // React Query mutation for deleting vehicle
    const deleteMutation = useMutation({
        mutationFn: async (vehicleId) => {
            return deleteVehicle(vehicleId);
        },
        onSuccess: () => {
            displayToast('success', 'Vehicle deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        },
        onError: (error) => {
            console.error('Failed to delete vehicle', error);
            displayToast('error', 'Failed to delete vehicle');
        },
        onSettled: () => {
            setIsDialogOpen(false);
            setVehicleToDelete(null);
        }
    });

    const handleAction = async (action, vehicle) => {
        try {
            if (action === 'view') {
                setSelectedVehicle({
                    id: vehicle.id || 'N/A',
                    brand_name: vehicle.brand_name || 'N/A',
                    category_name: vehicle.category_name || 'N/A',
                    region_name: vehicle.region_name || 'N/A',
                    photo: vehicle.photo || 'N/A',
                    vehicle: vehicle.vehicle || 'N/A',
                    seat: vehicle.seat || 'N/A',
                    transmission_name: vehicle.transmission_name || 'N/A',
                    pricing: vehicle.pricing || {},
                    hourly: vehicle.pricing?.hourly || 0,
                    daily: vehicle.pricing?.daily || 0,
                    weekly: vehicle.pricing?.weekly || 0,
                    monthly: vehicle.pricing?.monthly || 0,
                    cdw: vehicle.pricing?.cdw || 0,
                    status: vehicle.status === 1 ? 'Available' : 'Unavailable',
                    position: vehicle.position || 0,
                    seo_keyword: vehicle.seo_keyword || 'N/A',
                    seo_description: vehicle.seo_description || 'N/A',
                    created: vehicle.created || 'N/A',
                    modified: vehicle.modified || 'N/A'
                });
            } else if (action === 'edit') {
                if (vehicle.status === 1) {
                    displayToast('error', 'You need to disable the vehicle first before editing.');
                    return;
                }
                setEditingVehicle(vehicle);
                setIsVehicleFormOpen(true);
            } else if (action === 'accept' || action === 'enable') {
                await acceptMutation.mutateAsync(vehicle.id);
            } else if (action === 'reject' || action === 'disable') {
                await rejectMutation.mutateAsync(vehicle.id);
            } else if (action === 'delete') {
                if (vehicle.status !== 1) {
                    setVehicleToDelete(vehicle.id);
                    setIsDialogOpen(true);
                } else {
                    displayToast('error', 'You cannot delete an active vehicle. Disable it first.');
                }
            } 
        } catch (error) {
            console.error('Error handling action:', error);
            displayToast('error', 'An error occurred while processing your request.');
        }
    };

    // Handle form submission for creating/updating vehicle
    const handleVehicleSubmit = async (formData) => {
        try {
            if (editingVehicle) {
                // Update existing vehicle
                await updateVehicleMutation.mutateAsync({
                    id: editingVehicle.id,
                    vehicleData: formData
                });
            } else {
                // Create new vehicle
                await createVehicleMutation.mutateAsync(formData);
            }
        } catch (error) {
            console.error('Error saving vehicle:', error);
        }
    };
    
    const handleDeleteVehicle = async () => {
        try {
            const vehicle = vehicles.find((v) => v.id === vehicleToDelete);

            if (!vehicle) {
                displayToast('error', 'Vehicle not found. Please refresh the page and try again.');
                setIsDialogOpen(false);
                setVehicleToDelete(null);
                return;
            }

            if (vehicle.status === 1) {
                displayToast('error', 'Only unavailable vehicles can be deleted.');
                setIsDialogOpen(false);
                setVehicleToDelete(null);
                return;
            }
            
            const hasReservation = reservationsQuery.some(reservation => reservation.vehicle_id === vehicleToDelete);

            if (hasReservation) {
                displayToast('error', 'This vehicle has an existing reservation and cannot be deleted.');
                setIsDialogOpen(false);
                setVehicleToDelete(null);
                return;
            }

            deleteMutation.mutate(vehicleToDelete);
        } catch (error) {
            console.error('Failed to delete vehicle:', error);
            displayToast('error', 'Failed to delete vehicle. Please try again.');
            setIsDialogOpen(false);
            setVehicleToDelete(null);
        }
    };

    const handleApplyFilters = () => {
        setAppliedFilters({ 
            status: selectedStatus,
            brand: selectedBrand,
            category: selectedCategory,
            region: selectedRegion
        });
    };

    const filters = [
        {
            name: 'status',
            label: 'Status',
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
                { value: 'All', label: 'All Statuses' },
                { value: 'Available', label: 'Available' },
                { value: 'Unavailable', label: 'Unavailable' },
            ],
        },
        {
            name: 'brand',
            label: 'Brand',
            value: selectedBrand,
            onChange: setSelectedBrand,
            options: [
                { value: 'All', label: 'All Brands' },
                ...brands.map(brand => ({ value: brand.name, label: brand.name }))
            ],
        },
        {
            name: 'category',
            label: 'Category',
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
                { value: 'All', label: 'All Categories' },
                ...categories.map(category => ({ value: category.name, label: category.name }))
            ],
        },
        {
            name: 'region',
            label: 'Region',
            value: selectedRegion,
            onChange: setSelectedRegion,
            options: [
                { value: 'All', label: 'All Regions' },
                ...regions.map(region => ({ value: region.name, label: region.name }))
            ],
        },
    ];

    const displayLabels = {
        id: "Vehicle ID",
        brand_name: "Brand",
        category_name: "Category",
        region_name: "Region",
        photo: "Image",
        vehicle: "Vehicle Name",
        seat: "Seats",
        transmission_name: "Transmission",
        pricing: "Pricing Information",
        hourly: "Hourly Rate",
        daily: "Daily Rate",
        weekly: "Weekly Rate",
        monthly: "Monthly Rate",
        cdw: "CDW (Collision Damage Waiver)",
        status: "Status",
        position: "Display Position",
        seo_keyword: "SEO Keywords",
        seo_description: "SEO Description",
        created: "Created Date",
        modified: "Last Modified"
    };

    const filteredVehicles = vehicles.filter((vehicle) => {
        const statusMatch =
            appliedFilters.status === 'All' ||
            (vehicle.status === 1 ? 'Available' : 'Unavailable') === appliedFilters.status;

        const brandMatch =
            appliedFilters.brand === 'All' ||
            vehicle.brand_name === appliedFilters.brand;

        const categoryMatch =
            appliedFilters.category === 'All' ||
            vehicle.category_name === appliedFilters.category;

        const regionMatch =
            appliedFilters.region === 'All' ||
            vehicle.region_name === appliedFilters.region;

        const searchInFields =
            `${vehicle.id} ${vehicle.vehicle} ${vehicle.brand_name} ${vehicle.category_name} ${vehicle.region_name} ${vehicle.seat} ${vehicle.transmission_name}`
                .toLowerCase()
                .includes(searchKey.toLowerCase());

        return statusMatch && brandMatch && categoryMatch && regionMatch && searchInFields;
    });

    const vehicleDropdownItems = (vehicle, usergroup) => {
        const { status } = vehicle;
        const isAdmin = usergroup === 'Administrator';

        if (isAdmin) {
            if (status === 1) { // Available
                return [
                    { label: 'View Details', icon: <FaEye />, action: 'view' },
                    { label: 'Disable', icon: <FaTimes />, action: 'disable' },
                ];
            } else { // Unavailable
                return [
                    { label: 'View Details', icon: <FaEye />, action: 'view' },
                    { label: 'Edit', icon: <FaEdit />, action: 'edit' },
                    { label: 'Enable', icon: <FaCheck />, action: 'enable' },
                    { label: 'Delete', icon: <FaTrash />, action: 'delete' },
                ];
            }
        }

        // For non-admins (view only)
        return [{ label: 'View Details', icon: <FaEye />, action: 'view' }];
    };
    
    const usergroup = localStorage.getItem('usergroup'); 

    const columns = [
        { header: 'ID', accessor: 'id' },
        {
            header: 'Image',
            accessor: 'photo',
            render: (vehicle) => (
                vehicle.photo ? (
                    <img
                        src={vehicle.photo}
                        alt={vehicle.vehicle}
                        style={{ width: 80, height: 80, objectFit: 'cover' }}
                    />
                ) : (
                    <span>No Image</span>
                )
            ),
        },
        { header: 'Vehicle', accessor: 'vehicle' },
        { header: 'Brand', accessor: 'brand_name' },
        { header: 'Category', accessor: 'category_name' },
        { header: 'Region', accessor: 'region_name' },
        { header: 'Seats', accessor: 'seat' },
        { header: 'Transmission', accessor: 'transmission_name' },
        { 
            header: 'Daily Price', 
            accessor: (vehicle) => `$${(vehicle.pricing?.daily || 0).toFixed(2)}` 
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (vehicle) => (
                <Status value={vehicle.status === 1 ? 'Available' : 'Unavailable'} />
            ),
        },
        {
            header: 'Actions',
            accessor: 'actions',
            render: (vehicle) => (
                <ActionDropdown
                    items={vehicleDropdownItems(vehicle, usergroup)}
                    onAction={(action) => handleAction(action, vehicle)}
                />
            ),
        },
    ];

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handlePageSizeChange = (newPageSize) => {
        setPageSize(newPageSize);
        setPage(1);
    };

    const handleCloseModal = () => {
        setSelectedVehicle(null);
    };

    // Handle opening the vehicle form for creating new vehicle
    const handleAddNewVehicle = () => {
        setEditingVehicle(null);
        setIsVehicleFormOpen(true);
    };

    // Close vehicle form
    const handleCloseVehicleForm = () => {
        setIsVehicleFormOpen(false);
        setEditingVehicle(null);
    };

    return (
        <div>
            <div className="header-container">
                <h1 className="dashboard-page-title">Vehicle Listings</h1>
                <SearchBar 
                    value={searchKey} 
                    onChange={(newValue) => setSearchKey(newValue)} 
                    placeholder="Search vehicles..." 
                />
            </div>

            <Filter filters={filters} onApplyFilters={handleApplyFilters} />

            <button
                className="create-property-button"
                onClick={handleAddNewVehicle}
            >
                <FaPlus style={{ marginRight: '8px' }} />
                Add New Vehicle
            </button>

            {isLoading ? (
                <div className="loader-box">
                    <Loader />
                </div>
            ) : error ? (
                <div className="error-message">
                    Error loading vehicles. Please try again.
                </div>
            ) : (
                <PaginatedTable
                    data={filteredVehicles}
                    columns={columns}
                    rowKey="id"
                    currentPage={page}
                    pageSize={pageSize}
                    totalCount={filteredVehicles.length}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                />
            )}

            {/* View Details Modal */}
            <Modal
                isOpen={!!selectedVehicle}
                title={'Vehicle Details'}
                data={selectedVehicle || {}}
                labels={displayLabels}
                onClose={handleCloseModal}
            />

            {/* Vehicle Form Modal */}
            {isVehicleFormOpen && (
                <VehicleForm
                    isOpen={isVehicleFormOpen}
                    onClose={handleCloseVehicleForm}
                    onSubmit={handleVehicleSubmit}
                    initialData={editingVehicle}
                    brands={brands}
                    categories={categories}
                    regions={regions}
                    title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                />
            )}

            <Alert
                isOpen={isDialogOpen}
                title="Confirm Delete"
                message="Are you sure you want to delete this vehicle? This action cannot be undone."
                onConfirm={handleDeleteVehicle}
                onCancel={() => setIsDialogOpen(false)}
            />

            {showToast && <Toast type={toastType} message={toastMessage} />}
        </div>
    );
};

export default PropertyListing;