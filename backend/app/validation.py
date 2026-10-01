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
        return {"body": "Dữ liệu yêu cầu không hợp lệ."}

    full_name = data.get('full_name')
    if not full_name or not isinstance(full_name, str) or not full_name.strip():
        errors['full_name'] = "Vui lòng nhập họ và tên."

    email = data.get('email')
    if not email:
        errors['email'] = "Vui lòng nhập địa chỉ email."
    elif not validate_email(email):
        errors['email'] = "Địa chỉ email không đúng định dạng."

    password = data.get('password')
    if not password:
        errors['password'] = "Vui lòng nhập mật khẩu."
    elif not isinstance(password, str) or len(password) < 6:
        errors['password'] = "Mật khẩu phải có tối thiểu 6 ký tự."

    return errors

def validate_login(data):
    errors = {}
    if not isinstance(data, dict):
        return {"body": "Dữ liệu yêu cầu không hợp lệ."}

    email = data.get('email')
    if not email:
        errors['email'] = "Vui lòng nhập địa chỉ email."
    elif not validate_email(email):
        errors['email'] = "Địa chỉ email không đúng định dạng."

    password = data.get('password')
    if not password:
        errors['password'] = "Vui lòng nhập mật khẩu."

    return errors

def validate_appointment(data):
    errors = {}
    if not isinstance(data, dict):
        return {"body": "Dữ liệu yêu cầu không hợp lệ."}

    doctor_id = data.get('doctor_id')
    if doctor_id is None:
        errors['doctor_id'] = "Vui lòng chọn bác sĩ khám."
    else:
        try:
            val = int(doctor_id)
            if val <= 0:
                errors['doctor_id'] = "Mã bác sĩ không hợp lệ."
        except (ValueError, TypeError):
            errors['doctor_id'] = "Mã bác sĩ không hợp lệ."

    date_str = data.get('date')
    date_valid = False
    if not date_str or not isinstance(date_str, str):
        errors['date'] = "Vui lòng chọn ngày khám."
    elif not re.match(DATE_REGEX, date_str):
        errors['date'] = "Định dạng ngày khám không hợp lệ."
    else:
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
            date_valid = True
        except ValueError:
            errors['date'] = "Ngày khám không hợp lệ trên lịch."

    time_str = data.get('time')
    time_valid = False
    if not time_str or not isinstance(time_str, str):
        errors['time'] = "Vui lòng chọn giờ khám."
    elif not re.match(TIME_REGEX, time_str):
        errors['time'] = "Định dạng giờ khám không hợp lệ."
    else:
        try:
            parts = time_str.split(':')
            h, m = int(parts[0]), int(parts[1])
            if not (0 <= h <= 23 and 0 <= m <= 59):
                errors['time'] = "Khung giờ khám không hợp lệ."
            else:
                time_valid = True
        except ValueError:
            errors['time'] = "Giờ khám không đúng định dạng."

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
        return {"body": "Dữ liệu yêu cầu không hợp lệ."}

    # At least one editable field must be present
    editable = {'doctor_id', 'date', 'time', 'reason'}
    if not any(k in data for k in editable):
        return {"body": "Vui lòng cung cấp ít nhất một thông tin cần cập nhật."}

    doctor_id = data.get('doctor_id')
    if doctor_id is not None:
        try:
            val = int(doctor_id)
            if val <= 0:
                errors['doctor_id'] = "Mã bác sĩ không hợp lệ."
        except (ValueError, TypeError):
            errors['doctor_id'] = "Mã bác sĩ không hợp lệ."

    date_str = data.get('date')
    date_valid = False
    if date_str is not None:
        if not isinstance(date_str, str) or not re.match(DATE_REGEX, date_str):
            errors['date'] = "Định dạng ngày khám không hợp lệ."
        else:
            try:
                datetime.strptime(date_str, '%Y-%m-%d')
                date_valid = True
            except ValueError:
                errors['date'] = "Ngày khám không hợp lệ trên lịch."

    time_str = data.get('time')
    time_valid = False
    if time_str is not None:
        if not isinstance(time_str, str) or not re.match(TIME_REGEX, time_str):
            errors['time'] = "Định dạng giờ khám không hợp lệ."
        else:
            try:
                parts = time_str.split(':')
                h, m = int(parts[0]), int(parts[1])
                if not (0 <= h <= 23 and 0 <= m <= 59):
                    errors['time'] = "Khung giờ khám không hợp lệ."
                else:
                    time_valid = True
            except ValueError:
                errors['time'] = "Giờ khám không đúng định dạng."

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
        return {"body": "Dữ liệu yêu cầu không hợp lệ."}

    status = data.get('status')
    allowed_statuses = {'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'}
    if not status:
        errors['status'] = "Vui lòng chọn trạng thái."
    elif status not in allowed_statuses:
        errors['status'] = "Trạng thái cập nhật không hợp lệ."

    return errors

def validate_doctor_create(data):
    errors = {}
    if not isinstance(data, dict):
        return {"body": "Dữ liệu yêu cầu không hợp lệ."}

    full_name = data.get('full_name')
    if not full_name or not isinstance(full_name, str) or not full_name.strip():
        errors['full_name'] = "Vui lòng nhập họ và tên bác sĩ."

    email = data.get('email')
    if not email:
        errors['email'] = "Vui lòng nhập địa chỉ email."
    elif not validate_email(email):
        errors['email'] = "Địa chỉ email không đúng định dạng."

    password = data.get('password')
    if not password:
        errors['password'] = "Vui lòng nhập mật khẩu."
    elif not isinstance(password, str) or len(password) < 6:
        errors['password'] = "Mật khẩu phải có tối thiểu 6 ký tự."

    specialty_id = data.get('specialty_id')
    if specialty_id is None:
        errors['specialty_id'] = "Vui lòng chọn chuyên khoa."
    else:
        try:
            val = int(specialty_id)
            if val <= 0:
                errors['specialty_id'] = "Mã chuyên khoa không hợp lệ."
        except (ValueError, TypeError):
            errors['specialty_id'] = "Mã chuyên khoa không hợp lệ."

    experience = data.get('experience', 0)
    if experience is not None:
        try:
            val = int(experience)
            if val < 0:
                errors['experience'] = "Số năm kinh nghiệm không được âm."
        except (ValueError, TypeError):
            errors['experience'] = "Số năm kinh nghiệm phải là số nguyên."

    return errors
