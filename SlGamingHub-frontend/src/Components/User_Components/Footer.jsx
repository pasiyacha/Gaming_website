import React from "react";
import fb from "../../assets/Banner/Facebook.png";
import wa from "../../assets/Banner/WhatsApp.png";
const Footer = () => {
  return (
    <div className=" p-6">
    <footer className="bg-orange-400 rounded-2xl text-white mt-10 p-6">
      {/* Contact Section */}
      <h2 className="text-3xl p-4 font-bold text-center">Contact Us</h2>
      <p className="text-lg font-bold text-center">077 304 3667</p>
      <p className="text-lg font-bold text-center">slgaminghub09@gmail.com</p>

      {/* Social Media Icons */}
      <div className="flex justify-center gap-6 mt-4">
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={fb}
            alt="Facebook"
            className="w-12 h-12 hover:scale-110 transition duration-300"
          />
        </a>
        
        <a
          href="https://wa.me/+94773043667?text=Hi!_I_need_help_with_SLGamingHub_ID_Topup_Center_services.*"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={wa}
            alt="WhatsApp"
            className="w-12 h-12 hover:scale-110 transition duration-300"
          />
        </a>
      </div>

      {/* Message Section */}
      <div className="mt-6 text-lg font-bold text-center pb-6">
        <p>Thank you for visiting SL Gaming Hub</p>
        <p>We hope you find the perfect package for your gaming needs!</p>
        <p>Happy Gaming!</p>
      </div>
    </footer>
    </div>
  );
};

export default Footer;
