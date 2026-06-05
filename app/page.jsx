'use client'
import React from "react";
import HeaderSlider from "@/components/HeaderSlider";
import HomeProducts from "@/components/HomeProducts";
import Banner from "@/components/Banner";
import NewsLetter from "@/components/NewsLetter";
import { OpportunitiesPreview as FeaturedProduct } from "@/components/FeaturedProduct";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HowItWorksSection from "@/components/howitworks";

const Home = () => {
  return (
    <>
     
      <div className="">
        <HeaderSlider />
        <HowItWorksSection />
        <HomeProducts />
        <FeaturedProduct />
        <Banner />
        <NewsLetter />
      </div>
 
    </>
  );
};

export default Home;
