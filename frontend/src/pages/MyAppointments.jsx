import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import AppointmentCard from '../components/AppointmentCard';
import Loading from '../components/Loading';

const MORNING_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30'];
const AFTERNOON_SLOTS = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

/** Returns true if the slot on dateStr is already in the past */
const isSlotPast = (dateStr, slotTime) => {
  const now = new Date();
  const [h, m] = slotTime.split(':').map(Number);
  const slotDate = new Date(dateStr);
  slotDate.setHours(h, m, 0, 0);
  return slotDate <= now;
};

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('ALL');

  // --- Edit modal state ---
  const [editingAppt, setEditingAppt] = useState(null); // appointment object being edited
  const [doctors, setDoctors] = useState([]);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDoctorId, setEditDoctorId] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getMyAppointments();
      setAppointments(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách lịch hẹn của bạn.');
    } finally {
      setLoading(false);
    }
  };

  // --- Cancel (soft) ---
  const handleCancelAppointment = async (id) => {
    const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn khám này không?');
    if (!confirmCancel) return;

    setCancellingId(id);
    setActionMessage({ type: '', text: '' });

    try {
      const res = await api.cancelAppointment(id);
      setActionMessage({ type: 'success', text: 'Hủy lịch hẹn thành công.' });
      // Update status in-list (soft cancel — record is kept with status CANCELLED)
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? (res?.appointment || { ...a, status: 'CANCELLED' }) : a))
      );
    } catch (err) {
      setActionMessage({
        type: 'danger',
        text: err.message || 'Hủy lịch hẹn không thành công.'
      });
    } finally {
      setCancellingId(null);
    }
  };

  // --- Open edit modal ---
  const handleOpenEdit = async (appt) => {
    setEditingAppt(appt);
    setEditDate(appt.date);
    setEditTime(appt.time);
    setEditDoctorId(String(appt.doctor_id));
    setEditReason(appt.reason || '');
    setEditError('');

    if (doctors.length === 0) {
      try {
        const list = await api.getDoctors();
        setDoctors(list || []);
      } catch {
        // ignore — doctor select will be empty
      }
    }
  };

  const handleCloseEdit = () => {
    setEditingAppt(null);
    setEditError('');
  };

  // When the date changes inside the modal, keep time only if it's still in the future
  const handleEditDateChange = (newDate) => {
    setEditDate(newDate);
    if (isSlotPast(newDate, editTime)) {
      const firstFuture = ALL_SLOTS.find((s) => !isSlotPast(newDate, s));
      if (firstFuture) setEditTime(firstFuture);
    }
  };

  // --- Submit edit ---
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editDate || !editTime) {
      setEditError('Vui lòng chọn ngày và giờ khám.');
      return;
    }

    // Client-side past guard
    if (isSlotPast(editDate, editTime)) {
      setEditError('⚠️ Khung giờ đã chọn đã qua. Vui lòng chọn ngày hoặc giờ trong tương lai.');
      return;
    }

    setEditSubmitting(true);
    setEditError('');

    try {
      const res = await api.updateAppointment(editingAppt.id, {
        doctor_id: parseInt(editDoctorId, 10),
        date: editDate,
        time: editTime,
        reason: editReason.trim()
      });

      const updated = res?.appointment;
      setAppointments((prev) =>
        prev.map((a) => (a.id === editingAppt.id ? updated || a : a))
      );
      setActionMessage({ type: 'success', text: 'Cập nhật lịch hẹn thành công.' });
      handleCloseEdit();
    } catch (err) {
      if (err.status === 409 || err.code === 'appointment_conflict') {
        setEditError('⚠️ Bác sĩ đã có lịch khám vào khung giờ này. Vui lòng chọn giờ hoặc ngày khác.');
      } else if (err.details?.datetime) {
        setEditError(`⚠️ ${err.details.datetime}`);
      } else {
        setEditError(err.message || 'Cập nhật lịch hẹn thất bại.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  // --- Tabs ---
  const counts = {
    ALL: appointments.length,
    PENDING: appointments.filter((a) => a.status === 'PENDING').length,
    CONFIRMED: appointments.filter((a) => a.status === 'CONFIRMED').length,
    COMPLETED: appointments.filter((a) => a.status === 'COMPLETED').length,
    CANCELLED: appointments.filter((a) => a.status === 'CANCELLED').length
  };

  const filteredAppointments = activeTab === 'ALL'
    ? appointments
    : appointments.filter((a) => a.status === activeTab);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>Lịch Hẹn Của Tôi</h2>
          <p>Theo dõi trạng thái và quản lý các lịch hẹn đã đăng ký</p>
        </div>
        <Link to="/doctors" className="btn btn-primary">
          + Đặt lịch khám mới
        </Link>
      </div>

      {actionMessage.text && (
        <div className={`alert alert-${actionMessage.type}`}>
          {actionMessage.text}
        </div>
      )}

      {loading && <Loading message="Đang tải danh sách lịch hẹn..." />}

      {error && !loading && (
        <div className="alert alert-danger">
          <p>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={loadAppointments} style={{ marginTop: '0.5rem' }}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && appointments.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">📅</div>
          <h3>Bạn chưa có lịch hẹn khám nào</h3>
          <p>Hãy chọn bác sĩ và đặt lịch khám phù hợp với thời gian biểu của bạn.</p>
          <Link to="/doctors" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Khám phá danh sách bác sĩ
          </Link>
        </div>
      )}

      {!loading && !error && appointments.length > 0 && (
        <>
          {/* Bộ lọc trạng thái */}
          <div className="appointment-filter-tabs">
            <button
              type="button"
              className={`appointment-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              Tất cả <span className="appointment-tab-count">{counts.ALL}</span>
            </button>
            <button
              type="button"
              className={`appointment-tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
              onClick={() => setActiveTab('PENDING')}
            >
              Chờ xác nhận <span className="appointment-tab-count">{counts.PENDING}</span>
            </button>
            <button
              type="button"
              className={`appointment-tab-btn ${activeTab === 'CONFIRMED' ? 'active' : ''}`}
              onClick={() => setActiveTab('CONFIRMED')}
            >
              Đã xác nhận <span className="appointment-tab-count">{counts.CONFIRMED}</span>
            </button>
            <button
              type="button"
              className={`appointment-tab-btn ${activeTab === 'COMPLETED' ? 'active' : ''}`}
              onClick={() => setActiveTab('COMPLETED')}
            >
              Đã khám <span className="appointment-tab-count">{counts.COMPLETED}</span>
            </button>
            <button
              type="button"
              className={`appointment-tab-btn ${activeTab === 'CANCELLED' ? 'active' : ''}`}
              onClick={() => setActiveTab('CANCELLED')}
            >
              Đã hủy <span className="appointment-tab-count">{counts.CANCELLED}</span>
            </button>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="empty-state card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
              <h4>Không có lịch hẹn nào ở trạng thái này</h4>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                Bạn có thể chọn tab khác hoặc nhấn nút dưới đây để xem tất cả lịch hẹn.
              </p>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab('ALL')}
                style={{ marginTop: '1rem' }}
              >
                Xem tất cả lịch hẹn ({counts.ALL})
              </button>
            </div>
          ) : (
            <div className="appointments-list">
              {filteredAppointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onCancel={handleCancelAppointment}
                  onEdit={handleOpenEdit}
                  isCancelling={cancellingId === appt.id}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Edit Modal ── */}
      {editingAppt && (
        <div className="modal-overlay" onClick={handleCloseEdit}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Sửa Lịch Hẹn <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}>#{editingAppt.id}</span></h3>
              <button type="button" className="modal-close-btn" onClick={handleCloseEdit} aria-label="Đóng">✕</button>
            </div>

            {editError && <div className="alert alert-danger" style={{ margin: '0 1.5rem 0.5rem' }}>{editError}</div>}

            <form onSubmit={handleEditSubmit} className="modal-body">
              {/* Doctor select */}
              <div className="form-group">
                <label htmlFor="edit-doctor">Bác sĩ:</label>
                <select
                  id="edit-doctor"
                  className="form-control"
                  value={editDoctorId}
                  onChange={(e) => setEditDoctorId(e.target.value)}
                  disabled={editSubmitting || doctors.length === 0}
                >
                  {doctors.length === 0 ? (
                    <option value={editingAppt.doctor_id}>{editingAppt.doctor_name}</option>
                  ) : (
                    doctors.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.full_name} — {d.specialty_name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Date */}
              <div className="form-group">
                <label htmlFor="edit-date">Ngày hẹn (*):</label>
                <input
                  id="edit-date"
                  type="date"
                  className="form-control date-picker-input"
                  min={today}
                  value={editDate}
                  onChange={(e) => handleEditDateChange(e.target.value)}
                  required
                  disabled={editSubmitting}
                />
              </div>

              {/* Time slots */}
              <div className="form-group">
                <label>Khung giờ (*):</label>
                <div className="slot-section">
                  <span className="slot-period-title">🌅 Buổi sáng:</span>
                  <div className="slots-grid">
                    {MORNING_SLOTS.map((slot) => {
                      const past = isSlotPast(editDate, slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-chip ${editTime === slot ? 'active' : ''} ${past ? 'slot-chip-disabled' : ''}`}
                          onClick={() => !past && setEditTime(slot)}
                          disabled={editSubmitting || past}
                          title={past ? 'Khung giờ này đã qua' : ''}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="slot-section" style={{ marginTop: '0.65rem' }}>
                  <span className="slot-period-title">🌇 Buổi chiều:</span>
                  <div className="slots-grid">
                    {AFTERNOON_SLOTS.map((slot) => {
                      const past = isSlotPast(editDate, slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-chip ${editTime === slot ? 'active' : ''} ${past ? 'slot-chip-disabled' : ''}`}
                          onClick={() => !past && setEditTime(slot)}
                          disabled={editSubmitting || past}
                          title={past ? 'Khung giờ này đã qua' : ''}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="selected-slot-preview" style={{ marginTop: '0.5rem' }}>
                  Đã chọn: <strong>📅 {editDate}</strong> lúc <strong>⏰ {editTime}</strong>
                </div>
              </div>

              {/* Reason */}
              <div className="form-group">
                <label htmlFor="edit-reason">Lý do / Triệu chứng:</label>
                <textarea
                  id="edit-reason"
                  rows="3"
                  className="form-control"
                  placeholder="Mô tả tình trạng sức khỏe, triệu chứng..."
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  disabled={editSubmitting}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCloseEdit}
                  disabled={editSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
