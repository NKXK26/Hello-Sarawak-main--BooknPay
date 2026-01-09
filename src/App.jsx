import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './Pages/customer/Home/Home';
import Login from './Pages/customer/Login/Login';
import Register from './Pages/customer/Register/Register';
import ModeratorDashboard from './Pages/moderator/ModeratorDashboard';
import AdminDashboard from './Pages/administrator/AdminDashboard';
import OwnerDashboard from './Pages/cams_owner/OwnerDashboard';
import AboutSarawak from './Pages/customer/About_Sarawak/about_sarawak';
import Product from './Pages/customer/Product/product';
import PropertyDetails from './Pages/customer/PropertyDetails/PropertyDetails';
import Cart from './Pages/customer/Cart/cart';
import AboutUs from './Pages/customer/About_us/About_Us';
import NoAccess from './Component/NoAccess/NoAccess';
import Error from './Component/Error_404/Error';
import Profile from './Pages/customer/Profile/Profile';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/register', element: <Register /> },
  { path: '/login', element: <Login /> },

  // Customer routes
  { path: '/home', element: <Home /> },
  { path: '/about_sarawak', element: <AboutSarawak /> },
  { path: '/product', element: <Product /> },
  { path: '/product/:propertyid', element: <PropertyDetails /> },
  { path: '/cart', element: <Cart /> },
  { path: '/about_us', element: <AboutUs /> },
  { path: '/profile', element: <Profile /> },

  // Administrator
  { path: '/administrator_dashboard/*', element: <AdminDashboard /> },

  // Moderator
  { path: '/moderator_dashboard/*', element: <ModeratorDashboard /> },

  // Owner
  { path: '/owner_dashboard/*', element: <OwnerDashboard /> },

  // No Access
  { path: '/no-access', element: <NoAccess /> },

  // Error 404
  { path: '*', element: <Error /> },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
