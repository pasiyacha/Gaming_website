import React from "react";
import bannerImage from "./../../assets/Banner/banner.jpg";
import Header from "../../Components/User_Components/Header";
import GameSection from "../../Components/User_Components/GameSection";
import Footer from "../../Components/User_Components/Footer"
const Home = () => {
  return (
    <div className="bg-blue-950 min-h-screen text-black">
      {/* Header */}
      <Header />

      {/* Banner Section */}
      <div className="w-full overflow-hidden">
          <img
            src={bannerImage}
            alt="SL Gaming Hub Banner"
            className="w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[550px] object-cover pt-4 sm:pt-6 md:pt-8 lg:pt-10 px-2 sm:px-4 md:px-8 lg:px-70"
          />
      </div>

      {/* Game Section */}
      <div className="max-w-7xl mx-auto p-6">
        <GameSection />
      </div>

      {/* Payment Methods & Information Section */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-yellow-300">Payment & Support Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Store Hours */}
            <div className="border-b md:border-b-0 md:border-r border-blue-500 pb-6 md:pb-0 pr-0 md:pr-6">
              <h3 className="text-xl font-bold mb-4 text-yellow-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Store Hours
              </h3>
              <div className="bg-blue-800 bg-opacity-50 p-4 rounded-lg">
                <p className="text-xl font-semibold mb-2">6:00 AM - 10:00 PM</p>
                <p className="text-sm text-blue-200">
                  We're open every day including weekends and holidays.
                  <br />
                  Orders placed outside store hours will be processed the next day.
                </p>
              </div>
            </div>
            
            {/* eZcash Payment */}
            <div className="border-b md:border-b-0 md:border-r border-blue-500 pb-6 md:pb-0 px-0 md:px-6">
              <h3 className="text-xl font-bold mb-4 text-green-300 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                eZcash Payment 
                <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </h3>
              <div className="bg-green-800 bg-opacity-40 p-4 rounded-lg">
                <p className="text-sm mb-3">
                  Fast payment processing with eZcash! Send payment to either of our eZcash numbers:
                </p>
                <div className="flex items-center mt-3 bg-green-700 bg-opacity-30 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-green-300 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
                  </svg>
                  <span className="font-mono text-green-100 font-bold">0773043667</span>
                </div>
                <div className="flex items-center mt-2 bg-green-700 bg-opacity-30 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-green-300 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
                  </svg>
                  <span className="font-mono text-green-100 font-bold">0741880764</span>
                </div>
              </div>
            </div>
            
            {/* Customer Support */}
            <div className="pl-0 md:pl-6">
              <h3 className="text-xl font-bold mb-4 text-yellow-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Customer Support
              </h3>
              <div className="bg-blue-800 bg-opacity-50 p-4 rounded-lg">
                <p className="text-sm mb-3">
                  ඔබ මිලදී ගත් Product එකේ හෝ Quantity වල ගැටලුවක් ඇත්නම් හෝ එක නොලැබුනේ නම් අපගේ WhatsApp number එකට message එක එවීමෙන් Check කර ගත හැකිය.
                </p>
                <div className="flex items-center mt-3 bg-blue-700 bg-opacity-30 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
                  </svg>
                  <a href="https://wa.me/+94773043667?text=Hi!_I_need_help_with_SLGamingHub_ID_Topup_Center_services.*" className="text-white hover:text-green-300 font-medium" target="_blank" rel="noopener noreferrer">
                    +94 77 304 3667
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
