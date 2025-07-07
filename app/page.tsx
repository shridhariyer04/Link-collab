"use client"
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowRight, Users, Layers, Shield, Smartphone, ChevronRight } from 'lucide-react';

const LinkCollabLanding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Replace this with your actual authentication check
        // This could be checking localStorage, cookies, or making an API call
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        
        if (token && user) {
          setIsLoggedIn(true);
          // Redirect to boards page if user is logged in
          router.push('/boards');
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push('/boards');
    } else {
      router.push('/login'); // or '/signup' depending on your preference
    }
  };

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Real-time Collaboration",
      description: "Socket-based syncing keeps everyone in sync instantly"
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: "Link Collections per Board",
      description: "Organize your links into meaningful collections"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Role-based Access Control",
      description: "Owner, Editor, and Viewer permissions"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Works on Mobile & Desktop",
      description: "Access your boards from anywhere, any device"
    }
  ];

  const steps = [
    { title: "Create a Board", description: "Start by creating your first collaboration board" },
    { title: "Add Collections", description: "Organize your links into themed collections" },
    { title: "Paste Links", description: "Add links and collaborate with your team in real-time" }
  ];

  const useCases = [
    { icon: "🔗", title: "Teams sharing research links", description: "Centralize all your research and references" },
    { icon: "🧑‍💻", title: "Developers organizing API docs", description: "Keep all your development resources organized" },
    { icon: "📚", title: "Students collecting resources", description: "Gather study materials and academic resources" },
    { icon: "🎨", title: "Designers collaborating on inspiration", description: "Share mood boards and design references" }
  ];

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>LinkCollab - Collaborative Link Management</title>
        <meta name="description" content="Create boards, save important links, and collaborate with friends in real-time" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        {/* Hero Section */}
        <section className="pt-16 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Collaborate
                </span>
                <br />
                <span className="text-white">on Links</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Create boards, save all your important links, and collaborate with friends in real-time
              </p>
              <div className="flex justify-center mb-12">
                <button 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-violet-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  {isLoggedIn ? 'Go to Boards' : 'Start Collaborating'}
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Core Features</h2>
              <p className="text-xl text-gray-300">Everything you need for seamless link collaboration</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300 group">
                  <div className="text-violet-400 mb-4 group-hover:text-violet-300 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-xl text-gray-300">Get started in just 3 simple steps</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-white font-bold text-xl">{index + 1}</span>
                  </div>
                  <h3 className="text-white font-semibold text-xl mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-6 h-6 text-gray-600 mx-auto mt-6 hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Perfect for Link Storage</h2>
              <p className="text-xl text-gray-300">Organize and share your important links effortlessly</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">🔗</span>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Store Your Links</h3>
                    <p className="text-gray-400">Keep all your important links organized in one place</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">👥</span>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Share with Others</h3>
                    <p className="text-gray-400">Collaborate and share your link collections with friends</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
          <div className="max-w-6xl mx-auto text-center text-gray-400">
            <p>&copy; 2025 LinkCollab. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LinkCollabLanding;