"use client"
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowRight, Users, Layers, Shield, Smartphone, ChevronRight, FileText, Link } from 'lucide-react';

const LinkCollabLanding: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/boards');
    } else {
      setIsLoading(false);
    }
  }, [isSignedIn, router]);

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push('/boards');
    } else {
      router.push('/sign-up');
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
      title: "Organized Collections",
      description: "Organize your links, files, and notes into meaningful collections"
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
    { title: "Add Collections", description: "Organize your content into themed collections" },
    { title: "Add Content", description: "Add links, files, and notes - collaborate with your team in real-time" }
  ];

  const useCases = [
    { icon: "🔗", title: "Teams sharing research resources", description: "Centralize links, documents, and research notes" },
    { icon: "🧑‍💻", title: "Developers organizing documentation", description: "Keep API docs, code snippets, and notes organized" },
    { icon: "📚", title: "Students collecting study materials", description: "Gather links, files, and study notes in one place" },
    { icon: "🎨", title: "Designers collaborating on projects", description: "Share inspiration links, files, and project notes" }
  ];

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
        <title>LinkCollab - Collaborative Content Management</title>
        <meta name="description" content="Create boards, save links, files, and notes, and collaborate with friends in real-time" />
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
                <span className="text-white">on Everything</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Create boards, save links, files, and notes, and collaborate with friends in real-time
              </p>
              <div className="flex justify-center mb-12">
                <button 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-violet-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center"
                >
                  {isSignedIn ? 'Go to Boards' : 'Start Collaborating'}
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
              <p className="text-xl text-gray-300">Everything you need for seamless content collaboration</p>
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
              <h2 className="text-4xl font-bold text-white mb-4">Perfect for Content Organization</h2>
              <p className="text-xl text-gray-300">Organize and share your links, files, and notes effortlessly</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <Link className="w-8 h-8 text-violet-400 mr-4 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Save Links</h3>
                    <p className="text-gray-400">Keep all your important links organized and accessible</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">📁</span>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Upload Files</h3>
                    <p className="text-gray-400">Store and share documents, images, and other files</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <FileText className="w-8 h-8 text-violet-400 mr-4 mt-1" />
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Create Notes</h3>
                    <p className="text-gray-400">Add rich text notes and collaborate on ideas</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12">
              <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">👥</span>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Share with Others</h3>
                    <p className="text-gray-400">Collaborate and share your content collections with friends and team members</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Updated Use Cases */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Use Cases</h2>
              <p className="text-xl text-gray-300">See how different teams use LinkCollab</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {useCases.map((useCase, index) => (
                <div key={index} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-violet-500/50 transition-all duration-300">
                  <div className="flex items-start">
                    <span className="text-3xl mr-4">{useCase.icon}</span>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-2">{useCase.title}</h3>
                      <p className="text-gray-400">{useCase.description}</p>
                    </div>
                  </div>
                </div>
              ))}
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