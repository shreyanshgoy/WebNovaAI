import React, { useState } from 'react';
import './Pricing.css';

const Pricing = ({ isOpen, onClose }) => {
  const plans = [
    {
      name: 'Starter',
      price: '$9',
      period: '/month',
      features: [
        '5 websites per month',
        'Basic AI templates',
        'Email support',
        'Standard hosting'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      features: [
        'Unlimited websites',
        'Advanced AI templates',
        'Priority support',
        'Premium hosting',
        'Custom domains'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      features: [
        'Everything in Pro',
        'White-label solution',
        'Dedicated support',
        'Custom integrations',
        'Team collaboration'
      ],
      popular: false
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="pricing-overlay" onClick={onClose}>
      <div className="pricing-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pricing-header">
          <h2>Choose Your Plan</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">
                <span className="price">{plan.price}</span>
                <span className="period">{plan.period}</span>
              </div>
              <ul className="plan-features">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex}>{feature}</li>
                ))}
              </ul>
              <button className="plan-btn">Get Started</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing; 