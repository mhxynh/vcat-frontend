import vanguardLogo from '../assets/images/vanguard.png';
import '../styles/pages/Login.css';

export const vcatTheme = {
  name: 'vcat-enterprise-theme',
  tokens: {
    colors: {
      brand: {
        primary: {
          10: { value: '#FFFFFF' },
          80: { value: '#96151D' },
          90: { value: '#7a1518' },
        },
      },
    },
    components: {
      authenticator: {
        router: {
          borderWidth: { value: '0' },
          boxShadow: { value: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' },
        },
      },
      button: {
        primary: {
          backgroundColor: { value: '{colors.brand.primary.80}' },
          _hover: { backgroundColor: { value: '{colors.brand.primary.90}' } },
        },
        borderRadius: { value: '10px' },
      },
      fieldcontrol: {
        borderRadius: { value: '4px' },
      },
    },
  },
};

export const formFields = {
  signIn: {
    username: {
      label: 'Email Address',
      placeholder: 'name@company.com',
    },
    password: {
      label: (
        <div className="login-password-label-row">
          <span>Password</span>
          <a
            href="/"
            className="login-password-forgot-link"
            onClick={(event) => event.preventDefault()}
          >
            Forgot password?
          </a>
        </div>
      ),
      placeholder: 'Enter your password',
    },
  },
};

export const components = {
  Header() {
    return (
      <div className="login-header">
        <img alt="Vanguard logo" src={vanguardLogo} className="login-logo" />
        <h2 className="login-title">Control Testing</h2>
        <p className="login-subtitle">Sign in to your account</p>
      </div>
    );
  },
  SignIn: {
    Footer() {
      return (
        <div className="login-signin-footer">
          <p className="login-signin-footer-text">
            Don't have an account?{' '}
            <a href="/" className="login-contact-admin-link">
              Contact Admin
            </a>
          </p>
        </div>
      );
    },
  },
};
