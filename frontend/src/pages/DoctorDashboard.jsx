import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Loading from '../components/Loading';

const statusBadges = {
  PENDING: { label: 'Chờ xác nhận', class: 'badge-pending' },
  CONFIRMED: { label: 'Đã xác nhận', class: 'badge-confirmed' },
  COMPLETED: { label: 'Đã khám', class: 'badge-completed' },
  CANCELLED: { label: 'Đã hủy', class: 'badge-cancelled' }
};

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getDoctorAppointments();
      setAppointments(data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải lịch hẹn của bác sĩ.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    setUpdatingId(appointmentId);
    setMessage({ type: '', text: '' });

    try {
      await api.updateAppointmentStatus(appointmentId, newStatus);
      setMessage({
        type: 'success',
        text: `Đã cập nhật trạng thái lịch hẹn sang "${statusBadges[newStatus]?.label || newStatus}" thành công!`
      });

      // Update local state with updated appointment
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.message || 'Không thể cập nhật trạng thái lịch hẹn.'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats calculation
  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  const filteredAppointments = appointments.filter((a) => {
    if (filterStatus === 'ALL') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Thông tin chung</h2>
          <p>Quản lý danh sách bệnh nhân và cập nhật trạng thái các buổi khám</p>
        </div>
      </div>

      {/* Summary KPI stats */}
      <div className="dashboard-stats-grid">
        <div
          className={`dashboard-stat-card ${filterStatus === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilterStatus('ALL')}
          title="Xem tất cả lịch hẹn"
        >
          <div className="stat-card-title">Tổng lịch hẹn</div>
          <div className="stat-card-val text-primary">{totalCount}</div>
          <div className="stat-card-sub">Lịch khám của bạn</div>
        </div>

        <div
          className={`dashboard-stat-card ${filterStatus === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilterStatus('PENDING')}
          title="Lọc lịch chờ xác nhận"
        >
          <div className="stat-card-title">Chờ xác nhận</div>
          <div className="stat-card-val text-warning">{pendingCount}</div>
          <div className="stat-card-sub">Cần bác sĩ duyệt</div>
        </div>

        <div
          className={`dashboard-stat-card ${filterStatus === 'CONFIRMED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('CONFIRMED')}
          title="Lọc lịch đã xác nhận"
        >
          <div className="stat-card-title">Đã xác nhận</div>
          <div className="stat-card-val text-info">{confirmedCount}</div>
          <div className="stat-card-sub">Sẵn sàng thăm khám</div>
        </div>

        <div
          className={`dashboard-stat-card ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setFilterStatus('COMPLETED')}
          title="Lọc lịch đã hoàn thành"
        >
          <div className="stat-card-title">Đã hoàn thành</div>
          <div className="stat-card-val text-success">{completedCount}</div>
          <div className="stat-card-sub">Đã khám xong</div>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {loading && <Loading message="Đang tải lịch hẹn phụ trách..." />}

      {error && !loading && (
        <div className="alert alert-danger">
          <p>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={loadAppointments} style={{ marginTop: '0.5rem' }}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && filteredAppointments.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">🩺</div>
          <h3>Hiện tại không có lịch hẹn nào {filterStatus !== 'ALL' ? `ở trạng thái ${statusBadges[filterStatus]?.label}` : ''}</h3>
          <p>Khi bệnh nhân đăng ký khám với bạn, thông tin lịch hẹn sẽ hiển thị ở đây.</p>
          {filterStatus !== 'ALL' && (
            <button className="btn btn-outline btn-sm" onClick={() => setFilterStatus('ALL')} style={{ marginTop: '0.75rem' }}>
              Xem tất cả trạng thái
            </button>
          )}
        </div>
      )}

      {!loading && !error && filteredAppointments.length > 0 && (
        <div className="card table-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap' }}>Mã số</th>
                  <th>Bệnh nhân</th>
                  <th>Email liên hệ</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Ngày & Giờ</th>
                  <th>Triệu chứng / Lý do</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Trạng thái</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => {
                  const badge = statusBadges[appt.status] || { label: appt.status, class: 'badge-pending' };
                  const isUpdating = updatingId === appt.id;

                  return (
                    <tr key={appt.id}>
                      <td style={{ whiteSpace: 'nowrap' }}><strong>#{appt.id}</strong></td>
                      <td><strong>{appt.patient_name}</strong></td>
                      <td>{appt.patient_email}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div>📅 {appt.date}</div>
                        <div>⏰ <strong>{appt.time}</strong></div>
                      </td>
                      <td className="cell-reason">{appt.reason || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`badge ${badge.class}`} style={{ whiteSpace: 'nowrap' }}>{badge.label}</span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div className="action-buttons" style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', gap: '8px' }}>
                          {/* Bước 1: Khi nhận được PENDING -> Bác sĩ Xác nhận khám hoặc Từ chối */}
                          {appt.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() => handleUpdateStatus(appt.id, 'CONFIRMED')}
                                disabled={isUpdating}
                                style={{ whiteSpace: 'nowrap' }}
                                title="Xác nhận tiếp nhận lịch khám bệnh này"
                              >
                                ✓ Xác nhận khám
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleUpdateStatus(appt.id, 'CANCELLED')}
                                disabled={isUpdating}
                                style={{ whiteSpace: 'nowrap' }}
                                title="Hủy / Từ chối lịch hẹn"
                              >
                                ✕ Hủy lịch
                              </button>
                            </>
                          )}

                          {/* Bước 2: Khi đã CONFIRMED -> Bác sĩ KHÔNG THỂ HỦY, chỉ có thể Hoàn thành khám */}
                          {appt.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                              disabled={isUpdating}
                              style={{ whiteSpace: 'nowrap' }}
                              title="Đánh dấu bệnh nhân đã hoàn thành buổi khám"
                            >
                              🩺 Hoàn thành khám
                            </button>
                          )}

                          {/* Bước 3: Đã khám xong */}
                          {appt.status === 'COMPLETED' && (
                            <span className="text-muted-check" style={{ whiteSpace: 'nowrap' }}>
                              ✓ Đã hoàn tất
                            </span>
                          )}

                          {/* Lịch đã hủy */}
                          {appt.status === 'CANCELLED' && (
                            <span className="text-muted-cancel" style={{ whiteSpace: 'nowrap' }}>
                              ✕ Lịch đã hủy
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
