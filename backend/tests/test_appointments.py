# Test Suite: Appointments & Role-Based Actions (test_appointments.py)
# Covers Function 5 (Book), 6 (My Appointments), 7 (Cancel),
# Function 8 (Doctor Appointments), Function 9 (Update Status), Function 10 (Manage Doctors)

# ----------------- FUNCTION 5: Book Appointment -----------------

def test_book_appointment_success(client, patient_token):
    res = client.post('/api/appointments', json={
        'doctor_id': 1,
        'date': '2026-10-15',
        'time': '14:00',
        'reason': 'Khám định kỳ tổng quát'
    }, headers={'Authorization': f'Bearer {patient_token}'})
    assert res.status_code == 201
    data = res.get_json()
    assert 'appointment' in data
    assert data['appointment']['doctor_id'] == 1
    assert data['appointment']['status'] == 'PENDING'

def test_book_appointment_duplicate_slot_conflict(client, patient_token, patient2_token):
    # Book a slot first
    res1 = client.post('/api/appointments', json={
        'doctor_id': 1,
        'date': '2026-10-20',
        'time': '10:00',
        'reason': 'Khám họng'
    }, headers={'Authorization': f'Bearer {patient_token}'})
    assert res1.status_code == 201

    # Another patient books the EXACT same doctor, date, and time
    res2 = client.post('/api/appointments', json={
        'doctor_id': 1,
        'date': '2026-10-20',
        'time': '10:00',
        'reason': 'Khám dạ dày'
    }, headers={'Authorization': f'Bearer {patient2_token}'})
    assert res2.status_code == 409
    data = res2.get_json()
    assert data['error']['code'] == 'appointment_conflict'
    assert data['error']['message'] == 'Bác sĩ đã có lịch hẹn vào khung giờ này. Vui lòng chọn thời gian khác.'

def test_book_appointment_unauthenticated(client):
    res = client.post('/api/appointments', json={
        'doctor_id': 1,
        'date': '2026-10-22',
        'time': '11:00',
        'reason': 'No token'
    })
    assert res.status_code == 401
    assert res.get_json()['error']['code'] == 'unauthorized'

def test_book_appointment_non_patient_blocked(client, doctor_token):
    # Doctor role cannot book appointment
    res = client.post('/api/appointments', json={
        'doctor_id': 1,
        'date': '2026-10-25',
        'time': '15:00',
        'reason': 'Doctor booking'
    }, headers={'Authorization': f'Bearer {doctor_token}'})
    assert res.status_code == 403
    assert res.get_json()['error']['code'] == 'forbidden'

def test_book_appointment_invalid_doctor(client, patient_token):
    res = client.post('/api/appointments', json={
        'doctor_id': 99999,
        'date': '2026-10-25',
        'time': '15:00',
        'reason': 'Doctor not found'
    }, headers={'Authorization': f'Bearer {patient_token}'})
    assert res.status_code == 404

def test_book_appointment_validation_error(client, patient_token):
    res = client.post('/api/appointments', json={
        'doctor_id': 1,
        'date': 'not-a-date',
        'time': '99:99',
        'reason': ''
    }, headers={'Authorization': f'Bearer {patient_token}'})
    assert res.status_code == 422
    assert res.get_json()['error']['code'] == 'validation_failed'

# ----------------- FUNCTION 6: View My Appointments -----------------

def test_patient_view_my_appointments(client, patient_token):
    res = client.get('/api/my-appointments', headers={'Authorization': f'Bearer {patient_token}'})
    assert res.status_code == 200
    appts = res.get_json()
    assert isinstance(appts, list)
    # Check joined fields
    if len(appts) > 0:
        first = appts[0]
        assert 'doctor_name' in first
        assert 'specialty_name' in first

def test_my_appointments_unauthenticated(client):
    res = client.get('/api/my-appointments')
    assert res.status_code == 401

# ----------------- FUNCTION 7: Cancel Appointment -----------------

def test_cancel_appointment_owner_success(client, patient_token):
    # Book first
    res_book = client.post('/api/appointments', json={
        'doctor_id': 2,
        'date': '2026-10-30',
        'time': '09:00',
        'reason': 'Cancel test'
    }, headers={'Authorization': f'Bearer {patient_token}'})
    appt_id = res_book.get_json()['appointment']['id']

    # Cancel own appointment
    res_cancel = client.delete(f'/api/appointments/{appt_id}', headers={'Authorization': f'Bearer {patient_token}'})
    assert res_cancel.status_code == 204
    assert res_cancel.data == b''

def test_cancel_foreign_appointment_forbidden(client, patient_token, patient2_token):
    # Patient 1 books
    res_book = client.post('/api/appointments', json={
        'doctor_id': 2,
        'date': '2026-10-31',
        'time': '09:30',
        'reason': 'Patient 1 appointment'
    }, headers={'Authorization': f'Bearer {patient_token}'})
    appt_id = res_book.get_json()['appointment']['id']

    # Patient 2 attempts to cancel Patient 1's appointment -> 403
    res_cancel = client.delete(f'/api/appointments/{appt_id}', headers={'Authorization': f'Bearer {patient2_token}'})
    assert res_cancel.status_code == 403
    assert res_cancel.get_json()['error']['code'] == 'forbidden'

def test_cancel_nonexistent_appointment(client, patient_token):
    res = client.delete('/api/appointments/99999', headers={'Authorization': f'Bearer {patient_token}'})
    assert res.status_code == 404

# ----------------- FUNCTION 8: Doctor View Appointments -----------------

def test_doctor_view_appointments(client, doctor_token):
    res = client.get('/api/doctor/appointments', headers={'Authorization': f'Bearer {doctor_token}'})
    assert res.status_code == 200
    appts = res.get_json()
    assert isinstance(appts, list)

def test_non_doctor_blocked_from_doctor_dashboard(client, patient_token):
    res = client.get('/api/doctor/appointments', headers={'Authorization': f'Bearer {patient_token}'})
    assert res.status_code == 403

# ----------------- FUNCTION 9: Update Appointment Status -----------------

def test_doctor_update_status_success(client, doctor_token):
    # Appointment id 1 is with Doctor 1 (BS. An) from seed data
    res = client.put('/api/doctor/appointments/1', json={
        'status': 'COMPLETED'
    }, headers={'Authorization': f'Bearer {doctor_token}'})
    assert res.status_code == 200
    data = res.get_json()
    assert data['appointment']['status'] == 'COMPLETED'

def test_doctor_update_status_invalid(client, doctor_token):
    res = client.put('/api/doctor/appointments/1', json={
        'status': 'UNKNOWN_STATUS'
    }, headers={'Authorization': f'Bearer {doctor_token}'})
    assert res.status_code == 422
    assert res.get_json()['error']['code'] == 'validation_failed'

def test_doctor_confirm_then_complete_workflow(client, doctor_token, patient_token):
    # 1. Patient creates a new PENDING appointment with Doctor 1
    res_book = client.post('/api/appointments', json={
        'doctor_id': 1,
        'date': '2026-11-10',
        'time': '09:00',
        'reason': 'Khám tai mũi họng'
    }, headers={'Authorization': f'Bearer {patient_token}'})
    assert res_book.status_code == 201
    appt_id = res_book.get_json()['appointment']['id']

    # 2. Doctor attempts to directly COMPLETE without CONFIRMING -> 422
    res_direct_complete = client.put(f'/api/doctor/appointments/{appt_id}', json={
        'status': 'COMPLETED'
    }, headers={'Authorization': f'Bearer {doctor_token}'})
    assert res_direct_complete.status_code == 422
    assert res_direct_complete.get_json()['error']['code'] == 'validation_failed'

    # 3. Doctor CONFIRMS the appointment -> 200 OK
    res_confirm = client.put(f'/api/doctor/appointments/{appt_id}', json={
        'status': 'CONFIRMED'
    }, headers={'Authorization': f'Bearer {doctor_token}'})
    assert res_confirm.status_code == 200
    assert res_confirm.get_json()['appointment']['status'] == 'CONFIRMED'

    # 4. Doctor attempts to CANCEL confirmed appointment -> 422 (Not allowed per business rule)
    res_cancel_confirmed = client.put(f'/api/doctor/appointments/{appt_id}', json={
        'status': 'CANCELLED'
    }, headers={'Authorization': f'Bearer {doctor_token}'})
    assert res_cancel_confirmed.status_code == 422
    assert res_cancel_confirmed.get_json()['error']['code'] == 'validation_failed'

    # 5. Doctor completes the examination -> 200 OK
    res_complete = client.put(f'/api/doctor/appointments/{appt_id}', json={
        'status': 'COMPLETED'
    }, headers={'Authorization': f'Bearer {doctor_token}'})
    assert res_complete.status_code == 200
    assert res_complete.get_json()['appointment']['status'] == 'COMPLETED'

def test_doctor_update_other_doctor_appointment_forbidden(client, doctor2_token):
    # Appointment id 1 is with Doctor 1 (BS. An), Doctor 2 (BS. Mai) tries to edit it -> 403
    res = client.put('/api/doctor/appointments/1', json={
        'status': 'CONFIRMED'
    }, headers={'Authorization': f'Bearer {doctor2_token}'})
    assert res.status_code == 403

# ----------------- FUNCTION 10: Manage Doctors (Admin) -----------------

def test_non_admin_blocked_from_admin_api(client, patient_token):
    res = client.post('/api/admin/doctors', json={
        'full_name': 'BS. Fake',
        'email': 'fake@clinic.com',
        'password': 'Password123',
        'specialty_id': 1
    }, headers={'Authorization': f'Bearer {patient_token}'})
    assert res.status_code == 403

def test_admin_add_and_delete_doctor(client, admin_token):
    # 1. Admin creates a new doctor
    res_create = client.post('/api/admin/doctors', json={
        'full_name': 'BS. CKI Trần Hoàng Yến',
        'email': 'doctor.yen@clinic.com',
        'password': 'Doctor@123',
        'specialty_id': 2,
        'phone': '0988776655',
        'experience': 5,
        'description': 'Bác sĩ chuyên khoa Nhi'
    }, headers={'Authorization': f'Bearer {admin_token}'})
    assert res_create.status_code == 201
    doc_data = res_create.get_json()['doctor']
    doc_id = doc_data['id']
    assert doc_data['full_name'] == 'BS. CKI Trần Hoàng Yến'

    # 2. Check doctor exists in public list
    res_list = client.get(f'/api/doctors/{doc_id}')
    assert res_list.status_code == 200

    # 3. Admin deletes the doctor
    res_del = client.delete(f'/api/admin/doctors/{doc_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert res_del.status_code == 204
    assert res_del.data == b''

    # 4. Verify doctor is gone
    res_check = client.get(f'/api/doctors/{doc_id}')
    assert res_check.status_code == 404

def test_admin_add_doctor_duplicate_email(client, admin_token):
    # doctor.an@clinic.com already exists
    res = client.post('/api/admin/doctors', json={
        'full_name': 'BS. Duplicate',
        'email': 'doctor.an@clinic.com',
        'password': 'Doctor@123',
        'specialty_id': 1
    }, headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 409
    assert res.get_json()['error']['code'] == 'email_exists'
