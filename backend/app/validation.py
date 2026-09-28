import re
from datetime import datetime

EMAIL_REGEX = r'^[\w\.-]+@[\w\.-]+\.\w+$'
DATE_REGEX = r'^\d{4}-\d{2}-\d{2}$'
TIME_REGEX = r'^\d{2}:\d{2}$'

def validate_email(email):
    if not email or not isinstance(email, str):
        return False
    return bool(re.match(EMAIL_REGEX, email.strip()))

def validate_register(data):
    errors = {}
    if not isinstance(data, dict):
        return {"body": "Request body must be a JSON object"}

    full_name = data.get('full_name')
    if not full_name or not isinstance(full_name, str) or not full_name.strip():
        errors['full_name'] = "Full name is required."

    email = data.get('email')
    if not email:
        errors['email'] = "Email is required."
    elif not validate_email(email):
        errors['email'] = "Invalid email format."

    password = data.get('password')
    if not password:
        errors['password'] = "Password is required."
    elif not isinstance(password, str) or len(password) < 6:
        errors['password'] = "Password must be at least 6 characters long."

    return errors

def validate_login(data):
    errors = {}
    if not isinstance(data, dict):
        return {"body": "Request body must be a JSON object"}

    email = data.get('email')
    if not email:
        errors['email'] = "Email is required."
    elif not validate_email(email):
        errors['email'] = "Invalid email format."

    password = data.get('password')
    if not password:
        errors['password'] = "Password is required."

    return errors

def validate_appointment(data):
    errors = {}
    if not isinstance(data, dict):
        return {"body": "Request body must be a JSON object"}

    doctor_id = data.get('doctor_id')
    if doctor_id is None:
        errors['doctor_id'] = "Doctor ID is required."
    else:
        try:
            val = int(doctor_id)
            if val <= 0:
                errors['doctor_id'] = "Doctor ID must be a positive integer."
        except (ValueError, TypeError):
            errors['doctor_id'] = "Doctor ID must be an integer."

    date_str = data.get('date')
    date_valid = False
    if not date_str or not isinstance(date_str, str):
        errors['date'] = "Appointment date is required."
    elif not re.match(DATE_REGEX, date_str):
        errors['date'] = "Date must be in format YYYY-MM-DD."
    else:
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
            date_valid = True
        except ValueError:
            errors['date'] = "Invalid calendar date."

    time_str = data.get('time')
    time_valid = False
    if not time_str or not isinstance(time_str, str):
        errors['time'] = "Appointment time is required."
    elif not re.match(TIME_REGEX, time_str):
        errors['time'] = "Time must be in format HH:MM."
    else:
        try:
            parts = time_str.split(':')
            h, m = int(parts[0]), int(parts[1])
            if not (0 <= h <= 23 and 0 <= m <= 59):
                errors['time'] = "Invalid time range."
            else:
                time_valid = True
        except ValueError:
            errors['time'] = "Invalid time format."

    # Check that the appointment datetime is not in the past (Vietnam UTC+7)
    if date_valid and time_valid:
        from datetime import timezone, timedelta
        VN_TZ = timezone(timedelta(hours=7))
        appt_dt = datetime.strptime(f"{date_str} {time_str}", '%Y-%m-%d %H:%M').replace(tzinfo=VN_TZ)
        now_vn = datetime.now(VN_TZ)
        if appt_dt <= now_vn:
            errors['datetime'] = "Không thể đặt lịch hẹn vào thời điểm đã qua. Vui lòng chọn ngày và giờ trong tương lai."

    return errors

def validate_appointment_update(data):
    """Validate PATCH body for editing an existing appointment."""
    errors = {}
    if not isinstance(data, dict):
        return {"body": "Request body must be a JSON object"}

    # At least one editable field must be present
    editable = {'doctor_id', 'date', 'time', 'reason'}
    if not any(k in data for k in editable):
        return {"body": "At least one field (doctor_id, date, time, reason) must be provided."}

    doctor_id = data.get('doctor_id')
    if doctor_id is not None:
        try:
            val = int(doctor_id)
            if val <= 0:
                errors['doctor_id'] = "Doctor ID must be a positive integer."
        except (ValueError, TypeError):
            errors['doctor_id'] = "Doctor ID must be an integer."

    date_str = data.get('date')
    date_valid = False
    if date_str is not None:
        if not isinstance(date_str, str) or not re.match(DATE_REGEX, date_str):
            errors['date'] = "Date must be in format YYYY-MM-DD."
        else:
            try:
                datetime.strptime(date_str, '%Y-%m-%d')
                date_valid = True
            except ValueError:
                errors['date'] = "Invalid calendar date."

    time_str = data.get('time')
    time_valid = False
    if time_str is not None:
        if not isinstance(time_str, str) or not re.match(TIME_REGEX, time_str):
            errors['time'] = "Time must be in format HH:MM."
        else:
            try:
                parts = time_str.split(':')
                h, m = int(parts[0]), int(parts[1])
                if not (0 <= h <= 23 and 0 <= m <= 59):
                    errors['time'] = "Invalid time range."
                else:
                    time_valid = True
            except ValueError:
                errors['time'] = "Invalid time format."

    # When both date and time are supplied in the PATCH body, check for past datetime
    if date_valid and time_valid:
        from datetime import timezone, timedelta
        VN_TZ = timezone(timedelta(hours=7))
        appt_dt = datetime.strptime(f"{date_str} {time_str}", '%Y-%m-%d %H:%M').replace(tzinfo=VN_TZ)
        now_vn = datetime.now(VN_TZ)
        if appt_dt <= now_vn:
            errors['datetime'] = "Không thể đặt lịch hẹn vào thời điểm đã qua. Vui lòng chọn ngày và giờ trong tương lai."

    return errors

def validate_status_update(data):
    errors = {}
    if not isinstance(data, dict):
        return {"body": "Request body must be a JSON object"}

    status = data.get('status')
    allowed_statuses = {'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'}
    if not status:
        errors['status'] = "Status is required."
    elif status not in allowed_statuses:
        errors['status'] = f"Status must be one of: {', '.join(sorted(allowed_statuses))}."

    return errors

def validate_doctor_create(data):
    errors = {}
    if not isinstance(data, dict):
        return {"body": "Request body must be a JSON object"}

    full_name = data.get('full_name')
    if not full_name or not isinstance(full_name, str) or not full_name.strip():
        errors['full_name'] = "Doctor's full name is required."

    email = data.get('email')
    if not email:
        errors['email'] = "Email is required."
    elif not validate_email(email):
        errors['email'] = "Invalid email format."

    password = data.get('password')
    if not password:
        errors['password'] = "Password is required."
    elif not isinstance(password, str) or len(password) < 6:
        errors['password'] = "Password must be at least 6 characters long."

    specialty_id = data.get('specialty_id')
    if specialty_id is None:
        errors['specialty_id'] = "Specialty ID is required."
    else:
        try:
            val = int(specialty_id)
            if val <= 0:
                errors['specialty_id'] = "Specialty ID must be a positive integer."
        except (ValueError, TypeError):
            errors['specialty_id'] = "Specialty ID must be an integer."

    experience = data.get('experience', 0)
    if experience is not None:
        try:
            val = int(experience)
            if val < 0:
                errors['experience'] = "Experience must be non-negative."
        except (ValueError, TypeError):
            errors['experience'] = "Experience must be an integer."

    return errors
