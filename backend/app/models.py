from .database import query_db, execute_db

class User:
    @staticmethod
    def find_by_email(email):
        return query_db("SELECT * FROM users WHERE email = ?", (email.strip().lower(),), one=True)

    @staticmethod
    def find_by_id(user_id):
        return query_db("SELECT id, full_name, email, role, created_at FROM users WHERE id = ?", (user_id,), one=True)

    @staticmethod
    def get_all_patients():
        return query_db("SELECT id, full_name, email, created_at FROM users WHERE role = 'PATIENT' ORDER BY id DESC")

    @staticmethod
    def create(full_name, email, password_hash, role='PATIENT'):
        last_id, _ = execute_db(
            "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            (full_name.strip(), email.strip().lower(), password_hash, role)
        )
        return last_id

class Specialty:
    @staticmethod
    def get_all():
        return query_db("SELECT * FROM specialties ORDER BY id ASC")

    @staticmethod
    def find_by_id(specialty_id):
        return query_db("SELECT * FROM specialties WHERE id = ?", (specialty_id,), one=True)

class Doctor:
    @staticmethod
    def get_all():
        sql = """
            SELECT 
                d.id, d.user_id, d.specialty_id, d.phone, d.experience, d.description, d.available,
                u.full_name, u.email,
                s.name AS specialty_name, s.description AS specialty_description
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            JOIN specialties s ON d.specialty_id = s.id
            ORDER BY d.id ASC
        """
        return query_db(sql)

    @staticmethod
    def find_by_id(doctor_id):
        sql = """
            SELECT 
                d.id, d.user_id, d.specialty_id, d.phone, d.experience, d.description, d.available,
                u.full_name, u.email,
                s.name AS specialty_name, s.description AS specialty_description
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            JOIN specialties s ON d.specialty_id = s.id
            WHERE d.id = ?
        """
        return query_db(sql, (doctor_id,), one=True)

    @staticmethod
    def find_by_user_id(user_id):
        sql = """
            SELECT 
                d.id, d.user_id, d.specialty_id, d.phone, d.experience, d.description, d.available,
                u.full_name, u.email,
                s.name AS specialty_name
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            JOIN specialties s ON d.specialty_id = s.id
            WHERE d.user_id = ?
        """
        return query_db(sql, (user_id,), one=True)

    @staticmethod
    def create(user_id, specialty_id, phone='', experience=0, description='', available=1):
        last_id, _ = execute_db(
            """INSERT INTO doctors (user_id, specialty_id, phone, experience, description, available)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, specialty_id, phone, experience, description, available)
        )
        return last_id

    @staticmethod
    def delete(doctor_id):
        # Find doctor to get user_id
        doc = query_db("SELECT user_id FROM doctors WHERE id = ?", (doctor_id,), one=True)
        if not doc:
            return False
        # Delete doctor and corresponding user
        execute_db("DELETE FROM doctors WHERE id = ?", (doctor_id,))
        execute_db("DELETE FROM users WHERE id = ?", (doc['user_id'],))
        return True

class Appointment:
    @staticmethod
    def check_conflict(doctor_id, date, time):
        sql = """
            SELECT id FROM appointments
            WHERE doctor_id = ? AND date = ? AND time = ? AND status != 'CANCELLED'
        """
        return query_db(sql, (doctor_id, date, time), one=True) is not None

    @staticmethod
    def get_all():
        sql = """
            SELECT 
                a.id, a.patient_id, a.doctor_id, a.date, a.time, a.reason, a.status, a.created_at,
                p.full_name AS patient_name, p.email AS patient_email,
                u_doc.full_name AS doctor_name, u_doc.email AS doctor_email,
                d.phone AS doctor_phone,
                s.name AS specialty_name
            FROM appointments a
            JOIN users p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u_doc ON d.user_id = u_doc.id
            JOIN specialties s ON d.specialty_id = s.id
            ORDER BY a.date DESC, a.time DESC
        """
        return query_db(sql)

    @staticmethod
    def create(patient_id, doctor_id, date, time, reason=''):
        last_id, _ = execute_db(
            """INSERT INTO appointments (patient_id, doctor_id, date, time, reason, status)
               VALUES (?, ?, ?, ?, ?, 'PENDING')""",
            (patient_id, doctor_id, date, time, reason)
        )
        return last_id
    @staticmethod
    def update(appointment_id, doctor_id, date, time, reason):
        _, row_count = execute_db(
            """UPDATE appointments
               SET doctor_id = ?, date = ?, time = ?, reason = ?
               WHERE id = ?""",
            (doctor_id, date, time, reason, appointment_id)
        )
        return row_count > 0
    @staticmethod
    def find_by_id(appointment_id):
        sql = """
            SELECT 
                a.id, a.patient_id, a.doctor_id, a.date, a.time, a.reason, a.status, a.created_at,
                p.full_name AS patient_name, p.email AS patient_email,
                u_doc.full_name AS doctor_name, u_doc.email AS doctor_email,
                d.phone AS doctor_phone,
                s.name AS specialty_name
            FROM appointments a
            JOIN users p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u_doc ON d.user_id = u_doc.id
            JOIN specialties s ON d.specialty_id = s.id
            WHERE a.id = ?
        """
        return query_db(sql, (appointment_id,), one=True)

    @staticmethod
    def find_by_patient(patient_id):
        sql = """
            SELECT 
                a.id, a.patient_id, a.doctor_id, a.date, a.time, a.reason, a.status, a.created_at,
                u_doc.full_name AS doctor_name, u_doc.email AS doctor_email,
                d.phone AS doctor_phone,
                s.name AS specialty_name
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u_doc ON d.user_id = u_doc.id
            JOIN specialties s ON d.specialty_id = s.id
            WHERE a.patient_id = ?
            ORDER BY a.date DESC, a.time DESC
        """
        return query_db(sql, (patient_id,))

    @staticmethod
    def find_by_doctor(doctor_id):
        sql = """
            SELECT 
                a.id, a.patient_id, a.doctor_id, a.date, a.time, a.reason, a.status, a.created_at,
                p.full_name AS patient_name, p.email AS patient_email
            FROM appointments a
            JOIN users p ON a.patient_id = p.id
            WHERE a.doctor_id = ?
            ORDER BY a.date DESC, a.time DESC
        """
        return query_db(sql, (doctor_id,))

    @staticmethod
    def update_status(appointment_id, status):
        _, row_count = execute_db(
            "UPDATE appointments SET status = ? WHERE id = ?",
            (status, appointment_id)
        )
        return row_count > 0

    @staticmethod
    def delete(appointment_id):
        _, row_count = execute_db("DELETE FROM appointments WHERE id = ?", (appointment_id,))
        return row_count > 0
