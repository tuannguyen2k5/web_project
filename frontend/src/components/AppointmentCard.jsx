import React from 'react';
import { Link } from 'react-router-dom';
import { getDoctorImage } from '../utils/doctorImages';

const statusConfig = {
  PENDING: {
    label: 'Chờ xác nhận',
    className: 'badge-pending',
    icon: '⏳',
    note: 'Lịch hẹn đang được nhân viên và bác sĩ tiếp nhận xử lý.'
  },
  CONFIRMED: {
    label: 'Đã xác nhận',
    className: 'badge-confirmed',
    icon: '✅',
    note: 'Lịch hẹn đã được bác sĩ xác nhận. Vui lòng đến trước giờ hẹn 10-15 phút.'
  },
  COMPLETED: {
    label: 'Đã khám',
    className: 'badge-completed',
    icon: '🩺',
    note: 'Buổi khám đã hoàn thành. Chúc bạn luôn mạnh khỏe và bình an!'
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'badge-cancelled',
    icon: '✕',
    note: 'Lịch hẹn này đã được hủy thành công.'
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
};

const AppointmentCard = ({ appointment, onCancel, onEdit, isCancelling = false }) => {
  const statusInfo = statusConfig[appointment.status] || {
    label: appointment.status,
    className: 'badge-pending',
    icon: 'ℹ️',
    note: ''
  };

  const doctorPhoto = getDoctorImage(appointment.doctor_id);

  return (
    <div className={`card appointment-card status-${appointment.status.toLowerCase()}`}>
      <div className="appointment-card-inner">
        {/* Top: Doctor Profile + Status Badge */}
        <div className="appointment-header">
          <div className="appointment-doctor-info">
            {doctorPhoto ? (
              <img
                src={doctorPhoto}
                alt={appointment.doctor_name || 'Bác sĩ'}
                className="appointment-doctor-avatar"
              />
            ) : (
              <div className="appointment-doctor-avatar-fallback">
                {appointment.doctor_name ? appointment.doctor_name.charAt(0).toUpperCase() : '👨‍⚕️'}
              </div>
            )}
            <div className="appointment-doctor-meta">
              <div className="appointment-name-row">
                <h4 className="appointment-doctor-name">
                  {appointment.doctor_name || `Bác sĩ #${appointment.doctor_id}`}
                </h4>
                <span className="badge badge-specialty">
                  {appointment.specialty_name || 'Chuyên khoa'}
                </span>
              </div>
              <span className="appointment-code-label">
                Mã lịch hẹn: <strong>#{appointment.id}</strong>
              </span>
            </div>
          </div>

          <div className="appointment-status-badge-wrap">
            <span className={`badge ${statusInfo.className}`}>
              <span className="status-badge-icon">{statusInfo.icon}</span> {statusInfo.label}
            </span>
          </div>
        </div>

        {/* Middle: Schedule Strip & Reason */}
        <div className="appointment-body">
          <div className="appointment-schedule-strip">
            <div className="schedule-item">
              <span className="schedule-icon">📅</span>
              <div>
                <div className="schedule-label">Ngày khám</div>
                <div className="schedule-val">{formatDate(appointment.date)}</div>
              </div>
            </div>
            <div className="schedule-divider" />
            <div className="schedule-item">
              <span className="schedule-icon">⏰</span>
              <div>
                <div className="schedule-label">Giờ hẹn</div>
                <div className="schedule-val">{appointment.time}</div>
              </div>
            </div>
            <div className="schedule-divider" />
            <div className="schedule-item">
              <img
                src="/images/logo.webp"
                alt="Logo Phòng khám"
                className="schedule-logo-icon"
              />
              <div>
                <div className="schedule-label">Địa điểm</div>
                <div className="schedule-val">Phòng khám Đa khoa</div>
              </div>
            </div>
          </div>

          {appointment.reason && (
            <div className="appointment-reason-box">
              <span className="reason-label-tag">Lý do khám:</span>
              <p className="reason-text">{appointment.reason}</p>
            </div>
          )}
        </div>

        {/* Bottom: Note + Actions */}
        <div className="appointment-footer">
          <p className="appointment-note-text">
            {statusInfo.note}
          </p>

          <div className="appointment-btn-actions">
            {appointment.doctor_id && (
              <Link
                to={`/doctors/${appointment.doctor_id}`}
                className="btn btn-outline btn-sm"
              >
                Xem chi tiết bác sĩ
              </Link>
            )}

            {/* Edit button — only for PENDING */}
            {onEdit && appointment.status === 'PENDING' && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onEdit(appointment)}
              >
                ✏️ Sửa lịch hẹn
              </button>
            )}

            {onCancel && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => onCancel(appointment.id)}
                disabled={isCancelling}
              >
                {isCancelling ? 'Đang hủy...' : 'Hủy lịch hẹn'}
              </button>
            )}

            {(appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') && (
              <Link
                to={appointment.doctor_id ? `/book/${appointment.doctor_id}` : '/doctors'}
                className="btn btn-outline-primary btn-sm"
              >
                Đặt lại lịch khám
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
