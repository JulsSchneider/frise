// Globale Datenstrukturen
let customers = JSON.parse(localStorage.getItem('customers')) || [];
let appointments = JSON.parse(localStorage.getItem('appointments')) || [];
let employees = JSON.parse(localStorage.getItem('employees')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Konfiguration
const servicePrices = {
  "Haarschnitt": 30,
  "Färben": 50,
  "Waschen und Schneiden": 40
};
const adminCredentials = { email: "admin@salon.de", password: "admin" };

// Zeitslots
let timeSlots = [];

// Hilfsfunktionen
function formatDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}.${month}.${year}`;
}

function formatTime(timeStr) {
  return timeStr || "";
}

function getMonthName(i) { 
  return ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'][i]; 
}

function formatDateForDisplay(s) { 
  const [y,m,d] = s.split('-'); 
  return `${d}.${m}.${y}`; 
}

// --- Login / Logout ---
function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;

  if (email === adminCredentials.email && pass === adminCredentials.password) {
    localStorage.removeItem('currentUser');
    window.location = 'admin.html';
    return;
  }
  
  const user = customers.find(c => c.email === email && c.password === pass);
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    window.location = 'user.html';
  } else {
    alert("Login fehlgeschlagen: Bitte E-Mail und Passwort überprüfen.");
  }
}

function logout() {
  localStorage.removeItem('currentUser');
  window.location = 'login.html';
}

// --- Registrierung ---
function registerUser(event) {
  event.preventDefault();
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const phone = document.getElementById('regPhone').value;
  const password = document.getElementById('regPass').value;

  if (customers.find(c => c.email === email)) {
    alert("Diese E-Mail ist bereits registriert.");
    return;
  }
  
  const newCustomer = { name: name, email: email, phone: phone, password: password };
  customers.push(newCustomer);
  localStorage.setItem('customers', JSON.stringify(customers));
  alert("Registrierung erfolgreich! Bitte loggen Sie sich nun ein.");
  window.location = 'login.html';
}

// --- Kunden-Funktionen ---
function showUserAppointments() {
  const user = currentUser;
  if (!user) return;
  
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const hh = String(today.getHours()).padStart(2, "0");
  const min = String(today.getMinutes()).padStart(2, "0");
  const nowTimeStr = `${hh}:${min}`;

  const userAppointments = appointments.filter(a => a.customerEmail === user.email);
  
  const upcoming = [];
  const past = [];
  
  for (let appt of userAppointments) {
    if (appt.date > todayStr || (appt.date === todayStr && appt.time >= nowTimeStr)) {
      upcoming.push(appt);
    } else {
      past.push(appt);
    }
  }
  
  upcoming.sort((a,b) => {
    if (a.date === b.date) return a.time.localeCompare(b.time);
    return a.date.localeCompare(b.date);
  });
  
  past.sort((a,b) => {
    if (a.date === b.date) return b.time.localeCompare(a.time);
    return b.date.localeCompare(a.date);
  });

  const upcomingTable = document.getElementById('userAppointmentsTable');
  const pastTable = document.getElementById('pastAppointmentsTable');
  
  if (upcomingTable) {
    upcomingTable.innerHTML = `<tr>
      <th>Datum</th><th>Uhrzeit</th><th>Service</th><th>Aktion</th>
    </tr>`;
    
    for (let appt of upcoming) {
      const actionText = `<button onclick="cancelCustomerBooking(${appt.id})" class="btn-small btn-secondary">Stornieren</button>`;
      const row = upcomingTable.insertRow();
      row.innerHTML = `<td>${formatDate(appt.date)}</td>
                       <td>${formatTime(appt.time)}</td>
                       <td>${appt.service || 'Haarschnitt'}</td>
                       <td>${actionText}</td>`;
    }
  }
  
  if (pastTable) {
    pastTable.innerHTML = `<tr>
      <th>Datum</th><th>Uhrzeit</th><th>Service</th>
    </tr>`;
    
    for (let appt of past) {
      const row = pastTable.insertRow();
      row.innerHTML = `<td>${formatDate(appt.date)}</td>
                       <td>${formatTime(appt.time)}</td>
                       <td>${appt.service || 'Haarschnitt'}</td>`;
    }
  }
}

function cancelCustomerBooking(id) {
  if (!confirm('Möchten Sie diesen Termin wirklich stornieren?')) return;
  const idx = appointments.findIndex(b => b.id === id);
  if (idx !== -1) {
    appointments[idx].status = 'cancelled';
    localStorage.setItem('appointments', JSON.stringify(appointments));
    showUserAppointments();
    updateMobileCalendar();
    alert('Termin wurde storniert.');
  }
}

// --- PERFEKTER MOBILER KALENDER ---
let selectedDate = null;

function updateMobileCalendar() {
  const calendarElement = document.getElementById('mobile-calendar-days');
  if (!calendarElement) return;
  
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  document.getElementById('current-month-year').textContent = 
    `${getMonthName(month)} ${year}`;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();
  
  // Anpassung: Montag als ersten Tag
  let startOffset = startDay === 0 ? 6 : startDay - 1;
  
  let html = '';
  
  // Leere Zellen vor dem ersten Tag
  for (let i = 0; i < startOffset; i++) {
    html += '<div class="calendar-day-cell empty"></div>';
  }
  
  // Tage des Monats
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    
    const isToday = day === today.getDate() && 
                    month === today.getMonth() && 
                    year === today.getFullYear();
    
    const availableSlots = timeSlots.filter(s => 
      s.date === dateStr && s.status === 'available'
    );
    
    const bookedAppointments = appointments.filter(a => 
      a.date === dateStr && a.status !== 'cancelled'
    );
    
    let cellClass = 'calendar-day-cell';
    if (isToday) cellClass += ' today';
    if (availableSlots.length > 0) cellClass += ' has-slots';
    if (bookedAppointments.length > 0) cellClass += ' has-bookings';
    
    html += `<div class="${cellClass}" onclick="openDayPopup('${dateStr}')">
      <span class="day-number">${day}</span>`;
    
    if (availableSlots.length > 0) {
      html += `<span class="slot-indicator">${availableSlots.length}</span>`;
    }
    
    html += '</div>';
  }
  
  calendarElement.innerHTML = html;
}

// Tages-Popup öffnen
function openDayPopup(dateStr) {
  selectedDate = dateStr;
  const popup = document.getElementById('day-popup');
  const title = document.getElementById('popup-date-title');
  const slotsList = document.getElementById('popup-slots-list');
  
  if (!popup || !title || !slotsList) return;
  
  const date = new Date(dateStr + 'T12:00:00');
  const formattedDate = `${date.getDate()}. ${getMonthName(date.getMonth())} ${date.getFullYear()}`;
  title.textContent = `Termine am ${formattedDate}`;
  
  const daySlots = timeSlots.filter(s => s.date === dateStr);
  const dayBookings = appointments.filter(a => a.date === dateStr && a.status !== 'cancelled');
  
  let slotsHtml = '';
  
  if (daySlots.length === 0 && dayBookings.length === 0) {
    slotsHtml = '<div class="no-slots-popup">Keine Termine an diesem Tag</div>';
  } else {
    const allTimes = [...new Set([...daySlots.map(s => s.time), ...dayBookings.map(b => b.time)])];
    allTimes.sort();
    
    allTimes.forEach(time => {
      const slot = daySlots.find(s => s.time === time);
      const booking = dayBookings.find(b => b.time === time);
      
      if (booking) {
        slotsHtml += `
          <div class="popup-slot-item booked">
            <div>
              <div class="popup-slot-time">${time} Uhr</div>
              <div class="popup-slot-customer">${booking.customerName}</div>
            </div>
            <button class="popup-slot-action booked-btn" disabled>
              <i class="fas fa-check"></i>
            </button>
          </div>`;
      } else if (slot) {
        slotsHtml += `
          <div class="popup-slot-item" onclick="openBookingPopup('${dateStr}', '${time}', ${slot.duration})">
            <div>
              <div class="popup-slot-time">${time} Uhr</div>
              <div class="popup-slot-duration">${slot.duration} min</div>
            </div>
            <button class="popup-slot-action">Buchen</button>
          </div>`;
      }
    });
  }
  
  slotsList.innerHTML = slotsHtml;
  popup.classList.add('active');
}

function closeDayPopup() {
  document.getElementById('day-popup').classList.remove('active');
}

// Buchungs-Popup öffnen
function openBookingPopup(date, time, duration) {
  const popup = document.getElementById('booking-popup');
  const slotInfo = document.getElementById('booking-slot-info');
  
  const dateObj = new Date(date + 'T12:00:00');
  const formattedDate = `${dateObj.getDate()}. ${getMonthName(dateObj.getMonth())} ${dateObj.getFullYear()}`;
  
  slotInfo.textContent = `${formattedDate}, ${time} Uhr (${duration} min)`;
  
  window.currentBooking = { date, time, duration };
  
  if (currentUser) {
    document.getElementById('booking-name').value = currentUser.name;
    document.getElementById('booking-email').value = currentUser.email;
    document.getElementById('booking-phone').value = currentUser.phone || '';
  } else {
    document.getElementById('booking-name').value = '';
    document.getElementById('booking-email').value = '';
    document.getElementById('booking-phone').value = '';
  }
  
  popup.classList.add('active');
}

function closeBookingPopup() {
  document.getElementById('booking-popup').classList.remove('active');
}

// Buchung bestätigen
function confirmMobileBooking() {
  if (!window.currentBooking) return;
  
  const { date, time, duration } = window.currentBooking;
  
  const name = document.getElementById('booking-name').value;
  const email = document.getElementById('booking-email').value;
  const phone = document.getElementById('booking-phone').value;
  
  if (!name || !email) {
    alert('Bitte Name und Email angeben!');
    return;
  }
  
  const newB = {
    id: appointments.length + 1,
    customerId: currentUser ? currentUser.id : null,
    date: date,
    time: time,
    duration: duration,
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    service: 'Haarschnitt',
    status: 'confirmed'
  };
  
  appointments.push(newB);
  localStorage.setItem('appointments', JSON.stringify(appointments));
  
  const slotIndex = timeSlots.findIndex(s => s.date === date && s.time === time);
  if (slotIndex !== -1) {
    timeSlots[slotIndex].status = 'booked';
  }
  
  closeBookingPopup();
  closeDayPopup();
  
  alert('Termin erfolgreich gebucht!');
  
  updateMobileCalendar();
  showUserAppointments();
}

function changeMonth(direction) {
  updateMobileCalendar();
}

// --- Admin-Funktionen ---
function showSection(sectionId) {
  const sections = document.querySelectorAll('.content > div');
  sections.forEach(sec => {
    sec.style.display = (sec.id === sectionId) ? 'block' : 'none';
  });
  
  if (sectionId === 'dashboard-section') {
    showDashboardStats();
    showUpcomingAppointments();
  } else if (sectionId === 'kunden-section') {
    showCustomers();
  }
}

function showCustomers() {
  const table = document.getElementById('customersTable');
  if (!table) return;
  
  table.innerHTML = `<tr>
    <th>Name</th><th>E-Mail</th><th>Telefon</th><th>Letzter Besuch</th>
  </tr>`;
  
  for (let cust of customers) {
    let lastVisit = "";
    if (appointments.length > 0) {
      const pastVisits = appointments.filter(a => a.customerEmail === cust.email && a.date <= new Date().toISOString().slice(0,10));
      if (pastVisits.length > 0) {
        pastVisits.sort((a,b) => {
          if (a.date === b.date) return b.time.localeCompare(a.time);
          return b.date.localeCompare(a.date);
        });
        const lv = pastVisits[0];
        lastVisit = formatDate(lv.date);
      }
    }
    const row = table.insertRow();
    row.innerHTML = `<td>${cust.name}</td>
                     <td>${cust.email}</td>
                     <td>${cust.phone || '-'}</td>
                     <td>${lastVisit || '-'}</td>`;
  }
}

function showDashboardStats() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const hh = String(today.getHours()).padStart(2, "0");
  const min = String(today.getMinutes()).padStart(2, "0");
  const nowTimeStr = `${hh}:${min}`;

  let todayCount = 0;
  for (let appt of appointments) {
    if (appt.date === todayStr && appt.time >= nowTimeStr && appt.status !== 'cancelled') {
      todayCount++;
    }
  }
  
  const todayElement = document.getElementById('todayCount');
  if (todayElement) todayElement.textContent = todayCount;

  const waitlistElement = document.getElementById('waitlistCount');
  if (waitlistElement) waitlistElement.textContent = '0';
}

function showUpcomingAppointments() {
  const table = document.getElementById('upcomingAppointmentsTable');
  if (!table) return;
  
  table.innerHTML = `<tr>
    <th>Kunde (Tel)</th><th>Termin</th><th>Details</th>
  </tr>`;
  
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const hh = String(today.getHours()).padStart(2, "0");
  const min = String(today.getMinutes()).padStart(2, "0");
  const nowTimeStr = `${hh}:${min}`;

  const upcoming = appointments.filter(a => 
    (a.date > todayStr || (a.date === todayStr && a.time >= nowTimeStr)) && 
    a.status !== 'cancelled'
  );
  
  upcoming.sort((a,b) => {
    if (a.date === b.date) return a.time.localeCompare(b.time);
    return a.date.localeCompare(b.date);
  });
  
  for (let appt of upcoming) {
    const custInfo = `${appt.customerName} (Tel: ${appt.customerPhone || "-"})`;
    const termInfo = `${formatDate(appt.date)} ${formatTime(appt.time)}`;
    const details = `Service: ${appt.service || 'Haarschnitt'}`;
    const row = table.insertRow();
    row.innerHTML = `<td>${custInfo}</td><td>${termInfo}</td><td>${details}</td>`;
  }
}

// --- Initialisierung ---
function initUserPage() {
  if (!currentUser) {
    window.location = 'login.html';
    return;
  }
  
  // Testdaten für Zeitslots
  if (timeSlots.length === 0) {
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0) {
        const dateStr = date.toISOString().split('T')[0];
        
        timeSlots.push(
          { id: timeSlots.length+1, date: dateStr, time: '09:00', duration: 30, status: 'available' },
          { id: timeSlots.length+1, date: dateStr, time: '10:00', duration: 30, status: 'available' },
          { id: timeSlots.length+1, date: dateStr, time: '11:00', duration: 30, status: 'available' },
          { id: timeSlots.length+1, date: dateStr, time: '14:00', duration: 30, status: 'available' },
          { id: timeSlots.length+1, date: dateStr, time: '15:00', duration: 30, status: 'available' },
          { id: timeSlots.length+1, date: dateStr, time: '16:00', duration: 30, status: 'available' }
        );
      }
    }
  }
  
  updateMobileCalendar();
  showUserAppointments();
}

function initAdminPage() {
  showDashboardStats();
  showUpcomingAppointments();
  showCustomers();
  showSection('dashboard-section');
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('mobile-calendar-days')) {
    initUserPage();
  }
  if (document.getElementById('dashboard-section')) {
    initAdminPage();
  }
});