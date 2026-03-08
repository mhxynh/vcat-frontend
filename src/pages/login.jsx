import { ThemeProvider, Theme } from '@aws-amplify/ui-react';

export const vcatTheme = {
  name: 'vcat-enterprise-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: { value: '#f9f9f9' },
          80: { value: '#921A1D' },
          90: { value: '#7a1518' },
        },
      },
    },
    components: {
      authenticator: {
        router: {
          boxShadow: { value: '0 4px 12px rgba(0, 0, 0, 0.1)' },
          borderWidth: { value: '1px' },
        },
      },
      button: {
        primary: {
          backgroundColor: { value: '{colors.brand.primary.80}' },
          _hover: { backgroundColor: { value: '{colors.brand.primary.90}' } },
          borderRadius: { value: '4px' },
        },
      },
      fieldcontrol: {
        borderRadius: { value: '4px' },
      },
    },
  },
};

export const components = {
  Header() {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem 0' }}>
        <img
          alt="Vanguard logo"
          src="..\assets\images\vanguard.png"
          style={{ height: '60px', marginBottom: '1rem' }}
        />
        <h2 style={{ color: '#921A1D', fontWeight: '700', margin: 0 }}>Control Testing</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '8px' }}>
          Sign in to your account
        </p>
      </div>
    );
  },
  Footer() {
    return (
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <p style={{ fontSize: '0.85rem' }}>
          Don't have an account?{' '}
          <a
            href="mailto:admin@vanguard.com"
            style={{ color: '#921A1D', fontWeight: 'bold', textDecoration: 'none' }}
          >
            Contact Admin
          </a>
        </p>
        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '2rem' }}>
          © 2026 Control Testing App. All rights reserved.
        </p>
      </div>
    );
  },
};
