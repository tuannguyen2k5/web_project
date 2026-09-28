from flask import Blueprint, request, jsonify
from .models import User, Specialty, Doctor, Appointment
from .auth import hash_password, verify_password, generate_token, token_required, role_required
from .validation import (
    validate_register,
    validate_login,
    validate_appointment,
    validate_appointment_update,
    validate_status_update,
    validate_doctor_create
)

api_bp = Blueprint('api', __name__)

def error_response(code, message, details=None, status_code=400):
    return jsonify({
        "error": {
            "code": code,
            "message": message,
            "details": details or {}
        }
    }), status_code

# Health check
@api_bp.get('/health')
def health():
    return jsonify({"status": "ok", "service": "Clinic Appointment System"}), 200

# 1. Register (Patient) - POST /api/register
@api_bp.post('/register')
def register():
    data = request.get_json(silent=True)
    if data is None:
        return error_response("bad_request", "Malformed request body or invalid JSON.", status_code=400)

    errors = validate_register(data)
    if errors:
        return error_response("validation_failed", "The request body is invalid.", errors, status_code=422)

    email = data['email'].strip().lower()
    existing = User.find_by_email(email)
    if existing:
        return error_response("email_exists", "This email address is already registered.", status_code=409)

    pwd_hash = hash_password(data['password'])
    user_id = User.create(
        full_name=data['full_name'].strip(),
        email=email,
        password_hash=pwd_hash,
        role='PATIENT'
    )

    created_user = User.find_by_id(user_id)
    return jsonify({
        "message": "User registered successfully.",
        "user": created_user
    }), 201

# 2. Login (Patient / Doctor / Admin) - POST /api/login
@api_bp.post('/login')
def login():
    data = request.get_json(silent=True)
    if data is None:
        return error_response("bad_request", "Malformed request body or invalid JSON.", status_code=400)

    errors = validate_login(data)
    if errors:
        return error_response("validation_failed", "The request body is invalid.", errors, status_code=422)

    email = data['email'].strip().lower()
    user = User.find_by_email(email)
    if not user or not verify_password(user['password_hash'], data['password']):
        return error_response("invalid_credentials", "Invalid email or password.", status_code=401)

    token = generate_token(user_id=user['id'], role=user['role'])
    return jsonify({
        "token": token,
        "user": {
            "id": user['id'],
            "full_name": user['full_name'],
            "email": user['email'],
            "role": user['role']
        }
    }), 200

# 3. View Doctor List (Patient / Public) - GET /api/doctors
@api_bp.get('/doctors')
def get_doctors():
    doctors = Doctor.get_all()
    return jsonify(doctors), 200

# 4. View Doctor Detail (Patient / Public) - GET /api/doctors/<int:doctor_id>
@api_bp.get('/doctors/<int:doctor_id>')
def get_doctor(doctor_id):
    doctor = Doctor.find_by_id(doctor_id)
    if not doctor:
        return error_response("not_found", "Doctor not found.", status_code=404)
    return jsonify(doctor), 200

# 5. Book Appointment (Patient) - POST /api/appointments
@api_bp.post('/appointments')
@token_required
@role_required('PATIENT')
def book_appointment(current_user):
    data = request.get_json(silent=True)
    if data is None:
        return error_response("bad_request", "Malformed request body or invalid JSON.", status_code=400)

    errors = validate_appointment(data)
    if errors:
        return error_response("validation_failed", "The request body is invalid.", errors, status_code=422)

    doctor_id = int(data['doctor_id'])
    doctor = Doctor.find_by_id(doctor_id)
    if not doctor:
        return error_response("not_found", "Doctor not found.", status_code=404)

    date = data['date'].strip()
    time = data['time'].strip()
    reason = data.get('reason', '').strip()

    # Slot already booked?
    if Appointment.check_conflict(doctor_id, date, time):
        return error_response(
            code="appointment_conflict",
            message="This doctor is already booked at this time.",
            details={},
            status_code=409
        )

    appt_id = Appointment.create(
        patient_id=current_user['user_id'],
        doctor_id=doctor_id,
        date=date,
        time=time,
        reason=reason
    )

    created_appt = Appointment.find_by_id(appt_id)
    return jsonify({
        "message": "Appointment booked successfully.",
        "appointment": created_appt
    }), 201

# 6. View My Appointments (Patient) - GET /api/my-appointments
@api_bp.get('/my-appointments')
@token_required
@role_required('PATIENT')
def get_my_appointments(current_user):
    appointments = Appointment.find_by_patient(current_user['user_id'])
    return jsonify(appointments), 200

# 7. Cancel Appointment (Patient / Owner) - DELETE /api/appointments/<int:appointment_id>
@api_bp.delete('/appointments/<int:appointment_id>')
@token_required
def cancel_appointment(current_user, appointment_id):
    appt = Appointment.find_by_id(appointment_id)
    if not appt:
        return error_response("not_found", "Appointment not found.", status_code=404)

    # Ownership check: Only the patient who booked this appointment can cancel it
    if current_user['role'] != 'PATIENT' or appt['patient_id'] != current_user['user_id']:
        return error_response("forbidden", "You can only cancel your own appointments.", status_code=403)

    # Business rule: only PENDING or CONFIRMED appointments can be cancelled
    if appt['status'] not in ('PENDING', 'CONFIRMED'):
        return error_response(
            "validation_failed",
            f"Không thể hủy lịch hẹn đã ở trạng thái '{appt['status']}'.",
            {"status": f"Appointment is already {appt['status']}."},
            status_code=422
        )

    Appointment.cancel(appointment_id)
    return "", 204

# 7b. Edit Appointment (Patient / Owner) - PATCH /api/appointments/<int:appointment_id>
@api_bp.patch('/appointments/<int:appointment_id>')
@token_required
@role_required('PATIENT')
def edit_appointment(current_user, appointment_id):
    appt = Appointment.find_by_id(appointment_id)
    if not appt:
        return error_response("not_found", "Appointment not found.", status_code=404)

    if appt['patient_id'] != current_user['user_id']:
        return error_response("forbidden", "You can only edit your own appointments.", status_code=403)

    # Only PENDING appointments can be edited
    if appt['status'] != 'PENDING':
        return error_response(
            "validation_failed",
            "Chỉ có thể sửa lịch hẹn đang ở trạng thái 'Chờ xác nhận' (PENDING).",
            {"status": "Only PENDING appointments can be edited."},
            status_code=422
        )

    data = request.get_json(silent=True)
    if data is None:
        return error_response("bad_request", "Malformed request body or invalid JSON.", status_code=400)

    errors = validate_appointment_update(data)
    if errors:
        return error_response("validation_failed", "The request body is invalid.", errors, status_code=422)

    # Resolve new field values (fall back to existing values if not provided)
    new_doctor_id = int(data['doctor_id']) if 'doctor_id' in data else appt['doctor_id']
    new_date = data.get('date', appt['date']).strip()
    new_time = data.get('time', appt['time']).strip()
    new_reason = data.get('reason', appt['reason'] or '').strip()

    # Check merged date+time is not in the past (Vietnam UTC+7)
    from datetime import datetime as dt, timezone, timedelta
    VN_TZ = timezone(timedelta(hours=7))
    try:
        appt_dt = dt.strptime(f"{new_date} {new_time}", '%Y-%m-%d %H:%M').replace(tzinfo=VN_TZ)
        if appt_dt <= dt.now(VN_TZ):
            return error_response(
                "validation_failed",
                "Không thể đặt lịch hẹn vào thời điểm đã qua. Vui lòng chọn ngày và giờ trong tương lai.",
                {"datetime": "Appointment datetime must be in the future."},
                status_code=422
            )
    except ValueError:
        pass  # already caught by validate_appointment_update

    # Validate new doctor exists (if changed)
    if new_doctor_id != appt['doctor_id']:
        doctor = Doctor.find_by_id(new_doctor_id)
        if not doctor:
            return error_response("not_found", "Doctor not found.", status_code=404)

    # Check slot conflict (excluding this appointment itself)
    conflict_sql = """
        SELECT id FROM appointments
        WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'CANCELLED' AND id != ?
    """
    from .database import query_db
    if query_db(conflict_sql, (new_doctor_id, new_date, new_time, appointment_id), one=True):
        return error_response(
            "appointment_conflict",
            "This doctor is already booked at this time.",
            {},
            status_code=409
        )

    Appointment.update(appointment_id, new_doctor_id, new_date, new_time, new_reason)
    updated_appt = Appointment.find_by_id(appointment_id)
    return jsonify({
        "message": "Appointment updated successfully.",
        "appointment": updated_appt
    }), 200

# 8. View Appointments (Doctor) - GET /api/doctor/appointments
@api_bp.get('/doctor/appointments')
@token_required
@role_required('DOCTOR')
def get_doctor_appointments(current_user):
    doctor = Doctor.find_by_user_id(current_user['user_id'])
    if not doctor:
        return error_response("not_found", "Doctor profile not found for this user.", status_code=404)

    appointments = Appointment.find_by_doctor(doctor['id'])
    return jsonify(appointments), 200

# 9. Update Appointment Status (Doctor / Owner) - PUT /api/doctor/appointments/<int:appointment_id>
@api_bp.put('/doctor/appointments/<int:appointment_id>')
@token_required
@role_required('DOCTOR')
def update_appointment_status(current_user, appointment_id):
    doctor = Doctor.find_by_user_id(current_user['user_id'])
    if not doctor:
        return error_response("not_found", "Doctor profile not found for this user.", status_code=404)

    appt = Appointment.find_by_id(appointment_id)
    if not appt:
        return error_response("not_found", "Appointment not found.", status_code=404)

    # Ownership check: Doctor must be the assigned doctor for this appointment
    if appt['doctor_id'] != doctor['id']:
        return error_response("forbidden", "You can only update appointments assigned to you.", status_code=403)

    data = request.get_json(silent=True)
    if data is None:
        return error_response("bad_request", "Malformed request body or invalid JSON.", status_code=400)

    errors = validate_status_update(data)
    if errors:
        return error_response("validation_failed", "The request body is invalid.", errors, status_code=422)

    status = data['status'].upper()
    current_status = appt['status']

    # Quy tắc nghiệp vụ y tế:
    # 1. Lịch PENDING cần được Bác sĩ Xác nhận (CONFIRMED) trước khi Hoàn thành (COMPLETED)
    if status == 'COMPLETED' and current_status == 'PENDING':
        return error_response(
            "validation_failed",
            "Lịch hẹn cần được Bác sĩ xác nhận (CONFIRMED) trước khi đánh dấu hoàn thành khám.",
            {"status": "Appointment must be confirmed before it can be marked as completed."},
            status_code=422
        )

    # 2. Khi đã xác nhận khám (CONFIRMED), Bác sĩ không thể hủy lịch khám nữa
    if current_status == 'CONFIRMED' and status == 'CANCELLED':
        return error_response(
            "validation_failed",
            "Lịch hẹn đã được xác nhận không thể hủy bởi bác sĩ. Vui lòng hoàn thành buổi khám hoặc liên hệ quản trị viên.",
            {"status": "Confirmed appointments cannot be cancelled by doctor."},
            status_code=422
        )

    # 3. Lịch đã kết thúc (COMPLETED hoặc CANCELLED) không thể sửa đổi
    if current_status in ['COMPLETED', 'CANCELLED']:
        return error_response(
            "validation_failed",
            f"Không thể thay đổi trạng thái của lịch hẹn đã ở trạng thái '{current_status}'.",
            {"status": f"Appointment is already {current_status}."},
            status_code=422
        )

    Appointment.update_status(appointment_id, status)
    updated_appt = Appointment.find_by_id(appointment_id)

    return jsonify({
        "message": "Appointment status updated successfully.",
        "appointment": updated_appt
    }), 200

# 10. Manage Doctors (Admin) - POST & DELETE /api/admin/doctors[/<int:doctor_id>]
@api_bp.post('/admin/doctors')
@token_required
@role_required('ADMIN')
def create_doctor(current_user):
    data = request.get_json(silent=True)
    if data is None:
        return error_response("bad_request", "Malformed request body or invalid JSON.", status_code=400)

    errors = validate_doctor_create(data)
    if errors:
        return error_response("validation_failed", "The request body is invalid.", errors, status_code=422)

    email = data['email'].strip().lower()
    if User.find_by_email(email):
        return error_response("email_exists", "A user with this email address already exists.", status_code=409)

    specialty_id = int(data['specialty_id'])
    specialty = Specialty.find_by_id(specialty_id)
    if not specialty:
        return error_response("not_found", "Specialty not found.", status_code=404)

    pwd_hash = hash_password(data['password'])
    user_id = User.create(
        full_name=data['full_name'].strip(),
        email=email,
        password_hash=pwd_hash,
        role='DOCTOR'
    )

    doctor_id = Doctor.create(
        user_id=user_id,
        specialty_id=specialty_id,
        phone=data.get('phone', '').strip(),
        experience=int(data.get('experience', 0)),
        description=data.get('description', '').strip(),
        available=1
    )

    created_doctor = Doctor.find_by_id(doctor_id)
    return jsonify({
        "message": "Doctor created successfully.",
        "doctor": created_doctor
    }), 201

@api_bp.delete('/admin/doctors/<int:doctor_id>')
@token_required
@role_required('ADMIN')
def delete_doctor(current_user, doctor_id):
    doctor = Doctor.find_by_id(doctor_id)
    if not doctor:
        return error_response("not_found", "Doctor not found.", status_code=404)

    Doctor.delete(doctor_id)
    return "", 204

# Helper: Get all specialties
@api_bp.get('/specialties')
def get_specialties():
    specialties = Specialty.get_all()
    return jsonify(specialties), 200
