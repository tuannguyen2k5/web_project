import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Loading from '../components/Loading';
import { getDoctorImage } from '../utils/doctorImages';

const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDoctor();
  }, [id]);

  const loadDoctor = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getDoctor(id);
      setDoctor(data);
    } catch (err) {
      if (err.status === 404 || err.code === 'not_found') {
        setError('Không tìm thấy thông tin bác sĩ yêu cầu.');
      } else {
        setError(err.message || 'Không thể tải thông tin chi tiết bác sĩ.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="back-link">
        <Link to="/doctors">← Quay lại danh sách bác sĩ</Link>
      </div>

      {loading && <Loading message="Đang tải thông tin chi tiết bác sĩ..." />}

      {error && !loading && (
        <div className="alert alert-danger">
          <p>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/doctors')} style={{ marginTop: '0.5rem' }}>
            Xem danh sách bác sĩ khác
          </button>
        </div>
      )}

      {!loading && !error && doctor && (
        <div className="doctor-profile-layout">
          {/* Header Profile Card */}
          <div className="card doctor-profile-header-card">
            <div className="doctor-profile-top">
              {getDoctorImage(doctor.id) ? (
                <img
                  src={getDoctorImage(doctor.id)}
                  alt={doctor.full_name}
                  className="doctor-profile-real-avatar"
                />
              ) : (
                <div className="avatar-circle large doctor-profile-avatar">
                  {doctor.full_name ? doctor.full_name.charAt(0).toUpperCase() : 'B'}
                </div>
              )}
              <div className="doctor-profile-main-info">
                <div className="doctor-detail-title-row">
                  <h1 className="doctor-profile-name">{doctor.full_name}</h1>
                  <span className="badge badge-specialty doctor-profile-badge">
                    {doctor.specialty_name}
                  </span>
                </div>
                <div className="doctor-profile-contacts">
                  <span className="contact-chip">📧 {doctor.email}</span>
                  {doctor.phone && <span className="contact-chip">📞 {doctor.phone}</span>}
                  <span className="contact-chip status-chip-online">
                    <span className="live-status-dot"></span>
                    {doctor.available ? 'Đang nhận lịch khám' : 'Tạm ngưng nhận lịch'}
                  </span>
                </div>
              </div>
              <div className="doctor-profile-header-cta">
                <Link to={`/book/${doctor.id}`} className="btn btn-primary btn-lg shadow-btn">
                  📅 Đặt lịch khám với bác sĩ này
                </Link>
              </div>
            </div>
          </div>

          {/* Main Info Cards */}
          <div className="doctor-profile-main-content">
            {/* Box 1: Thông số chuyên môn */}
            <div className="card doctor-info-card">
              <h3 className="info-card-title">🩺 Thông tin chuyên môn</h3>
              <div className="doctor-meta-list">
                <div className="meta-list-row">
                  <span className="meta-row-label">Chuyên khoa:</span>
                  <span className="meta-row-val highlight-val">{doctor.specialty_name}</span>
                </div>
                <div className="meta-list-row">
                  <span className="meta-row-label">Kinh nghiệm công tác:</span>
                  <span className="meta-row-val">{doctor.experience || 0} năm</span>
                </div>
                <div className="meta-list-row">
                  <span className="meta-row-label">Điện thoại liên hệ:</span>
                  <span className="meta-row-val">{doctor.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="meta-list-row">
                  <span className="meta-row-label">Giờ tiếp nhận khám:</span>
                  <span className="meta-row-val">Thứ 2 – Thứ 7 (08:00 – 17:00)</span>
                </div>
                <div className="meta-list-row">
                  <span className="meta-row-label">Đơn vị công tác:</span>
                  <span className="meta-row-val">Group 9 - Phòng khám đa khoa</span>
                </div>
              </div>
            </div>

            {/* Box 2: Giới thiệu chuyên môn */}
            <div className="card doctor-info-card">
              <h3 className="info-card-title">👨‍⚕️ Giới thiệu chuyên môn</h3>
              <p className="doctor-bio-text">
                {doctor.description || 'Bác sĩ chuyên khoa giàu kinh nghiệm và tận tâm với sức khỏe người bệnh.'}
              </p>
            </div>

            {/* Box 3: Về chuyên khoa */}
            {doctor.specialty_description && (
              <div className="card doctor-info-card">
                <h3 className="info-card-title">🏥 Về chuyên khoa {doctor.specialty_name}</h3>
                <p className="doctor-bio-text">{doctor.specialty_description}</p>
              </div>
            )}

            {/* Bottom Booking Button */}
            <div className="doctor-detail-bottom-cta">
              <Link to={`/book/${doctor.id}`} className="btn btn-primary btn-lg shadow-btn">
                📅 Đặt lịch khám với bác sĩ này
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDetail;
