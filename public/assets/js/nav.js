async function configureNavigation() {
    try {
        const response = await fetch('/api/me');
        if (!response.ok) return;

        const userData = await response.json();
        const adminLink = document.getElementById('adminNavLink');
        if (adminLink && userData.isLoggedIn && userData.role === 'admin') {
            adminLink.style.display = 'inline-block';
        }
    }
    catch (error) {
        console.error('Error fetching navigation state:', error);
    }
}

configureNavigation();
