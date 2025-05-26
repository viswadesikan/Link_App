document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const submitBtn = document.getElementById('submit-btn');
  const authSwitch = document.getElementById('auth-switch');
  
  if (action === 'signup') {
    authTitle.textContent = 'Sign Up';
    submitBtn.textContent = 'Sign Up';
    authSwitch.innerHTML = 'Already have an account? <a href="auth.html?action=login">Login</a>';
  } else {
    authTitle.textContent = 'Login';
    submitBtn.textContent = 'Login';
    authSwitch.innerHTML = 'Don\'t have an account? <a href="auth.html?action=signup">Sign up</a>';
  }
  
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const endpoint = action === 'signup' ? 'signup' : 'login';
    
    try {
      const response = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      localStorage.setItem('token', data.token);
      window.location.href = 'home.html';
    } catch (err) {
      alert(err.message);
    }
  });
});