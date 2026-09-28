// Frontend API Service - Centralized HTTP client
// Matches REST API Contract: Page 5 & Page 9

const BASE_URL = '/api';

const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (includeAuth) {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 204) {
    return { success: true };
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorObj = data?.error || {};
    const message = errorObj.message || data?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = errorObj.code || 'error';
    error.details = errorObj.details || {};
    throw error;
  }

  return data;
};

const request = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    return await handleResponse(res);
  } catch (err) {
    if (err.name === 'TypeError' && (err.message.includes('fetch') || err.message.includes('NetworkError'))) {
      const netErr = new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra Flask server đang chạy.');
      netErr.code = 'network_error';
      throw netErr;
    }
    throw err;
  }
};

export const api = {
  // 1. Register (Patient) - POST /api/register
  register: (payload) =>
    request(`${BASE_URL}/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(payload)
    }),

  // 2. Login (All) - POST /api/login
  login: (payload) =>
    request(`${BASE_URL}/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(payload)
    }),

  // 3. View Doctor List (Patient/Public) - GET /api/doctors
  getDoctors: () =>
    request(`${BASE_URL}/doctors`, {
      method: 'GET',
      headers: getHeaders(false)
    }),

  // 4. View Doctor Detail (Patient/Public) - GET /api/doctors/:id
  getDoctor: (id) =>
    request(`${BASE_URL}/doctors/${id}`, {
      method: 'GET',
      headers: getHeaders(false)
    }),

  // 5. Book Appointment (Patient) - POST /api/appointments
  bookAppointment: (payload) =>
    request(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    }),

  // 6. View My Appointments (Patient) - GET /api/my-appointments
  getMyAppointments: () =>
    request(`${BASE_URL}/my-appointments`, {
      method: 'GET',
      headers: getHeaders(true)
    }),

  // 7. Cancel Appointment (Patient) - DELETE /api/appointments/:id
  //    Returns 200 { appointment } with status CANCELLED (soft-delete)
  cancelAppointment: (id) =>
    request(`${BASE_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    }),

  // 7b. Edit Appointment (Patient) - PATCH /api/appointments/:id
  //     Only PENDING appointments can be edited.
  updateAppointment: (id, payload) =>
    request(`${BASE_URL}/appointments/${id}`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    }),

  // 8. View Appointments (Doctor) - GET /api/doctor/appointments
  getDoctorAppointments: () =>
    request(`${BASE_URL}/doctor/appointments`, {
      method: 'GET',
      headers: getHeaders(true)
    }),

  // 9. Update Appointment Status (Doctor) - PUT /api/doctor/appointments/:id
  updateAppointmentStatus: (id, status) =>
    request(`${BASE_URL}/doctor/appointments/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ status })
    }),

  // 10. Manage Doctors (Admin) - POST /api/admin/doctors, DELETE /api/admin/doctors/:id
  createDoctor: (payload) =>
    request(`${BASE_URL}/admin/doctors`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    }),

  deleteDoctor: (id) =>
    request(`${BASE_URL}/admin/doctors/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    }),

  // Helper: Specialties
  getSpecialties: () =>
    request(`${BASE_URL}/specialties`, {
      method: 'GET',
      headers: getHeaders(false)
    })
};
