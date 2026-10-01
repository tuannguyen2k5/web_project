import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Loading from '../components/Loading';

const statusBadges = {
  PENDING: { label: 'Chờ xác nhận', class: 'badge-pending' },
  CONFIRMED: { label: 'Đã xác nhận', class: 'badge-confirmed' },
  COMPLETED: { label: 'Đã khám', class: 'badge-completed' },
  CANCELLED: { label: 'Đã hủy', class: 'badge-cancelled' }
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('doctors');
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deletingId, setDeletingId] = useState(null);

  // Form states for creating a doctor
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    specialty_id: '',
    phone: '',
    experience: 1,
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [docData, specData, patData, apptData] = await Promise.all([
        api.getDoctors(),
        api.getSpecialties().catch(() => []),
        api.getAdminPatients().catch(() => []),
        api.getAdminAppointments().catch(() => [])
      ]);
      setDoctors(docData || []);
      setSpecialties(specData || []);
      setPatients(patData || []);
      setAppointments(apptData || []);
      if (specData && specData.length > 0 && !formData.specialty_id) {
        setFormData((prev) => ({ ...prev, specialty_id: specData[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu quản trị.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (formError) setFormError('');
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password || !formData.specialty_id) {
      setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    setMessage({ type: '', text: '' });

    try {
      const res = await api.createDoctor({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        specialty_id: parseInt(formData.specialty_id, 10),
        phone: formData.phone.trim(),
        experience: parseInt(formData.experience || 0, 10),
        description: formData.description.trim()
      });

      setMessage({
        type: 'success',
        text: `Đã tạo tài khoản và hồ sơ cho ${formData.full_name} thành công!`
      });

      // Reset form
      setFormData({
        full_name: '',
        email: '',
        password: '',
        specialty_id: specialties[0]?.id || '',
        phone: '',
        experience: 1,
        description: ''
      });
      setShowAddForm(false);

      // Refresh list
      loadData();
    } catch (err) {
      if (err.status === 409 || err.code === 'email_exists') {
        setFormError('Email này đã được sử dụng trong hệ thống.');
      } else {
        setFormError(err.message || 'Thêm bác sĩ không thành công.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDoctor = async (doctor) => {
    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa bác sĩ "${doctor.full_name}" không? Thao tác này sẽ xóa hồ sơ và tài khoản tương ứng.`);
    if (!confirmed) return;

    setDeletingId(doctor.id);
    setMessage({ type: '', text: '' });

    try {
      await api.deleteDoctor(doctor.id);
      setMessage({
        type: 'success',
        text: `Đã xóa bác sĩ "${doctor.full_name}" thành công.`
      });
      setDoctors((prev) => prev.filter((d) => d.id !== doctor.id));
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.message || 'Xóa bác sĩ không thành công.'
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>Quản Trị Hệ Thống</h2>
          <p>Quản lý nhân sự y tế, bệnh nhân và lịch hẹn</p>
        </div>
        {activeTab === 'doctors' && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Đóng biểu mẫu' : '+ Thêm Bác sĩ Mới'}
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="dashboard-stats-grid">
        <div 
          className={`dashboard-stat-card ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctors')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-card-title">Tổng số Bác sĩ</div>
          <div className="stat-card-val text-primary">{doctors.length}</div>
          <div className="stat-card-sub">Nhân sự y tế</div>
        </div>

        <div 
          className={`dashboard-stat-card ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-card-title">Tổng số Bệnh nhân</div>
          <div className="stat-card-val text-info">{patients.length}</div>
          <div className="stat-card-sub">Đã đăng ký hệ thống</div>
        </div>

        <div 
          className={`dashboard-stat-card ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-card-title">Tổng Lịch hẹn</div>
          <div className="stat-card-val text-success">{appointments.length}</div>
          <div className="stat-card-sub">Trên toàn hệ thống</div>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {activeTab === 'doctors' && showAddForm && (
        <div className="card form-card" style={{ marginBottom: '2rem' }}>
          <h3>Thêm Bác Sĩ Mới Vào Hệ Thống</h3>
          {formError && <div className="alert alert-danger">{formError}</div>}

          <form onSubmit={handleCreateDoctor}>
            <div className="form-row">
              <div className="form-group col">
                <label htmlFor="full_name">Họ và tên bác sĩ (*):</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  className="form-control"
                  placeholder="BS. CKII Nguyễn Văn B"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group col">
                <label htmlFor="email">Email đăng nhập (*):</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  placeholder="doctor.b@clinic.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col">
                <label htmlFor="password">Mật khẩu khởi tạo (*):</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-control"
                  placeholder="Tối thiểu 6 ký tự"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group col">
                <label htmlFor="specialty_id">Chuyên khoa (*):</label>
                <select
                  id="specialty_id"
                  name="specialty_id"
                  className="form-control"
                  value={formData.specialty_id}
                  onChange={handleInputChange}
                  required
                >
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group col">
                <label htmlFor="phone">Số điện thoại liên hệ:</label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  className="form-control"
                  placeholder="0901234567"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group col">
                <label htmlFor="experience">Số năm kinh nghiệm:</label>
                <input
                  id="experience"
                  name="experience"
                  type="number"
                  min="0"
                  className="form-control"
                  value={formData.experience}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Mô tả tóm tắt năng lực / chuyên môn:</label>
              <textarea
                id="description"
                name="description"
                rows="2"
                className="form-control"
                placeholder="Giới thiệu bằng cấp, lĩnh vực chuyên sâu..."
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowAddForm(false)}
                disabled={submitting}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Đang lưu thông tin...' : 'Tạo Bác Sĩ'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <Loading message="Đang tải dữ liệu quản trị..." />}

      {error && !loading && (
        <div className="alert alert-danger">
          <p>{error}</p>
          <button className="btn btn-outline btn-sm" onClick={loadData} style={{ marginTop: '0.5rem' }}>
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && activeTab === 'doctors' && (
        <div className="card table-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Bác sĩ</th>
                  <th>Chuyên khoa</th>
                  <th>Email</th>
                  <th>Điện thoại</th>
                  <th>Kinh nghiệm</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc.id}>
                    <td>#{doc.id}</td>
                    <td><strong>{doc.full_name}</strong></td>
                    <td>
                      <span className="badge badge-specialty">{doc.specialty_name}</span>
                    </td>
                    <td>{doc.email}</td>
                    <td>{doc.phone || '—'}</td>
                    <td>{doc.experience || 0} năm</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger-outline"
                        onClick={() => handleDeleteDoctor(doc)}
                        disabled={deletingId === doc.id}
                      >
                        {deletingId === doc.id ? 'Đang xóa...' : 'Xóa'}
                      </button>
                    </td>
                  </tr>
                ))}
                {doctors.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center'}}>Chưa có bác sĩ nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'patients' && (
        <div className="card table-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên Bệnh nhân</th>
                  <th>Email</th>
                  <th>Ngày đăng ký</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((pat) => (
                  <tr key={pat.id}>
                    <td>#{pat.id}</td>
                    <td><strong>{pat.full_name}</strong></td>
                    <td>{pat.email}</td>
                    <td>{new Date(pat.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {patients.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center'}}>Chưa có bệnh nhân nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && activeTab === 'appointments' && (
        <div className="card table-card">
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Bệnh nhân</th>
                  <th>Bác sĩ</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => {
                  const badge = statusBadges[appt.status] || { label: appt.status, class: 'badge-pending' };
                  return (
                    <tr key={appt.id}>
                      <td>#{appt.id}</td>
                      <td><strong>{appt.patient_name}</strong><br/><small>{appt.patient_email}</small></td>
                      <td><strong>{appt.doctor_name}</strong><br/><small>{appt.specialty_name}</small></td>
                      <td>
                        📅 {appt.date}<br/>
                        ⏰ <strong>{appt.time}</strong>
                      </td>
                      <td>
                        <span className={`badge ${badge.class}`}>{badge.label}</span>
                      </td>
                    </tr>
                  )
                })}
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center'}}>Chưa có lịch hẹn nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
