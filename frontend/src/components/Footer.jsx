import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ 
      background: '#121212', 
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '2rem 1.5rem',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '2.5rem',
          justifyContent: 'space-between',
          marginBottom: '2rem'
        }}>
          
          {/* Brand Section */}
          <div style={{ flex: '1 1 250px' }}>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#ffffff' }}>
              KHELO <span style={{ color: '#3b82f6' }}>KARACHI</span>
            </h3>
            <p style={{ color: '#9ca3af', marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '300px' }}>
              Karachi's premium destination for arena bookings and competitive matchmaking.
            </p>
          </div>

          {/* Quick Links */}
          <div style={{ flex: '1 1 150px' }}>
            <h4 style={{ color: '#ffffff', fontWeight: '800', marginBottom: '1.25rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/courts" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem' }}>Browse Arenas</Link>
              <Link to="/find-team" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem' }}>Find a Match</Link>
              <Link to="/profile" style={{ color: '#9ca3af', textDecoration: 'none', fontSize: '0.9rem' }}>Dashboard</Link>
            </div>
          </div>

          {/* Contact Section */}
          <div style={{ flex: '1 1 200px' }}>
            <h4 style={{ color: '#ffffff', fontWeight: '800', marginBottom: '1.25rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ color: '#ffffff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#3b82f6' }}>📞</span> +92 300 1234567
              </div>
              <div style={{ color: '#ffffff', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#3b82f6' }}>✉️</span> khelokarachi@gmail.com
              </div>
            </div>
            <a href="mailto:khelokarachi@gmail.com" style={{ 
              display: 'inline-block', 
              marginTop: '1.25rem', 
              color: '#ffffff', 
              fontSize: '0.85rem', 
              fontWeight: '800', 
              textDecoration: 'none',
              padding: '10px 20px',
              background: '#3b82f6',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              Email Support
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ 
          borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
          paddingTop: '1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
            &copy; {new Date().getFullYear()} KHELO KARACHI.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#" style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;