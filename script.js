// --- Constants ---
const WEBHOOK_URL = 'https://shreelaxmi21-rk.app.n8n.cloud/webhook-test/complaint'; // User to replace this with actual webhook URL

const TRACKING_WEBHOOK_URL = 'https://shreelaxmi21-rk.app.n8n.cloud/webhook-test/check-status'; // User to replace this with actual tracking webhook URL

const MOCK_OTP = '1234';

// --- State Variables ---
let currentUser = {
    name: '',
    phone: '',
    gmail: '',
    state: '',
    district: '',
    aadhar: '',
    age: '',
    isLoggedIn: false
};
let uploadedImages = [];
let uploadedVideos = [];

// --- DOM Elements ---
// ==========================================
// NAVIGATION SIDEBAR LOGIC (Left Menu)
// ==========================================

window.openNavSidebar = function (e) {
    if (e) e.preventDefault();
    const navSidebar = document.getElementById('nav-sidebar');
    const navOverlay = document.getElementById('nav-overlay');

    if (!navSidebar || !navOverlay) return;

    navOverlay.classList.remove('hidden');

    // Force reflow before adding active class for animation
    void navSidebar.offsetWidth;

    navSidebar.classList.add('active');
};

window.closeNavSidebar = function () {
    const navSidebar = document.getElementById('nav-sidebar');
    const navOverlay = document.getElementById('nav-overlay');
    if (navSidebar && navOverlay) {
        navSidebar.classList.remove('active');
        setTimeout(() => {
            navOverlay.classList.add('hidden');
        }, 300);
    }
};

document.addEventListener('click', (e) => {
    const closeNavBtn = e.target.closest('#close-nav-btn');
    const navOverlay = document.getElementById('nav-overlay');
    const navSidebar = document.getElementById('nav-sidebar');

    if (!navSidebar || !navOverlay) return;

    // Close
    if (closeNavBtn || e.target === navOverlay) {
        if (e) e.preventDefault();
        window.closeNavSidebar();
    }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    const navSidebar = document.getElementById('nav-sidebar');
    const navOverlay = document.getElementById('nav-overlay');

    if (e.key === 'Escape' && navSidebar && navSidebar.classList.contains('active')) {
        window.closeNavSidebar();
    }
});

// ==========================================
// CORE APP LOGIC
// ==========================================

const loginForm = document.getElementById('login-form');
const complaintForm = document.getElementById('complaint-form');
const loginPhoneInput = document.getElementById('login-phone');
const loginGmailInput = document.getElementById('login-gmail');
const loginNameInput = document.getElementById('login-name');
const loginStateInput = document.getElementById('login-state');
const loginDistrictInput = document.getElementById('login-district');
const loginAadharInput = document.getElementById('login-aadhar');
const loginAgeInput = document.getElementById('login-age');
const loginOtpInput = document.getElementById('login-otp');
const userPhoneInput = document.getElementById('user-phone');
const userNameInput = document.getElementById('user-name');
const imageFileInput = document.getElementById('image-files');
const imageFileList = document.getElementById('image-file-list');
const videoFileInput = document.getElementById('video-files');
const videoFileList = document.getElementById('video-file-list');
const toast = document.getElementById('toast');
const trackBtn = document.getElementById('track-btn');
const trackRegistrationIdInput = document.getElementById('track-registration-id');
const logoutBtn = document.getElementById('logout-btn');

// --- Utilities ---
let toastTimeout = null;

function showToast(message, type = 'success') {
    if (!toast) return;

    // Clear any existing timeout to prevent stacking
    if (toastTimeout) clearTimeout(toastTimeout);

    toast.textContent = message;
    toast.className = `toast ${type}`;

    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
        toastTimeout = null;
    }, 3000);
}

// --- Event Listeners ---

// 1. Login Handling
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = loginNameInput.value.trim();
        const phone = loginPhoneInput.value.trim();
        const gmail = loginGmailInput.value.trim();
        const state = loginStateInput.value.trim();
        const district = loginDistrictInput.value.trim();
        const aadhar = loginAadharInput.value.trim();
        const age = loginAgeInput.value.trim();
        const otp = loginOtpInput.value.trim();

        if (!name || !phone || !gmail || !state || !district || !aadhar || !age || !otp) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        // Validate Gmail format
        if (!gmail.toLowerCase().endsWith('@gmail.com')) {
            showToast('Please enter a valid Gmail ID', 'error');
            return;
        }

        // Validate age
        if (parseInt(age) < 16) {
            showToast('Age must be greater than 15', 'error');
            return;
        }

        // Validate Aadhar (12 digits)
        if (!/^\d{12}$/.test(aadhar)) {
            showToast('Aadhar Number must be 12 digits', 'error');
            return;
        }

        if (otp !== MOCK_OTP) {
            showToast('Invalid OTP. Try 1234', 'error');
            return;
        }

        // Success — store all user details in localStorage
        const userObj = {
            name: name,
            phone: phone,
            gmail: gmail,
            state: state,
            district: district,
            aadhar: aadhar,
            age: age,
            isLoggedIn: true
        };
        localStorage.setItem('currentUser', JSON.stringify(userObj));

        showToast('Welcome to UrbanVoice', 'success');

        // Redirect to dashboard page immediately
        window.location.href = 'dashboard.html';
    });
}

// 1.5 Page Load Authentication Check
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');

    // If we're on dashboard.html and NOT logged in, redirect to index
    if (window.location.pathname.includes('dashboard.html')) {
        if (!savedUser) {
            window.location.href = 'index.html';
            return;
        }

        const userObj = JSON.parse(savedUser);
        currentUser = userObj;

        // Auto-fill dashboard form fields from login data
        if (userPhoneInput) userPhoneInput.value = userObj.phone;
        if (userNameInput) userNameInput.value = userObj.name;

        // Show user's first name in the header chip
        const headerUsername = document.getElementById('header-username');
        if (headerUsername) headerUsername.textContent = userObj.name.split(' ')[0];
    }

    // If we're on index.html (login) and ALREADY logged in, redirect to dashboard
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        if (savedUser) {
            window.location.href = 'dashboard.html';
        }
    }
});

// Hide registration message when user starts making changes to form
function setupFormChangeListeners() {
    if (!complaintForm) return;

    const formInputs = complaintForm.querySelectorAll('input, textarea');
    const responseDiv = document.getElementById('responseMessage');

    const hideResponseMessage = () => {
        if (responseDiv && responseDiv.style.display !== 'none') {
            responseDiv.style.display = 'none';
            responseDiv.innerHTML = '';
        }
    };

    // Add event listener to all form inputs
    formInputs.forEach(input => {
        // Hide on first input/change
        input.addEventListener('input', hideResponseMessage, { once: true });
        input.addEventListener('change', hideResponseMessage, { once: true });
    });

    // Also hide when files are selected
    if (imageFileInput) imageFileInput.addEventListener('change', hideResponseMessage, { once: true });
    if (videoFileInput) videoFileInput.addEventListener('change', hideResponseMessage, { once: true });
}

// Call this when page loads
setupFormChangeListeners();

// 1.8 Logout Handling
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        currentUser = {
            name: '', phone: '', gmail: '', state: '', district: '', aadhar: '', age: '', isLoggedIn: false
        };
        window.location.href = 'index.html';
    });
}

// 2. File Upload Handling

if (imageFileInput) {
    imageFileInput.addEventListener('change', (e) => {
        const newFiles = Array.from(e.target.files);
        uploadedImages = [...uploadedImages, ...newFiles];
        renderFileList(uploadedImages, imageFileList, 'image');
    });
}

if (videoFileInput) {
    videoFileInput.addEventListener('change', (e) => {
        const newFiles = Array.from(e.target.files);
        uploadedVideos = [...uploadedVideos, ...newFiles];
        renderFileList(uploadedVideos, videoFileList, 'video');
    });
}

function renderFileList(files, listEl, type) {
    listEl.innerHTML = '';
    if (files.length === 0) return;

    files.forEach((file, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'margin-top: 6px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;';
        const iconName = type === 'image' ? 'image-outline' : 'film-outline';
        const sizeMB = (file.size / 1024 / 1024).toFixed(2);
        item.innerHTML = `
            <span style="color: var(--accent); display: inline-flex; align-items: center; gap: 4px;">
                <ion-icon name="${iconName}"></ion-icon> ${file.name}
            </span>
            <span style="color: var(--text-muted); font-size: 0.8em;">(${sizeMB} MB)</span>
            <span style="cursor: pointer; color: var(--error); margin-left: 4px; display: inline-flex; align-items: center;" 
                  onclick="removeFile('${type}', ${index})" title="Remove">
                <ion-icon name="close-circle-outline"></ion-icon>
            </span>
        `;
        listEl.appendChild(item);
    });
}

window.removeFile = (type, index) => {
    if (type === 'image') {
        uploadedImages.splice(index, 1);
        renderFileList(uploadedImages, imageFileList, 'image');
    } else {
        uploadedVideos.splice(index, 1);
        renderFileList(uploadedVideos, videoFileList, 'video');
    }
};

// --- Base64 Conversion Helpers (used for images only) ---

/**
 * Converts a File object to a Base64 string (data portion only, no prefix).
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // reader.result is "data:<mime>;base64,<data>" — extract only the base64 part
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}



// 4. Form Submission — Structured JSON for n8n / OpenAI
if (complaintForm) {
    complaintForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = complaintForm.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const loader = submitBtn.querySelector('.loader');

        // Validation
        const userName = userNameInput.value.trim();
        const complaint = document.getElementById('user-complaint').value.trim();

        if (!userName || !complaint) {
            showToast('Name and Complaint are mandatory.', 'error');
            return;
        }

        // UI Loading State
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        loader.style.display = 'block';

        try {
            // Build structured metadata as JSON
            const metadata = {
                timestamp: new Date().toISOString(),
                source: 'public-complaint-portal',
                version: '1.0'
            };
            const complaintData = {
                text: complaint,
                address: document.getElementById('user-address').value.trim() || null,
                language: 'auto'
            };

            // Use FormData to send files natively (avoids Base64 size inflation & webhook body limits)
            const formData = new FormData();
            formData.append('metadata', JSON.stringify(metadata));

            // User fields sent separately for easy access in n8n
            formData.append('name', currentUser.name || userName);
            formData.append('phone', currentUser.phone);
            formData.append('gmail', currentUser.gmail);
            formData.append('address', document.getElementById('user-address').value.trim() || '');
            formData.append('state', currentUser.state);
            formData.append('district', currentUser.district);
            formData.append('aadhar', currentUser.aadhar);
            formData.append('age', currentUser.age);

            formData.append('complaint', JSON.stringify(complaintData));

            // Append image files
            uploadedImages.forEach((file, i) => {
                formData.append(`image_${i}`, file, file.name);
            });
            formData.append('image_count', uploadedImages.length);

            // Append video files
            uploadedVideos.forEach((file, i) => {
                formData.append(`video_${i}`, file, file.name);
            });
            formData.append('video_count', uploadedVideos.length);

            console.log('Sending payload with', uploadedImages.length, 'image(s) and', uploadedVideos.length, 'video(s)');

            // Send as multipart/form-data to webhook (no Content-Type header — browser sets boundary automatically)
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                body: formData
            });

            console.log('Webhook response status:', response.status);
            console.log('User:', userName, currentUser.phone, currentUser.gmail);

            // Parse the response JSON
            if (!response.ok) {
                throw new Error('Webhook request failed');
            }

            const responseData = await response.json();
            console.log('Webhook response data:', responseData);

            // Extract registration ID from response
            const registrationId = responseData.registration_id || responseData.registrationId || responseData.id;

            if (registrationId) {
                // Display registration ID on the page
                displayRegistrationId(registrationId);
            } else {
                // Fallback to toast if no registration ID in response
                showToast(`Complaint Successfully Registered! Registration ID will be sent to ${currentUser.gmail}`, 'success');
            }

            resetForm();

        } catch (error) {
            console.error('Submission Error:', error);
            // Display error message
            displayErrorMessage();
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            loader.style.display = 'none';
        }
    });

    function resetForm() {
        complaintForm.reset();
        userPhoneInput.value = currentUser.phone; // Re-fill phone after reset
        uploadedImages = [];
        uploadedVideos = [];
        renderFileList(uploadedImages, imageFileList, 'image');
        renderFileList(uploadedVideos, videoFileList, 'video');

        // Note: responseMessage is NOT hidden here - it persists until user makes changes
    }


    // --- Display Registration ID Response ---
    function displayRegistrationId(registrationId) {
        const responseDiv = document.getElementById('responseMessage');
        responseDiv.innerHTML = `
        <div style="color: var(--success); font-size: var(--step-0); margin-bottom: var(--space-sm);">
            <ion-icon name="checkmark-circle" style="font-size: 2.5rem; display: block; margin: 0 auto var(--space-sm);"></ion-icon>
            Complaint Registered Successfully
        </div>
        <div style="color: var(--text-main); font-size: var(--step-0);">
            Your Registration ID: <strong style="color: var(--accent); font-size: var(--step-1); letter-spacing: 1px;">${registrationId}</strong>
        </div>
        <div style="color: var(--text-muted); font-size: var(--step--1); margin-top: var(--space-md);">
            Please save this ID to track your complaint status.
        </div>
    `;
        responseDiv.style.display = 'block';

        // Scroll to the message
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Also show toast
        showToast('Complaint submitted successfully!', 'success');
    }

    function displayErrorMessage() {
        const responseDiv = document.getElementById('responseMessage');
        responseDiv.innerHTML = `
        <div style="color: var(--error); font-size: var(--step-0);">
            <ion-icon name="alert-circle" style="font-size: 2.5rem; display: block; margin: 0 auto var(--space-sm);"></ion-icon>
            Submission failed. Please try again.
        </div>
    `;
        responseDiv.style.display = 'block';

        // Scroll to the message
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Also show toast
        showToast('Submission failed. Please try again.', 'error');
    }

    // --- Track Complaint Status ---
    trackBtn.addEventListener('click', async () => {
        const registrationId = trackRegistrationIdInput.value.trim();

        if (!registrationId) {
            showToast('Please enter a Registration ID', 'error');
            return;
        }

        // Disable button and show loading state
        trackBtn.disabled = true;
        trackBtn.innerHTML = '<div class="loader" style="display:block; width: 16px; height: 16px;"></div>';

        try {
            await fetchComplaintStatus(registrationId);
        } catch (error) {
            console.error('Error tracking complaint:', error);
            showToast('Failed to fetch status. Please try again.', 'error');
        } finally {
            trackBtn.disabled = false;
            trackBtn.innerHTML = '<ion-icon name="search-outline"></ion-icon> Track Status';
        }
    });

    async function fetchComplaintStatus(registrationId) {
        try {
            const payload = {
                registrationId: registrationId,
                requestedBy: currentUser.gmail || 'Unknown',
                timestamp: new Date().toISOString()
            };

            const response = await fetch(TRACKING_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('Tracking webhook response status:', response.status);
            console.log('Payload sent to tracking webhook:', payload);

            if (!response.ok) {
                throw new Error('Failed to fetch complaint status');
            }

            const statusData = await response.json();
            console.log('Tracking webhook raw response:', JSON.stringify(statusData, null, 2));
            displayComplaintStatus(statusData);

        } catch (error) {
            console.error('Tracking webhook error:', error);
            showErrorInModal(registrationId);
        }
    }

    function displayComplaintStatus(rawData) {
        // n8n returns an array — unwrap the first element
        const statusData = Array.isArray(rawData) ? rawData[0] : rawData;

        // Use bracket notation for space-separated keys returned by n8n
        const regId = statusData['registration id'] || statusData.registration_id || statusData.registrationId || statusData.id || 'N/A';
        const status = statusData.status || 'pending';
        const assignedTo = statusData['assigned to'] || statusData.assigned_to || statusData.assignedTo || 'Not Assigned';
        const remarks = statusData.remarks || '';

        const statusModal = document.getElementById('status-modal');
        const statusBody = document.getElementById('status-body');
        if (!statusModal || !statusBody) return;

        const statusHTML = `
        <div class="status-info">
            <div class="status-info-row">
                <span class="status-label">Registration ID</span>
                <span class="status-value">${regId}</span>
            </div>
            <div class="status-info-row">
                <span class="status-label">Status</span>
                <span class="status-badge ${status}">${status.replace('-', ' ')}</span>
            </div>
            <div class="status-info-row">
                <span class="status-label">Assigned To</span>
                <span class="status-value">${assignedTo}</span>
            </div>
            ${remarks ? `
            <div class="status-info-row">
                <span class="status-label">Remarks</span>
                <span class="status-value">${remarks}</span>
            </div>
            ` : ''}
        </div>
    `;

        statusBody.innerHTML = statusHTML;
        statusModal.classList.remove('hidden');
    }

    function showErrorInModal(registrationId) {
        const errorHTML = `
        <div class="status-info">
            <div class="status-info-row">
                <span class="status-label">Registration ID</span>
                <span class="status-value">${registrationId}</span>
            </div>
            <div class="status-info-row">
                <span class="status-label">Status</span>
                <span class="status-badge rejected">Not Found</span>
            </div>
        </div>
        <p style="color: var(--text-muted); font-size: var(--step--1); margin-top: var(--space-md); text-align: center;">
            Unable to find complaint with this registration ID. Please verify the ID and try again.
        </p>
    `;

        const statusModal = document.getElementById('status-modal');
        const statusBody = document.getElementById('status-body');
        if (!statusModal || !statusBody) return;

        statusBody.innerHTML = errorHTML;
        statusModal.classList.remove('hidden');
    }

    // Modal Close Handlers
    const closeModalBtnDynamic = document.getElementById('close-modal-btn');
    if (closeModalBtnDynamic) {
        closeModalBtnDynamic.addEventListener('click', () => {
            const sm = document.getElementById('status-modal');
            if (sm) sm.classList.add('hidden');
        });
    }

    // Close status modal button
    document.addEventListener('click', (e) => {
        if (e.target.closest('#close-status-modal-btn')) {
            const sm = document.getElementById('status-modal');
            if (sm) sm.classList.add('hidden');
        }
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        const sm = document.getElementById('status-modal');
        if (sm && e.target === sm) {
            sm.classList.add('hidden');
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        const sm = document.getElementById('status-modal');
        if (e.key === 'Escape' && sm && !sm.classList.contains('hidden')) {
            sm.classList.add('hidden');
        }
    });

    // Logout
    if (document.getElementById('logout-btn')) {
        document.getElementById('logout-btn').addEventListener('click', () => {
            location.reload();
        });
    }
} // End of if (complaintForm) block

// ==========================================
// PROFILE SIDEBAR & COMPLAINT HISTORY LOGIC
// ==========================================
// (Profile logic extracted from DOMContentLoaded to work across view transitions)

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1aeguSQrm9Km8e-45zYXyI0dbLcRWoB0tTTVpCpa1hco/export?format=csv';

// --- Live History Data Fetcher ---
async function fetchUserHistory(userPhone) {
    if (!userPhone) return [];

    return new Promise((resolve, reject) => {
        if (typeof Papa === 'undefined') {
            return resolve([]);
        }
        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true,
            header: true, // Use the first row as keys
            complete: function (results) {
                const data = results.data;
                // Filter complaints by the user's phone number
                // Column is named " phone number" in the sheet
                const userComplaints = data.filter(row => {
                    const phone = row[' phone number'] || row['phone number'] || row['phone'];
                    return phone && phone.trim() === userPhone;
                });

                // Map the matching rows to the format our frontend expects
                const mappedHistory = userComplaints.map(row => {
                    return {
                        id: row['registration id'] || 'Unknown ID',
                        date: row['time stamp'] ? row['time stamp'].split(' ')[0] : 'Unknown Date',
                        description: row['text complaint'] || 'No description provided.',
                        status: (row['status'] || 'Submitted').trim().toLowerCase(),
                        authority: row['authorities'] || 'Pending Assignment'
                    };
                });

                resolve(mappedHistory);
            },
            error: function (err) {
                console.error("Failed to parse Google Sheet:", err);
                resolve([]); // Return empty array on failure so UI doesn't break
            }
        });
    });
}

// Submit Feedback mock handler
window.submitFeedback = function (buttonElem, regId) {
    const section = buttonElem.closest('.feedback-section');
    const textarea = section.querySelector('textarea');
    const text = textarea.value.trim();
    const activeStars = section.querySelectorAll('.star-rating ion-icon.active').length;

    if (activeStars === 0) {
        alert('Please select a star rating.');
        return;
    }

    buttonElem.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Submitted';
    buttonElem.classList.replace('btn-primary', 'btn-success');
    buttonElem.disabled = true;
    textarea.disabled = true;
    // Optional: show a global toast if the function is defined
    if (typeof showToast === 'function') {
        showToast('Feedback submitted successfully!', 'success');
    }
};

// Star rating hover handler
window.handleStarHover = function (icon, enter) {
    const ratingContainer = icon.parentElement;
    if (enter) {
        const index = Array.from(ratingContainer.children).indexOf(icon);
        Array.from(ratingContainer.children).forEach((star, i) => {
            if (i <= index) star.classList.add('hovered');
            else star.classList.remove('hovered');
        });
    } else {
        Array.from(ratingContainer.children).forEach(star => {
            star.classList.remove('hovered');
        });
    }
};

// Star rating click handler
window.handleStarClick = function (icon) {
    const ratingContainer = icon.parentElement;
    const index = Array.from(ratingContainer.children).indexOf(icon);
    Array.from(ratingContainer.children).forEach((star, i) => {
        if (i <= index) star.classList.add('active');
        else star.classList.remove('active');
    });
};

window.renderHistory = async function () {
    if (!currentUser || !currentUser.isLoggedIn) return;

    const sidebarUserName = document.getElementById('sidebar-user-name');
    const sidebarUserPhone = document.getElementById('sidebar-user-phone');
    const historyList = document.getElementById('complaint-history-list');
    if (!historyList) return;

    // Populate profile info
    if (sidebarUserName) sidebarUserName.textContent = currentUser.name;
    if (sidebarUserPhone) sidebarUserPhone.textContent = currentUser.phone;

    // Show loading state
    historyList.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-muted);"><ion-icon name="sync-outline" style="animation: spin 1s linear infinite; font-size: 24px;"></ion-icon><p>Loading records...</p></div>';

    // Get history dynamically from Google Sheets
    const userHistory = await fetchUserHistory(currentUser.phone);

    if (!userHistory || userHistory.length === 0) {
        historyList.innerHTML = '<div class="empty-history" style="text-align:center; padding: 20px; color: var(--text-muted);">No complaints filed yet.</div>';
        return;
    }

    let html = '';
    userHistory.forEach(item => {
        // Check if status is resolved to show feedback box
        const isResolved = item.status === 'resolved';

        html += `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-id">${item.id}</span>
                        <span class="history-date">${item.date}</span>
                    </div>
                    <div class="history-desc">${item.description}</div>
                    <div class="history-footer">
                        <span class="history-status ${item.status.replace(/\s+/g, '-')}">${item.status.replace('-', ' ')}</span>
                        <span class="history-authority"><ion-icon name="business-outline"></ion-icon> ${item.authority}</span>
                        <button class="btn-icon" style="min-width: 32px; min-height: 32px; padding: 4px;" title="Track" onclick="document.getElementById('track-registration-id').value = '${item.id}'; document.getElementById('track-btn').click(); closeProfileSidebar();">
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </button>
                    </div>
                    
                    ${isResolved ? `
                    <div class="feedback-section">
                        <h4>Provide Feedback</h4>
                        <div class="star-rating">
                            <ion-icon name="star" onmouseover="handleStarHover(this, true)" onmouseout="handleStarHover(this, false)" onclick="handleStarClick(this)"></ion-icon>
                            <ion-icon name="star" onmouseover="handleStarHover(this, true)" onmouseout="handleStarHover(this, false)" onclick="handleStarClick(this)"></ion-icon>
                            <ion-icon name="star" onmouseover="handleStarHover(this, true)" onmouseout="handleStarHover(this, false)" onclick="handleStarClick(this)"></ion-icon>
                            <ion-icon name="star" onmouseover="handleStarHover(this, true)" onmouseout="handleStarHover(this, false)" onclick="handleStarClick(this)"></ion-icon>
                            <ion-icon name="star" onmouseover="handleStarHover(this, true)" onmouseout="handleStarHover(this, false)" onclick="handleStarClick(this)"></ion-icon>
                        </div>
                        <textarea placeholder="Tell us about your experience..." rows="2"></textarea>
                        <button type="button" class="btn-primary" style="padding: 8px 16px; font-size: 0.8rem; border-radius: 6px;" onclick="submitFeedback(this, '${item.id}')">Submit Review</button>
                    </div>
                    ` : ''}
                </div>
            `;
    });

    historyList.innerHTML = html;
}

window.openProfileSidebar = async function (e) {
    // Rely on native link navigation, allow it to fire normally
    window.location.href = 'history.html';
};

window.closeProfileSidebar = function () {
    const sidebar = document.getElementById('profile-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (!sidebar || !sidebarOverlay) return;

    sidebar.classList.remove('active');
    setTimeout(() => {
        sidebarOverlay.classList.add('hidden');
        sidebar.classList.add('hidden');
    }, 300); // Matches CSS transition duration
};

// Event Listeners (dynamic resolution)
document.addEventListener('click', (e) => {
    if (e.target.closest('#header-username')) {
        window.openProfileSidebar(e);
    } else if (e.target.closest('#close-sidebar-btn') || e.target.id === 'sidebar-overlay') {
        window.closeProfileSidebar();
    }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    const sidebar = document.getElementById('profile-sidebar');
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('active')) {
        window.closeProfileSidebar();
    }
});


