import { BrowserRouter, Route, Routes } from "react-router-dom";
import Register from "../Components/User_Components/Register";
import LoginForm from "../Components/User_Components/LoginForm";
import Reset from "../Components/User_Components/Reset"; 
import DefaultLayout from "../Layout/defaultLayout";
import AuthLayout from "../Layout/authLayout";
import Order from "../Pages/Admin_Dashbord/Orders";
import Bank from "../Pages/Admin_Dashbord/Bank_Detail";
import Package from "../Pages/Admin_Dashbord/Package";
import Users from "../Pages/Admin_Dashbord/Users";
import Games from "../Pages/Admin_Dashbord/Games";
import Home from "../Pages/User Page/Home";
import FreeFireSGTopUp from "../Pages/TopUp/FreeFireSGTopUp";
import FreeFireIndonesiaTopUp from "../Pages/TopUp/FreeFireIndonesiaTopUp";
import PUBGMobileTopUp from "../Pages/TopUp/PUBGMobileTopUp";
import CheckoutPage from "../Pages/TopUp/CheckoutPage";
import ProtectedRoute from "./ProtectedRoute";


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes with auth layout */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="register" element={<Register />} />
          <Route path="login" element={<LoginForm />} />
          <Route path="reset" element={<Reset />} />
        </Route>

        {/* Public routes */}
        <Route path="/" element={<Home />} /> 
        
        {/* Specialized Top-Up routes */}
        <Route path="/topup/freefire-sg" element={<FreeFireSGTopUp />} />
        <Route path="/topup/freefire-indonesia" element={<FreeFireIndonesiaTopUp />} />
        <Route path="/topup/pubg-mobile" element={<PUBGMobileTopUp />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        
        {/* admin dashboard with nested routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <DefaultLayout />
          </ProtectedRoute>
        }>
          <Route path="Order" element={<Order />} />
          <Route path="Games" element={<Games />} />
          <Route path="Package" element={<Package />} />
          <Route path="Users" element={<Users />} />
          <Route path="Bank_Details" element={<Bank />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}