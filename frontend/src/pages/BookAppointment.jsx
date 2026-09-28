import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Loading from '../components/Loading';

const MORNING_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'];
const AFTERNOON_SLOTS = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

/**
 * Returns true if the given slot (HH:MM) on the given date string (YYYY-MM-DD)
 * is already in the past relative to the current local time.
 */
const isSlotPast = (dateStr, slotTime) => {
  const now = new Date();
  const [h, m] = slotTime.split(':').map(Number);
  const slotDate = new Date(dateStr);
  slotDate.setHours(h, m, 0, 0);
  return slotDate <= now;
};

/**
 * Find the first future slot on today, or fall back to the first slot overall.
 */
const getDefaultTime = (dateStr) => {
  const future = ALL_SLOTS.find((s) => !isSlotPast(dateStr, s));
  return future || ALL_SLOTS[0];
};

const BookAppointment = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [doctor, setDoctor] = useState(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(() => getDefaultTime(today));
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadDoctor();
  }, [doctorId]);

  const loadDoctor = async () => {
    setLoadingDoctor(true);
    setError('');
    try {
      const data = await api.getDoctor(doctorId);
      setDoctor(data);
    } catch (err) {
      setError(err.message || 'Không tìm thấy thông tin bác sĩ.');
    } finally {
      setLoadingDoctor(false);
    }
  };

  // When date changes, reset time to first available future slot
  const handleDateChange = (newDate) => {
    setDate(newDate);
    const currentSlotPast = isSlotPast(newDate, time);
    if (currentSlotPast) {
      setTime(getDefaultTime(newDate));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !time) {
      setError('Vui lòng chọn ngày và khung giờ khám.');
      return;
    }

    // Client-side past check before sending to server
    if (isSlotPast(date, time)) {
      setError('⚠️ Khung giờ đã chọn đã qua. Vui lòng chọn ngày hoặc giờ trong tương lai.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.bookAppointment({
        doctor_id: parseInt(doctorId, 10),
        date,
        time,
        reason: reason.trim()
      });

      setSuccess('🎉 Đặt lịch khám thành công! Đang chuyển đến danh sách lịch hẹn của bạn...');
      setTimeout(() => {
        navigate('/my-appointments');
      }, 1200);
    } catch (err) {
      if (err.status === 409 || err.code === 'appointment_conflict') {
        setError('⚠️ Bác sĩ đã có lịch hẹn khám vào khung giờ này. Vui lòng chọn khung giờ hoặc ngày khám khác.');
      } else if (err.details?.datetime) {
        setError(`⚠️ ${err.details.datetime}`);
      } else {
        setError(err.message || 'Đặt lịch thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDoctor) {
    return <Loading message="Đang chuẩn bị thông tin đặt lịch..." />;
  }

  return (
    <div className="page-container">
      <div className="back-link">
        <Link to={`/doctors/${doctorId}`}>← Quay lại hồ sơ bác sĩ</Link>
      </div>

      <div className="card booking-card">
        <div className="booking-header">
          <div className="booking-badge">🏥 PHIẾU ĐĂNG KÝ KHÁM TRỰC TUYẾN</div>
          <h2>Đặt Lịch Khám Bệnh</h2>
          <p>Điền thông tin và chọn thời gian thích hợp nhất để gặp bác sĩ</p>
        </div>

        {doctor && (
          <div className="booking-doctor-summary">
            <div className="avatar-circle">
              {doctor.full_name ? doctor.full_name.charAt(0).toUpperCase() : 'B'}
            </div>
            <div className="doctor-summary-info">
              <h3>{doctor.full_name}</h3>
              <div className="summary-tags">
                <span className="badge badge-specialty">{doctor.specialty_name}</span>
                <span className="summary-exp">⏱️ {doctor.experience || 0} năm kinh nghiệm</span>
                {doctor.phone && <span className="summary-phone">📞 {doctor.phone}</span>}
              </div>
            </div>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label htmlFor="patient-info">Bệnh nhân đăng ký khám:</label>
            <div className="patient-info-box">
              <span className="patient-avatar">👤</span>
              <div>
                <strong>{user?.full_name || 'Bệnh nhân'}</strong>
                <span className="patient-email">({user?.email || ''})</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date">1. Chọn ngày hẹn khám (*):</label>
            <input
              id="date"
              type="date"
              className="form-control date-picker-input"
              min={today}
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label>2. Chọn khung giờ khám (*):</label>

            <div className="slot-section">
              <span className="slot-period-title">🌅 Buổi sáng:</span>
              <div className="slots-grid">
                {MORNING_SLOTS.map((slot) => {
                  const past = isSlotPast(date, slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-chip ${time === slot ? 'active' : ''} ${past ? 'slot-chip-disabled' : ''}`}
                      onClick={() => !past && setTime(slot)}
                      disabled={submitting || past}
                      title={past ? 'Khung giờ này đã qua' : ''}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="slot-section" style={{ marginTop: '0.85rem' }}>
              <span className="slot-period-title">🌇 Buổi chiều:</span>
              <div className="slots-grid">
                {AFTERNOON_SLOTS.map((slot) => {
                  const past = isSlotPast(date, slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-chip ${time === slot ? 'active' : ''} ${past ? 'slot-chip-disabled' : ''}`}
                      onClick={() => !past && setTime(slot)}
                      disabled={submitting || past}
                      title={past ? 'Khung giờ này đã qua' : ''}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="selected-slot-preview">
              Lịch đã chọn: <strong>📅 {date}</strong> vào lúc <strong>⏰ {time}</strong>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reason">3. Triệu chứng hoặc lý do khám bệnh:</label>
            <textarea
              id="reason"
              rows="3"
              className="form-control"
              placeholder="Mô tả tóm tắt tình trạng sức khỏe, triệu chứng gặp phải..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg shadow-btn"
            disabled={submitting || !doctor}
          >
            {submitting ? 'Đang gửi yêu cầu đặt lịch...' : 'Xác nhận Đặt Lịch Khám'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookAppointment;
