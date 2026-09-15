import React from 'react';
import { Link } from 'react-router-dom';
import { 
    Leaf, Users, Target, Award, Truck, Shield, 
    Clock, Globe, Heart, Mail, Phone, MapPin,
    CheckCircle, Star, TrendingUp, Package
} from 'lucide-react';

const About = () => {
    const values = [
        {
            icon: Leaf,
            title: 'Sustainability',
            description: 'Committed to eco-friendly practices and sustainable business operations.'
        },
        {
            icon: Users,
            title: 'Customer First',
            description: 'We prioritize our customers\' needs and strive for complete satisfaction.'
        },
        {
            icon: Target,
            title: 'Excellence',
            description: 'We maintain high standards in quality, service, and business ethics.'
        },
        {
            icon: Award,
            title: 'Trust & Integrity',
            description: 'We build lasting relationships through transparency and honesty.'
        }
    ];

    const stats = [
        { number: '500+', label: 'Products Available', icon: Package },
        { number: '50+', label: 'Verified Suppliers', icon: Users },
        { number: '1000+', label: 'Happy Customers', icon: Star },
        { number: '24/7', label: 'Customer Support', icon: Clock }
    ];

    const team = [
        {
            name: 'Harykims',
            role: 'Founder & CEO',
            bio: 'Visionary leader with 15+ years in e-commerce and business development.'
        },
        {
            name: 'Samuel Wainaina',
            role: 'Operations Manager',
            bio: 'Expert in supply chain management and customer experience optimization.'
        },
        {
            name: 'Dr. Bond',
            role: 'Head of Technology',
            bio: 'Full-stack developer passionate about creating seamless digital experiences.'
        },
        {
            name: 'Charity Njoki',
            role: 'Customer Experience Lead',
            bio: 'Dedicated to ensuring every customer gets the best service possible.'
        },
        {
            name: 'Mistaken',
            role: 'Strategic Planning & Development',
            bio: 'Developing Marketing Strategies: Creating comprehensive plans to achieve business objectives (e.g., increasing market share, entering new markets, or launching new products).'
        }
    ];

    return (
        <div className="bg-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-harykims-700 to-harykims-500 text-white py-16">
                <div className="container-custom text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">About Harykims Intertech</h1>
                    <p className="text-xl text-harykims-100 max-w-2xl mx-auto">
                        Kenya's premier B2B marketplace connecting businesses with quality products and trusted suppliers.
                    </p>
                </div>
            </div>

            {/* Mission & Vision */}
            <div className="container-custom py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-harykims-50 p-8 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-harykims-600 p-2 rounded-lg">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-harykims-800">Our Mission</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            To empower businesses in Kenya and beyond by providing a trusted, efficient, 
                            and sustainable marketplace for quality accessories and tech products, 
                            fostering growth and success for both buyers and sellers.
                        </p>
                    </div>
                    <div className="bg-harykims-50 p-8 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-harykims-600 p-2 rounded-lg">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-harykims-800">Our Vision</h2>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                            To become East Africa's leading B2B marketplace, driving economic growth 
                            through innovation, sustainability, and creating meaningful connections 
                            between businesses across the region.
                        </p>
                    </div>
                </div>
            </div>

            {/* Story Section */}
            <div className="bg-gray-50 py-16">
                <div className="container-custom">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                        <p className="text-gray-700 leading-relaxed mb-6">
                            Founded in 2024, Harykims Intertech was born from a vision to revolutionize 
                            B2B commerce in Kenya. We recognized the need for a reliable, transparent, 
                            and efficient marketplace where businesses could source quality products 
                            with confidence.
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                            Today, we serve hundreds of businesses across Kenya, connecting them with 
                            verified suppliers and quality products. Our commitment to sustainability, 
                            innovation, and customer satisfaction continues to drive our growth and 
                            shape the future of B2B commerce in the region.
                        </p>
                    </div>
                </div>
            </div>

            {/* Values */}
            <div className="container-custom py-16">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Core Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {values.map((value, index) => (
                        <div key={index} className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                            <div className="inline-flex p-3 bg-harykims-100 rounded-full mb-4">
                                <value.icon className="w-6 h-6 text-harykims-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800 mb-2">{value.title}</h3>
                            <p className="text-sm text-gray-600">{value.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="bg-harykims-900 text-white py-16">
                <div className="container-custom">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <stat.icon className="w-8 h-8 text-harykims-400 mx-auto mb-3" />
                                <div className="text-3xl md:text-4xl font-bold text-white">{stat.number}</div>
                                <p className="text-harykims-300 text-sm mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Team */}
            <div className="container-custom py-16">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Meet Our Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {team.map((member, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 text-center border border-gray-100">
                            <div className="w-20 h-20 bg-harykims-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-10 h-10 text-harykims-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800">{member.name}</h3>
                            <p className="text-harykims-600 text-sm font-medium">{member.role}</p>
                            <p className="text-sm text-gray-600 mt-2">{member.bio}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-harykims-700 to-harykims-500 text-white py-16">
                <div className="container-custom text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Business?</h2>
                    <p className="text-harykims-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of businesses already sourcing and selling on Harykims Intertech.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link to="/register" className="bg-white text-harykims-700 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors">
                            Get Started
                        </Link>
                        <Link to="/contact" className="bg-transparent hover:bg-white/10 text-white px-8 py-3 rounded-lg font-semibold border border-white/30 transition-colors">
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
