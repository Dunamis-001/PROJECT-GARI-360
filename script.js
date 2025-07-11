document.addEventListener('DOMContentLoaded', () => {

   
    const BASE_URL = "https://project-1-data-base-2.onrender.com"; // This is the default port for JSON Server

    // Global object to hold all our fetched data (cars, users, admin)
    // Initialize with empty structures to prevent errors before data loads.
    let appData = {
        cars: [],
        users: [],
        admin: null // Initialize admin as null or empty object if it might not always exist
    };

    // This simulates a "logged-in" user. We'll set it once user data loads.
    let currentUser = null;

    // --- 2. Get References to HTML Elements (so JS can interact with them) ---
    // Select all elements that have the 'page' class. These are our main content sections.
    const allPages = document.querySelectorAll('.page');

    // Select all navigation links in the header.
    const navLinks = document.querySelectorAll('nav ul li a');

    // Get the "Start Search" button on the landing page.
    const startSearchButton = document.querySelector('button[data-page="search-page"][class="cta-button"]');

    // Get the search input field, search button, and message area on the Search Page.
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchMessage = document.getElementById('searchMessage');

    // Get the area where the car report will be displayed.
    const reportContent = document.getElementById('reportContent');

    // Get the "Back to Search" button on the Report Page.
    const backToSearchButton = document.querySelector('.back-button');

    // Get elements for the User Profile Page.
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const searchHistoryList = document.getElementById('searchHistoryList');

    // Get elements for the Admin Page.
    const adminTotalCars = document.getElementById('adminTotalCars');
    const adminActiveUsers = document.getElementById('adminActiveUsers'); // Will show N/A if not in data.json


    // --- 3. Core Functions (actions our app can perform) ---

    // Function to load all necessary data from the JSON Server API.
    async function loadData() {
        try {
            // Use Promise.all to fetch data from all endpoints concurrently.
            // This makes the initial load faster as requests happen in parallel.
            const [carsResponse, usersResponse, adminResponse] = await Promise.all([
                fetch(`${BASE_URL}/cars`),  // Fetches car listings from JSON Server's /cars endpoint
                fetch(`${BASE_URL}/users`), // Fetches user data from /users endpoint
                fetch(`${BASE_URL}/admin`)  // Fetches admin statistics from /admin endpoint
            ]);

            // Check if all responses were successful (HTTP status 200-299).
            if (!carsResponse.ok) {
                throw new Error(`HTTP error fetching cars! Status: ${carsResponse.status}`);
            }
            if (!usersResponse.ok) {
                throw new Error(`HTTP error fetching users! Status: ${usersResponse.status}`);
            }
            if (!adminResponse.ok) {
                throw new Error(`HTTP error fetching admin! Status: ${adminResponse.status}`);
            }

            // Parse the JSON data from each successful response.
            appData.cars = await carsResponse.json();
            appData.users = await usersResponse.json();
            appData.admin = await adminResponse.json();

            console.log('Data loaded successfully:', appData);

            // Simulate user login: Set the current user to the first user in our fetched data.
            // This is for demonstration purposes for the profile page.
            if (appData.users && appData.users.length > 0) {
                currentUser = appData.users[0];
            } else {
                console.warn('No user data found in data.json. Profile page may be empty.');
            }

            // After all data is loaded, display the initial landing page.
            showPage('landing-page');

        } catch (error) {
            // Log the error and display a user-friendly alert if data loading fails.
            // This helps in debugging network or JSON Server issues.
            console.error('Failed to load data from JSON Server:', error);
            alert(`App data could not be loaded. Please ensure your JSON Server is running correctly at ${BASE_URL} and your data.json file is properly structured (check 'cars', 'users', 'admin' keys). Error: ${error.message}`);
        }
    }

    // Function to control which "page" (section) is visible.
    // It hides all pages first, then displays the specified page.
    function showPage(pageId) {
        // Hide all pages by removing the 'active' class.
        allPages.forEach(page => {
            page.classList.remove('active');
        });

        // Find the specific page to show using its ID.
        const targetPage = document.getElementById(pageId);

        // If the target page exists, add the 'active' class to make it visible.
        if (targetPage) {
            targetPage.classList.add('active');

            // Perform additional actions specific to the page being shown.
            if (pageId === 'profile-page') {
                renderUserProfile(); // Update profile details
            } else if (pageId === 'admin-page') {
                renderAdminPanel(); // Update admin stats
            } else if (pageId === 'search-page') {
                // When navigating back to the search page, reset the report area and hide the back button.
                reportContent.innerHTML = '<p>Search for a car to see its basic report here.</p>';
                searchMessage.textContent = ''; // Clear any search messages too
                backToSearchButton.style.display = 'none'; // Hide the back button
                searchInput.value = ''; // Clear the search input field
            }
            // The 'report-page' is NOT a separate section, it's part of 'search-page'.
            // So we don't call showPage for it.
            // The back button is managed directly when search results are displayed.

        } else {
            // Log an error if a page with the specified ID is not found in the HTML.
            console.error(`Error: Page with ID "${pageId}" not found in HTML.`);
        }

        // Update the visual active state for navigation links in the header.
        navLinks.forEach(link => {
            if (link.dataset.page === pageId) {
                link.classList.add('active-nav-link');
            } else {
                link.classList.remove('active-nav-link');
            }
        });
    }

    // Function to display the detailed car report in the 'reportContent' area.
    function renderCarReport(car) {
        // Ensure the search page is active before rendering the report (it should be).
        showPage('search-page'); // Re-activate search page just in case navigation occurred.

        // If no car object is provided (e.g., search found nothing), display a "not found" message.
        if (!car) {
            reportContent.innerHTML = '<p>No car found with that VIN or Plate. Please try again.</p>';
            searchMessage.textContent = 'Car not found.';
            backToSearchButton.style.display = 'block'; // Show back button even if car not found, to clear the message
            return;
        }

        // Generate HTML for the car's owners history.
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

        // Generate HTML for the car's accident history.
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

        // Determine "Yes" or "No" status for pending finance and reported stolen.
        const pendingFinanceStatus = car.history && car.history.pendingFinance ? 'Yes' : 'No';
        const reportedStolenStatus = car.history && car.history.reportedStolen ? 'Yes' : 'No';

        // --- Handle Image Display ---
        // Uses the first image URL from the 'imageUrls' array, or a placeholder if none exist.
        const carImage = car.imageUrls && car.imageUrls.length > 0 ? car.imageUrls[0] : 'https://via.placeholder.com/400x300?text=No+Image';
        const imageHtml = `<img src="${carImage}" alt="${car.make} ${car.model}" class="car-report-image">`;


        // Populate the 'reportContent' area using a template literal for easy HTML generation.
        reportContent.innerHTML = `
            <h2>${car.make} ${car.model} (${car.year})</h2>
            ${imageHtml}
            <p><strong>VIN:</strong> ${car.vin}</p>
            <p><strong>Plate:</strong> ${car.plate}</p>
            <p><strong>Price:</strong> KES ${car.priceKES.toLocaleString()}</p>
            <p><strong>Mileage:</strong> ${car.mileageKM.toLocaleString()} KM</p>
            <p><strong>Location:</strong> ${car.location}</p>
            <p><strong>Description:</strong> ${car.description}</p>

            <h3>Vehicle History</h3>
            ${ownersHtml}
            ${accidentsHtml}
            <p><strong>Pending Finance:</strong> ${pendingFinanceStatus}</p>
            <p><strong>Reported Stolen:</strong> ${reportedStolenStatus}</p>
        `;

        backToSearchButton.style.display = 'block'; // Show the "Back to Search" button after a report is displayed
        // IMPORTANT: We do NOT call showPage('report-page') here because 'reportContent' is already
        // part of the 'search-page'.
    }

    // Function to display user profile data dynamically.
    function renderUserProfile() {
        if (currentUser) {
            profileUsername.textContent = currentUser.username;
            profileEmail.textContent = currentUser.email;

            // Render simulated search history.
            if (currentUser.searchHistory && currentUser.searchHistory.length > 0) {
                // Ensure date formatting is consistent. 'en-US' locale gives MM/DD/YYYY
                searchHistoryList.innerHTML = currentUser.searchHistory
                    .map(item => `<li>Searched for: ${item.query} on ${new Date(item.date).toLocaleDateString('en-US')}</li>`)
                    .join('');
            } else {
                searchHistoryList.innerHTML = '<li>No recent searches.</li>';
            }
        } else {
            profileUsername.textContent = 'Guest';
            profileEmail.textContent = 'N/A';
            searchHistoryList.innerHTML = '<li>User not logged in.</li>';
        }
    }

    // Function to display admin panel data dynamically.
    function renderAdminPanel() {
        if (appData.admin) {
            adminTotalCars.textContent = appData.admin.totalCars;
            // The 'activeUsers' field might not be in data.json's admin object, so provide fallback.
            adminActiveUsers.textContent = appData.admin.activeUsers !== undefined ? appData.admin.activeUsers : 'N/A';
        } else {
            adminTotalCars.textContent = 'N/A';
            adminActiveUsers.textContent = 'N/A';
        }
    }


    // --- 4. Event Listeners (making our buttons/links clickable) ---

    // Event listener for all navigation links to switch active pages.
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            showPage(event.target.dataset.page);
        });
    });

    // Event listener for the "Start Search" button on the landing page.
    startSearchButton.addEventListener('click', (event) => {
        event.preventDefault();
        showPage('search-page');
    });

    // Event listener for the "Back to Search" button on the report page.
    backToSearchButton.addEventListener('click', (event) => {
        event.preventDefault();
        // When clicking back, reset the search page state
        reportContent.innerHTML = '<p>Search for a car to see its basic report here.</p>'; // Clear the report
        searchMessage.textContent = ''; // Clear any search messages
        backToSearchButton.style.display = 'none'; // Hide the back button
        searchInput.value = ''; // Clear the search input
        showPage('search-page'); // Explicitly ensure we are on the search page
    });


    // Event listener for the main "Search Car" button.
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim(); // Get and trim the search input.
        searchMessage.textContent = ''; // Clear previous messages.

        if (query === '') {
            searchMessage.textContent = 'Please enter a VIN or Plate.';
            reportContent.innerHTML = '<p>Search for a car to see its basic report here.</p>';
            backToSearchButton.style.display = 'none'; // No need for back button if nothing was searched
            return;
        }

        // Search for a car within the loaded `appData.cars` array.
        // It matches either VIN or Plate number (case-insensitive).
        const foundCar = appData.cars.find(car =>
            car.vin.toLowerCase() === query.toLowerCase() ||
            car.plate.toLowerCase() === query.toLowerCase()
        );

        // Render the report based on the search result.
        renderCarReport(foundCar);

        // Optional: Update user's search history (simulated, this doesn't update JSON Server)
        if (currentUser && foundCar) {
            if (!currentUser.searchHistory) {
                currentUser.searchHistory = [];
            }
            // Check if this search query is already in history to avoid duplicates
            const existingSearch = currentUser.searchHistory.find(s => s.query.toLowerCase() === query.toLowerCase());
            if (!existingSearch) {
                // Add new search to the beginning of the history
                currentUser.searchHistory.unshift({ query: query, date: new Date().toISOString() });
                // Keep history limited to a certain number of items (e.g., 5)
                if (currentUser.searchHistory.length > 5) {
                    currentUser.searchHistory.pop(); // Remove the oldest entry
                }
            }
        }
    });

    // --- 5. Initialization (what runs when the script first loads) ---

    // Set the current year dynamically in the footer.
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Begin the application by loading data from the JSON Server.
    loadData();

}); // End of DOMContentLoaded event listener
