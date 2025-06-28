// This makes sure our JavaScript code runs ONLY after the entire HTML page is loaded.
// It prevents errors where JS tries to find an element before it exists.
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Global Variables (data that needs to be accessed by many functions) ---

    // This will hold all our car, user, and admin data after we load it from data.json.
    let appData = {};

    // This simulates a "logged-in" user. We'll set it once data loads.
    let currentUser = null;

    // --- 2. Get References to HTML Elements (so JS can interact with them) ---

    // Get ALL elements that have the 'page' class (these are our different content sections).
    const allPages = document.querySelectorAll('.page');

    // Get ALL navigation links in the header.
    // We look for 'a' tags inside 'nav ul li'.
    const navLinks = document.querySelectorAll('nav ul li a');

    // Get the "Start Search" button on the landing page.
    const startSearchButton = document.querySelector('button[data-page="search-page"]');

    // Get the search input field and button on the Search Page.
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchMessage = document.getElementById('searchMessage'); // For displaying search errors/info

    // Get the area where the car report will be displayed.
    const reportContent = document.getElementById('reportContent');

    // Get the "Back to Search" button on the Report Page.
    const backToSearchButton = document.querySelector('button[data-page="search-page"][class="simple-button"]');

    // Get elements for the User Profile Page.
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');

    // Get element for the Admin Page.
    const adminTotalCars = document.getElementById('adminTotalCars');


    // --- 3. Core Functions (actions our app can perform) ---

    // Function to load our dummy data from the 'data.json' file.
    // 'async' means this function will do something that takes time (like fetching a file).
    async function loadData() {
        try {
            // 'fetch' sends a request to get the 'data.json' file.
            // 'await' pauses this function until the file is completely loaded.
            const response = await fetch('data.json');

            // If the response is not ok (e.g., file not found, 404 error), throw an error.
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // 'await response.json()' parses the loaded data into a JavaScript object.
            appData = await response.json();
            console.log('Data loaded successfully:', appData); // Log to console to confirm

            // Simulate a user being "logged in" by picking the first user from our data.
            if (appData.users && appData.users.length > 0) {
                currentUser = appData.users[0];
            }

            // After data is loaded, show the initial landing page.
            showPage('landing-page');

        } catch (error) {
            // If anything goes wrong during data loading, log an error.
            console.error('Failed to load data:', error);
            alert('App data could not be loaded. Check data.json and your server setup (e.g., Live Server).');
        }
    }

    // Function to show only one specific "page" and hide all others.
    // 'pageId' is the ID of the HTML div (e.g., 'landing-page', 'search-page').
    function showPage(pageId) {
        // Loop through every element that has the 'page' class.
        allPages.forEach(page => {
            // Remove the 'active' class from each page. This hides them all.
            page.classList.remove('active');
        });

        // Find the specific page we want to show using its ID.
        const targetPage = document.getElementById(pageId);

        // IMPORTANT: Check if the page actually exists before trying to use it.
        // This prevents the "Cannot read properties of null" error if an ID is wrong.
        if (targetPage) {
            // Add the 'active' class to the target page. This makes it visible.
            targetPage.classList.add('active');

            // --- Additional actions based on the page being shown ---
            if (pageId === 'profile-page') {
                renderUserProfile(); // If it's the profile page, update its content.
            } else if (pageId === 'admin-page') {
                renderAdminPanel(); // If it's the admin page, update its content.
            } else if (pageId === 'report-page') {
                // If we're going to the report page, clear any old messages
                // unless a search just filled it.
                if (reportContent.innerHTML.includes('<p>Search for a car')) {
                    reportContent.innerHTML = '<p>Search for a car to see its basic report here.</p>';
                }
            }

        } else {
            console.error(`Error: Page with ID "${pageId}" not found in HTML.`);
        }

        // Optional: Update navigation link active state (visual feedback)
        navLinks.forEach(link => {
            // Check if the link's data-page attribute matches the currently active pageId
            if (link.dataset.page === pageId) {
                link.classList.add('active-nav-link'); // Add a class for styling active nav links
            } else {
                link.classList.remove('active-nav-link');
            }
        });
    }

    // Function to display the car report.
    function renderCarReport(car) {
        if (!car) {
            reportContent.innerHTML = '<p>No car found with that VIN or Plate.</p>';
            return;
        }

        // Initialize history details HTML
        let ownersHtml = '';
        if (car.history && car.history.owners && car.history.owners.length > 0) {
            ownersHtml = '<h4>Owners:</h4><ul>';
            car.history.owners.forEach(owner => {
                ownersHtml += `<li>${owner.type} (Acquired: ${owner.dateAcquired})</li>`;
            });
            ownersHtml += '</ul>';
        } else {
            ownersHtml = '<p>No owner history available.</p>';
        }

        let accidentsHtml = '';
        if (car.history && car.history.accidents && car.history.accidents.length > 0) {
            accidentsHtml = '<h4>Accidents:</h4><ul>';
            car.history.accidents.forEach(accident => {
                accidentsHtml += `<li>Date: ${accident.date}, Description: ${accident.description}</li>`;
            });
            accidentsHtml += '</ul>';
        } else {
            accidentsHtml = '<p>No accident records.</p>';
        }

        const pendingFinanceStatus = car.history && car.history.pendingFinance ? 'Yes' : 'No';
        const reportedStolenStatus = car.history && car.history.reportedStolen ? 'Yes' : 'No';

        // Use template literals (backticks ``) to easily write multi-line HTML.
        reportContent.innerHTML = `
            <h2>${car.make} ${car.model} (${car.year})</h2>
            <p><strong>VIN:</strong> ${car.vin}</p>
            <p><strong>Plate:</strong> ${car.plate}</p>
            <p><strong>Price:</strong> KES ${car.priceKES.toLocaleString()}</p>
            <p><strong>Mileage:</strong> ${car.mileageKM.toLocaleString()} KM</p>
            <p><strong>Description:</strong> ${car.description}</p>
            
            <h3>Vehicle History</h3>
            ${ownersHtml}
            ${accidentsHtml}
            <p><strong>Pending Finance:</strong> ${pendingFinanceStatus}</p>
            <p><strong>Reported Stolen:</strong> ${reportedStolenStatus}</p>
        `;
        showPage('report-page'); // Show the report page after rendering content.
    }

    // Function to display user profile data.
    function renderUserProfile() {
        if (currentUser) {
            profileUsername.textContent = currentUser.username; // Set the username text.
            profileEmail.textContent = currentUser.email;      // Set the email text.
        } else {
            profileUsername.textContent = 'Guest'; // If no user, show 'Guest'.
            profileEmail.textContent = 'N/A';
        }
    }

    // Function to display admin data.
    function renderAdminPanel() {
        if (appData.admin) {
            adminTotalCars.textContent = appData.admin.totalCars; // Set total cars text.
        } else {
            adminTotalCars.textContent = 'N/A';
        }
    }

    // --- 4. Event Listeners (making our buttons/links clickable) ---

    // Listen for clicks on ALL navigation links.
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Stop the browser from going to a new URL.
            // Get the 'data-page' value from the clicked link and show that page.
            showPage(event.target.dataset.page);
        });
    });

    // Listen for a click on the "Start Search" button on the landing page.
    startSearchButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default button action (though not strictly needed here).
        // Show the search page.
        showPage('search-page');
    });

    // Listen for a click on the "Back to Search" button on the report page.
    backToSearchButton.addEventListener('click', (event) => {
        event.preventDefault();
        showPage('search-page'); // Show the search page.
    });


    // Listen for a click on the "Search Car" button.
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim(); // Get text from input, remove spaces.
        searchMessage.textContent = ''; // Clear previous messages.

        if (query === '') {
            searchMessage.textContent = 'Please enter a VIN or Plate.';
            return; // Stop here if input is empty.
        }

        // Try to find a car that matches the VIN OR the Plate.
        // '.find()' returns the first car object that matches.
        const foundCar = appData.cars.find(car =>
            car.vin.toLowerCase() === query.toLowerCase() ||
            car.plate.toLowerCase() === query.toLowerCase()
        );

        renderCarReport(foundCar); // Display the report for the found car (or 'not found' message).
    });

    // --- 5. Initialization (what runs when the script first loads) ---

    // Start everything by loading our data.
    loadData();

}); // End of DOMContentLoaded