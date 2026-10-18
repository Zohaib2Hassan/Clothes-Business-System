import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Splash from './screens/auth/Splash';
import Onboarding from './screens/auth/Onboarding';
import CreateAccount from './screens/auth/CreateAccount';
import Login from './screens/auth/Login';
import SetupBusiness from './screens/auth/SetupBusiness';
import MainLayout from './components/MainLayout';
import Dashboard from './screens/main/Dashboard';
import Settings from './screens/main/Settings';
import Products from './screens/inventory/Products';
import AddProduct from './screens/inventory/AddProduct';
import ProductDetails from './screens/inventory/ProductDetails';
import FilterSort from './screens/inventory/FilterSort';
import Inventory from './screens/inventory/Inventory';
import Sales from './screens/sales/Sales';
import AddSale from './screens/sales/AddSale';
import POSScreen from './screens/sales/POSScreen';
import Customers from './screens/sales/Customers';
import CustomerProfile from './screens/sales/CustomerProfile';
import Expenses from './screens/sales/Expenses';
import Analytics from './screens/analytics/Analytics';
import AIAssistant from './screens/analytics/AIAssistant';
import Reports from './screens/analytics/Reports';
import Predictions from './screens/analytics/Predictions';
import Subscription from './screens/main/Subscription';

// Protected route wrapper - redirects to login if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-brand-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/register" element={<CreateAccount />} />
      <Route path="/login" element={<Login />} />
      <Route path="/setup" element={<SetupBusiness />} />

      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/pos" element={<POSScreen />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/add" element={<AddProduct />} />
        <Route path="/products/filter" element={<FilterSort />} />
        <Route path="/products/:id/edit" element={<ProductDetails />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        
        <Route path="/inventory" element={<Inventory />} />
        
        <Route path="/sales" element={<Sales />} />
        <Route path="/sales/add" element={<AddSale />} />
        
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerProfile />} />
        
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/predictions" element={<Predictions />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Settings />} />
        <Route path="/subscription" element={<Subscription />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
