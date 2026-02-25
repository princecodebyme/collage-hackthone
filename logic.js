
(function () {
    // ----- LOCAL STORAGE INIT -----
    const USERS_KEY = 'hackathon_users';
    const APPOINTMENTS_KEY = 'appointments';
    const REMINDERS_KEY = 'reminders';
    const CHATS_KEY = 'chats'; // new key for direct messages

    // ----- SCHEMES SCROLLING SETUP -----
    // Duplicate schemes for seamless looping
    setTimeout(() => {
        const schemeWrapper = document.querySelector('.schemes-scroll-wrapper');
        if (schemeWrapper) {
            const original = schemeWrapper.innerHTML;
            schemeWrapper.innerHTML += original; // Duplicate content for seamless loop
        }
    }, 100);

    // Default data if nothing exists
    if (!localStorage.getItem(USERS_KEY)) {
        // sample patient
        const sampleUsers = [
            { fullName: 'John Doe', gender: 'Male', age: 28, phone: '9876543210', email: 'john@example.com', password: 'pass', emergencyContact: '1234567890', role: 'patient' },
            { fullName: 'Sarah Smith', gender: 'Female', age: 32, phone: '9876543211', email: 'sarah@example.com', password: 'pass', emergencyContact: '1234567891', role: 'patient' },
            { fullName: 'Emily Davis', specialization: 'Cardiologist', experience: 10, phone: '9988776655', email: 'emily@heart.com', password: 'doc', availableTime: 'Mon-Fri 10AM-4PM', role: 'doctor', rating: 4.8 },
            { fullName: 'Michael Lee', specialization: 'Dermatologist', experience: 8, phone: '9988776644', email: 'michael@skin.com', password: 'doc', availableTime: 'Tue-Thu 2PM-8PM', role: 'doctor', rating: 4.5 }
        ];
        localStorage.setItem(USERS_KEY, JSON.stringify(sampleUsers));
    }
    if (!localStorage.getItem(APPOINTMENTS_KEY)) localStorage.setItem(APPOINTMENTS_KEY, '[]');
    if (!localStorage.getItem(REMINDERS_KEY)) localStorage.setItem(REMINDERS_KEY, '[]');
    if (!localStorage.getItem(CHATS_KEY)) localStorage.setItem(CHATS_KEY, '[]');

    // ----- GLOBAL VARIABLES -----
    let currentUser = null; // will be set after login
    let currentChatTargetEmail = null; // used for the open chat window

    // ----- HELPER FUNCTIONS -----
    function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
    function getUsers() { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    function saveAppointments(apps) { localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(apps)); }
    function getAppointments() { return JSON.parse(localStorage.getItem(APPOINTMENTS_KEY)) || []; }
    function saveReminders(rem) { localStorage.setItem(REMINDERS_KEY, JSON.stringify(rem)); }
    function getReminders() { return JSON.parse(localStorage.getItem(REMINDERS_KEY)) || []; }
    function saveChats(chats) { localStorage.setItem(CHATS_KEY, JSON.stringify(chats)); }
    function getChats() { return JSON.parse(localStorage.getItem(CHATS_KEY)) || []; }

    // Loading animation helpers
    function showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        if (overlay && text) {
            text.innerText = message;
            overlay.classList.remove('hide');
        }
    }

    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            setTimeout(() => {
                overlay.classList.add('hide');
            }, 800);
        }
    }

    // Switch views
    function showAuth() {
        document.getElementById('authView').classList.remove('hide');
        document.getElementById('patientDashboard').classList.add('hide');
        document.getElementById('doctorDashboard').classList.add('hide');
        currentUser = null;
        sessionStorage.removeItem('currentUser');
    }

    function showPatientDashboard(user) {
        document.getElementById('authView').classList.add('hide');
        document.getElementById('patientDashboard').classList.remove('hide');
        document.getElementById('doctorDashboard').classList.add('hide');
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        renderPatientDashboard(user);
    }

    function showDoctorDashboard(user) {
        document.getElementById('authView').classList.add('hide');
        document.getElementById('doctorDashboard').classList.remove('hide');
        document.getElementById('patientDashboard').classList.add('hide');
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        renderDoctorDashboard(user);
    }

    // Check session on load
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        if (user.role === 'patient') showPatientDashboard(user);
        else if (user.role === 'doctor') showDoctorDashboard(user);
    }

    // ----- AUTH TAB TOGGLE -----
    const authTabs = document.querySelectorAll('.auth-tab');
    const patientAuth = document.getElementById('patientAuth');
    const doctorAuth = document.getElementById('doctorAuth');
    authTabs.forEach(tab => {
        tab.addEventListener('click', e => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tab.dataset.tab === 'patient') {
                patientAuth.classList.add('active');
                doctorAuth.classList.remove('active');
            } else {
                doctorAuth.classList.add('active');
                patientAuth.classList.remove('active');
            }
        });
    });

    // Patient login/register tab toggle
    document.getElementById('patientLoginTab').addEventListener('click', () => {
        document.getElementById('patientLoginForm').style.display = 'block';
        document.getElementById('patientRegisterForm').style.display = 'none';
    });
    document.getElementById('patientRegisterTab').addEventListener('click', () => {
        document.getElementById('patientLoginForm').style.display = 'none';
        document.getElementById('patientRegisterForm').style.display = 'block';
    });
    // Doctor login/register tab toggle
    document.getElementById('doctorLoginTab').addEventListener('click', () => {
        document.getElementById('doctorLoginForm').style.display = 'block';
        document.getElementById('doctorRegisterForm').style.display = 'none';
    });
    document.getElementById('doctorRegisterTab').addEventListener('click', () => {
        document.getElementById('doctorLoginForm').style.display = 'none';
        document.getElementById('doctorRegisterForm').style.display = 'block';
    });

    // ----- REGISTRATION & LOGIN -----
    // Patient Register
    document.getElementById('patientRegisterBtn').addEventListener('click', () => {
        const fullName = document.getElementById('regFullName').value.trim();
        const gender = document.getElementById('regGender').value;
        const age = document.getElementById('regAge').value;
        const phone = document.getElementById('regPhone').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const emergency = document.getElementById('regEmergency').value.trim();
        if (!fullName || !gender || !age || !phone || !email || !password || !emergency || gender === '') {
            alert('Please fill all fields'); return;
        }
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            alert('Email already registered'); return;
        }
        showLoading('Creating your account...');
        setTimeout(() => {
            const newPatient = { fullName, gender, age, phone, email, password, emergencyContact: emergency, role: 'patient' };
            users.push(newPatient);
            saveUsers(users);
            hideLoading();
            alert('Registration successful! Please login.');
            // switch to login view
            document.getElementById('patientLoginForm').style.display = 'block';
            document.getElementById('patientRegisterForm').style.display = 'none';
            document.getElementById('patientLoginTab').click();
        }, 1200);
    });

    // Patient Login
    document.getElementById('patientLoginBtn').addEventListener('click', () => {
        const email = document.getElementById('patientLoginEmail').value.trim();
        const pwd = document.getElementById('patientLoginPassword').value;
        if (!email || !pwd) {
            alert('Please fill in all fields');
            return;
        }
        showLoading('Signing in...');
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === pwd && u.role === 'patient');
        setTimeout(() => {
            hideLoading();
            if (user) {
                showPatientDashboard(user);
            } else {
                alert('Invalid credentials');
            }
        }, 1200);
    });

    // Doctor Register
    document.getElementById('doctorRegisterBtn').addEventListener('click', () => {
        const fullName = document.getElementById('docFullName').value.trim();
        const spec = document.getElementById('docSpecialization').value.trim();
        const exp = document.getElementById('docExperience').value;
        const phone = document.getElementById('docPhone').value.trim();
        const email = document.getElementById('docEmail').value.trim();
        const pwd = document.getElementById('docPassword').value;
        const avail = document.getElementById('docAvailable').value.trim();
        if (!fullName || !spec || !exp || !phone || !email || !pwd || !avail) {
            alert('Fill all fields'); return;
        }
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            alert('Email already used'); return;
        }
        showLoading('Registering your practice...');
        setTimeout(() => {
            const newDoc = { fullName, specialization: spec, experience: exp, phone, email, password: pwd, availableTime: avail, role: 'doctor', rating: 5.0 };
            users.push(newDoc);
            saveUsers(users);
            hideLoading();
            alert('Doctor registered. Please login.');
            document.getElementById('doctorLoginForm').style.display = 'block';
            document.getElementById('doctorRegisterForm').style.display = 'none';
            document.getElementById('doctorLoginTab').click();
        }, 1200);
    });

    // Doctor Login
    document.getElementById('doctorLoginBtn').addEventListener('click', () => {
        const email = document.getElementById('doctorLoginEmail').value.trim();
        const pwd = document.getElementById('doctorLoginPassword').value;
        if (!email || !pwd) {
            alert('Please fill in all fields');
            return;
        }
        showLoading('Authenticating doctor account...');
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === pwd && u.role === 'doctor');
        setTimeout(() => {
            hideLoading();
            if (user) {
                showDoctorDashboard(user);
            } else {
                alert('Invalid credentials');
            }
        }, 1200);
    });

    // Logout
    document.getElementById('patientLogout').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        showAuth();
    });
    document.getElementById('doctorLogout').addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        showAuth();
    });

    // ----- PATIENT DASHBOARD RENDER -----
    function renderPatientDashboard(user) {
        document.getElementById('patientName').innerText = user.fullName.split(' ')[0];
        // Load reminders
        renderReminders(user.email);
        renderUpcomingReminders(user.email);

        // Active Appointments / Chat
        renderPatientActiveAppointments(user.email);

        // Profile
        const profileDiv = document.getElementById('patientProfileInfo');
        profileDiv.innerHTML = `
                    <p><strong>Name:</strong> ${user.fullName}</p>
                    <p><strong>Gender:</strong> ${user.gender}</p>
                    <p><strong>Age:</strong> ${user.age}</p>
                    <p><strong>Phone:</strong> ${user.phone}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Emergency:</strong> ${user.emergencyContact}</p>
                `;

        // Show doctors based on issue
        document.getElementById('showDoctorsBtn').onclick = () => {
            const issue = document.getElementById('issueSelect').value;
            // map issue to specialization loosely
            let spec = issue; // e.g., 'Cardiologist'
            const users = getUsers();
            const doctors = users.filter(u => u.role === 'doctor' && u.specialization && u.specialization.includes(spec.replace('General Physician', '')));
            // if none, show all doctors
            const listDiv = document.getElementById('doctorListContainer');
            if (doctors.length === 0) {
                listDiv.innerHTML = '<p>No doctors found for this issue, showing all:</p>';
                const allDocs = users.filter(u => u.role === 'doctor');
                displayDoctorList(allDocs, user.email);
            } else {
                displayDoctorList(doctors, user.email);
            }
        };

        // Emergency button
        document.getElementById('emergencyBtn').onclick = triggerEmergency;

        // Add reminder with enhanced features
        document.getElementById('addReminderBtn').onclick = () => {
            const med = document.getElementById('reminderName').value.trim();
            const time = document.getElementById('reminderTime').value;
            const dosage = document.getElementById('reminderDosage').value.trim();
            const notes = document.getElementById('reminderNotes').value.trim();
            
            if (!med || !time) { alert('Enter medicine name and time'); return; }
            
            const reminders = getReminders();
            const newRem = { 
                id: Date.now(), 
                patientEmail: user.email, 
                medicine: med, 
                time, 
                dosage: dosage || 'Not specified',
                notes: notes || 'No notes',
                taken: false
            };
            reminders.push(newRem);
            saveReminders(reminders);
            document.getElementById('reminderName').value = '';
            document.getElementById('reminderTime').value = '';
            document.getElementById('reminderDosage').value = '';
            document.getElementById('reminderNotes').value = '';
            renderReminders(user.email);
            renderUpcomingReminders(user.email);
        };
    }

    function renderPatientActiveAppointments(patientEmail) {
        const apps = getAppointments().filter(a => a.patientEmail === patientEmail && a.status === 'accepted');
        const container = document.getElementById('patientActiveChatsContainer');
        if (!container) return;

        if (apps.length === 0) {
            container.innerHTML = '<p style="opacity: 0.7;">No active chats yet. Book a doctor first!</p>';
            return;
        }

        // Find unique doctors patient is connected to
        const doctorEmails = [...new Set(apps.map(a => a.doctorEmail))];
        const users = getUsers();
        const doctors = users.filter(u => u.role === 'doctor' && doctorEmails.includes(u.email));

        let html = '';
        doctors.forEach(d => {
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #eef2f6; padding: 1rem; border-radius: 12px; margin-top: 0.5rem;">
                    <strong>Dr. ${d.fullName}</strong>
                    <button class="btn" style="padding: 0.4rem 1.2rem; font-size: 0.9rem;" onclick="openChat('${d.email}', 'Dr. ${d.fullName}')"><i class="fas fa-comment"></i> Chat</button>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    function renderUpcomingReminders(patientEmail) {
        const rems = getReminders().filter(r => r.patientEmail === patientEmail);
        const container = document.getElementById('upcomingReminders');
        if (!container) return;
        
        if (rems.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No reminders scheduled</p>';
            return;
        }

        const sortedRems = rems.sort((a, b) => a.time.localeCompare(b.time));
        let html = '';
        sortedRems.forEach(r => {
            const status = r.taken ? '✅ Taken' : '⏳ Pending';
            html += `
                <div style="background: white; padding: 1rem; border-radius: 12px; border-left: 4px solid ${r.taken ? '#3b82f6' : '#2563eb'}; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <strong style="font-size: 1.1rem; color: #1e2b4f;">${r.medicine}</strong>
                        <p style="color: #666; margin: 0.3rem 0 0 0;"><i class="fas fa-clock"></i> ${r.time}</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="color: #666; font-size: 0.9rem; margin: 0;">Dosage: ${r.dosage}</p>
                        <p style="color: #999; font-size: 0.85rem; margin: 0.3rem 0 0 0;">${status}</p>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    function renderReminders(patientEmail) {
        const rems = getReminders().filter(r => r.patientEmail === patientEmail);
        const container = document.getElementById('reminderList');
        const noMsg = document.getElementById('noRemindersMsg');
        
        if (!container) return;
        
        if (rems.length === 0) { 
            container.innerHTML = '';
            if (noMsg) noMsg.style.display = 'block';
            return; 
        }
        
        if (noMsg) noMsg.style.display = 'none';
        
        container.innerHTML = rems.map(r => `
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 1.2rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <strong style="font-size: 1.1rem; color: #1e2b4f;">${r.medicine}</strong>
                    <p style="color: #666; margin: 0.3rem 0; font-size: 0.95rem;">
                        <i class="fas fa-clock"></i> ${r.time} | <i class="fas fa-weight"></i> ${r.dosage}
                    </p>
                    <p style="color: #888; font-size: 0.9rem; margin: 0.3rem 0 0 0; font-style: italic;">${r.notes}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button style="background: #2563eb; padding: 0.5rem 1rem; border-radius: 6px; border: none; color: white; cursor: pointer;" 
                            onclick="markReminderTaken(${r.id}, '${patientEmail}')">
                        <i class="fas fa-check"></i> Taken
                    </button>
                    <i class="fas fa-trash" style="color:#dc2626; cursor:pointer; padding: 0.5rem; font-size: 1.1rem;" data-id="${r.id}" title="Delete"></i>
                </div>
            </div>
        `).join('');
        
        // attach delete handlers
        document.querySelectorAll('#reminderList .fa-trash').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                let rems = getReminders();
                rems = rems.filter(r => r.id != id);
                saveReminders(rems);
                renderReminders(patientEmail);
                renderUpcomingReminders(patientEmail);
            });
        });
    }

    // Mark reminder as taken
    window.markReminderTaken = function(id, patientEmail) {
        let rems = getReminders();
        const reminder = rems.find(r => r.id == id);
        if (reminder) {
            reminder.taken = true;
            saveReminders(rems);
            renderReminders(patientEmail);
            renderUpcomingReminders(patientEmail);
            alert('✅ Medicine marked as taken!');
        }
    };

    function displayDoctorList(doctors, patientEmail) {
        const container = document.getElementById('doctorListContainer');
        if (doctors.length === 0) { container.innerHTML = '<p>No doctors available</p>'; return; }

        container.innerHTML = doctors.map(d => {
            const ratingNum = d.rating || 5.0; // default to 5.0 if not set
            const fullStars = Math.floor(ratingNum);
            const hasHalfStar = ratingNum - fullStars >= 0.5 ? 1 : 0;
            const emptyStars = 5 - fullStars - hasHalfStar;

            const starsHTML =
                '<i class="fas fa-star" style="color: #fbbf24;"></i>'.repeat(fullStars) +
                (hasHalfStar ? '<i class="fas fa-star-half-alt" style="color: #fbbf24;"></i>' : '') +
                '<i class="far fa-star" style="color: #fbbf24;"></i>'.repeat(emptyStars);

            return `
                    <div class="doctor-item" style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="flex: 1;">
                            <strong>Dr. ${d.fullName}</strong> (${d.specialization}) · ${d.experience} yrs<br>
                            <div style="margin: 3px 0; font-size: 0.9rem;">
                                ${starsHTML} <span style="font-weight: 500;">${ratingNum.toFixed(1)}</span>
                            </div>
                            <small>${d.availableTime}</small>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 0.3rem;">
                            <button class="book-app-btn btn" style="padding: 0.3rem 1rem; font-size: 0.9rem;" data-doctor='${JSON.stringify(d)}'>Book</button>
                            <button class="view-profile-btn btn-outline" style="padding: 0.3rem 1rem; font-size: 0.9rem;" data-doctor='${JSON.stringify(d)}'>Profile</button>
                        </div>
                    </div>
                `;
        }).join('');
        // booking
        document.querySelectorAll('.book-app-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const doctor = JSON.parse(e.target.dataset.doctor);
                const issueDesc = prompt('Describe your issue briefly:');
                if (issueDesc === null) return;
                const apps = getAppointments();
                const newApp = {
                    id: Date.now(),
                    patientEmail: patientEmail,
                    patientName: currentUser.fullName,
                    doctorEmail: doctor.email,
                    doctorName: doctor.fullName,
                    issue: issueDesc,
                    date: new Date().toLocaleString(),
                    status: 'pending'
                };
                apps.push(newApp);
                saveAppointments(apps);
                alert('Appointment request sent!');
            });
        });

        // view profile
        document.querySelectorAll('.view-profile-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const doctor = JSON.parse(e.target.dataset.doctor);
                if (window.showDoctorProfileModal) {
                    window.showDoctorProfileModal(doctor);
                }
            });
        });
    }

    // Emergency function
    function triggerEmergency() {
        const infoDiv = document.getElementById('emergencyInfo');
        infoDiv.innerHTML = '<p>📍 Getting your location...</p>';
        if (!navigator.geolocation) {
            infoDiv.innerHTML = '<p>Geolocation not supported.</p>';
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                // Simulated hospitals (lat,lng around a common area)
                const hospitals = [
                    { name: 'City General Hospital', lat: lat + 0.01, lng: lng - 0.01, phone: '108' },
                    { name: 'MediCare Super Speciality', lat: lat - 0.02, lng: lng + 0.02, phone: '102' },
                    { name: 'Govt Medical College', lat: lat + 0.005, lng: lng + 0.005, phone: '104' }
                ];
                // distance
                const withDist = hospitals.map(h => {
                    const dist = Math.sqrt((h.lat - lat) ** 2 + (h.lng - lng) ** 2) * 111; // approx km
                    return { ...h, dist: dist.toFixed(1) };
                }).sort((a, b) => a.dist - b.dist);
                let html = '<p><i class="fas fa-exclamation-triangle"></i> Alert sent to emergency contact! (simulated)</p>';
                html += '<div class="hospital-list"><h4>Nearest hospitals:</h4>';
                withDist.forEach(h => {
                    html += `<div class="hospital-item"><strong>${h.name}</strong> · ${h.dist} km · 📞 ${h.phone}</div>`;
                });
                // Fix: use template literal for interpolation
                html += `</div><p>📍 Live location <a href="https://maps.google.com/?q=${lat},${lng}" target="_blank">view on map</a> (link sent to family)</p>`;
                infoDiv.innerHTML = html;

                // Automatically send to emergency contact via SMS
                if (currentUser && currentUser.emergencyContact) {
                    const cleanPhone = currentUser.emergencyContact.replace(/\D/g, '');
                    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
                    const message = encodeURIComponent(`🚨 EMERGENCY Alert from ${currentUser.fullName}! I need help. My live location is: ${mapsLink}`);

                    // Open default SMS app with pre-filled message
                    // Note: iOS sometimes uses &body= instead of ?body=
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                    const separator = isIOS ? '&' : '?';
                    window.location.href = `sms:${cleanPhone}${separator}body=${message}`;

                    console.log(`🚨 SOS: SMS location sent to ${currentUser.emergencyContact} - logic.js:549`);
                }
            },
            (err) => {
                infoDiv.innerHTML = '<p>Could not get location. Please enable GPS.</p>';
            }
        );
    }

    // ----- DOCTOR DASHBOARD RENDER -----
    function renderDoctorDashboard(doctor) {
        document.getElementById('doctorName').innerText = doctor.fullName;
        renderAppointmentRequests(doctor.email);
        renderPatientList(doctor.email);
        // Profile
        const profileDiv = document.getElementById('doctorProfileInfo');
        const ratingNum = doctor.rating || 5.0;
        const fullStars = Math.floor(ratingNum);
        const hasHalfStar = ratingNum - fullStars >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - hasHalfStar;
        const starsHTML =
            '<i class="fas fa-star" style="color: #fbbf24;"></i>'.repeat(fullStars) +
            (hasHalfStar ? '<i class="fas fa-star-half-alt" style="color: #fbbf24;"></i>' : '') +
            '<i class="far fa-star" style="color: #fbbf24;"></i>'.repeat(emptyStars);

        profileDiv.innerHTML = `
                    <p><strong>Dr. ${doctor.fullName}</strong></p>
                    <p>${doctor.specialization} · ${doctor.experience} years</p>
                    <p style="font-size: 1.1rem; margin: 0.5rem 0;">${starsHTML} <strong>${ratingNum.toFixed(1)}</strong></p>
                    <p>📞 ${doctor.phone}</p>
                    <p>📧 ${doctor.email}</p>
                    <p>🕒 ${doctor.availableTime}</p>
                `;
    }

    function renderAppointmentRequests(doctorEmail) {
        const apps = getAppointments().filter(a => a.doctorEmail === doctorEmail && a.status === 'pending');
        const container = document.getElementById('appointmentRequestsList');
        if (apps.length === 0) {
            container.innerHTML = '<p>No pending requests</p>';
            return;
        }
        container.innerHTML = apps.map(app => `
                    <div class="appointment-item">
                        <div>
                            <strong>${app.patientName}</strong><br>
                            <small>${app.issue} · ${app.date}</small>
                        </div>
                        <div>
                            <button class="accept-app" data-id="${app.id}">✓ Accept</button>
                            <button class="reject-app" data-id="${app.id}">✗ Reject</button>
                        </div>
                    </div>
                `).join('');

        document.querySelectorAll('.accept-app').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.target.dataset.id);
                let apps = getAppointments();
                apps = apps.map(a => a.id === id ? { ...a, status: 'accepted' } : a);
                saveAppointments(apps);
                renderAppointmentRequests(doctorEmail);
                renderPatientList(doctorEmail);
            });
        });
        document.querySelectorAll('.reject-app').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.target.dataset.id);
                let apps = getAppointments();
                apps = apps.map(a => a.id === id ? { ...a, status: 'rejected' } : a);
                saveAppointments(apps);
                renderAppointmentRequests(doctorEmail);
            });
        });
    }

    function renderPatientList(doctorEmail) {
        const apps = getAppointments().filter(a => a.doctorEmail === doctorEmail && a.status === 'accepted');
        const patientEmails = [...new Set(apps.map(a => a.patientEmail))];
        const users = getUsers();
        const patients = users.filter(u => u.role === 'patient' && patientEmails.includes(u.email));
        const container = document.getElementById('patientListDoctor');
        if (patients.length === 0) {
            container.innerHTML = '<p>No patients yet</p>';
            return;
        }
        container.innerHTML = patients.map(p => `
                    <div class="reminder-item">
                        <span><strong>${p.fullName}</strong> (${p.age}y) · ${p.phone}</span>
                        <button class="btn" style="padding: 0.4rem 1rem; font-size: 0.9rem;" onclick="openChat('${p.email}', '${p.fullName}')"><i class="fas fa-comment"></i> Chat</button>
                    </div>
                `).join('');
    }

    // Minimal profile edit simulation
    document.getElementById('editPatientProfile')?.addEventListener('click', () => {
        alert('Edit profile would open in full version (update localStorage).');
    });
    document.getElementById('editDoctorProfile')?.addEventListener('click', () => {
        alert('Edit profile would open in full version.');
    });

    // ----- DOCTOR PROFILE MODAL LOGIC -----
    const doctorProfileModal = document.getElementById('doctorProfileModal');
    const doctorProfileOverlay = document.getElementById('doctorProfileOverlay');
    const closeDoctorProfileBtn = document.getElementById('closeDoctorProfileBtn');

    window.showDoctorProfileModal = function (doctor) {
        if (!doctorProfileModal || !doctorProfileOverlay) return;

        const content = document.getElementById('doctorProfileModalContent');
        const ratingNum = doctor.rating || 5.0;
        const fullStars = Math.floor(ratingNum);
        const hasHalfStar = ratingNum - fullStars >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - hasHalfStar;
        const starsHTML =
            '<i class="fas fa-star" style="color: #fbbf24;"></i>'.repeat(fullStars) +
            (hasHalfStar ? '<i class="fas fa-star-half-alt" style="color: #fbbf24;"></i>' : '') +
            '<i class="far fa-star" style="color: #fbbf24;"></i>'.repeat(emptyStars);

        content.innerHTML = `
            <p style="font-size: 1.3rem; margin-top: 0.5rem; color: #1e2b4f;"><strong>Dr. ${doctor.fullName}</strong></p>
            <p style="color: #475569; font-weight: 500;">${doctor.specialization} · ${doctor.experience} years exp</p>
            <p style="font-size: 1.2rem; margin: 0.8rem 0;">${starsHTML} <strong>${ratingNum.toFixed(1)}</strong></p>
            
            <div style="background: #f1f5f9; padding: 1rem; border-radius: 12px; margin-top: 1rem; color: #334155;">
                <p style="margin-bottom: 0.5rem;"><i class="fas fa-phone" style="width: 25px;"></i> <strong>Phone:</strong> ${doctor.phone}</p>
                <p style="margin-bottom: 0.5rem;"><i class="fas fa-envelope" style="width: 25px;"></i> <strong>Email:</strong> ${doctor.email}</p>
                <p style="margin-bottom: 0.5rem;"><i class="fas fa-clock" style="width: 25px;"></i> <strong>Time:</strong> ${doctor.availableTime}</p>
                <p style="margin-bottom: 0;"><i class="fas fa-transgender" style="width: 25px;"></i> <strong>Gender:</strong> ${doctor.gender || 'Not specified'}</p>
            </div>
            
            <button class="btn" style="width: 100%; margin-top: 1rem; font-size: 1.1rem;" onclick="
                if (document.getElementById('closeDoctorProfileBtn')) document.getElementById('closeDoctorProfileBtn').click();
                setTimeout(() => openChat('${doctor.email}', 'Dr. ${doctor.fullName}'), 100);
            "><i class="fas fa-comments"></i> Message Doctor</button>
        `;

        doctorProfileModal.classList.remove('hide');
        doctorProfileOverlay.classList.remove('hide');
    };

    if (closeDoctorProfileBtn) {
        closeDoctorProfileBtn.addEventListener('click', () => {
            doctorProfileModal.classList.add('hide');
            doctorProfileOverlay.classList.add('hide');
        });
    }

    // ----- DIRECT CHAT LOGIC -----
    const chatModal = document.getElementById('chatModal');
    const chatOverlay = document.getElementById('chatOverlay');
    const chatTargetName = document.getElementById('chatTargetName');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatClose = document.getElementById('chatClose');

    // Make functions available globally so onclick handlers in rendered strings can call them
    window.openChat = function (targetEmail, targetName) {
        currentChatTargetEmail = targetEmail;
        chatTargetName.innerText = targetName;
        chatModal.classList.remove('hide');
        chatOverlay.classList.remove('hide');
        renderChatMessages();
    };

    if (chatClose) {
        chatClose.addEventListener('click', () => {
            chatModal.classList.add('hide');
            chatOverlay.classList.add('hide');
            currentChatTargetEmail = null;
        });
    }

    if (chatSend) {
        chatSend.addEventListener('click', () => {
            const text = chatInput.value.trim();
            if (text && currentChatTargetEmail && currentUser) {
                const chats = getChats();
                chats.push({
                    senderEmail: currentUser.email,
                    receiverEmail: currentChatTargetEmail,
                    text: text,
                    timestamp: new Date().toISOString()
                });
                saveChats(chats);
                chatInput.value = '';
                renderChatMessages();
            }
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                chatSend.click();
            }
        });
    }

    function renderChatMessages() {
        if (!currentChatTargetEmail || !currentUser) return;

        const chats = getChats().filter(c =>
            (c.senderEmail === currentUser.email && c.receiverEmail === currentChatTargetEmail) ||
            (c.receiverEmail === currentUser.email && c.senderEmail === currentChatTargetEmail)
        );

        chatMessages.innerHTML = chats.map(c => {
            const isMe = c.senderEmail === currentUser.email;
            return `<div class="${isMe ? 'user-msg' : 'bot-msg'}">${c.text}</div>`;
        }).join('');

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Refresh active chat periodically (simple polling instead of websockets for this hackathon)
    setInterval(() => {
        if (!chatModal.classList.contains('hide')) {
            renderChatMessages();
        }
    }, 2000);

    // ----- CONTINUOUS REMINDER ALARM -----
    let reminderCheckInterval;
    let activeAlarmInterval;
    let notifiedReminders = new Set();

    const medicineModal = document.getElementById('medicineModal');
    const medicineOverlay = document.getElementById('medicineOverlay');
    const medicineModalText = document.getElementById('medicineModalText');
    const medicineAcknowledgeBtn = document.getElementById('medicineAcknowledgeBtn');

    function startReminderCheck() {
        if (reminderCheckInterval) clearInterval(reminderCheckInterval);
        reminderCheckInterval = setInterval(() => {
            if (!currentUser || currentUser.role !== 'patient') return;

            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTimeStr = `${currentHour}:${currentMinute}`;

            const reminders = getReminders().filter(r => r.patientEmail === currentUser.email);

            reminders.forEach(r => {
                const reminderKey = r.id + "_" + currentTimeStr;
                if (r.time === currentTimeStr && !notifiedReminders.has(reminderKey)) {
                    notifiedReminders.add(reminderKey); // Notify once for this minute
                    triggerMedicineAlarm(r.medicine);
                }
            });

            // Cleanup memory of past minutes
            notifiedReminders.forEach(key => {
                if (!key.endsWith(currentTimeStr)) {
                    notifiedReminders.delete(key);
                }
            });
        }, 5000); // Check every 5 seconds
    }

    function triggerMedicineAlarm(medicineName) {
        if (!medicineModal) return;

        medicineModalText.innerText = `It is the exact time to take your medicine:\n${medicineName}`;
        medicineModal.classList.remove('hide');
        medicineOverlay.classList.remove('hide');

        // Initial browser alert popup
        setTimeout(() => alert(`⏰ MEDICINE ALARM: Please take ${medicineName} now!`), 500);

        if (activeAlarmInterval) clearInterval(activeAlarmInterval);

        // Continuously pop message every 10 seconds until acknowledged
        activeAlarmInterval = setInterval(() => {
            // Shake visual effect
            medicineModal.style.transform = "translate(-50%, -50%) scale(1.05)";
            setTimeout(() => {
                medicineModal.style.transform = "translate(-50%, -50%) scale(1)";
            }, 300);

            // Resend alert pop-up
            alert(`⚠️ URGENT REMINDER: You haven't taken ${medicineName} yet!`);
        }, 10000);
    }

    if (medicineAcknowledgeBtn) {
        medicineAcknowledgeBtn.addEventListener('click', () => {
            medicineModal.classList.add('hide');
            medicineOverlay.classList.add('hide');
            if (activeAlarmInterval) clearInterval(activeAlarmInterval);
        });
    }

    // Start checker on load
    startReminderCheck();

    // ----- CHATBOT LOGIC -----
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotSend = document.getElementById('chatbotSend');
    const chatbotMessages = document.getElementById('chatbotMessages');

    if (chatbotToggle && chatbotWindow) {
        chatbotToggle.addEventListener('click', () => {
            chatbotWindow.classList.toggle('hide');
        });

        chatbotClose.addEventListener('click', () => {
            chatbotWindow.classList.add('hide');
        });

        function addChatMessage(text, sender) {
            const msgDiv = document.createElement('div');
            msgDiv.classList.add(sender === 'bot' ? 'bot-msg' : 'user-msg');
            msgDiv.innerText = text;
            chatbotMessages.appendChild(msgDiv);
            chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }

        function handleChatbotResponse(userText) {
            const text = userText.toLowerCase();
            let response = "I'm sorry, I didn't understand that. You can ask me about 'appointment', 'emergency', 'doctors', or 'profile'.";

            if (text.includes('hello') || text.includes('hi')) {
                response = "Hello! How can I assist you with Healthguard today?";
            } else if (text.includes('appointment') || text.includes('book')) {
                response = "To book an appointment, go to the 'Consult a Doctor' section on your dashboard, select an issue, and find a doctor.";
            } else if (text.includes('emergency') || text.includes('sos')) {
                response = "If this is a medical emergency, please click the red SOS EMERGENCY button on your dashboard immediately!";
            } else if (text.includes('doctor')) {
                response = "We have General Physicians, Cardiologists, Dermatologists, and Pediatricians available.";
            } else if (text.includes('reminder') || text.includes('medicine')) {
                response = "You can add medicine reminders directly from your dashboard.";
            } else if (text.includes('profile')) {
                response = "Your profile information is displayed on your dashboard. You can click 'Edit' to update it.";
            }

            setTimeout(() => {
                addChatMessage(response, 'bot');
            }, 500);
        }

        chatbotSend.addEventListener('click', () => {
            const text = chatbotInput.value.trim();
            if (text) {
                addChatMessage(text, 'user');
                chatbotInput.value = '';
                handleChatbotResponse(text);
            }
        });

        chatbotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                chatbotSend.click();
            }
        });
    }

    // ----- SLIDER / TAB LOGIC -----
    const slideTabs = document.querySelectorAll('.slide-tab');
    const slides = document.querySelectorAll('.dashboard-slide');
    let currentSlideIndex = 0;

    // Function to switch to a specific slide
    function goToSlide(index) {
        // Ensure index is within bounds
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        
        currentSlideIndex = index;
        
        // Remove active class from all tabs & slides
        slideTabs.forEach(t => t.classList.remove('active'));
        slides.forEach(s => s.classList.remove('active-slide'));

        // Add active class to target tab and slide
        slideTabs[index].classList.add('active');
        slides[index].classList.add('active-slide');
    }

    // Manual click handler
    slideTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    // ----- TERMS & CONDITIONS PAGE -----
    window.showTermsConditions = function() {
        document.getElementById('authView').classList.add('hide');
        document.getElementById('patientDashboard').classList.add('hide');
        document.getElementById('doctorDashboard').classList.add('hide');
        document.getElementById('termsConditionsView').classList.remove('hide');
    };

    window.hideTermsConditions = function() {
        document.getElementById('termsConditionsView').classList.add('hide');
        if (currentUser) {
            if (currentUser.role === 'patient') {
                document.getElementById('patientDashboard').classList.remove('hide');
            } else if (currentUser.role === 'doctor') {
                document.getElementById('doctorDashboard').classList.remove('hide');
            }
        } else {
            document.getElementById('authView').classList.remove('hide');
        }
    };

})();
