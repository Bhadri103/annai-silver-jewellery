import React, { useState } from 'react';

const HelpCenterSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('bank-transfers');

  const categories = [
    { id: 'bank-transfers', label: 'BANK TRANSFERS & PAYMENTS', icon: 'ðŸ’³' },
    { id: 'general', label: 'GENERAL QUESTIONS', icon: 'â“' },
    { id: 'getting-started', label: 'GETTING STARTED', icon: 'ðŸš€' },
    { id: 'account', label: 'MY ACCOUNT', icon: 'ðŸ‘¤' }
  ];

  const helpContent = {
    'bank-transfers': {
      title: 'How to fund my trading account?',
      breadcrumb: 'Help Center / Bank Transfers & Payments',
      content: [
        {
          question: 'What is an internal transfer?',
          answer: 'An internal transfer allows you to move funds between your trading accounts instantly without any fees.'
        },
        {
          question: 'What is an external transfer?',
          answer: 'An external transfer involves moving funds from your bank account to your trading account or vice versa.'
        },
        {
          question: 'What payment methods are available?',
          answer: 'We accept various payment methods including bank transfers, credit cards, e-wallets, and cryptocurrency.'
        },
        {
          question: 'How long does a bank transfer take?',
          answer: 'Bank transfers typically take 1-3 business days to process depending on your bank and location.'
        }
      ],
      detailedInfo: `To fund your trading account, you have multiple options available to you. Let me guide you through the most common methods:

Bank Transfer: This is one of our most popular funding methods. You can find out about domestic and international deposits, as well as bank transfer options. Simply navigate to the deposit section, where you will find all available deposit methods. The minimum available deposit on your account will be displayed by default so that you won't be able to use the decrease button below that amount and the maximum displayed deposit amount.

What happens when you use the funding methods link is that the minimum and maximum deposit limits are displayed.

Once you have selected your payment method, the next screen will pop up in close when account funding is successful and the transaction is completed with an instant deposit.

The deposit amount for each time that you must make at least USD 5. If you're depositing to your account for the first time, it is going to open the amount that each you have defined as the default per the account type.

In your trading account, there will be a deposit notification for as long as a deposit is pending.

Whatever method you use to deposit, keep in mind that funds must always originate from your account, and deposits cannot receive any third-party or anonymous deposit due to international Anti money laundering laws.

We offer several methods for making deposits to your trading account. We recommend selecting the payment methods are described.`
    },
    'general': {
      title: 'Frequently Asked Questions',
      breadcrumb: 'Help Center / General Questions',
      content: [
        {
          question: 'What are your trading hours?',
          answer: 'Our trading platform operates 24/5, from Sunday 5 PM EST to Friday 5 PM EST.'
        },
        {
          question: 'How do I contact customer support?',
          answer: 'You can reach our support team via live chat, email, or phone during business hours.'
        }
      ],
      detailedInfo: 'Find answers to the most commonly asked questions about our trading platform and services.'
    },
    'getting-started': {
      title: 'Getting Started Guide',
      breadcrumb: 'Help Center / Getting Started',
      content: [
        {
          question: 'How do I create an account?',
          answer: 'Click on "Sign Up" and follow the registration process with your personal information.'
        },
        {
          question: 'How do I verify my account?',
          answer: 'Upload required documents including ID and proof of address for account verification.'
        }
      ],
      detailedInfo: 'Complete guide to getting started with your trading journey on our platform.'
    },
    'account': {
      title: 'Account Management',
      breadcrumb: 'Help Center / My Account',
      content: [
        {
          question: 'How do I change my password?',
          answer: 'Go to account settings and select "Change Password" to update your login credentials.'
        },
        {
          question: 'How do I update my personal information?',
          answer: 'Navigate to your profile settings to update personal details and contact information.'
        }
      ],
      detailedInfo: 'Manage your account settings, security, and personal information effectively.'
    }
  };

  const currentContent = helpContent[activeCategory as keyof typeof helpContent];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Header Section */}
      <div className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h1 className="text-5xl font-bold text-white mb-6">Help Center</h1>
              <p className="text-gray-300 text-lg leading-relaxed">
                The Help Center is our self-service knowledge base for traders to 
                find answers to their questions quickly. So you have a broad or 
                specific question about trading, deposits, withdrawals, 
                compliance, or anything else? Find your answer here.
              </p>
            </div>
            
            {/* 3D Geometric Illustration */}
            <div className="relative flex justify-center">
              <div className="relative">
                {/* Main geometric shape */}
                <div className="w-64 h-64 relative">
                  {/* Purple cube */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-purple-500 to-indigo-600 transform rotate-12 rounded-lg shadow-2xl"></div>
                  
                  {/* Pink ring */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48">
                    <div className="w-full h-full border-8 border-pink-500 rounded-full opacity-80 transform rotate-45"></div>
                    <div className="absolute inset-4 border-4 border-pink-400 rounded-full opacity-60"></div>
                  </div>
                  
                  {/* Bottom geometric elements */}
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tr from-cyan-400 to-blue-500 transform -rotate-12 rounded-lg shadow-xl"></div>
                </div>
                
                {/* Floating particles */}
                <div className="absolute -top-4 -left-4 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-2 -right-2 w-2 h-2 bg-pink-400 rounded-full animate-pulse delay-300"></div>
                <div className="absolute top-1/2 -left-8 w-4 h-4 bg-purple-400 rounded-full animate-pulse delay-700"></div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 sticky top-8">
                <nav className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        activeCategory === category.id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{category.icon}</span>
                        <span>{category.label}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                {/* Breadcrumb */}
                <div className="text-gray-400 text-sm mb-4">
                  {currentContent.breadcrumb}
                </div>
                
                {/* Title */}
                <h2 className="text-3xl font-bold text-white mb-8">
                  {currentContent.title}
                </h2>

                {/* FAQ Items */}
                <div className="space-y-6 mb-8">
                  {currentContent.content.map((item, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        {item.question}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Detailed Information */}
                <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-400/30">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Detailed Information
                  </h3>
                  <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {currentContent.detailedInfo}
                  </div>
                </div>

                {/* Contact Support */}
                <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Still need help?
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <button className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-amber-900 px-6 py-3 rounded-lg font-semibold transition-all">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

export default HelpCenterSection;